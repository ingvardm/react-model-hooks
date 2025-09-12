export type ValueSubscription<S, K extends keyof S = keyof S> = (v: S[K]) => void
export type ValueSubscriptions<S> = Map<keyof S, Set<ValueSubscription<S, keyof S>>>
export type StateSubscription<S> = (s: S) => unknown
export type StateSubscriptions<S> = Set<StateSubscription<S>>
export type EventSubscription<E, K extends keyof E = keyof E> = (v: E[K]) => void
export type EventSubscriptions<E> = Map<keyof E, Set<EventSubscription<E, keyof E>>>
export type EventsScheme = Record<string, unknown>
export type StatePlaceholder<T extends Record<PropertyKey, unknown> = Record<PropertyKey, unknown>> = T | Record<PropertyKey, unknown>
