# ER Improvement Journal

- **Performance Improvement:** Migrated `useDesignStore` destructuring to `useShallow` with explicit object selectors across all components. This minimizes unnecessary re-renders that previously occurred whenever any store property changed, particularly during active simulations (which updates multiple node and edge properties). Using `useShallow` ensures components only update when their specific dependencies mutate.
