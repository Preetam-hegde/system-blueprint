## Zustand State Selection Optimization

When destructuring multiple properties from a Zustand store (like `useDesignStore`), prefer using `useShallow` with an explicit object selector to prevent unnecessary re-renders. For example, instead of `const { a, b } = useDesignStore();`, use `const { a, b } = useDesignStore(useShallow(state => ({ a: state.a, b: state.b })));`.
