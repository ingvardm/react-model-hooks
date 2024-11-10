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
Minimal working example
```ts
// MyModel.ts
import { createModel, Model } from "react-better-model"

export default class MyModel extends Model {
	state = {
		count: 0,
	}
}

export const {
	useModel: useMyModel,
	Provider: MyModelProvider,
} = createModel(MyModel)

//MyFancyWidget.tsx
import React from "react"
import { useMyModel, MyModelProvider } from "./MyModel"

function Counter() {
	const myModel = useMyModel()

	const [count] = myModel.useState('count')

	return <p>Count: {count}</p>
}

function IncrementButton() {
	const myModel = useMyModel()

	const [count, setCount] = myModel.useState('count')

	return <button onClick={() => setCount(count + 1)}>
		Increment
	</button>
}

export function MyFancyWidget() {
	return <MyModelProvider>
		<Counter />
		<IncrementButton />
	</MyModelProvider>
}
```

Documentation
===
[Model creation](model_creation.md)<br>
[Global models](global_model.md)<br>
[State](state.md)<br>
[Events](events.md)<br>

Example
===
[Example project](https://github.com/ingvardm/react-model-hooks-example)
