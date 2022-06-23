import React, { createContext, FC, useMemo } from 'react'

import { Model } from '../Model'
import { useModelCtxEvent, useModelInstanceEvent } from '../hooks/event-hooks'
import { useModelCtx } from '../hooks/model-hooks'
import { useModelCtxState, useModelInstanceState } from '../hooks/state-hooks'
import { CreateModelOptions, ModelProviderProps } from '../types'

const DEFAULT_OPTIONS: CreateModelOptions = {}

type Ctor<M extends Model<M['state'], M['events']>> = new (initialState: M['state'], events?: M['events']) => M

export function createModel<
	K extends keyof M['state'],
	E extends keyof M['events'],
	M extends Model<M['state'], M['events']>
>(CName: Ctor<M>) {
	const Ctx = createContext<M>({} as M)

	function Provider({ value, initialState, ...props }: ModelProviderProps<M>) {
		const viewModel = useMemo(() => value || new CName(initialState), [])

		return <Ctx.Provider {...props} value={viewModel} />
	}

	return {
		Ctx,
		Provider,
		withProvider<T extends {}>(fc: FC<T & { model: M }>) {
			return (props: T & { initialState?: Partial<M['state']> }) => {
				const model = useMemo(() => new CName(props.initialState), [])

				return <Provider value={model}>
					{fc({...props, model})}
				</Provider>
			}
		},
		withModel<T extends {}>(fc: FC<T & { model: M }>) {
			return (props: T) => {
				const model = useModelCtx(Ctx)

				return fc({...props, model })
			}
		},
		useModel() {
			return useModelCtx(Ctx)
		},
		useState(key: K) {
			return useModelCtxState(Ctx, key)
		},
		useEvent(key: E) {
			return useModelCtxEvent(Ctx, key)
		},
	}
}
