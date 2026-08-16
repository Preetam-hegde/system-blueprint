# Improvement Journal

## Performance Optimization: Zustand store selectors
When destructuring multiple properties from a Zustand store (like `useDesignStore`), it is crucial to wrap the selector with `useShallow` from `zustand/react/shallow`.

By default, Zustand uses strict equality `===` to check if a selector's return value has changed. When returning a new object from the selector `(state) => ({ propA: state.propA, propB: state.propB })`, a new object reference is created on *every store update* (even for unrelated properties). This causes React to re-render the component unnecessarily.

`useShallow` fixes this by performing a shallow comparison of the object's top-level properties instead of a strict reference check, drastically reducing unnecessary re-renders across the application when components only depend on a subset of the store.
