# Improvement Journal

## 2023-10-XX

*   **Zustand Render Optimization:**
    *   **Pitfall:** Components were destructuring directly from `useDesignStore()` without selectors or using selectors that returned new object references (e.g., `useDesignStore(state => state.simulation)`). This causes components to re-render whenever *any* state in the store changes. In a high-update environment like a React Flow diagram, this is a significant performance killer.
    *   **Solution:** Extensively implemented `useShallow` from `zustand/react/shallow` in conjunction with object selectors that explicitly pick only the necessary state slices (e.g., `useDesignStore(useShallow(state => ({ prop: state.prop })))`).
    *   **Result:** Drastically reduced unnecessary React re-renders across the application, especially for fundamental canvas components (Nodes, Edges, Panels).
