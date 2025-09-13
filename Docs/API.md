# API Reference

## Overview
This library exposes a small, strongly‑typed API for stateful models and React hooks.
Public surface:
- `ModelBase<E>`: Core state and events engine.
- `Model<E>`: React hook bindings on top of `ModelBase`.
- `createModel(YourModel)`: Generates a Provider and `useModel` hook for a model class.

## ModelBase<E>
- `state`: abstract field you define in subclasses.
- `setState(delta)`: Merge partial state and notify subscribers.
- `reduce(reducer)`: Compute a partial update from current state and apply it.
- `onStateChange(cb) -> unsubscribe`: Subscribe to whole‑state changes.
- `onValueChange(key, cb) -> unsubscribe`: Subscribe to a specific key.
- `onEvent(event, cb) -> unsubscribe`: Subscribe to a typed event.
- `dispatch(event, payload?)`: Dispatch an event with optional payload.

## Model<E>
- `useState(key) -> [value, setValue]`: React hook for a single key.
- `useMapper(mapper) -> derived`: Derive a value from state with stable subscriptions.
- `useEvent(event, cb?) -> dispatch`: Subscribe to an event (optional `cb`) and get a typed dispatcher.

## createModel(YourModel)
Create a context for a model class and return wiring helpers.
- Returns: `{ Ctx, Provider, useModel }`
- `Provider` props:
  - `value?`: Prebuilt instance to inject (optional).
  - `state?`: External state snapshot (optional, for controlled setups).
  - `onChange?(state)`: Observe state changes (use with `state`).

Example
```ts
import { Model, createModel } from 'react-better-model'

type AppEvents = { 'clear-todos': undefined }

class TaskListModel extends Model<AppEvents> {
  state = { tasks: [] as { id:number; title:string; done:boolean }[], showCompleted: true }
}

export const { Provider: TaskListProvider, useModel: useTaskList } = createModel(TaskListModel)
```

Usage in components
```tsx
function TaskList() {
  const model = useTaskList()
  const visible = model.useMapper(s => s.showCompleted ? s.tasks : s.tasks.filter(t => !t.done))
  const [showCompleted, setShowCompleted] = model.useState('showCompleted')
  const clearAll = model.useEvent('clear-todos')
  return <button onClick={() => clearAll()}>Clear</button>
}
```
