# API Reference

Stateful models with typed subscriptions and React hooks.

## Overview
- `ModelBase<TState, TEvents>`: minimal state/event engine with granular subscriptions.
- `Model<TState, TEvents>`: React hooks on top of `ModelBase` (`useState`, `useDerived`, `useEvent`).
- `createModel(YourModel)`: builds a context + Provider + hooks for your model class.

## ModelBase<TState, TEvents = EventsScheme>
Base class for state management without React dependency.

**Type Parameters:**
- `TState`: The shape of your state object (required).
- `TEvents`: Event name → payload type map (optional, defaults to `EventsScheme`).

**Constructor & State:**
- `constructor(initialState: TState)`: pass your initial state to `super`.
- `state: TState`: the current state object.

**State Methods:**
- `setState(delta: Partial<TState>)`: shallow-merge; notifies state and key subscribers.
- `reduce(reducer: (s: TState) => Partial<TState>)`: compute a patch from a snapshot and apply it.

**Subscriptions:**
- `onStateChange(cb: (current: TState, prev: TState) => void) => () => void`: subscribe to any state change.
- `onValueChange<K extends keyof TState>(key: K, cb: (current: TState[K], prev: TState[K]) => void) => () => void`: subscribe to a single key.
- `onValuesChange<K extends keyof TState>(keys: readonly K[], cb: (current: TState, prev: TState) => void) => () => void`: subscribe when any of the keys change.

**Events:**
- `onEvent<K extends keyof TEvents>(event: K, cb: (payload: TEvents[K]) => void) => () => void`: subscribe to a typed event.
- `dispatch<K extends keyof TEvents>(event: K, payload?: TEvents[K])`: emit an event.

## Model<TState, TEvents = EventsScheme>
Extends `ModelBase` with React hooks.

**Type Parameters:**
- `TState`: The shape of your state object (required).
- `TEvents`: Event name → payload type map (optional).

**Hooks:**
- `useState<K extends keyof TState>(key: K) => [TState[K], (v: TState[K]) => void]`
  - Narrow subscription to one key; setter is a no-op if `Object.is(prev, next)`.
- `useDerived<T>(mapper: (state: TState, prev: TState) => T, mapperDeps?: any[]) => T`
  - Derives values from state with automatic dependency tracking via Proxy.
  - Only re-runs when accessed keys change.
  - Dependencies are re-tracked on each state update, so conditional access (e.g., `state.flag ? state.a : state.b`) works correctly.
  - Pass `mapperDeps` when the mapper function itself changes (e.g., `[mapper]` if mapper is created with `useCallback`).
- `useEvent<K extends keyof TEvents>(event: K, cb?: (payload: TEvents[K]) => void) => (payload?: TEvents[K]) => void`
  - Optional subscription; always returns a memoized dispatcher.

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
- Prefer `useState('key')` for single values; use `useDerived` for derived values from multiple keys.
- Keep mappers pure and fast; avoid allocating from unrelated keys.
- For many dependent keys, compose multiple `useState` calls with `useMemo` in the component.
