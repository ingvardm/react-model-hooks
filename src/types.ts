import { ProviderProps } from "react"

import { ModelBase } from "./ModelBase"

export type KeySub<S, K extends keyof S = keyof S> = (v: S[K]) => void
export type KeySubs<S> = Map<keyof S, Set<KeySub<S, keyof S>>>
export type StateSub<S> = (s: S) => unknown
export type StateSubs<S> = Set<StateSub<S>>

export type ModelProviderProps<E, S, M extends ModelBase<E, S>> = Omit<ProviderProps<M>, 'value'> & {
	value?: M
	initialState?: S
}

export type Ctor<
	E extends {},
	S extends {},
	M extends ModelBase<E, S>
> = new (initialState?: S) => M
