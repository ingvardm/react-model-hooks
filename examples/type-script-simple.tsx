import React, { createContext, useCallback, useMemo } from 'react'

import {
	Model,
	useModelCtxEvent,
	useModelCtxState,
	useModelInstanceEvent,
	useModelInstanceState
} from '../src'

// create context
const CounterModelCtx = createContext(new Model({
	count: 0
}))

const CounterText = () => {
	const [count, setCount] = useModelCtxState(CounterModelCtx, 'count')

	return <p>{count}</p>
}

const CounterIncrementButton = () => {
	const [count, setCount] = useModelCtxState(CounterModelCtx, 'count')

	const  onClick = useCallback(() => {
		setCount(count + 1)
	}, [count])

	return <button onClick={onClick}>Press me!</button>
}

const CounterClearButton = () => {
	const dispatchClear = useModelCtxEvent(CounterModelCtx, 'clear')

	const onClick = useCallback(() => {
		dispatchClear()
	}, [])

	return <button onClick={onClick}>Clear</button>
}

const Counter = () => {
	const model = useMemo(() => {
		return new Model({
			count: 0,
		})
	}, [])

	const [count, setCount] = useModelInstanceState(model, 'count')

	const onClear = useCallback(() => {
		setCount(0)
	}, [])

	useModelInstanceEvent(model, 'clear', onClear)

	return <div>
		<CounterModelCtx.Provider value={model}>
			<CounterText/>
			<CounterIncrementButton/>
			<CounterClearButton/>
		</CounterModelCtx.Provider>
	</div>
}

const App = () => {
	return <div>
		<Counter/>
		<Counter/>
		<Counter/>
	</div>
}

export default App
