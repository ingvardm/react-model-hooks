import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'

import { ModelBase } from './ModelBase'
import { EventsScheme, ValueSubscription } from './common-types'

export abstract class Model<E extends EventsScheme = {}> extends ModelBase<E> {
	useState = <K extends keyof typeof this['state']>(key: K): [typeof this['state'][K], (v: typeof this['state'][K]) => void] => {
		const setVal = useCallback((v: typeof this['state'][K]) => {
			const prev = (this.state as typeof this['state'])[key]

			if (Object.is(prev, v)) return

			const delta: Partial<typeof this['state']> = {}

			delta[key] = v

			this.setState(delta)
		}, [key])

		const val: typeof this['state'][typeof key] = useSyncExternalStore(
			(cb) => this.onValueChange(key, cb),
			() => this.state[key],
			() => this.state[key],
		)

		return [val, setVal]
	}

	useMapper = <T>(mapper: (state: typeof this['state']) => T) => {
		const lastStateRef = useRef<typeof this['state'] | null>(null)
		const lastValueRef = useRef<T | null>(null)
		const mapperRef = useRef(mapper)

		useEffect(() => {
			mapperRef.current = mapper
		}, [mapper])

		const getSnapshot = useCallback(() => {
			const s = this.state

			if (lastStateRef.current === s && lastValueRef.current !== null) {
				return lastValueRef.current as T
			}

			const v = mapperRef.current(s)

			lastStateRef.current = s
			lastValueRef.current = v

			return v
		}, [])

		return useSyncExternalStore<T>(
			(onChange) => this.onStateChange(onChange),
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
