import { Sub, Subs } from './types'

export class Model<S = {}, E = {}> {
	private subs: Subs<S> = new Map()
	private listeners: Subs<E> = new Map()

	private updateSingleSubscriber = <K extends keyof S>(k: K, v: S[K]) => {
		this.subs.get(k)?.forEach((cb) => cb(v))
	}

	private updateSubscribers = (delta: Partial<S>) => {
		const keyVals = Object.entries(delta)

		for (const [key, val] of keyVals as [keyof S, S[keyof S]][]) {
			if (this.subs.has(key)) {
				this.subs.get(key)!.forEach((cb) => cb(val))
			}
		}
	}

	private updateEventListeners = <K extends keyof E>(k: K, data?: E[K] extends undefined ? never : E[K]) => {
		this.listeners.get(k)?.forEach((cb) => cb(data!))
	}

	private initialState = {} as S

	declare events: E

	constructor(
		public state: S = {} as S,
	) {
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
