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
import { useCallback } from "react"
import { createModel, Model } from "react-better-model"

// initial state
const helloWorldModelInitialState = {
	count: 0,
}

// model state type (usefull later)
type HelloWorldModelState = typeof helloWorldModelInitialState

// model event types (optional, if you want to use events)
type HelloWorldModelEvents = {
	click: number
}

// create your model class
class HelloWorldModelClass extends Model<HelloWorldModelState, HelloWorldModelEvents> {
	constructor(state = helloWorldModelInitialState){
		super(state)
	}
}

// create object that will contain hooks and refferences
// that you can use in your code
const HWM = createModel(HelloWorldModelClass)

// component with button that listens to and sets 'count' value
const ButtonAdd = HWM.withModel(({ model, ...props }) => {
	const [count, setCount] = model.useState('count')

	const onClick = useCallback(() => {
		setCount(count + 1)
	}, [count])

	// this is just an example of listening and setting value.
	// a better way (without listening) would be:
	// const onClick = useCallback(() => {
	// 	model.reduce((state) => {
	// 		return {
	// 			count: state.count + 1
	// 		}
	// 	})
	// }, [])

	return <button onClick={onClick}>increment count</button>
})

// Button that uses an event dispatcher
const ButtonClickEvent = HWM.withModel(({ model, ...props }) => {
	const [count] = model.useState('count')

	const dispatchClearEvent = model.useEvent('click')

	const clear = useCallback(() => {
		dispatchClearEvent(count)
	}, [count])

	return <button onClick={clear}>click to dispatch 'click' event</button>
})

// label with the current count value
const CountLabel = HWM.withModel(({ model, ...props }) => {
	const [count] = model.useState('count')

	return <p>current count is: {count}</p>
})

// convinience component to handle model events in one place
const EventHandler = HWM.withModel(({ model, ...props }) => {
	const handleClickEvent = useCallback((x: HelloWorldModelEvents['click']) => {
		alert(`clicked ${x} times`)
	}, [])

	model.useEvent('click', handleClickEvent)

	return null
})

// the widget itself wrapped in HelloWorldModel Provider
// any consumers (HWM.withModel(...)) rendered here
// are inside the same context.
// they can still use other models via useState hook
// created with createModel()
export const HelloWorldWidget = HWM.withProvider(({
	model,
	...props
}) => {
	return <>
		<EventHandler/>     {/* Event handling component */}
		<CountLabel />      {/* Label that displays updated count */}
		<ButtonAdd/>        {/* Button that increases the count */}
		<ButtonClickEvent/> {/* Button that dispatches 'click' event */}
	</>
})
```

Documentation
===
[model creation](model_creation.md)
[global models](global_model.md)
[state](state.md)
[events](events.md)

Documentation
===
[example project](https://)
