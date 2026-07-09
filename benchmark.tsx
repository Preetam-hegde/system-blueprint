import { render } from '@testing-library/react';
import React from 'react';
import NodeConfigPanel from './src/components/system-design/NodeConfigPanel';
import { useDesignStore } from './src/store/useDesignStore';

function setupStore(numNodes: number, numEdges: number) {
  const nodes = Array.from({ length: numNodes }, (_, i) => ({
    id: `node-${i}`,
    data: { label: `Node ${i}` }
  }));

  const edges = Array.from({ length: numEdges }, (_, i) => ({
    id: `edge-${i}`,
    source: `node-${Math.floor(Math.random() * numNodes)}`,
    target: 'node-0', // All point to node 0 for worst-case incoming
    data: {}
  }));

  // Set the store state directly
  useDesignStore.setState({
    nodes,
    edges,
    selectedNodeId: 'node-0',
    selectedEdgeId: null
  });
}

const runBenchmark = () => {
  setupStore(10000, 1000); // 10k nodes, 1k incoming edges

  const start = performance.now();
  render(<NodeConfigPanel />);
  const end = performance.now();

  console.log(`Render time: ${end - start}ms`);
};

runBenchmark();
