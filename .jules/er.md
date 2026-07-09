# ER Improvement Journal

## Performance Findings
- **Zustand store (useDesignStore.ts)**: Identified redundant iterations and state updates when modifying graphs. `updateNodeLoads()` and `runAnalysis()` were called sequentially across many UI events, leading to duplicate calculations of graph loads, bottlenecks, and multiple updates to the replay trace. Unifying these into a single `refreshSimulationState()` resolved UI state drift (stale data when the simulation is paused) and halved the number of passes over graph structures.

## Critical Learnings
- **Zustand sync issues**: When writing Zustand actions that derive data from current state (e.g. `nodes`, `edges`), those derivations *must* be invoked on state modifications (like `undo`, `redo`, `importJSON`). Previously, these actions modified the nodes and edges array but failed to trigger load/warning updates, leaving the UI showing warnings for nodes that were just deleted.
