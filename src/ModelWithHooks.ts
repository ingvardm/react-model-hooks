import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useSyncExternalStore,
} from 'react'

import { ModelBase } from './ModelBase'
import {
	EventsScheme,
	StatePlaceholder,
	ValueSubscription,
} from './common-types'

function computeDeps<
	S extends StatePlaceholder,
	M extends (s: S) => unknown,
>(mapper: M, state: S) {
	const deps = new Set<keyof S>()

	mapper(new Proxy(state, {
		get: (t, k) => {
			deps.add(k)

			return t[k]
		},
	}))

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

	useMapper = <T>(mapper: (state: typeof this['state']) => T) => {
		const mapperRef = useRef(mapper)

		const lastState = useRef(this.state)
		const lastValue = useRef(mapper(this.state))

		const mapperDeps = useMemo(() => {
			return computeDeps(mapper, this.state)
		}, [mapper])

		useEffect(() => {
			mapperRef.current = mapper
		}, [mapper])

		const getSnapshot = useCallback(() => {
			if (lastState.current !== this.state) {
				lastState.current = this.state
				lastValue.current = mapperRef.current(this.state)

				return lastValue.current
			}

			return lastValue.current
		}, [])

		const subscribe = useCallback((onChange: () => void) => {
			return this.onValuesChange(mapperDeps, onChange)
		}, [mapperDeps])

		return useSyncExternalStore<T>(
			subscribe,
			getSnapshot,
			getSnapshot,
		)
	}

	useEvent = <K extends keyof E>(ns: K, cb?: ValueSubscription<E, K>) => {
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
