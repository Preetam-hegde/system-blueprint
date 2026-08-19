# ER Improvement Journal

- Found multiple instances of `useDesignStore` returning full state slices, causing unnecessary re-renders in heavy components. Mitigated by wrapping selectors in `useShallow` from `zustand/react/shallow`.
