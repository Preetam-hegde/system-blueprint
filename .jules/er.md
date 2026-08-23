# Improvement Journal

## React/Zustand Performance Pitfalls
When destructuring state using `useShallow` from `zustand/react/shallow`, selecting a nested object (like `simulation: state.simulation` where `simulation` regenerates) will defeat the shallow equality check and still cause re-renders. Always select **primitive values** or construct new flat objects containing primitives instead of returning complex nested state directly inside the `useShallow` selector. Ensure local variables are used to reconstruct complex objects to minimize disruptive changes.
