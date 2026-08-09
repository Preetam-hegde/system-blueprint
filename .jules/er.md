# ER Improvement Journal

- **Performance (Zustand Re-renders):** Use `useShallow` from `zustand/react/shallow` when destructuring state from `useDesignStore`. We encountered excessive renders due to multiple primitive destructuring or destructuring whole nested objects (`state.simulation`) that regenerate often. Using explicit object selectors in `useShallow((state) => ({ prop: state.prop }))` prevents this.
