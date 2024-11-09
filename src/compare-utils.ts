export function shallowEqual(objA: any, objB: any): boolean {
	return objA === objB || (objA !== objA && objB !== objB)
}

export function deepEqual(objA: any, objB: any) {
	if (shallowEqual(objA, objB)) return true

	if (typeof objA !== 'object' || objA === null ||
		typeof objB !== 'object' || objB === null) return false

	if (Object.keys(objA).length !== Object.keys(objB).length) return false

	for (let key in objA) {
		if (!objB.hasOwnProperty(key)) return false
		if (!deepEqual(objA[key], objB[key])) return false
	}

	return true
}
