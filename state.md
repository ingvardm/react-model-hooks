# State management
### With createModel():
assuming you created your model with createModel()
```ts
const MyModel = createModel(Model<{
	x: number
}>)
```

Using component wrapper:
```ts
const MyComponent = MyModel.withModel(({
	model,
}) => {
	const [x, setX] = model.useState('x')
})
```

Using static MyModel.useState:
```ts
const MyComponent = () => {
	const [x, setX] = MyModel.useState('x')
}
```

### With React.createContext():
```ts
const MyModelContext = React.createContext(new MyModelClass(initialState))
```

Using model instance:
```ts
const modelInstance = useModelCtx(MyModelContext)

const [x, setX] = modelInstance.useState('x')
```

Using state from context:
```ts
const [x, setX] = useModelCtxState(MyModelContext, 'x')
```

### Using internal methods to avoid unnessesary rerenders
Using model.reduce:
```ts
const onClick = useCallback((x) => {
	model.reduce((state) => {
		return {
			count: state.count + x
		}
	}, [])
})
```

Using model.setState:
```ts
const onClick = useCallback((x) => {
	model.setState({
		count: x
	})
})
```

Using model.setValue:
```ts
const onClick = useCallback((x) => {
	model.setValue('state', x)
})
```
