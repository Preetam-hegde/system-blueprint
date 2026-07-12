# Improvement Journal

## Performance Findings
- **Zustand `useShallow`**: Implemented `useShallow` when destructing multiple properties from `useDesignStore` across various components (e.g., `Index.tsx`, `SystemNode.tsx`, `Toolbar.tsx`, etc.). Without `useShallow`, destructuring an object directly from the store causes the component to re-render anytime *any* property in the store changes, rather than just the properties being consumed. This is a critical performance fix in highly interactive visual workspaces where state changes frequently (like node positions or edge updates).
