import {
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react'

import { ModelBase, ValueSubscription } from './ModelBase'
import { deepEqual } from './compare-utils'

export abstract class Model<E = {}> extends ModelBase<E> {
	useState = <K extends keyof typeof this['state']>(key: K) => {
		const [value, setValue] = useState((this.state as typeof this['state'])[key])

		useEffect(() => this.onValueChange(key, setValue as ValueSubscription<typeof this['state']>), [])

		const setter = useCallback((v: typeof this['state'][K]) => {
			const delta: Partial<typeof this['state']> = {}

			delta[key] = v

			this.setState(delta)
		}, [key])

		return [value, setter] as [typeof value, (v: typeof value) => void]
	}

	useEvent = <K extends keyof E>(ns: K, cb?: ValueSubscription<E, K>) => {
		useEffect(() => {
			if (cb)
				return this.onEvent(ns, cb)
		}, [cb])

		return (data?: E[K] extends undefined ? never : E[K]) => this.dispatch(ns, data)
	}

	useMapper = <T>(cb: (state: typeof this['state']) => T, deps: any[]) => {
		const [value, setValue] = useState(cb(this.state))

		const lastValue = useRef(value)
		const cbRef = useRef(cb)

		// state change callback
		// will update the value if not deep equal
		const onStateChange = useCallback((state: typeof this['state']) => {
			const out = cbRef.current(state)

			if (!deepEqual(lastValue.current, out)) {
				lastValue.current = out
				setValue(out)
			}
		}, [])

		// subscribe to state change
		// return unsubscribe as cleanup
		useEffect(() => this.onStateChange(onStateChange), [])

		// update cb ref when deps change
		// also update value if cb output is
		useEffect(() => {
			cbRef.current = cb
			onStateChange(this.state)
		}, deps)

		return value
	}
}
