React Better Model
===
Easy way to share state and events between components and services.

Installation:
===
```bash
npm i react-better-model
```
or
```bash
yarn add react-better-model
```

Usage
===
```typescript
// CounterModel.ts
export const initialState = {
	count: 0,
}

export const defaultEventData = {
	click: undefined,
}

// create context
export const CounterModelCtx = createContext(new Model(initialState, defaultEventData))

```

```typescript
// CounterText.tsx
const CounterText = () => {
	const [count, setCount] = useModelCtxState(CounterModelCtx, 'count')

	return <p>{count}</p>
}
```

```typescript
// CounterIncrementButton.tsx
const CounterIncrementButton = () => {
	const [count, setCount] = useModelCtxState(CounterModelCtx, 'count')

	const onClick = useCallback(() => {
		setCount(count + 1)
	}, [count])

	return <button onClick={onClick}>Press me!</button>
}
```

```typescript
// CounterClearButton.tsx
const CounterClearButton = () => {
	const dispatchClear = useModelCtxEvent(CounterModelCtx, 'clear')

	const onClick = useCallback(() => {
		dispatchClear()
	}, [])

	return <button onClick={onClick}>Clear</button>
}
```

```typescript
// Counter.tsx
const Counter = () => {
	const model = useMemo(() => {
		return new Model(initialState, defaultEventData)
	}, [])

	const [count, setCount] = useModelInstanceState(model, 'count')

	const onClear = useCallback(() => {
		setCount(0)
	}, [])

	useModelInstanceEvent(model, 'clear', onClear)

	return <div>
		<CounterModelCtx.Provider value={model}>
			<CounterText />
			<CounterIncrementButton />
			<CounterClearButton />
		</CounterModelCtx.Provider>
	</div>
}
```

```typescript
// app.js
const App = () => {
	return <div>
		<Counter />
		<Counter />
		<Counter />
	</div>
}
```