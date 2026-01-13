import { StatePlaceholder } from "./common-types"

export function shallowEqual<S extends Record<string, unknown>>(a: S, b: S) {
	if (a === b) return true

	const keys = new Set([...Object.keys(a), ...Object.keys(b)])

	for (const key of keys) {
		const av = a[key]
		const bv = b[key]

		if (av === bv) {
			continue
		}

		// Handle NaN
		if (av !== av && bv !== bv) {
			continue
		}

		if (!Object.is(av, bv)) {
			return false
		}
	}

	return true
}

export function computeDeps<T, S extends StatePlaceholder>(
	func: (currentState: S, prevState: S) => T,
	currentState: S,
	prevState: S,
) {
	const deps = new Set<keyof S>()

	const result = func(new Proxy(currentState, {
		get: (t, k) => {
			deps.add(k)

			return t[k]
		},
	}), prevState)

	return {
		result: result as T,
		deps: Array.from(deps),
	}
}
