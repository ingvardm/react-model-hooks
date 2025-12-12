import React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react'

import { createModel, Model } from '../src'

class CounterModel extends Model {
  state = { count: 0 }

  increment = () => this.setState({ count: this.state.count + 1 })
}

describe('createModel', () => {
  it('creates a single model instance per Provider lifecycle', () => {
    class CountingModel extends Model {
      static instances = 0
      state = { value: 0 }

      constructor() {
        super()
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

  it('exposes a create helper that forwards constructor arguments', () => {
    class InitializableModel extends Model {
      state = { value: 1 }

      constructor(initialState?: { value: number }) {
        super()
        if (initialState) {
          this.state = initialState
        }
      }
    }

    const { create } = createModel(InitializableModel)

    const instanceWithState = create({ value: 42 })
    expect(instanceWithState).toBeInstanceOf(InitializableModel)
    expect(instanceWithState.state.value).toBe(42)

    const defaultInstance = create()
    expect(defaultInstance.state.value).toBe(1)
  })
})
