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

export abstract class Model<E extends EventsScheme = {}> extends ModelBase<E> {
	useState = <K extends keyof typeof this['state']>(key: K): [typeof this['state'][K], (v: typeof this['state'][K]) => void] => {
		const setVal = useCallback((v: typeof this['state'][K]) => {
			const prev = (this.state as typeof this['state'])[key]

			if (Object.is(prev, v)) return

			const delta: Partial<typeof this['state']> = {}

			delta[key] = v

			this.setState(delta)
		}, [key])

		const getSnapshot = useCallback(() => this.state[key], [key])

		const val: typeof this['state'][typeof key] = useSyncExternalStore(
			(cb) => this.onValueChange(key, () => cb()),
			getSnapshot,
			getSnapshot,
		)

		return [val, setVal]
	}

	useMapper = <T>(mapper: (state: typeof this['state'], prevState: typeof this['state']) => T) => {
		const mapperRef = useRef(mapper)

		const lastState = useRef(this.state)
		const lastValue = useRef(mapper(this.state, this.state))

		const deps = useMemo(() => {
			mapperRef.current = mapper

			return computeDeps(mapper, this.state, lastState.current)
		}, [mapper])

		const getSnapshot = useCallback(() => {
			if (lastState.current !== this.state) {
				lastValue.current = mapperRef.current(this.state, lastState.current)
				lastState.current = this.state

				return lastValue.current
			}

			return lastValue.current
		}, [])

		const subscribe = useCallback((onChange: () => void) => {
			return this.onValuesChange(deps, onChange)
		}, [deps])

		return useSyncExternalStore<T>(
			subscribe,
			getSnapshot,
			getSnapshot,
		)
	}

	useEffect = (effect: (state: typeof this['state'], prevState: typeof this['state']) => unknown) => {
		const effectRef = useRef(effect)
		const lastState = useRef({ ...this.state })

		const deps = useMemo(() => {
			effectRef.current = effect

			return computeDeps(effect, this.state, lastState.current)
		}, [effect])

		useEffect(() => this.onValuesChange(
			deps,
			() => {
				effectRef.current(this.state, lastState.current)
				lastState.current = { ...this.state }
			}
		), [deps])
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
