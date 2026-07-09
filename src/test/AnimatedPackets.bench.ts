import { bench, describe, vi } from 'vitest';

const numNodes = 1000;
const numEdges = 2000;

const nodes = Array.from({ length: numNodes }, (_, i) => ({
  id: `node-${i}`,
  data: { region: 'us-east', type: 'service' }
}));

const activeEdges = Array.from({ length: numEdges }, (_, i) => ({
  id: `edge-${i}`,
  source: `node-${Math.floor(Math.random() * numNodes)}`,
  target: `node-${Math.floor(Math.random() * numNodes)}`,
  data: { protocol: 'HTTP' }
}));

const map = new Map(nodes.map(n => [n.id, n]));

describe('Node Lookup Performance', () => {
  bench('Array.find (baseline)', () => {
    const randomEdge = activeEdges[Math.floor(Math.random() * activeEdges.length)];
    const sourceNode = nodes.find((node) => node.id === randomEdge.source);
    const targetNode = nodes.find((node) => node.id === randomEdge.target);
  });

  bench('Map.get (optimized)', () => {
    const randomEdge = activeEdges[Math.floor(Math.random() * activeEdges.length)];
    const sourceNode = map.get(randomEdge.source);
    const targetNode = map.get(randomEdge.target);
  });
});
