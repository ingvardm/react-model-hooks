import {
	useCallback,
	useEffect,
	useRef,
	useSyncExternalStore,
} from 'react'

import { ModelBase } from './ModelBase'
import {
	EventSubscription,
	EventsScheme,
	StatePlaceholder,
} from './common-types'

function computeDeps<S extends StatePlaceholder>(
	func: (currentState: S, prevState: S) => void,
	currentState: S,
	prevState: S,
) {
	const deps = new Set<keyof S>()

	func(new Proxy(currentState, {
		get: (t, k) => {
			deps.add(k)

			return t[k]
		},
	}), prevState)

	return Array.from(deps)
}

export class Model<E extends EventsScheme = {}> extends ModelBase<E> {
	useState = <K extends keyof typeof this['state']>(key: K): [typeof this['state'][K], (v: typeof this['state'][K]) => void] => {
		const setValue = useCallback((v: typeof this['state'][K]) => {
			const previousValue = (this.state as typeof this['state'])[key]

			// Avoid useless updates when value is unchanged.
			if (Object.is(previousValue, v)) return

			const nextStatePatch: Partial<typeof this['state']> = {}

			nextStatePatch[key] = v

			this.setState(nextStatePatch)
		}, [key])

		const subscribe = useCallback((onChange: () => void) => {
			return this.onValueChange(key, onChange)
		}, [key])

		const getSnapshot = useCallback(() => this.state[key], [key])

		const val: typeof this['state'][typeof key] = useSyncExternalStore(
			subscribe,
			getSnapshot,
			getSnapshot,
		)

		return [val, setValue]
	}

	useMapper = <T>(mapper: (state: typeof this['state'], prevState: typeof this['state']) => T) => {
		const latestMapperRef = useRef(mapper)
		const previousStateRef = useRef(this.state)
		const derivedValueRef = useRef(mapper(this.state, this.state))

		latestMapperRef.current = mapper

		const deps = computeDeps(
			latestMapperRef.current,
			this.state,
			previousStateRef.current,
		).sort()

		const depsSig = deps.join("\u0000")

		const getSnapshot = useCallback(() => {
			if (previousStateRef.current !== this.state) {
				derivedValueRef.current = latestMapperRef.current(this.state, previousStateRef.current)
				previousStateRef.current = this.state
			}

			return derivedValueRef.current
		}, [])

		const subscribe = useCallback((onChange: () => void) => {
			return this.onValuesChange(deps, onChange)
		}, [depsSig])

		return useSyncExternalStore<T>(
			subscribe,
			getSnapshot,
			getSnapshot,
		)
	}

	useEvent = <K extends keyof E>(ns: K, cb?: EventSubscription<E, K>) => {
		useEffect(() => {
			if (!cb) return

			return this.onEvent(ns, cb)
		}, [ns, cb])

		return (data?: E[K] extends undefined ? never : E[K]) => this.dispatch(ns, data)
	}
}
