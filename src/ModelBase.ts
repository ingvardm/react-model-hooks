export type ValueSubscription<S, K extends keyof S = keyof S> = (v: S[K]) => void
export type ValueSubscriptions<S> = Map<keyof S, Set<ValueSubscription<S, keyof S>>>
export type StateSubscription<S> = (s: S) => unknown
export type StateSubscriptions<S> = Set<StateSubscription<S>>
export type EventSubscription<E, K extends keyof E = keyof E> = (v: E[K]) => void
export type EventSubscriptions<E> = Map<keyof E, Set<EventSubscription<E, keyof E>>>

type StatePlaceholder = Record<PropertyKey, unknown>

export abstract class ModelBase<TEvents = {}> {
	protected keySubs: ValueSubscriptions<StatePlaceholder> = new Map()
	protected stateSubs: StateSubscriptions<StatePlaceholder> = new Set()
	protected listeners: EventSubscriptions<TEvents> = new Map()

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

	protected updateEventListeners = <K extends keyof TEvents>(k: K, data?: TEvents[K] extends undefined ? never : TEvents[K]) => {
		this.listeners.get(k)?.forEach((cb) => cb(data!))
	}

	onStateChange = (cb: StateSubscription<typeof this['state']>) => {
		this.stateSubs.add(cb)

		return () => {
			this.stateSubs.delete(cb)
		}
	}

	onValueChange = <K extends keyof typeof this['state']>(k: K, cb: ValueSubscription<typeof this['state']>) => {
		let keySubs = this.keySubs.get(k)

		if (!keySubs) {
			keySubs = new Set()
			this.keySubs.set(k, keySubs)
		}

		keySubs.add(cb)

		return () => {
			keySubs?.delete(cb)
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

	onEvent = <K extends keyof TEvents>(k: K, cb: EventSubscription<TEvents, K>) => {
		let nsListeners = this.listeners.get(k)

		if (!nsListeners) {
			nsListeners = new Set()
			this.listeners.set(k, nsListeners)
		}

		nsListeners.add(cb as EventSubscription<TEvents, keyof TEvents>)

		return () => {
			nsListeners!.delete(cb as EventSubscription<TEvents, keyof TEvents>)
		}
	}

	dispatch = <K extends keyof TEvents>(key: K, data?: TEvents[K] extends undefined ? never : TEvents[K]) => {
		this.updateEventListeners(key, data)
	}

	abstract state: StatePlaceholder
}
