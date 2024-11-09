
### Example Usage

Here’s an example of how to use the library in an app:

```tsx
// MyModel.ts
import { Model } from 'react-better-model'

interface Events {
	reset: void
}

const initialState = { count: 0 }

class MyModel extends Model<Events> {
	state = initialState

	increment = () => {
		this.setState({ count: this.state.count + 1 })
	}

    reset = () => {
        this.setState(initialState)
    }
}

export const {
    Provider: MyModelProvider,
    useModel: useMyModel,
} = createModel(MyModel)

// App.tsx
import React from 'react'
import { MyModelProvider, useModel } from './MyModelProvider'

function Counter() {
	const myModel = useMyModel()
	const [count, setCount] = myModel.useState('count')
	const reset = myModel.useEvent('reset')

	return (
		<div>
			<p>Count: {count}</p>
			<button onClick={myModel.increment}>Increment</button>
			<button onClick={() => setCount(count + 1)}>Increment by five</button>
			<button onClick={reset}>Reset</button>
		</div>
	)
}

function App() {
    const myModel = useMemo(() => {
        return new MyModel()
    })

    myModel.useEvent('reset', () => {
        myModel.reset()
    })

	return <MyModelProvider value={myModel}>
        <Counter />
    </MyModelProvider>
}

export default App
```

