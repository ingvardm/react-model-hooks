### Documentation for `ModelBase.ts`

#### Overview
`ModelBase` provides a foundational class to manage application state and event-driven updates. It includes mechanisms for managing subscriptions to specific keys in the state, as well as overall state and event listeners.

#### Types
- **`KeySub<S, K extends keyof S>`**: A type alias for a callback that receives the updated value of a specific key in state.
- **`KeySubs<S>`**: A map where each key in the state has a corresponding set of subscribers.
- **`StateSub<S>`**: A callback type for subscribers to the entire state.
- **`StateSubs<S>`**: A set of subscribers listening to changes in the entire state.

#### `ModelBase<E = {}>` Class

- **`keySubs`**: Tracks subscribers for each key in the state.
- **`stateSubs`**: Tracks subscribers to changes in the entire state.
- **`listeners`**: Tracks event listeners.

##### Methods
- **`updateSingleKeySubscriber(k, v)`**: Notifies subscribers of a specific key `k` with the new value `v`.
- **`updateKeySubscribers(delta)`**: Updates all subscribers for any keys that changed in `delta`.
- **`updateStateChangeSubscribers(state)`**: Notifies all subscribers of the entire state.
- **`updateEventListeners(k, data)`**: Triggers event listeners for event `k`, with optional data.
- **`onStateChange(cb)`**: Adds a callback for overall state changes and returns an unsubscribe function.
- **`onValueChange(k, cb)`**: Adds a callback for changes to a specific key `k` and returns an unsubscribe function.
- **`setState(delta)`**: Merges `delta` into the current state and updates subscribers.
- **`reduce(reducer)`**: Applies a reducer function to the current state and updates it.
- **`onEvent(k, cb)`**: Adds an event listener for event `k` and returns an unsubscribe function.
- **`dispatch(key, data)`**: Dispatches an event for `key` with optional `data`.
