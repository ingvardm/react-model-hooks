import React, { createContext, useCallback, useMemo } from 'react'

import {
	Model,
	useModelCtxEvent,
	useModelCtxState,
	useModelInstanceEvent,
	useModelInstanceState
} from 'react-better-model'


// CounterModel.js
export const initialState = {
	count: 0,
}

export const defaultEventData = {
	click: undefined,
}

// create context
export const CounterModelCtx = createContext(new Model(initialState, defaultEventData))


// CounterText.js
const CounterText = () => {
	const [count, setCount] = useModelCtxState(CounterModelCtx, 'count')

	return <p>{count}</p>
}

// CounterIncrementButton.js
const CounterIncrementButton = () => {
	const [count, setCount] = useModelCtxState(CounterModelCtx, 'count')

	const onClick = useCallback(() => {
		setCount(count + 1)
	}, [count])

	return <button onClick={onClick}>Press me!</button>
}

// CounterClearButton.js
const CounterClearButton = () => {
	const dispatchClear = useModelCtxEvent(CounterModelCtx, 'clear')

	const onClick = useCallback(() => {
		dispatchClear()
	}, [])

	return <button onClick={onClick}>Clear</button>
}

// Counter.js
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

const App = () => {
	return <div>
		<Counter />
		<Counter />
		<Counter />
	</div>
}

export default App
