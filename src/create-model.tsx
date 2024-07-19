import React, {
	ProviderProps,
	createContext,
	useContext,
	useMemo,
} from 'react'

import { Model } from './ModelWithHooks'

type ModelProviderProps<S, E, M extends Model<S, E>> = Omit<ProviderProps<M>, 'value'> & {
	value?: M
	initialState?: S
}

type Ctor<S extends {}, E extends {}, M extends Model<S, E>> = new (initialState?: S) => M

export function createModel<S extends {} = {}, E extends {} = {}, M extends Model<S, E> = Model<S, E>>(CName: Ctor<S, E, M>) {
	const Ctx = createContext<M>({} as M)

	function Provider({ value, initialState, ...props }: ModelProviderProps<S, E, M>) {
		if (!value && !initialState) throw new Error('createModel: either <value> or <initialState> must be supplyed')

		const viewModel = useMemo(() => value || new CName(initialState), [])

		return <Ctx.Provider {...props} value={viewModel} />
	}

	return {
		Ctx,
		Provider,
		useModel() {
			return useContext(Ctx)
		},
	}
}
