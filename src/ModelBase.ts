export type KeySub<S, K extends keyof S = keyof S> = (v: S[K]) => void
export type KeySubs<S> = Map<keyof S, Set<KeySub<S, keyof S>>>
export type StateSub<S> = (s: S) => unknown
export type StateSubs<S> = Set<StateSub<S>>

export class ModelBase<S = {}, E = {}> {
	protected initialState
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

	constructor(public state: S) {
		this.initialState = { ...state }
	}

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

	setState = (delta: Partial<S>) => {
		this.state = {
			...this.state,
			...delta,
		}

		this.updateStateChangeSubscribers(this.state)
		this.updateKeySubscribers(delta)
	}

	setValue = <K extends keyof S>(key: K, value: S[K]) => {
		this.state[key] = value

		this.updateStateChangeSubscribers(this.state)
		this.updateSingleKeySubscriber(key, value!)
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
