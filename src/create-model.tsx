import React, {
	createContext,
	ProviderProps,
	useContext,
	useMemo,
} from 'react'

import { Model } from './ModelWithHooks'
import { ModelBase } from './ModelBase'

type Ctor<
	E extends {},
	S extends {},
	M extends ModelBase<E>
> = new (initialState?: S) => M

export type ModelProviderProps<E, S, M extends ModelBase<E>> = Omit<ProviderProps<M>, 'value'> & {
	value?: M
	initialState?: S
}

export function createModel<E extends {} = {}, S extends {} = {}, M extends Model<E> = Model<E>>(CName: Ctor<E, S, M>) {
	const Ctx = createContext<M>({} as M)

	function Provider({ value, initialState, ...props }: ModelProviderProps<E, S, M>) {
		if (!value && !initialState) throw new Error('createModel: either <value> or <initialState> must be supplyed')

		const viewModel = useMemo(() => value || new CName(initialState), [])

		return <Ctx.Provider {...props} value={viewModel} />
	}

	function useModel() {
		const model = useContext(Ctx)

		if (!model) {
			throw new Error(`[useModel]: Could not find model\n${JSON.stringify(Ctx, null, 2)}`)
		}

		return model
	}

	return { Ctx, Provider, useModel }
}
