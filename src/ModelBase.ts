import { KeySub, KeySubs, StateSub, StateSubs } from "./types"

export abstract class ModelBase<E = {}, S = {}> {
	protected keySubs: KeySubs<S> = new Map()
	protected stateSubs: StateSubs<S> = new Set()
	protected listeners: KeySubs<E> = new Map()

	//#region updaters
	protected updateSingleKeySubscriber = <K extends keyof S>(k: K, v: S[K]) => {
		this.keySubs.get(k)?.forEach((cb) => cb(v))
	}

	protected updateKeySubscribers = (delta: Partial<S>) => {
		const keyVals = Object.entries(delta)

		for (const [key, val] of keyVals as [keyof S, S[keyof S]][]) {
			if (this.keySubs.has(key)) {
				this.updateSingleKeySubscriber(key, val)
			}
		}
	}

	protected updateStateChangeSubscribers = (state: S) => {
		this.stateSubs.forEach(cb => cb(state))
	}

	protected updateEventListeners = <K extends keyof E>(k: K, data?: E[K] extends undefined ? never : E[K]) => {
		this.listeners.get(k)?.forEach((cb) => cb(data!))
	}
	//#endregion updaters

	abstract state: S

	// constructor(public state: S) { }

	//#region state
	onStateChange = (cb: StateSub<S>) => {
		this.stateSubs.add(cb)

		return () => {
			this.stateSubs.delete(cb)
		}
	}

	onValueChange = <K extends keyof S>(k: K, cb: KeySub<S>) => {
		let keySubs = this.keySubs.get(k)

		if (!keySubs) {
			keySubs = new Set()
			this.keySubs.set(k, keySubs)
		}

		keySubs.add(cb)

		return () => {
			keySubs.delete(cb)
		}
	}

	setState = (delta: Partial<typeof this['state']>) => {
		this.state = {
			...this.state,
			...delta,
		}

		this.updateStateChangeSubscribers(this.state)
		this.updateKeySubscribers(delta)
	}

	reduce = (reducer: (state: typeof this['state']) => Partial<typeof this['state']>) => {
		const nextState = reducer(this.state)

		this.setState(nextState)
	}
	//#endregion state

	//#region events
	onEvent = <K extends keyof E>(k: K, cb: KeySub<E, K>) => {
		let nsListeners = this.listeners.get(k)

		if (!nsListeners) {
			nsListeners = new Set()
			this.listeners.set(k, nsListeners)
		}

		nsListeners.add(cb as KeySub<E, keyof E>)

		return () => {
			nsListeners!.delete(cb as KeySub<E, keyof E>)
		}
	}

	dispatch = <K extends keyof E>(key: K, data?: E[K] extends undefined ? never : E[K]) => {
		this.updateEventListeners(key, data)
	}
	//#endregion events
}
