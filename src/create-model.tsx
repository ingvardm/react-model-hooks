import React, {
	createContext,
	useContext,
	useMemo,
} from 'react'

import { Model } from './ModelWithHooks'
import { Ctor, ModelProviderProps } from './types'

export function createModel<E extends {} = {}, S extends {} = {}, M extends Model<E, S> = Model<E, S>>(CName: Ctor<E, S, M>) {
	const Ctx = createContext<M>({} as M)

	function Provider({ value, initialState, ...props }: ModelProviderProps<E, S, M>) {
		if (!value && !initialState) throw new Error('createModel: either <value> or <initialState> must be supplyed')

		const viewModel = useMemo(() => value || new CName(initialState), [])

		return <Ctx.Provider {...props} value={viewModel} />
	}

	return {
		Ctx,
		Provider,
		useModel() {
			const model = useContext(Ctx)

			if (!model) {
				throw new Error(`[useModel]: Could not find model\n${JSON.stringify(Ctx, null, 2)}`)
			}

			return useContext(Ctx)
		},
	}
}
