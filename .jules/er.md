## Zustand Performance

When destructuring multiple values from a Zustand store (e.g. `useDesignStore`), it's critical to use `useShallow` from `zustand/react/shallow` to prevent unnecessary component re-renders.

Example:
```typescript
const { simulation, nodes } = useDesignStore(
  useShallow((state) => ({
    simulation: state.simulation,
    nodes: state.nodes
  }))
);
```

Avoid destructing directly from the store like `const { simulation } = useDesignStore();` as this will cause the component to re-render whenever *any* state in the store changes.
