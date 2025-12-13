import React, {
	createContext,
	ProviderProps,
	useContext,
	useEffect,
	useMemo,
} from 'react'

import { Model } from './ModelWithHooks'
import { ModelBase } from './ModelBase'
import { EventsScheme } from './common-types'

type Ctor<TEvents extends {}, TModel extends ModelBase<TEvents>> = new (...args: any[]) => TModel

export type ModelProviderProps<TEvents extends EventsScheme, TModel extends ModelBase<TEvents>> = Omit<ProviderProps<TModel>, 'value'> & {
	value?: TModel
	state?: TModel['state']
	onChange?: (state: TModel['state'], prevState: TModel['state']) => void
}

export function createModel<TEvents extends {} = {}, TModel extends Model<TEvents> = Model<TEvents>>(CName: Ctor<TEvents, TModel>) {
	const Ctx = createContext<TModel | null>(null)

	function Provider({
		value,
		state,
		onChange,
		...props
	}: ModelProviderProps<TEvents, TModel>) {
		const model = useMemo(() => value || new CName(), [])

		useEffect(() => {
			if (state !== undefined && state !== model.state) {
				model.setState(state)
			}
		}, [state, model])

		useEffect(() => {
			let listener = () => { }

			if (onChange) {
				listener = model.onStateChange(onChange)
			}

			return () => {
				listener()
			}
		}, [onChange])

		return <Ctx.Provider {...props} value={model} />
	}

	function useModel() {
		const model = useContext(Ctx)

		if (!model) {
			throw new Error(`[useModel]: Could not find model\n${JSON.stringify(Ctx, null, 2)}`)
		}

		return model
	}

	function useModelInstance(state?: TModel["state"]) {
		return useMemo(() => new CName(state), [])
	}

	return {
		Ctx,
		Provider,
		useModel,
		useModelInstance,
	}
}
