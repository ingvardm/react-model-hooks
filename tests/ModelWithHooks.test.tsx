import React from 'react'
import { act, fireEvent, render } from '@testing-library/react'

import { createModel, Model } from '../src'

type Events = { ping: number }
type HookState = { count: number; flag: boolean }

class HookModel extends Model<Events> {
  state: HookState

  constructor(initial: HookState = { count: 0, flag: false }) {
    super(initial)
    this.state = initial
  }
}

const { Provider, useModel } = createModel(HookModel)

describe('ModelWithHooks', () => {
  it('useState subscribes to one key and skips updates when the value is unchanged', () => {
    const model = new HookModel()
    const countRenders = jest.fn()
    const flagRenders = jest.fn()

    function CountView() {
      const [count, setCount] = useModel().useState('count')
      countRenders(count)
      return (
        <button data-testid="noop" onClick={() => setCount(count)}>
          count: {count}
        </button>
      )
    }

    function FlagView() {
      const [flag] = useModel().useState('flag')
      flagRenders(flag)
      return <div data-testid="flag">{String(flag)}</div>
    }

    const view = render(
      <Provider value={model}>
        <CountView />
        <FlagView />
      </Provider>
    )

    expect(countRenders).toHaveBeenCalledTimes(1)
    expect(flagRenders).toHaveBeenCalledTimes(1)

    fireEvent.click(view.getByTestId('noop'))
    expect(countRenders).toHaveBeenCalledTimes(1)

    act(() => {
      model.setState({ flag: true })
    })
    expect(flagRenders).toHaveBeenCalledTimes(2)
    expect(countRenders).toHaveBeenCalledTimes(1)

    act(() => {
      model.setState({ count: 5 })
    })
    expect(countRenders).toHaveBeenCalledTimes(2)
  })

  it('useMapper recomputes only when mapped keys change', () => {
    const model = new HookModel()
    const derivedRenders = jest.fn()

    function Derived() {
      const doubled = useModel().useMapper((state) => state.count * 2)
      derivedRenders(doubled)
      return <div data-testid="derived">{doubled}</div>
    }

    render(
      <Provider value={model}>
        <Derived />
      </Provider>
    )

    expect(derivedRenders).toHaveBeenCalledTimes(1)
    expect(derivedRenders).toHaveBeenLastCalledWith(0)

    act(() => {
      model.setState({ flag: true })
    })
    expect(derivedRenders).toHaveBeenCalledTimes(1)

    act(() => {
      model.setState({ count: 3 })
    })
    expect(derivedRenders).toHaveBeenCalledTimes(2)
    expect(derivedRenders).toHaveBeenLastCalledWith(6)
  })

  it('useMapper re-tracks dependencies when mapper function changes', () => {
    const model = new HookModel()
    const renders: Array<string | number> = []

    function Derived({ keys }: { keys: Array<keyof HookState> }) {
      const mapper = React.useCallback(
        (state: HookState) => keys.map(k => state[k]).join(':'),
        [keys]
      )
      const value = useModel().useMapper(mapper)
      renders.push(value)
      return <div data-testid="derived">{value}</div>
    }

    const view = render(
      <Provider value={model}>
        <Derived keys={['count']} />
      </Provider>
    )

    act(() => model.setState({ count: 1 }))
    expect(renders.pop()).toBe('1')

    view.rerender(
      <Provider value={model}>
        <Derived keys={['flag']} />
      </Provider>
    )

    act(() => model.setState({ flag: true }))
    expect(renders.pop()).toBe('true')
  })

  it('useEvent subscribes and dispatches typed events', () => {
    const onPing = jest.fn()

    function Listener() {
      const dispatch = useModel().useEvent('ping', onPing)
      return (
        <button data-testid="ping" onClick={() => dispatch(9)}>
          ping
        </button>
      )
    }

    const view = render(
      <Provider>
        <Listener />
      </Provider>
    )

    fireEvent.click(view.getByTestId('ping'))
    expect(onPing).toHaveBeenCalledTimes(1)
    expect(onPing).toHaveBeenCalledWith(9)

    view.unmount()

    act(() => {
      // Subscription should be cleaned up on unmount.
      view.unmount()
    })
  })
})
