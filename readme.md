# React Better Model

Stateful models with typed React hooks: simple, explicit, and fast.

- Install: `npm i react-better-model` or `yarn add react-better-model`
- Quick Start: see [Docs/QuickStart.md](Docs/QuickStart.md)
- API Reference: see [Docs/API.md](Docs/API.md)

Example
```ts
import { Model, createModel } from 'react-better-model'

type AppEvents = { 'clear-todos': undefined }

class TaskListModel extends Model<AppEvents> {
  state = { tasks: [] as { id:number; title:string; done:boolean }[], showCompleted: true }
}

export const { Provider: TaskListProvider, useModel: useTaskList } = createModel(TaskListModel)
```

See [Docs/QuickStart.md](Docs/QuickStart.md) for component usage and provider wiring.
