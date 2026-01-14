import { StatePlaceholder } from "./common-types"

export function shallowEqual<S extends Record<string, unknown>>(a: S, b: S) {
	if (a === b) return true

	const aKeys = Object.keys(a)
	const bKeys = Object.keys(b)

	if (aKeys.length !== bKeys.length) return false

	for (const key of aKeys) {
		if (!Object.is(a[key], b[key])) {
			return false
		}
	}

	return true
}

export function isEqual<T>(a: T, b: T): boolean {
	if (Object.is(a, b)) return true

	if (
		typeof a === 'object' && a !== null &&
		typeof b === 'object' && b !== null &&
		!Array.isArray(a) && !Array.isArray(b)
	) {
		return shallowEqual(a as Record<string, unknown>, b as Record<string, unknown>)
	}

	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false
		for (let i = 0; i < a.length; i++) {
			if (!Object.is(a[i], b[i])) return false
		}
		return true
	}

	return false
}

export function computeDeps<T, S extends StatePlaceholder>(
	func: (currentState: S, prevState: S) => T,
	currentState: S,
	prevState: S,
) {
	const deps = new Set<keyof S>()

	const trackingHandler: ProxyHandler<S> = {
		get: (t, k) => {
			if (typeof k === 'string') {
				deps.add(k)
			}
			return t[k as keyof S]
		},
	}

	const result = func(
		new Proxy(currentState, trackingHandler),
		new Proxy(prevState, trackingHandler)
	)

	return {
		result: result as T,
		deps: Array.from(deps),
	}
}
