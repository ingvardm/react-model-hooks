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

export function computeDeps<S extends StatePlaceholder>(
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
