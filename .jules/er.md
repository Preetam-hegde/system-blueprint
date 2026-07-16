# Improvement Journal

## Performance Optimization: Zustand Selectors

- **Finding**: Destructuring multiple properties from a Zustand store (like `const { a, b } = useStore()`) without a selector causes the component to re-render whenever *any* state in the store changes, not just the destructured properties.
- **Solution**: Enforced the use of `useShallow` from `zustand/react/shallow` along with explicit object selectors.
- **Example**:
  Instead of: `const { a, b } = useStore();`
  Use: `const { a, b } = useStore(useShallow(state => ({ a: state.a, b: state.b })));`
- **Impact**: Significantly reduces unnecessary re-renders in React components subscribing to large complex state stores like `useDesignStore`.
