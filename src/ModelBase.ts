export type KeySub<S, K extends keyof S = keyof S> = (v: S[K]) => void
export type KeySubs<S> = Map<keyof S, Set<KeySub<S, keyof S>>>
export type StateSub<S> = (s: S) => unknown
export type StateSubs<S> = Set<StateSub<S>>

export abstract class ModelBase<E = {}> {
	protected keySubs: KeySubs<typeof this['state']> = new Map()
	protected stateSubs: StateSubs<typeof this['state']> = new Set()
	protected listeners: KeySubs<E> = new Map()

	protected updateSingleKeySubscriber = <K extends keyof typeof this['state']>(k: K, v: typeof this['state'][K]) => {
		this.keySubs.get(k)?.forEach((cb) => cb(v))
	}

	protected updateKeySubscribers = (delta: Partial<typeof this['state']>) => {
		const keyVals = Object.entries(delta) as [keyof typeof this['state'], typeof this['state'][keyof typeof this['state']]][]

		for (const [key, val] of keyVals) {
			if (this.keySubs.has(key)) {
				this.updateSingleKeySubscriber(key, val)
			}
		}
	}

	protected updateStateChangeSubscribers = (state: typeof this['state']) => {
		this.stateSubs.forEach(cb => cb(state))
	}

	protected updateEventListeners = <K extends keyof E>(k: K, data?: E[K] extends undefined ? never : E[K]) => {
		this.listeners.get(k)?.forEach((cb) => cb(data!))
	}

	onStateChange = (cb: StateSub<typeof this['state']>) => {
		this.stateSubs.add(cb)

		return () => {
			this.stateSubs.delete(cb)
		}
	}

	onValueChange = <K extends keyof typeof this['state']>(k: K, cb: KeySub<typeof this['state']>) => {
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
		this.state = { ...this.state as {}, ...delta }

		this.updateStateChangeSubscribers(this.state)
		this.updateKeySubscribers(delta)
	}

	reduce = (reducer: (state: typeof this['state']) => Partial<typeof this['state']>) => {
		const nextState = reducer(this.state)

		this.setState(nextState)
	}

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

	abstract state: unknown
}
