# Enhancement & Refinement Journal

## Performance Finding: Zustand Store Renders

**Date:** July 2024

**Issue:** Multiple React components (`Index`, `SimulationControls`, `SystemNode`, `SystemEdge`, `AnimatedPackets`, `AnalysisPanel`, `CapacityPlannerDialog`, `NodeConfigPanel`, `TemplateDialog`, `Toolbar`) were destructuring properties directly from `useDesignStore()` without selectors. When a component calls `useDesignStore()` without a selector, it subscribes to the *entire* state object. Any update to *any* property in the state (e.g. simulation stepping, node load updating, analysis running every 100ms) causes all of these components to re-render, leading to significant performance degradation and unnecessary React rendering cycles, especially during active simulation.

**Resolution:** Updated all components consuming `useDesignStore` to use `useShallow` from `zustand/react/shallow` along with explicit object selectors. For example:

```typescript
const { nodes, edges } = useDesignStore(useShallow((state) => ({
  nodes: state.nodes,
  edges: state.edges
})));
```

**Impact:** By using `useShallow` with explicit selectors, React components now only re-render when the specific state properties they care about change, drastically reducing unnecessary re-renders during active simulation ticks, and significantly improving the UI frame rate and overall responsiveness.
