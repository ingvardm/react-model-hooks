# Quick Start

Install
- `npm i react-better-model` or `yarn add react-better-model`.

Define a model
```ts
import { Model, createModel } from 'react-better-model'

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

export const { Provider: TaskListProvider, useModel: useTaskList } = createModel(TaskListModel)
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
  return (
    <TaskListProvider>
      <TaskList />
    </TaskListProvider>
  )
}
```
