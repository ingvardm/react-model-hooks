import React, {
	createContext,
	ProviderProps,
	useContext,
	useMemo,
} from 'react'

import { Model } from './ModelWithHooks'
import { ModelBase } from './ModelBase'

type Ctor<TEvents extends {}, TModel extends ModelBase<TEvents>> = new (...args: any[]) => TModel

export type ModelProviderProps<TEvents, TModel extends ModelBase<TEvents>> = Omit<ProviderProps<TModel>, 'value'> & {
	value?: TModel
}

export function createModel<TEvents extends {} = {}, TModel extends Model<TEvents> = Model<TEvents>>(CName: Ctor<TEvents, TModel>) {
	const Ctx = createContext<TModel>({} as TModel)

	function Provider({ value, ...props }: ModelProviderProps<TEvents, TModel>) {
		if (!value) throw new Error('createModel: either <value> or <initialState> must be supplyed')

		const viewModel = useMemo(() => value || new CName(), [])

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
