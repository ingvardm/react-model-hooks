import { Context, useContext, useEffect } from 'react'

import { Model } from '../Model'
import { Sub } from '../types'

export function useModelInstanceEvent<K extends keyof M['events'], D extends M['events'], M extends Model<M['state'], M['events']>>(
	viewModel: M,
	ns: K,
	cb?: Sub<D, K>,
) {
	useEffect(() => {
		if (cb) {
			return viewModel.onEvent(ns, cb as Sub<M['events']>)
		}
	}, [cb])

	return (data?: D[K] extends undefined ? never : D[K]) => viewModel.dispatch(ns, data!)
}

export function useModelCtxEvent<K extends keyof M['events'], D extends M['events'], M extends Model<M['state'], M['events']>>(
	ctx: Context<M>,
	ns: K,
	cb?: (eventData: D[K]) => void,
) {
	const viewModel = useContext(ctx)

	return useModelInstanceEvent(viewModel, ns, cb)
}
