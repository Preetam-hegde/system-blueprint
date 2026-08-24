# ER Improvement Journal

## Performance Learnings
- **Zustand Renders**: Components directly destructuring properties from `useDesignStore()` were triggering re-renders whenever *any* state in the store changed. Refactored to use `useShallow` from `zustand/react/shallow` to only re-render when the specific selected properties change.
- **Nested Objects in Zustand**: When extracting nested properties (like `simulation`), it's better to extract primitive properties individually and map them back to an object locally to prevent unnecessary object reference changes on every render.
