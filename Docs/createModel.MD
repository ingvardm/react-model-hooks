### Documentation for `createModel.ts`

#### Overview
`createModel` is a factory function to create a model context and provider for using models in React. This facilitates dependency injection for models across React components.

#### Types

- **`Ctor`**: A constructor type for creating models.
- **`ModelProviderProps`**: Props for the provider component.

#### `createModel(CName)`

- **Parameters**: `CName` – The model constructor.
- **Returns**: `{ Ctx, Provider, useModel }`
  - **`Ctx`**: React context for the model.
  - **`Provider`**: Provider component for the model context.
  - **`useModel`**: Hook to access the model instance.

##### Components

- **`Provider`**: Wraps components with access to the model.
- **`useModel`**: Accesses the model instance in the component tree.
