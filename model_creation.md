### Creating a model
```ts
// define initial state object that will be used as the default state
const initialState = {
	someKey: 'someValue',
}

// if you are planning to use events, also declare event data types
type MyEventTypes = {
	'showAlert': string
}
```

### Exporting with createModel():
```ts
export const MyModel = createModel(Model<MyModelModelState, myModelModelEvents>)

// with creating custom class (which can be extended)
class MyModelClass extends Model<MyModelModelState, myModelModelEvents>{
	constructor(){
		super(initialState)
	}
}

export const MyModel = createModel(MyModelClass)

// or like this for convinience
export const {
	Ctx: MyModelCtx,
	Provider: MyModelProvider,
	withProvider: withMyModelProvider,
	withModel: withMyModel,
	useModel: useMyModel,
	useState: useMyModelState,
	useEvent: useMyModelEvent,
} = createModel(MyModelClass)
```

### Extending Model:
```ts
class MyModelClass extends Model<HelloWorldModelState, HelloWorldModelEvents> {
	private somePrivateValue

	constructor(state = helloWorldModelInitialState){
		super(state)
	}

	myFancyAction = async (y: number) => {
		const z = await API.get(y)

		this.setState({
			x: this.state.x + z,
		})
	}
}
```
