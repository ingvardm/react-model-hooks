# TL;DR
```bash
npm i react-better-model
```
```bash
yarn add react-better-model
```
```bash
pnpm add react-better-model
```

```ts
// model.ts
import { Model, createModel } from 'react-better-model'

type CounterState = { n: number }

class Counter extends Model<CounterState> {
  constructor() {
    super({ n: 0 })
  }

  inc = () => this.setState({ n: this.state.n + 1 })
}

export const {
  Provider: CounterProvider,
  useModel: useCounterModel,
  useModelInstance: useCounterModelInstance,
} = createModel(Counter)
```

```tsx
// component.tsx
const counter = useCounterModel()
const [n, setN] = counter.useState('n') // narrow subscription + setter
const doubled = counter.useDerived(s => s.n * 2) // derived; subscribes to accessed keys
const dispatchTick = counter.useEvent('tick') // dispatcher
counter.useEvent('tick', onTick) // or pass cb to subscribe

// Provider usage (external control optional)
const instance = useCounterModelInstance()
<CounterProvider value={instance}>
  <SomeChild />
</CounterProvider>
```

- `useState(key)`: single-key subscription, setter is a no-op if `Object.is(prev,next)`.
- `useDerived(mapper, mapperDeps?)`: tracks accessed keys dynamically via Proxy; re-tracks on each update so conditional access works.
- `useEvent(name, cb?)`: optional subscribe; always returns a dispatcher.
- `setState(patch)`: shallow merge; notifies state + key subscribers.
- `reduce(fn)`: compute patch from a snapshot; calls `setState`. Example: `reduce(s => ({ n: s.n + 10 }))`.
- Providers: use `value` for DI/singletons or `useModelInstance` to build one locally.
- Global models: instantiate once and call hooks directly (no Provider).

[Todo example app](https://github.com/ingvardm/react-better-model-todo-example)
