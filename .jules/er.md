# Improvement Journal

## 2024-05-24
* **Performance:** Implemented `useShallow` optimization for all components using `useDesignStore`. By default, calling `useStore()` in Zustand subscribes the component to the entire store, causing it to re-render whenever any state in the store changes. By refactoring these calls to use `useShallow` with specific selectors, the components will now only re-render when their explicitly requested state properties change.
