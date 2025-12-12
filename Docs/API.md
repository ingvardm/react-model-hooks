# API Reference

## Overview
Stateful models with typed subscriptions and React hooks.

- `ModelBase<E>`: core state/event engine with precise subscriptions.
- `Model<E>`: React bindings (`useState`, `useMapper`, `useEvent`, `useStateEffect`).
- `createModel(YourModel)`: generates `Provider`, `useModel`, and a `create` factory.

## ModelBase<E>
- `state`: abstract field defined in subclasses.
- `setState(delta: Partial<this['state']>)`: shallow-merge; notifies with `(current, prev)` and per-key changes.
- `reduce(reducer: (s: this['state']) => Partial<this['state']>)`: compute a partial update from a snapshot and apply it.
- `onStateChange(cb: (current: this['state'], prev: this['state']) => void) => () => void`.
- `onValueChange<K extends keyof this['state']>(key: K, cb: (current: this['state'][K], prev: this['state'][K]) => void) => () => void`.
- `onValuesChange<K extends keyof this['state']>(keys: readonly K[], cb: (current: this['state'], prev: this['state']) => void) => () => void`.
- `onEvent<K extends keyof E>(event: K, cb: (payload: E[K]) => void) => () => void`.
- `dispatch<K extends keyof E>(event: K, payload?: E[K] extends undefined ? never : E[K])`.

## Model<E>
- `useState<K extends keyof this['state']>(key: K) => [this['state'][K], (v: this['state'][K]) => void]`
  - Subscribes to a single key; setter is a no-op if `Object.is(prev, next)`.
- `useMapper<T>(mapper: (state: this['state'], prev: this['state']) => T) => T`
  - Traces accessed top‑level keys by running `mapper` against a Proxy once when `mapper` changes.
  - Subscribes only to those keys; recomputes with `(state, prev)` and returns a cached snapshot per render to satisfy `useSyncExternalStore`.
- `useStateEffect(effect: (state: this['state'], prev: this['state']) => unknown)`
  - Traces accessed keys once; re-runs only when any of them change.
- `useEvent<K extends keyof E>(event: K, cb?: (payload: E[K]) => void) => (payload?: E[K]) => void`
  - Optional subscription + typed dispatcher.

## createModel(YourModel)
Creates a typed React context for your model class.

Returns: `{ Ctx, create, Provider, useModel }`
- `useModel(): InstanceType<typeof YourModel>` — access the instance from components.
- `create(initialState?)`: factory to build a new instance (if supported by your constructor).
- `Provider` props:
  - `value?`: prebuilt instance to inject (optional; enables external control).
  - `state?`: external state snapshot (controlled mode; optional).
  - `onChange?(current, prev)`: observe state changes (pair with `state`).

## Performance Tips
- Update state immutably: replace top‑level keys to ensure change detection works.
- Prefer `useState('key')` for single values; it’s the narrowest subscription.
- Keep mappers pure and fast; avoid allocating from unrelated keys.
- For many dependent keys, consider composing multiple `useState` calls with `useMemo` in the component.
