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
