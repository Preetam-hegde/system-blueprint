
## Zustand Store Subscriptions (Performance)
* **Finding:** When multiple UI components destructure properties from a global Zustand store without a selector, they subscribe to the *entire* store and re-render on any store change.
* **Fix/Pattern:** Use `import { useShallow } from 'zustand/react/shallow';` and supply an explicit object selector. e.g.:
```tsx
const { nodes, edges } = useDesignStore(
  useShallow(state => ({ nodes: state.nodes, edges: state.edges }))
);
```
* **Impact:** Drastically reduces unnecessary re-renders in heavily reactive components like visual designers.
