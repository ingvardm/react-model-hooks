import {
	EventSubscription,
	EventSubscriptions,
	EventsScheme,
	StatePlaceholder,
	StateSubscription,
	StateSubscriptions,
	ValueSubscription,
	ValueSubscriptions,
} from "./common-types"

function updateSingleKeySubscriber<
	S extends StatePlaceholder,
	K extends keyof S,
>(subs: ValueSubscriptions<S>, k: K, v: S[K]) {
	subs.get(k)?.forEach((cb) => cb(v))
}

function updateKeySubscribers<S extends StatePlaceholder>(
	subs: ValueSubscriptions<S>,
	delta: Partial<S>,
) {
	const keyVals = Object.entries(delta)

	for (const [key, val] of keyVals) {
		if (subs.has(key)) {
			updateSingleKeySubscriber(subs, key, val)
		}
	}
}

function updateStateChangeSubscribers<S extends StatePlaceholder>(
	subs: StateSubscriptions<S>,
	state: S,
) {
	subs.forEach(cb => cb(state))
}


function updateEventListeners<
	TEvents extends EventsScheme,
	K extends keyof TEvents,
	D extends TEvents[K],
>(listeners: EventSubscriptions<TEvents>, k: K, data?: D) {
	listeners.get(k)?.forEach((cb) => cb(data!))
}

export abstract class ModelBase<TEvents extends EventsScheme = {}> {
	protected keySubs: ValueSubscriptions<StatePlaceholder> = new Map()
	protected stateSubs: StateSubscriptions<StatePlaceholder> = new Set()
	protected listeners: EventSubscriptions<TEvents> = new Map()

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

		updateStateChangeSubscribers(this.stateSubs, this.state)
		updateKeySubscribers(this.keySubs, delta)
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
		updateEventListeners(this.listeners, key, data)
	}

	abstract state: StatePlaceholder
}
