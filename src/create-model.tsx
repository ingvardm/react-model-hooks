import React, {
	createContext,
	ProviderProps,
	useContext,
	useMemo,
} from 'react'

import { Model } from './ModelWithHooks'
import { ModelBase } from './ModelBase'

type Ctor<E extends {}, M extends ModelBase<E>> = new (...args: any[]) => M

export type ModelProviderProps<E, M extends ModelBase<E>> = Omit<ProviderProps<M>, 'value'> & {
	value?: M
}

export function createModel<E extends {} = {}, M extends Model<E> = Model<E>>(CName: Ctor<E, M>) {
	const Ctx = createContext<M>({} as M)

	function Provider({ value, ...props }: ModelProviderProps<E, M>) {
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
