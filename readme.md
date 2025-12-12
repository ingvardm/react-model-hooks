# React Better Model

Tiny, class-based models for React. Stay in TypeScript, keep state out of components, bootstrap with a single `createModel` call, and wire state/derived values/events with a handful of hooks.

## Installation
```bash
npm i react-better-model
```
```bash
yarn add react-better-model
```
```bash
pnpm add react-better-model
```

## Minimal example
```ts
// DiceModel.ts
import { Model, createModel } from 'react-better-model'

class DiceModel extends Model {
  constructor() {
    super({ lastRoll: 1 })
  }

  roll = () => {
    const next = 1 + Math.floor(Math.random() * 6)
    this.setState({ lastRoll: next })
  }
}

export const {
  Provider: DiceProvider,
  useModel: useDice,
} = createModel(DiceModel)
```

```tsx
// RollButton.tsx
import React from 'react'
import { useDice } from './DiceModel'

export function RollButton() {
  const model = useDice()

  return (
    <button onClick={model.roll}>
      Roll the die
    </button>
  )
}
```

```tsx
// RollResult.tsx
import React from 'react'
import { useDice } from './DiceModel'

export function RollResult() {
  const model = useDice()
  const [value] = model.useState('lastRoll')
  return <p>Last roll: {value}</p>
}
```

```tsx
// root component
import React from 'react'
import { createRoot } from 'react-dom/client'
import { RollButton } from './RollButton'
import { RollResult } from './RollResult'
import { DiceProvider } from './DiceModel'

createRoot(document.getElementById('root')!).render(
  <DiceProvider>
    <RollButton />
    <RollResult />
  </DiceProvider>
)
```

## State access and updates
- `useState('key')`: narrow subscription to one top-level key. Returns `[value, setValue]`; `setValue` skips updates when the value is unchanged.
- `useMapper(state => derived)`: derive values from one or many keys. The mapper is inspected to track which keys it reads; re-runs only when those change.
- `setState(patch)`: merge-style update for multiple keys; use inside model class methods to express actions.
- `reduce(draft => patch)`: compute the next state from a copy of the current state in one place.
- Class methods are your actions: declare methods on the model that call `setState`/`reduce` and call them from components (or events) to keep mutation logic centralized.

```ts
// inside a component that has access to the model
const [count, setCount] = model.useState('count') // read + update a single key

const doubled = model.useMapper((s) => s.count * 2) // derive from count; runs only when count changes

// inside the model class
increment = () => this.setState({ count: this.state.count + 1 }) // merge update

bumpBoth = () => this.setState({ count: this.state.count + 1, bonus: (this.state as any).bonus + 1 }) // multi-key patch

boost = () => this.reduce((state) => ({ count: state.count + 10 })) // compute next state from a draft
```
