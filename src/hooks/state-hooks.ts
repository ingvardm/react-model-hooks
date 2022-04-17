import {
	Context,
	useCallback,
	useContext,
	useEffect,
	useState,
} from 'react'

import { Model } from '../Model'
import { Sub } from '../types'

export function useModelInstanceState<K extends keyof M['state'], M extends Model<M['state'], M['events']>>(
	viewModel: M,
	key: K
): [M['state'][K], (data: M['state'][K]) => void] {
	const [value, setValue] = useState(viewModel.state[key])

	useEffect(() => viewModel.onStateChange(key, setValue as Sub<M['state']>), [])

	const setter = useCallback((v) => {
		viewModel.setValue(key, v)
	}, [key])

	return [value, setter]
}

export function useModelCtxState<K extends keyof M['state'], M extends Model<M['state'], M['events']>>(
	ctx: Context<M>,
	key: K
) {
	const viewModel = useContext(ctx)

	return useModelInstanceState(viewModel, key)
}
