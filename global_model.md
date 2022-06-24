### Using global model

Global model can be accessed from anywhere in code
Be sure to reset it when needed
```ts
// export global model instance
const globalModelInstance = new Model({
	count: 0
})
```

### Usage:
```ts
const LabelCount = () => {
	const [count] = globalModelInstance.useState('count')

	return <p>{count}</p>
}

class Poller {
	private interval: NodeJS.Timer | null = null

	start = () => {
		this.interval = setInterval(() => {
			this.onData(Math.ceil(Math.random() * 10))
		}, 1000)
	}

	stop = () => {
		this.interval && clearInterval(this.interval)
		this.interval = null
	}

	onData = (x: number) => {
		globalModelInstance.setValue('count', x)
	}
}

const poller = new Poller()

export const GlobalModelExample = () => {
	useEffect(() => {
		poller.start()

		return () => {
			poller.stop()
		}
	})

	return <>
		<LabelCount/>
	</>
}
```
