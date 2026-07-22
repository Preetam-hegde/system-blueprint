
## Zustand Overfetching
When destructured multiple properties from `useDesignStore`, a component will re-render whenever ANY part of the store changes unless it's wrapped in `useShallow`. We fixed this architectural pitfall by wrapping the selector in `useShallow` for components like `SimulationControls`, `AnimatedPackets`, `SystemNode`, `SystemEdge`, `Index`, `Toolbar`, etc.
