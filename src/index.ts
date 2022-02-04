import { Context, useCallback, useContext, useEffect, useState } from 'react'

type Sub<S, K extends keyof S = keyof S> = (v: S[K]) => void
type Subs<S> = Map<keyof S, Set<Sub<S>>>

export class Model<S, E = {}> {
	private subs: Subs<S> = new Map()
	private listeners: Subs<E> = new Map()

	private updateSingleSubscriber = <K extends keyof S>(k: K, v: S[K]) => {
		this.subs.get(k)?.forEach((cb) => cb(v))
	}

	private updateSubscribers = (delta: Partial<S>) => {
		const keyVals = Object.entries(delta)

		for (const [key, val] of keyVals as [keyof S, S[keyof S]][]){
			if(this.subs.has(key)){
				this.subs.get(key)!.forEach((cb) => {
					cb(val)
				})
			}
		}
	}

	private updateEventListeners = <K extends keyof E>(k: K, data?: E[K] extends undefined ? never : E[K]) => {
		this.listeners.get(k)?.forEach((cb) => cb(data!))
	}

	private initialState = {} as S

	constructor(
		public state: S = {} as S,
		public events: E = {} as E
	){
		this.initialState = state
	}

	onStateChange = <K extends keyof S>(k: K, cb: Sub<S>) => {
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

	setState = (delta: Partial<S>) => {
		this.state = {
			...this.state,
			...delta,
		}

		this.updateSubscribers(delta)
	}

	setValue = <K extends keyof S>(key: K, value: S[K]) => {
		this.state[key] = value

		this.updateSingleSubscriber(key, value!)
	}

	onEvent = <K extends keyof E>(k: K, cb: Sub<E>) => {
		let nsListeners = this.listeners.get(k)

		if (!nsListeners) {
			nsListeners = new Set()
			this.listeners.set(k, nsListeners)
		}

		nsListeners.add(cb)

		return () => {
			nsListeners!.delete(cb)
		}
	}

	dispatch = <K extends keyof E>(key: K, data?: E[K] extends undefined ? never : E[K]) => {
		this.updateEventListeners(key, data)
	}

	reset = () => {
		this.setState(this.initialState)
	}
}

export function useModelCtx<M extends Model<M['state'], M['events']>>(
	ctx: Context<M>,
){
	return useContext(ctx)
}

export function useModelInstanceState<K extends keyof M['state'], M extends Model<M['state'], M['events']>>(
	viewModel: M,
	key: K
): [M['state'][K], (data: M['state'][K]) => void] {
	const [value, setValue] = useState(viewModel.state[key])

	useEffect(() => viewModel.onStateChange(key, setValue as Sub<M['state']>), [])

	const setter = useCallback((v) => {
		viewModel.setValue(key, v)
	}, [key])

	return [value, setter]
}

export function useModelCtxState<K extends keyof M['state'], M extends Model<M['state'], M['events']>>(
	ctx: Context<M>,
	key: K
){
	const viewModel = useContext(ctx)

	return useModelInstanceState(viewModel, key)
}

export function useModelInstanceEvent<K extends keyof M['events'], D extends M['events'], M extends Model<M['state'], M['events']>>(
	viewModel: M,
	ns: K,
	cb?: Sub<D, K>,
) {
	useEffect(() => {
		if (cb) {
			return viewModel.onEvent(ns, cb as Sub<M['events']>)
		}
	}, [cb])

	return (data?: D[K] extends undefined ? never : D[K]) => viewModel.dispatch(ns, data!)
}

export function useModelCtxEvent<K extends keyof M['events'], D extends M['events'], M extends Model<M['state'], M['events']>>(
	ctx: Context<M>,
	ns: K,
	cb?: (eventData: D[K]) => void,
) {
	const viewModel = useContext(ctx)

	return useModelInstanceEvent(viewModel, ns, cb)
}
