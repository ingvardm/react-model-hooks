import { ModelBase } from '../src'

type TestState = { a: number; b: number }

class TestModel extends ModelBase<{ ping: number }> {
  state: TestState

  constructor(initial: TestState = { a: 1, b: 2 }) {
    super(initial)
    this.state = initial
  }
}

describe('ModelBase', () => {
  it('sets state and notifies onStateChange subscribers with prev/current snapshots', () => {
    const model = new TestModel()
    const handler = jest.fn()

    model.onStateChange(handler)
    model.setState({ a: 5 })

    expect(model.state).toEqual({ a: 5, b: 2 })
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith({ a: 5, b: 2 }, { a: 1, b: 2 })
  })

  it('notifies value subscribers when a key changes and skips unchanged values', () => {
    const model = new TestModel()
    const onA = jest.fn()

    model.onValueChange('a', onA)

    model.setState({ a: 10 })
    model.setState({ a: 10 }) // unchanged, should not fire

    expect(onA).toHaveBeenCalledTimes(1)
    expect(onA).toHaveBeenCalledWith(10, 1)
  })

  it('deduplicates the same value subscriber registered to multiple keys in a single update', () => {
    const model = new TestModel()
    const handler = jest.fn()

    model.onValueChange('a', handler)
    model.onValueChange('b', handler)

    model.setState({ a: 3, b: 4 })

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(3, 1)
  })

  it('calls onValuesChange when any tracked key changes and ignores unrelated keys', () => {
    const model = new TestModel()
    const tracked = jest.fn()
    const unsubscribe = model.onValuesChange(['a', 'b'], tracked)

    model.setState({ a: 2 })
    model.setState({ b: 5 })
    model.setState({ a: 2, b: 5 }) // no change
    model.setState({ a: 2, b: 6 })
    unsubscribe()
    model.setState({ a: 9 })

    expect(tracked).toHaveBeenCalledTimes(3)
    expect(tracked).toHaveBeenNthCalledWith(1, { a: 2, b: 2 }, { a: 1, b: 2 })
    expect(tracked).toHaveBeenNthCalledWith(2, { a: 2, b: 5 }, { a: 2, b: 2 })
    expect(tracked).toHaveBeenNthCalledWith(3, { a: 2, b: 6 }, { a: 2, b: 5 })
  })

  it('reduce merges returned patch into state and notifies subscribers', () => {
    const model = new TestModel()
    const handler = jest.fn()
    model.onStateChange(handler)

    model.reduce((state) => ({ a: state.a + 1, b: state.b + 3 }))

    expect(model.state).toEqual({ a: 2, b: 5 })
    expect(handler).toHaveBeenCalledWith({ a: 2, b: 5 }, { a: 1, b: 2 })
  })

  it('dispatches events to listeners and supports unsubscribe', () => {
    const model = new TestModel()
    const listener = jest.fn()
    const unsubscribe = model.onEvent('ping', listener)

    model.dispatch('ping', 7)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(7)

    unsubscribe()
    model.dispatch('ping', 9)
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
