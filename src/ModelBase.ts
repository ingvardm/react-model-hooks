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

//#region utils
function updateSingleKeySubscriber<
	S extends StatePlaceholder,
	K extends keyof S,
>(
	subs: ValueSubscriptions<S>,
	k: K,
	v: S[K],
	uniqueSubsSet?: WeakSet<ValueSubscription<S, keyof S>>
) {
	subs.get(k)?.forEach((cb) => {
		if (!uniqueSubsSet?.has(cb)) {
			uniqueSubsSet?.add(cb)
			cb(v)
		}
	})
}

function updateKeySubscribers<S extends StatePlaceholder>(
	subs: ValueSubscriptions<S>,
	delta: Partial<S>,
) {
	const keyVals = Object.entries(delta)

	const subscribersSetRef = new WeakSet<ValueSubscription<S, keyof S>>()

	for (const [key, val] of keyVals) {
		if (subs.has(key)) {
			updateSingleKeySubscriber(subs, key, val, subscribersSetRef)
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
//#endregion utils

export abstract class ModelBase<TEvents extends EventsScheme = EventsScheme> {
	protected keySubs: ValueSubscriptions<StatePlaceholder> = new Map()
	protected stateSubs: StateSubscriptions<StatePlaceholder> = new Set()
	protected listeners: EventSubscriptions<EventsScheme> = new Map()

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

	onValuesChange = <K extends keyof typeof this['state']>(selector: K[], cb: ValueSubscription<typeof this['state']>) => {
		const unsubs: (() => void)[] = []

		selector.forEach(k => {
			unsubs.push(this.onValueChange(k, cb))
		})

		return () => {
			unsubs.forEach(unsub => unsub())
		}
	}

	setState = (delta: Partial<StatePlaceholder<typeof this['state']>>) => {
		this.state = { ...this.state, ...delta }

		updateStateChangeSubscribers(this.stateSubs, this.state)
		updateKeySubscribers(this.keySubs, delta)
	}

	reduce = (reducer: (state: typeof this['state']) => Partial<typeof this['state']>) => {
		const nextState = reducer(this.state)

		this.setState(nextState)
	}

	onEvent = <K extends keyof TEvents>(k: K, cb: EventSubscription<TEvents, K>) => {
		let nsListeners = this.listeners.get(k as keyof EventsScheme)

		if (!nsListeners) {
			nsListeners = new Set()
			this.listeners.set(k as keyof EventsScheme, nsListeners)
		}

		nsListeners.add(cb as EventSubscription<EventsScheme, keyof EventsScheme>)

		return () => {
			nsListeners!.delete(cb as EventSubscription<EventsScheme, keyof EventsScheme>)
		}
	}

	dispatch = <K extends keyof TEvents>(key: K, data?: TEvents[K] extends undefined ? never : TEvents[K]) => {
		updateEventListeners(this.listeners, key as keyof EventsScheme, data)
	}

	abstract state: StatePlaceholder
}
