import React, { Context, createContext, FC, ProviderProps, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export class Model<S, E> {
	private subs = new Map<keyof S, Set<(v: S[keyof S]) => void>>()

	private updateSubscribers = (delta: Partial<S>) => {
		const keyVals = Object.values<[keyof S, S[keyof S]]>(delta as {})

		for (const [key, val] of keyVals){
			if(this.subs.has(key)){
				this.subs.get(key)!.forEach((cb) => {
					cb(val)
				})
			}
		}
	}

	constructor(public state: S = {} as S){}

	public eventListeners = new Map<keyof E, Set<(eventData: E[keyof E]) => void>>()

	public evtListenersBase: E = {} as E

	public onStateChange = (k: keyof S, cb: (v: S[typeof k]) => void) => {
		let keySubs = this.subs.get(k)

		if (!keySubs) {
			keySubs = new Set()
			this.subs.set(k, keySubs)
		}

		keySubs.add(cb)

		return () => {
			keySubs!.delete(cb)
		}
	}

	public setState(delta: Partial<S>) {
		this.state = {
			...this.state,
			...delta,
		}

		this.updateSubscribers(delta)
	}

	public onEvent = (evt: keyof typeof this.evtListenersBase, cb: (eventData: E[typeof evt]) => void) => {
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

	public emitEvent = (evt: keyof E, data: E[typeof evt]) => {
		if (this.eventListeners.has(evt)) {
			this.eventListeners.get(evt)!.forEach((cb) => {
				cb(data)
			})
		}
	}
}

export function ViewModelProvider<M extends Model<M['state'], M['evtListenersBase']>>({
	value,
}: ProviderProps<M>) {
	const context = useMemo<Context<M>>(() => {
		return createContext(value)
	}, [])

	return <context.Provider value={value}/>
}

export function useModelInstanceState<M extends Model<M['state'], M['evtListenersBase']>>(
	viewModel: M,
	key: keyof M['state']
) {
	const [value, setValue] = useState(viewModel.state[key])

	useEffect(() => viewModel.onStateChange(key, setValue), [])

	const setter = useCallback((v) => {
		viewModel.setState({ [key]: v } as Partial<M['state']>)
	}, [key])

	return [value, setter]
}

export function useModelCtxState<M extends Model<M['state'], M['evtListenersBase']>>(
	ctx: Context<M>,
	key: keyof M['state']
) {
	const viewModel = useContext(ctx)

	return useModelInstanceState(viewModel, key)
}

export function useModelInstanceEvent<M extends Model<M['state'], M['evtListenersBase']>, NS extends keyof M['evtListenersBase']>(
	viewModel: M,
	ns: NS,
	cb?: (eventData: M['evtListenersBase'][NS]) => void,
) {
	useEffect(() => {
		if (cb) {
			return viewModel.onEvent(ns, cb as (eventData: M['evtListenersBase']) => void)
		}
	}, [])


	return (data: M['evtListenersBase'][NS]) => viewModel.emitEvent(ns, data)
}

export function useModelCtxEvent<M extends Model<M['state'], M['evtListenersBase']>, NS extends keyof M['evtListenersBase']>(
	ctx: Context<M>,
	ns: NS,
	cb?: (eventData: M['evtListenersBase'][NS]) => void,
) {
	const viewModel = useContext(ctx)

	return useModelInstanceEvent(viewModel, ns, cb)
}







const myViewModelInitialState = {
	count: 0,
}

type MyViewModelEvents = {
	click: string
	increment: number
}

class MyViewModel extends Model<typeof myViewModelInitialState, MyViewModelEvents>{
	constructor(public state = myViewModelInitialState){
		super(state)
	}
}

const MyViewModelCtx = createContext(new MyViewModel())

const ChildFC: FC<any> = () => {
	const [count, setCount] = useModelCtxState(MyViewModelCtx, 'count')

	const onIncrement = useCallback((data: number) => {
		console.log('INCREMENT!', data)
	}, [])

	const click = useModelCtxEvent(MyViewModelCtx, 'click')
	const increment = useModelCtxEvent(MyViewModelCtx, 'increment', onIncrement)

	return <div onClick={() => {
		increment(1)
		click('a')
	}}>
		<p>{count}</p>
	</div>
}

const ParentFC: FC<any> = () => {
	const viewModel = new MyViewModel()

	const [count, setCount] = useModelInstanceState(viewModel, 'count')


	return <ViewModelProvider value={viewModel}>
		<p>{count}</p>
		<ChildFC/>
	</ViewModelProvider>
}
