import React, { createContext, FC, ProviderProps, useContext, useEffect, useMemo } from 'react'

type Callbacks = Record<string, (...args: any[]) => boolean | void>

const SharedCallbacksCtx = createContext({} as Callbacks)

SharedCallbacksCtx.displayName = 'SharedCallbacks'

export class SharedCallbacksOptions {
	static debug = false
}

export const SharedCallbacksProvider: FC<ProviderProps<Callbacks>> = ({
	value,
	...props
}) => {
	const parentValue = useContext(SharedCallbacksCtx)

	const memoizedValue = useMemo(() => {
		return {
			...parentValue,
			...value,
		}
	}, [
		...Object.values(parentValue),
		...Object.values(value),
	])

	useEffect(() => {
		if (SharedCallbacksOptions.debug) {
			Object.keys(value).forEach(key => {
				if (parentValue[key]) {
					console.warn(`[SharedCallbacksProvider] mount: callback '${key}' overrides another callback`)
					console.log(`new: ${value[key].toString()}`)
					console.log(`old: ${parentValue[key].toString()}`)
				}
			})
		}
	}, [])

	return <SharedCallbacksCtx.Provider value={memoizedValue} {...props} />
}

export function useSharedCallbacks<T extends Callbacks>() {
	return useContext(SharedCallbacksCtx) as T
}
