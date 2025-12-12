# React Better Model

Stateful models with typed React hooks. Simple, explicit, and fast.

- Install: `npm i react-better-model` or `yarn add react-better-model`
- Quick Start: see Docs/QuickStart.md
- API Reference: see Docs/API.md

## Standard Usage
```ts
import { Model, createModel } from 'react-better-model'

type AppEvents = { 'clear-todos': undefined }

class TaskListModel extends Model<AppEvents> {
  state = { tasks: [] as { id:number; title:string; done:boolean }[], showCompleted: true }
}

export const { Provider: TaskListProvider, useModel: useTaskList } = createModel(TaskListModel)
```

Use in components:
```tsx
function TaskList() {
  const model = useTaskList()
  const visible = model.useMapper((s) => s.showCompleted ? s.tasks : s.tasks.filter(t => !t.done))
  const [showCompleted, setShowCompleted] = model.useState('showCompleted')
  const clearAll = model.useEvent('clear-todos')
  return (
    <div>
      <button onClick={() => setShowCompleted(!showCompleted)}>
        {showCompleted ? 'Hide' : 'Show'} completed
      </button>
      {visible.map(t => <div key={t.id}>{t.title}</div>)}
      <button onClick={() => clearAll()}>Clear All</button>
    </div>
  )
}
```

## Inline Model Initialization (Portals, Embedded Widgets)
For cases like render portals where you don’t own the component’s surrounding state, create a model inline without a named class:
```ts
import { createModel, Model } from 'react-better-model'

export const { Provider: InlineProvider, useModel: useInline } = createModel(
  class InlineModel extends Model {
    state = { counter: 0 }
  }
)
```
Then use it directly where you render:
```tsx
function InlineWidget() {
  const model = useInline()
  const [n, setN] = model.useState('counter')
  return <button onClick={() => setN(n + 1)}>Count: {n}</button>
}

function PortalSurface() {
  return (
    <InlineProvider>
      <InlineWidget />
    </InlineProvider>
  )
}
```
This pattern is ideal when you need a small, self-contained state scope colocated with the rendered content.

See Docs/QuickStart.md for more examples and Docs/API.md for full API details.

## Providing a Prebuilt Instance (Unique to This Lib)
You can construct a model and pass it into the Provider. This is useful for dependency injection, reusing the same instance across trees, or controlling the model from outside React (e.g., in services or portals).
```tsx
function App() {
  const modelInstance = useMemo(() => new TaskListModel(/* optional initial state or deps */), [])
  // Observe or control from outside React tree
  modelInstance.useEvent('clear-todos', () => modelInstance.setState({ tasks: [] }))

  return (
    <TaskListProvider value={modelInstance}>
      <TaskList />
    </TaskListProvider>
  )
}
```
Unlike global stores (e.g., Redux), you can scope and pass distinct model instances wherever needed without extra wiring.
