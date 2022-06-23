import { ProviderProps } from 'react'
import { Model } from './Model'

export type Sub<S, K extends keyof S = keyof S> = (v: S[K]) => void

export type Subs<S> = Map<keyof S, Set<Sub<S>>>

export type CreateModelOptions = {
	globalInstance?: Model
	createGlobalInstance?: boolean
}

export type ModelProviderProps<M extends Model> = Omit<ProviderProps<M>, 'value'> & {
	value?: M
	initialState?: M['state']
}