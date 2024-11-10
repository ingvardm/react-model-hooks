
### Example Usage

Here’s an example of how to use the library in an app:

```tsx
// MyModel.ts
import { Model } from 'react-better-model'

interface Events {
	reset: void
}

export const myModelInitialState = { count: 0 }

export default class MyModel extends Model<Events> {
	state = myModelInitialState

	increment = () => {
		this.setState({ count: this.state.count + 1 })
	}
}

export const {
	Provider: MyModelProvider,
	useModel: useMyModel,
} = createModel(MyModel)

// App.tsx
import React from 'react'
import { MyModelProvider, useMyModel, myModelInitialState } from './MyModelProvider'

function Counter() {
	const myModel = useMyModel()

	const [count] = myModel.useState('count')

	return <p>Count: {count}</p>
}

function IncrementButton() {
	const myModel = useMyModel()

	return <button
		onClick={myModel.increment}>
		Increment
	</button>
}

function DecrementButton() {
	const myModel = useMyModel()

	const [count, setCount] = myModel.useState('count')

	return <button
		onClick={() => setCount(count - 1)}>
		Decrement
	</button>
}

function ResetButton() {
	const myModel = useMyModel()

	const reset = myModel.useEvent('reset')

	return <button onClick={reset}>
		Reset
	</button>
}

function App() {
	const myModel = useMemo(() => {
		return new MyModel()
	})

	myModel.useEvent('reset', () => {
		myModel.setState(myModelInitialState)
	})

	return <MyModelProvider value={myModel}>
		<Counter />
		<IncrementButton />
		<DecrementButton />
		<ResetButton />
	</MyModelProvider>
}
```

