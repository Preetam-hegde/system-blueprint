# ER Improvement Journal

## React & Zustand Performance Optimizations
- **Zustand Selectors:** When extracting multiple state values from a Zustand store (like `useDesignStore`), using standard destructuring without `useShallow` causes re-renders whenever *any* state in the store changes. Using `useShallow` from `zustand/react/shallow` along with an explicit mapped object prevents excessive component re-renders.
- **Nested Object Selections:** Returning entire nested objects from selectors (e.g. `state => state.simulation`) triggers frequent re-renders since their references usually mutate on any deep update. Instead, use primitive property selectors mapping only the needed properties (e.g. `useShallow(state => ({ mode: state.simulation.mode }))`).
