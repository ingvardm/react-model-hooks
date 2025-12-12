import React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react'

import { createModel, Model } from '../src'

type CounterState = { count: number }

class CounterModel extends Model {
  state: CounterState

  constructor(initial: CounterState = { count: 0 }) {
    super(initial)
    this.state = initial
  }

  increment = () => this.setState({ count: this.state.count + 1 })
}

describe('createModel', () => {
  it('creates a single model instance per Provider lifecycle', () => {
    class CountingModel extends Model {
      static instances = 0
      state: { value: number }

      constructor(initial = { value: 0 }) {
        super(initial)
        this.state = initial
        CountingModel.instances += 1
      }
    }

    const { Provider, useModel } = createModel(CountingModel)
    let lastModel: CountingModel | undefined

    function Consumer() {
      const model = useModel()
      lastModel = model
      return <div data-testid="value">{model.state.value}</div>
    }

    const view = render(
      <Provider>
        <Consumer />
      </Provider>
    )

    expect(CountingModel.instances).toBe(1)
    const firstModel = lastModel

    view.rerender(
      <Provider>
        <Consumer />
      </Provider>
    )

    expect(lastModel).toBe(firstModel)
    expect(CountingModel.instances).toBe(1)
  })

  it('uses a provided model instance and wires onChange callbacks', async () => {
    const { Provider, useModel } = createModel(CounterModel)
    const provided = new CounterModel()
    const handleChange = jest.fn()

    function Consumer() {
      const model = useModel()

      return (
        <button data-testid="increment" onClick={() => model.increment()}>
          increment
        </button>
      )
    }

    const { getByTestId } = render(
      <Provider value={provided} onChange={handleChange}>
        <Consumer />
      </Provider>
    )

    await act(async () => {
      /* allow useEffect to register subscriptions */
    })

    fireEvent.click(getByTestId('increment'))

    await waitFor(() => expect(handleChange).toHaveBeenCalledTimes(1))
    expect(handleChange).toHaveBeenCalledWith({ count: 1 }, { count: 0 })
    expect(provided.state.count).toBe(1)
  })

  it('syncs external state prop into the model instance', async () => {
    const { Provider, useModel } = createModel(CounterModel)

    function Consumer() {
      const model = useModel()
      const [count] = model.useState('count')
      return <div data-testid="count">{count}</div>
    }

    const view = render(
      <Provider state={{ count: 5 }}>
        <Consumer />
      </Provider>
    )

    await waitFor(() => expect(view.getByTestId('count').textContent).toBe('5'))

    view.rerender(
      <Provider state={{ count: 7 }}>
        <Consumer />
      </Provider>
    )

    await waitFor(() => expect(view.getByTestId('count').textContent).toBe('7'))
  })

  it('useModelInstance creates a memoized instance with optional initial state', () => {
    class InitializableModel extends Model {
      state: { value: number }

      constructor(initialState = { value: 1 }) {
        super(initialState)
        this.state = initialState
      }
    }

    const { useModelInstance } = createModel(InitializableModel)
    const seen: InitializableModel[] = []

    function Consumer({ value }: { value?: number }) {
      const instance = useModelInstance(value !== undefined ? { value } : undefined)
      seen.push(instance)
      return <div data-testid="value">{instance.state.value}</div>
    }

    const view = render(
      <Consumer />
    )

    expect(view.getByTestId('value').textContent).toBe('1')

    view.rerender(<Consumer value={5} />)

    expect(view.getByTestId('value').textContent).toBe('1')
    expect(seen[0]).toBe(seen[1])
  })
})
