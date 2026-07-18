# ER Improvement Journal

## Reactivity Optimization (Zustand)
- **Problem**: Component destructuring of `useDesignStore` (e.g., `const { nodes, edges } = useDesignStore()`) without a selector leads to unnecessary re-renders whenever any state property updates.
- **Solution**: Imported `useShallow` from `zustand/react/shallow` and applied explicit object selectors in components (e.g., `useDesignStore(useShallow(state => ({ nodes: state.nodes })))`). This ensures components only re-render when their specific dependent properties change.
