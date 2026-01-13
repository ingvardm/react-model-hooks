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

  it('useDerived recomputes only when mapped keys change', () => {
    const model = new HookModel()
    const derivedRenders = jest.fn()

    function Derived() {
      const doubled = useModel().useDerived((state) => state.count * 2)
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

  it('useDerived re-tracks dependencies when mapper function changes', () => {
    const model = new HookModel()
    const renders: Array<string | number> = []

    function Derived({ keys }: { keys: Array<keyof HookState> }) {
      const mapper = React.useCallback(
        (state: HookState) => keys.map(k => state[k]).join(':'),
        [keys]
      )
      const value = useModel().useDerived(mapper, [mapper])
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

  it('useDerived dynamically re-tracks dependencies based on state', () => {
    const model = new HookModel({ count: 10, flag: false })
    const renders = jest.fn()

    function Derived() {
      const value = useModel().useDerived((state) =>
        state.flag ? `count:${state.count}` : 'flag is false'
      )
      renders(value)
      return <div>{value}</div>
    }

    render(
      <Provider value={model}>
        <Derived />
      </Provider>
    )

    expect(renders).toHaveBeenCalledTimes(1)
    expect(renders).toHaveBeenLastCalledWith('flag is false')

    // count changes but we're not subscribed to it yet (flag is false)
    act(() => model.setState({ count: 20 }))
    expect(renders).toHaveBeenCalledTimes(1)

    // flag changes - now we subscribe to count
    act(() => model.setState({ flag: true }))
    expect(renders).toHaveBeenCalledTimes(2)
    expect(renders).toHaveBeenLastCalledWith('count:20')

    // now count changes should trigger re-render
    act(() => model.setState({ count: 30 }))
    expect(renders).toHaveBeenCalledTimes(3)
    expect(renders).toHaveBeenLastCalledWith('count:30')

    // switch back - should unsubscribe from count
    act(() => model.setState({ flag: false }))
    expect(renders).toHaveBeenCalledTimes(4)
    expect(renders).toHaveBeenLastCalledWith('flag is false')

    // count changes should not trigger re-render anymore
    act(() => model.setState({ count: 40 }))
    expect(renders).toHaveBeenCalledTimes(4)
  })

  it('useDerived cleans up subscriptions on unmount', () => {
    const model = new HookModel()
    const renders = jest.fn()

    function Derived() {
      const doubled = useModel().useDerived((state) => state.count * 2)
      renders(doubled)
      return <div>{doubled}</div>
    }

    const view = render(
      <Provider value={model}>
        <Derived />
      </Provider>
    )

    expect(renders).toHaveBeenCalledTimes(1)

    act(() => model.setState({ count: 5 }))
    expect(renders).toHaveBeenCalledTimes(2)

    view.unmount()

    // After unmount, state changes should not trigger renders
    act(() => model.setState({ count: 10 }))
    expect(renders).toHaveBeenCalledTimes(2)
  })

  it('useState setValue updates the model state', () => {
    const model = new HookModel()

    function Counter() {
      const [count, setCount] = useModel().useState('count')
      return (
        <button data-testid="inc" onClick={() => setCount(count + 1)}>
          {count}
        </button>
      )
    }

    const view = render(
      <Provider value={model}>
        <Counter />
      </Provider>
    )

    expect(view.getByTestId('inc').textContent).toBe('0')
    expect(model.state.count).toBe(0)

    fireEvent.click(view.getByTestId('inc'))
    expect(view.getByTestId('inc').textContent).toBe('1')
    expect(model.state.count).toBe(1)

    fireEvent.click(view.getByTestId('inc'))
    expect(view.getByTestId('inc').textContent).toBe('2')
    expect(model.state.count).toBe(2)
  })

  it('useEvent cleans up subscription on unmount', () => {
    const model = new HookModel()
    const onPing = jest.fn()

    function Listener() {
      useModel().useEvent('ping', onPing)
      return null
    }

    const view = render(
      <Provider value={model}>
        <Listener />
      </Provider>
    )

    act(() => model.dispatch('ping', 1))
    expect(onPing).toHaveBeenCalledTimes(1)

    view.unmount()

    act(() => model.dispatch('ping', 2))
    expect(onPing).toHaveBeenCalledTimes(1) // should not increase
  })

  it('useEvent without callback only returns dispatcher', () => {
    const model = new HookModel()
    const onPing = jest.fn()

    model.onEvent('ping', onPing)

    function Dispatcher() {
      const dispatch = useModel().useEvent('ping')
      return (
        <button data-testid="dispatch" onClick={() => dispatch(42)}>
          dispatch
        </button>
      )
    }

    const view = render(
      <Provider value={model}>
        <Dispatcher />
      </Provider>
    )

    fireEvent.click(view.getByTestId('dispatch'))
    expect(onPing).toHaveBeenCalledWith(42)
  })

  it('multiple components independently subscribe to different keys', () => {
    const model = new HookModel()
    const countRenders = jest.fn()
    const flagRenders = jest.fn()

    function CountView() {
      const doubled = useModel().useDerived((s) => s.count * 2)
      countRenders(doubled)
      return <div>{doubled}</div>
    }

    function FlagView() {
      const flagStr = useModel().useDerived((s) => s.flag ? 'yes' : 'no')
      flagRenders(flagStr)
      return <div>{flagStr}</div>
    }

    render(
      <Provider value={model}>
        <CountView />
        <FlagView />
      </Provider>
    )

    expect(countRenders).toHaveBeenCalledTimes(1)
    expect(flagRenders).toHaveBeenCalledTimes(1)

    act(() => model.setState({ count: 5 }))
    expect(countRenders).toHaveBeenCalledTimes(2)
    expect(flagRenders).toHaveBeenCalledTimes(1) // unchanged

    act(() => model.setState({ flag: true }))
    expect(countRenders).toHaveBeenCalledTimes(2) // unchanged
    expect(flagRenders).toHaveBeenCalledTimes(2)
  })
})
