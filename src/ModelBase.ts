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
import { shallowEqual } from "./utils"

//#region utils
function updateSingleKeySubscriber<
	S extends StatePlaceholder,
	K extends keyof S,
>(
	subs: ValueSubscriptions<S>,
	key: K,
	currentVal: S[K],
	prevVal: S[K],
	uniqueSubsSet?: WeakSet<ValueSubscription<S, keyof S>>
) {
	subs.get(key)?.forEach((subscription) => {
		if (!uniqueSubsSet?.has(subscription)) {
			uniqueSubsSet?.add(subscription)
			subscription(currentVal, prevVal)
		}
	})
}

function updateKeySubscribers<S extends StatePlaceholder>(
	subs: ValueSubscriptions<S>,
	delta: Partial<S>,
	prevState: S,
) {
	const keyVals = Object.entries(delta)

	const subscribersSetRef = new WeakSet<ValueSubscription<S, keyof S>>()

	for (const [key, val] of keyVals) {
		const prevVal = prevState[key] as typeof val

		if (subs.has(key) && !Object.is(val, prevVal)) {
			updateSingleKeySubscriber(subs, key, val, prevVal, subscribersSetRef)
		}
	}
}

function updateStateChangeSubscribers<S extends StatePlaceholder>(
	subs: StateSubscriptions<S>,
	currentState: S,
	prevState: S,
) {
	[...subs].forEach(subscription => subscription(currentState, prevState))
}


function updateEventListeners<
	TEvents extends EventsScheme,
	K extends keyof TEvents,
	D extends TEvents[K],
>(eventListeners: EventSubscriptions<TEvents>, key: K, data?: D) {
	eventListeners.get(key)?.forEach((subscription) => subscription(data!))
}
//#endregion utils

export class ModelBase<
	TState extends StatePlaceholder,
	TEvents extends EventsScheme = EventsScheme
> {
	protected valueSubscriptions: ValueSubscriptions<TState> = new Map()
	protected stateSubscriptions: StateSubscriptions<TState> = new Set()
	protected eventListeners: EventSubscriptions<EventsScheme> = new Map()

	constructor(public state: TState) { }

	onStateChange = (subscription: StateSubscription<TState>) => {
		this.stateSubscriptions.add(subscription)

		return () => {
			this.stateSubscriptions.delete(subscription)
		}
	}

	onValueChange = <K extends keyof typeof this['state']>(
		key: K,
		subscription: ValueSubscription<typeof this['state']>,
	) => {
		let subscriptions = this.valueSubscriptions.get(key)

		if (!subscriptions) {
			subscriptions = new Set()
			this.valueSubscriptions.set(key, subscriptions)
		}

		subscriptions.add(subscription)

		return () => {
			subscriptions?.delete(subscription)
		}
	}

	onValuesChange = <K extends keyof typeof this['state']>(
		keys: readonly K[],
		subscription: StateSubscription<typeof this['state']>,
	) => {
		return this.onStateChange((currentState, prevState) => {
			for (const key of keys) {
				if (!Object.is(prevState[key], currentState[key])) {
					subscription(currentState, prevState)
					break
				}
			}
		})
	}

	setState = (delta: Partial<TState>) => {
		const prevState = this.state
		const nextState = { ...prevState, ...delta }

		if (shallowEqual(prevState, nextState)) {
			return
		}

		this.state = nextState

		updateStateChangeSubscribers(this.stateSubscriptions, this.state, prevState)
		updateKeySubscribers(this.valueSubscriptions, delta, prevState)
	}

	reduce = (reducer: (state: typeof this['state']) => Partial<typeof this['state']>) => {
		const nextState = reducer({ ...this.state })

		this.setState(nextState)
	}

	onEvent = <K extends keyof TEvents>(key: K, subscription: EventSubscription<TEvents, K>) => {
		let nsListeners = this.eventListeners.get(key as keyof EventsScheme)

		if (!nsListeners) {
			nsListeners = new Set()
			this.eventListeners.set(key as keyof EventsScheme, nsListeners)
		}

		nsListeners.add(subscription as EventSubscription<EventsScheme, keyof EventsScheme>)

		return () => {
			nsListeners!.delete(subscription as EventSubscription<EventsScheme, keyof EventsScheme>)
		}
	}

	dispatch = <K extends keyof TEvents>(key: K, data?: TEvents[K] extends undefined ? never : TEvents[K]) => {
		updateEventListeners(this.eventListeners, key as keyof EventsScheme, data)
	}
}
