
## Zustand `useShallow` Optimization
- **Finding**: When destructing multiple properties from `useDesignStore()` directly without a selector, Zustand's default equality check considers it a new object and triggers a re-render on *any* store update.
- **Resolution**: Implemented `useShallow` from `zustand/react/shallow` to explicitly select state objects (e.g., `useDesignStore(useShallow(state => ({ prop: state.prop })))`).
- **Impact**: Prevents unnecessary re-renders in components when unrelated store values change, improving the general application performance.
