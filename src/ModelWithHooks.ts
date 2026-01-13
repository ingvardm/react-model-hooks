import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
} from 'react'

import { ModelBase } from './ModelBase'
import { EventSubscription, EventsScheme, StateSubscription } from './common-types'
import { computeDeps } from './utils'

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

	useDerived = <T>(
		mapper: (state: typeof this['state'], prevState: typeof this['state']) => T,
		mapperDeps: any[] = [],
	) => {
		const latestMapperRef = useRef(mapper)
		latestMapperRef.current = mapper

		const { result: derivedValue, deps: stateDeps } = useMemo(() => {
			return computeDeps(
				latestMapperRef.current,
				this.state,
				this.state,
			)
		}, mapperDeps)

		const initialValue = useRef(derivedValue).current

		const [val, setVal] = useState<T>(derivedValue)

		const unsubscribe = useRef(() => { })

		const reSubscribe = useCallback((deps: (keyof this["state"])[]) => {
			unsubscribe.current()

			unsubscribe.current = this.onValuesChange(deps, updateValue)
		}, [])

		const updateValue = useCallback<StateSubscription<this["state"]>>((next, prev) => {
			const { result, deps } = computeDeps(latestMapperRef.current, next, prev)

			setVal(result)
			reSubscribe(deps)
		}, [])

		useEffect(() => {
			if (initialValue !== derivedValue) {
				setVal(derivedValue)
			}

			reSubscribe(stateDeps)

			return () => {
				unsubscribe.current()
			}
		}, [derivedValue, stateDeps])

		return val
	}

	useEvent = <K extends keyof E>(ns: K, cb?: EventSubscription<E, K>) => {
		useEffect(() => {
			if (!cb) return

			return this.onEvent(ns, cb)
		}, [ns, cb])

		return (data?: E[K] extends undefined ? never : E[K]) => this.dispatch(ns, data)
	}
}
