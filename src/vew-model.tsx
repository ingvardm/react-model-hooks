import React, {
	Context,
	createContext,
	FC,
	ProviderProps,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react'

type EventListener<T> = (eventData: T) => void

abstract class ViewModel<T, E> {
	private subs = new Map<keyof T, Set<(v: T[keyof T]) => void>>()
	public eventListeners = new Map<keyof E, Set<EventListener<E[keyof E]>>>()

	public evtListenersBase: E = {} as E

	private updateSubscribers = (delta: Partial<T>) => {
		const keyVals = Object.values<[keyof T, any]>(delta as {})

		for (const [key, val] of keyVals){
			if(this.subs.has(key)){
				this.subs.get(key)!.forEach((cb) => {
					cb(val)
				})
			}
		}
	}

	public abstract state: T

	public setState(delta: Partial<T>) {
		this.state = {
			...this.state,
			...delta,
		}

		this.updateSubscribers(delta)
	}

	public onStateChange = (k: keyof T, cb: (v: T[typeof k]) => void) => {
		let keySubs = this.subs.get(k)

		if (!keySubs){
			keySubs = new Set()
			this.subs.set(k, keySubs)
		}

		keySubs.add(cb)

		return () => {
			keySubs!.delete(cb)
		}
	}

	public onEvent = (evt: keyof typeof this.evtListenersBase, cb: EventListener<E[typeof evt]>) => {
		let listeners = this.eventListeners.get(evt)

		if (!listeners) {
			listeners = new Set()
			this.eventListeners.set(evt, listeners)
		}

		listeners.add(cb)

		return () => {
			listeners!.delete(cb)
		}
	}

	public publish = (evt: keyof E, data: E[typeof evt]) => {
		if (this.eventListeners.has(evt)) {
			this.eventListeners.get(evt)!.forEach((cb) => {
				cb(data)
			})
		}
	}
}

function ViewModelProvider<T extends ViewModel<T['state'], T['evtListenersBase']>>({
	value,
}: ProviderProps<T>) {
	const context = useMemo<Context<T>>(() => {
		return createContext(value)
	}, [])

	return <context.Provider value={value}/>
}

function useViewModelState<VM extends ViewModel<VM['state'], VM['evtListenersBase']>>(
	ctx: Context<VM>,
	key: keyof VM['state']
): [VM['state'][typeof key], (v: typeof viewModel.state[typeof key]) => void]{
	const viewModel = useContext(ctx)

	const [value, setValue] = useState(viewModel.state[key])

	useEffect(() => viewModel.onStateChange(key, setValue), [])

	const setter = useCallback((v) => {
		viewModel.setState({ [key]: v } as Partial<VM['state']>)
	}, [key])

	return [ value, setter ]
}

function useViewModelEvent<VM extends ViewModel<VM['state'], VM['evtListenersBase']>, NS extends keyof VM['evtListenersBase']>(
	ctx: Context<VM>,
	ns: NS,
	cb?: EventListener<VM['evtListenersBase'][NS]>,
){
	const viewModel = useContext(ctx)

	useEffect(() => {
		if(cb){
			return viewModel.onEvent(ns, cb as EventListener<VM['evtListenersBase']>)
		}
	}, [])


	return (data: VM['evtListenersBase'][NS]) => viewModel.publish(ns, data)
}








const myViewModelInitialState = {
	count: 0,
}

type MyViewModelEvents = {
	click: string
	increment: number
}

class MyViewModel extends ViewModel<typeof myViewModelInitialState, MyViewModelEvents>{
	public state = myViewModelInitialState
}

const MyViewModelCtx = createContext(new MyViewModel())

const ChildFC: FC<any> = () => {
	const [count, setCount] = useViewModelState(MyViewModelCtx, 'count')

	const onIncrement = useCallback((data: number) => {
		console.log('INCREMENT!', data)
	}, [])

	const click = useViewModelEvent(MyViewModelCtx, 'click')
	const increment = useViewModelEvent(MyViewModelCtx, 'increment', onIncrement)

	return <div onClick={() => {
		increment(1)
		click('a')
	}}>
		<p>{count}</p>
	</div>
}

const ParentFC: FC<any> = () => {
	const viewModel = new MyViewModel()

	return <ViewModelProvider value={viewModel}>
		<ChildFC/>
	</ViewModelProvider>
}
