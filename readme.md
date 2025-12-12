# React Better Model

Typed, class-based models with tiny React hooks. Keep state outside components, scope it with a Provider, and subscribe narrowly with `useState`, `useMapper`, and `useEvent`.

- Install: `npm i react-better-model` or `yarn add react-better-model`
- Quick start: Docs/QuickStart.md
- Full API: Docs/API.md

## 10-second counter
```tsx
import { Model, createModel } from 'react-better-model'

class Counter extends Model {
  state = { n: 0 }
}

const { Provider, useModel } = createModel(Counter)

export function App() {
  const counter = useModel()
  const [n, setN] = counter.useState('n')
  return <button onClick={() => setN(n + 1)}>Count: {n}</button>
}
```
```tsx
// index.tsx
import { createRoot } from 'react-dom/client'
import { App, Provider } from './counter'

createRoot(document.getElementById('root')!).render(
  <Provider>
    <App />
  </Provider>
)
```

## Inline model (perfect for portals)
```tsx
import { createModel, Model } from 'react-better-model'

export const { Provider: InlineProvider, useModel: useInline } = createModel(
  class InlineModel extends Model {
    state = { counter: 0 }
  }
)

function InlineWidget() {
  const model = useInline()
  const [n, setN] = model.useState('counter')
  return <button onClick={() => setN(n + 1)}>Count: {n}</button>
}
```
Render wherever you need the scope:
```tsx
<InlineProvider>
  <InlineWidget />
</InlineProvider>
```

## Bring your own instance
Use an existing model instance for dependency injection or to control the model outside React.
```tsx
function App() {
  const modelInstance = useMemo(() => new Counter(), [])
  modelInstance.useEvent('reset', () => modelInstance.setState({ n: 0 }))

  return (
    <Provider value={modelInstance}>
      <CounterView />
    </Provider>
  )
}
```
You can create as many isolated instances as you like—no global store required.
