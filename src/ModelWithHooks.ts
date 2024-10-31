import { useCallback, useEffect, useState } from 'react'

import { ModelBase } from './ModelBase'
import { KeySub } from './types'

export abstract class Model<E = {}, S = {}> extends ModelBase<E, S> {
	abstract state: S

	useState = <K extends keyof S>(key: K) => {
		const [value, setValue] = useState(this.state[key])

		useEffect(() => this.onValueChange(key, setValue as KeySub<typeof this['state']>), [])

		const setter = useCallback((v: S[K]) => {
			const delta: Partial<typeof this['state']> = {}

			delta[key] = v

			this.setState(delta)
		}, [key])

		return [value, setter]
	}

	useEvent = <K extends keyof E>(ns: K, cb?: KeySub<E, K>) => {
		useEffect(() => {
			if (cb)
				return this.onEvent(ns, cb)
		}, [cb])

		return (data?: E[K] extends undefined ? never : E[K]) => this.dispatch(ns, data)
	}

	useMapper = <T>(cb: (state: S) => T) => {
		const [value, setValue] = useState(cb(this.state))

		const onStateChange = useCallback((state: S) => {
			setValue(cb(state))
		}, [])

		useEffect(() => this.onStateChange(onStateChange), [])

		return value
	}
}
