import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useSyncExternalStore,
} from 'react'

import { ModelBase } from './ModelBase'
import {
	EventSubscription,
	EventsScheme,
	StatePlaceholder,
} from './common-types'

// Create a shallow proxy to record which state keys a consumer reads.
function makeProxy(
	state: StatePlaceholder,
	recordDependency: (k: string) => void,
) {
	const proxy = {}

	for (const [key, value] of Object.entries(state)) {
		Object.defineProperty(proxy, key, {
			enumerable: true,
			configurable: false,
			get() {
				recordDependency(key)
				return value
			},
		})
	}

	return proxy
}

export abstract class Model<E extends EventsScheme = {}> extends ModelBase<E> {
	useState = <K extends keyof typeof this['state']>(key: K): [typeof this['state'][K], (v: typeof this['state'][K]) => void] => {
		const setValue = useCallback((v: typeof this['state'][K]) => {
			const previousValue = (this.state as typeof this['state'])[key]

			// Avoid useless updates when value is unchanged.
			if (Object.is(previousValue, v)) return

			const nextStatePatch: Partial<typeof this['state']> = {}

			nextStatePatch[key] = v

			this.setState(nextStatePatch)
		}, [key])

		const getSnapshot = useCallback(() => this.state[key], [key])

		const val: typeof this['state'][typeof key] = useSyncExternalStore(
			(cb) => this.onValueChange(key, () => cb()),
			getSnapshot,
			getSnapshot,
		)

		return [val, setValue]
	}

	useMapper = <T>(mapper: (state: typeof this['state'], prevState: typeof this['state']) => T) => {
		const latestMapperRef = useRef(mapper)

		const previousStateRef = useRef(this.state)
		const derivedValueRef = useRef(mapper(this.state, this.state))

		// Keep mapper ref fresh without re-subscribing.
		useEffect(() => {
			latestMapperRef.current = mapper
		}, [mapper])

		const dependencyKeysRef = useRef(new Set<string>())

		const dependencyProxy = useMemo(() => {
			return makeProxy(this.state, k => {
				dependencyKeysRef.current.add(k)
			})
		}, [])

		const dependencyKeys = useMemo(() => {
			dependencyKeysRef.current = new Set()

			// Execute mapper on the proxy to collect touched keys.
			mapper(dependencyProxy, previousStateRef.current)

			return Array.from(dependencyKeysRef.current)
		}, [mapper])

		const getSnapshot = useCallback(() => {
			if (previousStateRef.current !== this.state) {
				derivedValueRef.current = latestMapperRef.current(this.state, previousStateRef.current)
				previousStateRef.current = this.state

				return derivedValueRef.current
			}

			return derivedValueRef.current
		}, [])

		const subscribe = useCallback((onChange: () => void) => {
			return this.onValuesChange(dependencyKeys, onChange)
		}, [dependencyKeys])

		return useSyncExternalStore<T>(
			subscribe,
			getSnapshot,
			getSnapshot,
		)
	}

	useStateEffect = (effect: (state: typeof this['state'], prevState: typeof this['state']) => unknown) => {
		const latestEffectRef = useRef(effect)
		const previousStateRef = useRef({ ...this.state })

		const dependencyKeysRef = useRef(new Set<string>())

		const dependencyProxy = useMemo(() => {
			return makeProxy(this.state, k => {
				dependencyKeysRef.current.add(k)
			})
		}, [])

		// Keep effect ref current; subscription uses the ref.
		useEffect(() => {
			latestEffectRef.current = effect
		}, [effect])

		const dependencyKeys = useMemo(() => {
			dependencyKeysRef.current = new Set()

			// Execute effect once to discover which keys it reads.
			effect(dependencyProxy, previousStateRef.current)

			return Array.from(dependencyKeysRef.current)
		}, [effect])

		useEffect(() => this.onValuesChange(
			dependencyKeys,
			() => {
				latestEffectRef.current(this.state, previousStateRef.current)
				previousStateRef.current = { ...this.state }
			}
		), [dependencyKeys])
	}

	useEvent = <K extends keyof E>(ns: K, cb?: EventSubscription<E, K>) => {
		useEffect(() => {
			let removeListener = () => { }

			if (!!cb) {
				removeListener = this.onEvent(ns, cb)
			}

			return removeListener
		}, [ns, cb])

		return (data?: E[K] extends undefined ? never : E[K]) => this.dispatch(ns, data)
	}
}
