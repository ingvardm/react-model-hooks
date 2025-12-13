# API Reference

Stateful models with typed subscriptions and React hooks.

## Overview
- `ModelBase<E>`: minimal state/event engine with granular subscriptions.
- `Model<E>`: React hooks on top of `ModelBase` (`useState`, `useMapper`, `useEvent`).
- `createModel(YourModel)`: builds a context + Provider + hooks for your model class.

## ModelBase<E>
- `constructor(initialState: StatePlaceholder)`: required; pass your initial state to `super`.
- `state`: your current state (you typically reassign in the subclass constructor).
- `setState(delta: Partial<this['state']>)`: shallow-merge; notifies state and key subscribers.
- `reduce(reducer: (s: this['state']) => Partial<this['state']>)`: compute a patch from a snapshot and apply it.
- `onStateChange(cb: (current: this['state'], prev: this['state']) => void) => () => void`: subscribe to any state change.
- `onValueChange<K extends keyof this['state']>(key: K, cb: (current: this['state'][K], prev: this['state'][K]) => void) => () => void`: subscribe to a single key.
- `onValuesChange<K extends keyof this['state']>(keys: readonly K[], cb: (current: this['state'], prev: this['state']) => void) => () => void`: subscribe when any of the keys change.
- `onEvent<K extends keyof E>(event: K, cb: (payload: E[K]) => void) => () => void`: subscribe to a typed event.
- `dispatch<K extends keyof E>(event: K, payload?: E[K] extends undefined ? never : E[K])`: emit an event.

## Model<E>
- `useState<K extends keyof this['state']>(key: K) => [this['state'][K], (v: this['state'][K]) => void]`
  - Narrow subscription to one key; setter is a no-op if `Object.is(prev, next)`.
- `useMapper<T>(mapper: (state: this['state'], prev: this['state']) => T) => T`
  - Detects which top-level keys `mapper` reads; subscribes only to those keys; recomputes `(state, prev)` and memoizes the result for `useSyncExternalStore`.
- `useEvent<K extends keyof E>(event: K, cb?: (payload: E[K]) => void) => (payload?: E[K]) => void`
  - Optional subscription; always returns a typed dispatcher.

## createModel(YourModel)
Creates a typed React context for your model class.

Returns: `{ Ctx, Provider, useModel, useModelInstance }`
- `useModel(): InstanceType<typeof YourModel>` — access the instance from components.
- `useModelInstance(initialState?)`: build a memoized instance for use as a Provider `value`.
- `Provider` props:
  - `value?`: prebuilt instance to inject (external control or DI).
  - `state?`: external state snapshot (controlled mode).
  - `onChange?(current, prev)`: observe state changes (pair with `state`).

## Performance tips
- Update state immutably: replace top-level keys to ensure change detection works.
- Prefer `useState('key')` for single values; use `useMapper` for derived values from multiple keys.
- Keep mappers pure and fast; avoid allocating from unrelated keys.
- For many dependent keys, compose multiple `useState` calls with `useMemo` in the component.
