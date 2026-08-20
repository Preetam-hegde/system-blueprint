# ER Improvement Journal

## Refactoring Zustand Stores with useShallow
- When refactoring large objects out of a Zustand store using `useShallow`, always manually extract the specific primitive properties inside the selector (e.g. `useShallow(state => ({ simulationRunning: state.simulation.running }))`).
- **Avoid global string replacements** (regex or find/replace) to update component bodies to the new destructured aliases (like `simulation.running -> simulationRunning`), because it frequently corrupts unrelated local variables and object properties (like `preset.simulation.running`). Take the time to map them manually in complex components.
