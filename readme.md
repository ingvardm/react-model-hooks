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

## Provider control
`createModel` gives you `useModelInstance` to spin up a model inside the provider scope and keep a stable reference without extra wiring.

```tsx
// App.tsx
import React from 'react'
import { DiceProvider, useModelInstance } from './DiceModel'

function AppBody() {
  // Build the instance once; you can pass initial state if needed.
  const instance = useModelInstance({ lastRoll: 3 })

  return (
    <DiceProvider value={instance}>
      {/* children that call useDice() */}
    </DiceProvider>
  )
}
```
Use this when you want to control the model from the root (e.g., wire logging, external events) while still letting descendants consume it via `useModel`.

## Events
Declare your events on the model type, dispatch them from class methods, and subscribe/dispatch from components with `useEvent`.

```ts
// ChatModel.ts
import { Model, createModel } from 'react-better-model'

type ChatEvents = { 'message:new': { id: string; text: string } }

class ChatModel extends Model<ChatEvents> {
  constructor() {
    super({ messages: [] as { id: string; text: string }[] })
  }

  addMessage = (text: string) => {
    const msg = { id: crypto.randomUUID(), text }
    this.setState({ messages: [...this.state.messages, msg] })
    this.dispatch('message:new', msg)
  }
}

export const { Provider: ChatProvider, useModel: useChat } = createModel(ChatModel)
```

```tsx
// NewMessageForm.tsx (dispatch only)
import React, { useState } from 'react'
import { useChat } from './ChatModel'

export function NewMessageForm() {
  const chat = useChat()
  const send = chat.useEvent('message:new') // dispatcher only
  const [text, setText] = useState('')

  return (
    <form onSubmit={(e) => { e.preventDefault(); chat.addMessage(text); send({ id: 'ui', text }); setText('') }}>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button type="submit">Send</button>
    </form>
  )
}
```

```tsx
// MessageLogger.tsx (subscribe + optional dispatch)
import React, { useEffect } from 'react'
import { useChat } from './ChatModel'

export function MessageLogger() {
  const chat = useChat()
  const emit = chat.useEvent('message:new', (msg) => {
    console.log('New message', msg)
  })

  // emit can still dispatch if you need to trigger elsewhere:
  useEffect(() => {
    emit({ id: 'system', text: 'logger mounted' })
  }, [emit])

  return null
}
```

## Global models (optional)
Some state is truly global (e.g., auth/session). You can instantiate a model once and export it without a Provider.

```ts
// authModel.ts
import { Model } from 'react-better-model'

class AuthModel extends Model {
  constructor() {
    super({ user: null as null | { id: string; name: string } })
  }

  setUser = (user: AuthModel['state']['user']) => this.setState({ user })
}

export const authModel = new AuthModel()
```

```tsx
// Nav.tsx
import React from 'react'
import { authModel } from './authModel'

export function Nav() {
  const [user] = authModel.useState('user')
  return <div>{user ? `Hi, ${user.name}` : 'Sign in'}</div>
}
```
You still get typed hooks, but you skip a Provider when the model truly lives at app scope.

## Patterns & pitfalls
- Prefer immutable top-level updates: replace keys instead of mutating nested structures so subscriptions fire. e.g., `setState({ todos: todos.map(...) })`.
- Keep derived data out of state: compute with `useMapper` or on the fly in model methods.
- Class methods are your API surface: call them from components instead of mutating state directly.
- Scope models with Providers: make multiple instances for different parts of the tree instead of sharing global singletons.
- Event names should be literal and typed (e.g., `'clear-todos'`), and payloads should be minimal.

## Developing this library
- Install dependancies: `pnpm install`
- Build: `pnpm run build` runs TypeScript and emits to `lib/`.
- Tests: `pnpm run test` (ts-jest, jsdom).
- Docs live in `Docs/` and the root README; keep API changes reflected there.
