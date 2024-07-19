import { useCallback, useEffect, useRef, useState } from 'react'
import { ModelBase, KeySub, StateSub } from './ModelBase'

export class Model<S = {}, E = {}> extends ModelBase<S, E> {
	useState = <K extends keyof S>(key: K) => {
		const [value, setValue] = useState(this.state[key])

		useEffect(() => this.onValueChange(key, setValue as KeySub<typeof this['state']>), [])

		const setter = useCallback((v) => {
			this.setValue(key, v)
		}, [key])

		return [value, setter]
	}

	useComputed = (cb: StateSub<S>) => {
		const [value, setValue] = useState(cb(this.state))

		const lastValue = useRef(typeof value === 'object' ? JSON.stringify(value) : value)

		const setValueIfDifferent = useCallback((nextValue: unknown) => {
			let valueChanged = false

			if (typeof value === 'object') {
				const nextValueStringified = JSON.stringify(nextValue)

				valueChanged = nextValueStringified !== lastValue.current

				lastValue.current = nextValueStringified
			} else {
				valueChanged = lastValue.current !== nextValue
			}

			if (valueChanged) {
				setValue(nextValue)
			}
		}, [])

		useEffect(() => {
			setValueIfDifferent(cb(this.state))

			return this.onStateChange((state) => {
				setValueIfDifferent(cb(state))
			})
		}, [cb])

		return value
	}

	useStateEffect = (cb: StateSub<S>) => {
		const cbRef = useRef(cb)

		useEffect(() => {
			cbRef.current = cb
		}, [cb])

		useEffect(() => {
			cbRef.current(this.state)
			this.onStateChange(cbRef.current)
		}, [])
	}

	useEvent = <K extends keyof E>(ns: K, cb?: KeySub<E, K>) => {
		useEffect(() => {
			if (cb) {
				return this.onEvent(ns, cb)
			}
		}, [cb])

		return (data?: E[K] extends undefined ? never : E[K]) => this.dispatch(ns, data!)
	}
}
