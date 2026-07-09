# Improvement Journal

## Performance Optimizations
- **Node Lookups in Animation Intervals:** When repeatedly referencing objects from an array by ID within tight intervals (like requestAnimationFrame or short setIntervals for animations), pre-compute an `O(1)` Map lookup before the interval block instead of using `Array.prototype.find()` on every tick to avoid `O(N)` scaling issues. (Resolved in `AnimatedPackets.tsx`).
