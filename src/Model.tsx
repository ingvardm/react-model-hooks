import { Context, useCallback, useContext, useEffect, useState } from 'react'

export class Model<S, E> {
	private subs = new Map<keyof S, Set<(v: S[keyof S]) => void>>()

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

	constructor(public state: S = {} as S){}

	public eventListeners = new Map<keyof E, Set<(eventData: E[keyof E]) => void>>()

	public evtDataTypes: E = {} as E

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

	public onEvent = (evt: keyof typeof this.evtDataTypes, cb: (eventData: E[typeof evt]) => void) => {
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

export function useModelInstanceState<M extends Model<M['state'], M['evtDataTypes']>>(
	viewModel: M,
	key: keyof M['state']
) {
	const [value, setValue] = useState(viewModel.state[key])

	useEffect(() => {
		return viewModel.onStateChange(key, setValue)
	}, [viewModel])

	const setter = useCallback((v) => {
		viewModel.setState({ [key]: v } as Partial<M['state']>)
	}, [key])

	return [value, setter]
}

export function useModelCtxState<M extends Model<M['state'], M['evtDataTypes']>>(
	ctx: Context<M>,
	key: keyof M['state']
) {
	const viewModel = useContext(ctx)

	return useModelInstanceState(viewModel, key)
}

export function useModelInstanceEvent<M extends Model<M['state'], M['evtDataTypes']>, NS extends keyof M['evtDataTypes']>(
	viewModel: M,
	ns: NS,
	cb?: (eventData: M['evtDataTypes'][NS]) => void,
) {
	useEffect(() => {
		if (cb) {
			return viewModel.onEvent(ns, cb as (eventData: M['evtDataTypes']) => void)
		}
	}, [cb])


	return (data: M['evtDataTypes'][NS]) => viewModel.emitEvent(ns, data)
}

export function useModelCtxEvent<M extends Model<M['state'], M['evtDataTypes']>, NS extends keyof M['evtDataTypes']>(
	ctx: Context<M>,
	ns: NS,
	cb?: (eventData: M['evtDataTypes'][NS]) => void,
) {
	const viewModel = useContext(ctx)

	return useModelInstanceEvent(viewModel, ns, cb)
}
