# Events
### With createModel():
assuming you created your model with createModel()
```ts
const MyModel = createModel(Model<{}, {
	myevent: number,
}>)
```

### Listening to events:
```ts
const MyComponent = MyModel.withModel(({
	model,
}) => {
	const myEventHandler = useCallback((data: number) => {
		...
	})

	model.useEvent('myevent', myEventHandler)
})
```

### Using static MyModel.useEvent:
```ts
const MyComponent = () => {
	const myEventHandler = useCallback((data: number) => {
		...
	})

	MyModel.useEvent('myevent', myEventHandler)
}
```

### Dispatching events:
```ts
const MyComponent = MyModel.withModel(({
	model,
}) => {
	const myEventDispatcher = model.useEvent('myevent')

	const onClick = useCallback(() => {
		const x = 5

		myEventDispatcher(x)
	})

	<a onClick={onClick}/>
})
```
