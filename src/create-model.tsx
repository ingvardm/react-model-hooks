import React, {
	createContext,
	ProviderProps,
	useContext,
	useEffect,
	useMemo,
	useRef,
} from 'react'
import { ExtractState, ModelLike } from './common-types'

export type ModelProviderProps<
	TInit extends any[],
	TModel extends ModelLike
> = Omit<ProviderProps<TModel>, 'value'> & {
	value?: TModel
	init?: TInit
	state?: ExtractState<TModel>
	onChange?: (state: ExtractState<TModel>, prevState: ExtractState<TModel>) => void
}

export function createModel<
	TInit extends unknown[],
	TModel extends ModelLike
>(CName: new (...init: TInit) => TModel) {
	const Ctx = createContext<TModel | null>(null)

	function Provider({
		value,
		init,
		state,
		onChange,
		...props
	}: ModelProviderProps<TInit, TModel>) {
		const model = useMemo(() => value || new CName(...(init || []) as TInit), [value])

		useEffect(() => {
			if (state !== undefined && state !== model.state) {
				model.setState(state)
			}
		}, [state, model])

		const onChangeRef = useRef(onChange)
		onChangeRef.current = onChange

		useEffect(() => {
			const listener = model.onStateChange((current, prev) => {
				onChangeRef.current?.(current, prev)
			})

			return listener
		}, [model])

		return <Ctx.Provider {...props} value={model} />
	}

	function useModel() {
		const model = useContext(Ctx)

		if (!model) {
			throw new Error('[useModel]: No model found in context. Wrap your component tree in the corresponding Provider (or pass a `value`).')
		}

		return model
	}

	function useModelInstance(...init: TInit) {
		return useMemo(() => new CName(...init), [])
	}

	return {
		Ctx,
		Provider,
		useModel,
		useModelInstance,
	}
}
