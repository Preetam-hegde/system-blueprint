# ER Improvement Journal

## React & Zustand Performance in React Flow
- **Surprising Performance Finding**: Directly destructuring from `useDesignStore()` without an explicit selector subscribes a component to the *entire* state. In a highly dynamic app like this one (React Flow + continuous simulation ticking), this causes massive unnecessary re-renders across almost all components on the canvas whenever the simulation advances or a node updates.
- **Solution**: Consistently wrap all store destructuring in components using `useShallow` from `zustand/react/shallow`, explicitly selecting only the necessary properties. For nested objects that regenerate often (e.g., `state.simulation`), explicitly select primitive properties like `mode` or `replayTrace` instead of passing the entire object.
- **Architectural Pitfall**: Avoid committing temporary helper scripts or `__pycache__` directories used for large-scale string replacements when automating structural refactors.
