# Quick Start

## Install
```bash
npm i react-better-model
# or
yarn add react-better-model
# or
pnpm add react-better-model
```

## Define a model
```ts
import { Model, createModel } from 'react-better-model'

type AppEvents = { 'clear-todos': undefined }
type Task = { id: number; title: string; description: string; done: boolean }

class TaskListModel extends Model<AppEvents> {
  constructor() {
    super({ tasks: [] as Task[], showCompleted: true })
  }

  addTask = (title: string, description = '') => {
    const next = [
      ...this.state.tasks,
      { id: Date.now(), title, description, done: false },
    ]
    this.setState({ tasks: next })
  }

  toggleShowCompleted = () => {
    this.setState({ showCompleted: !this.state.showCompleted })
  }
}

export const {
  Provider: TaskListProvider,
  useModel: useTaskList,
  useModelInstance: useTaskListInstance,
} = createModel(TaskListModel)
```

## Use in components
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

## Provide the model
```tsx
import React, { useMemo } from 'react'
import { createRoot } from 'react-dom/client'

function App() {
  // Option 1: prebuild an instance for external control/DI
  const instance = useMemo(() => new TaskListModel(), [])
  instance.useEvent('clear-todos', () => instance.setState({ tasks: [] }))

  return (
    <TaskListProvider value={instance}>
      <TaskList />
    </TaskListProvider>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
```

```tsx
// Option 2: build inside with useModelInstance (memoized)
function AppInline() {
  const instance = useTaskListInstance()
  return (
    <TaskListProvider value={instance}>
      <TaskList />
    </TaskListProvider>
  )
}
```

## Inline models (portals/embedded widgets)
Define a model inline when you need a small, scoped state slice next to where you render it.
```ts
import { createModel, Model } from 'react-better-model'

export const { Provider: InlineProvider, useModel: useInline } = createModel(
  class InlineModel extends Model {
    constructor() {
      super({ counter: 0 })
    }
  }
)
```

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

## Notes
- `useMapper` tracks which top-level keys your selector touches and only recomputes when they change. Update state immutably (replace top-level keys) for accurate detection.
- Prefer methods on the model (like `addTask`) instead of mutating `state` directly; it keeps updates typed and centralized.
