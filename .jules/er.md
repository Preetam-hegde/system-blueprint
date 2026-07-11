# ER Improvement Journal

## Architectural Pitfalls
- **Zustand Store Re-renders**: Destructuring multiple properties from a Zustand store (like `useDesignStore`) without using `useShallow` causes components to re-render whenever *any* state in the store changes, not just the destructured properties.
- **Solution**: Always wrap the selector function in `useShallow` from `zustand/react/shallow` when accessing multiple state slices in React components. This explicitly opts into shallow equality checking, preventing unnecessary re-renders and improving overall application performance.
