import { useModelInstanceEvent } from './hooks/event-hooks'
import { useModelInstanceState } from './hooks/state-hooks'
import { Sub, Subs } from './types'

export class Model<S = {}, E = {}> {
	protected initialState
	protected subs: Subs<S> = new Map()
	protected listeners: Subs<E> = new Map()

	//#region updaters
	protected updateSingleSubscriber = <K extends keyof S>(k: K, v: S[K]) => {
		this.subs.get(k)?.forEach((cb) => cb(v))
	}

	protected updateSubscribers = (delta: Partial<S>) => {
		const keyVals = Object.entries(delta)

		for (const [key, val] of keyVals as [keyof S, S[keyof S]][]) {
			if (this.subs.has(key)) {
				this.updateSingleSubscriber(key, val)
			}
		}
	}

	protected updateEventListeners = <K extends keyof E>(k: K, data?: E[K] extends undefined ? never : E[K]) => {
		this.listeners.get(k)?.forEach((cb) => cb(data!))
	}
	//#endregion updaters

	constructor(
		public state: S,
		public events: E = {} as E,
	) {
		this.initialState = {...state}
	}

	//#region state
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

	reduce = (reducer: (state: S) => Partial<S>) => {
		const nextState = reducer(this.state)

		this.setState(nextState)
	}

	reset = () => {
		this.setState(this.initialState)
	}
	//#endregion state

	//#region events
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

	awaitEvent = <K extends keyof E>(key: K) => {
		return new Promise<E[K]>((resolve) => {
			const remove = this.onEvent(key, (data) => {
				remove()
				resolve(data as E[K])
			})
		})
	}
	//#endregion events

	//#region instance hooks
	useState = <K extends keyof S>(key: K) => {
		return useModelInstanceState(this, key)
	}

	useEvent = <K extends keyof E>(ns: K, cb?: Sub<E, K>) => {
		return useModelInstanceEvent(this, ns, cb)
	}
	//#endregion instance hoooks
}
