export type ValueSubscription<S, K extends keyof S = keyof S> = (currentValue: S[K], prevValue: S[K]) => void
export type ValueSubscriptions<S> = Map<keyof S, Set<ValueSubscription<S, keyof S>>>
export type StateSubscription<S> = (currentState: S, prevState: S) => unknown
export type StateSubscriptions<S> = Set<StateSubscription<S>>
export type EventSubscription<E, K extends keyof E = keyof E> = (eventData: E[K]) => void
export type EventSubscriptions<E> = Map<keyof E, Set<EventSubscription<E, keyof E>>>
export type EventsScheme = Record<string, unknown>
export type StatePlaceholder = Record<string, unknown>
export type ExtractState<M> = M extends { state: infer S } ? S : never
export type ModelLike = {
	state: StatePlaceholder
	setState(delta: Partial<StatePlaceholder>): void
	onStateChange(subscription: (current: any, prev: any) => unknown): () => void
}
