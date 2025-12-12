# Quick Start

Install
- `npm i react-better-model` or `yarn add react-better-model`.

Define a model
```ts
import { Model, createModel } from 'react-better-model'

// Optional if you want to use events:
type AppEvents = { 'clear-todos': undefined }

type Task = { id: number; title: string; description: string; done: boolean }

class TaskListModel extends Model<AppEvents> {
  state = { tasks: [] as Task[], showCompleted: true }

  addTask = (title: string, description = '') => {
    const next = [
      ...this.state.tasks,
      { id: Date.now(), title, description, done: false },
    ]
    this.setState({ tasks: next })
  }
}

export const {
  Provider: TaskListProvider,
  useModel: useTaskList,
} = createModel(TaskListModel)
```

Use in components
```tsx
function TaskList() {
  const model = useTaskList()
  const visible = model.useMapper(s => s.showCompleted ? s.tasks : s.tasks.filter(t => !t.done))
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

Provide the model
```tsx
function App() {
  // Optional: pass a prebuilt instance to control it outside React
  const instance = useMemo(() => new TaskListModel(), [])
  instance.useEvent('clear-todos', () => instance.setState({ tasks: [] }))
  return (
    <TaskListProvider value={instance}>
      <TaskList />
    </TaskListProvider>
  )
}
```

Notes
- `useMapper` records which top‑level keys your selector reads and only recomputes when they change. Update state immutably (replace top‑level keys) for accurate detection.

## Inline Models (Portals / Embedded Widgets)
When you need a small, self‑contained state scope colocated with rendered content (e.g., portals), define a model inline without a named class.

```ts
import { createModel, Model } from 'react-better-model'

export const { Provider: InlineProvider, useModel: useInline } = createModel(
  class InlineModel extends Model {
    state = { counter: 0 }
  }
)
```

Use it where you render:
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
