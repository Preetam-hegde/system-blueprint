import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Node } from '@xyflow/react';
import { useDesignStore } from '@/store/useDesignStore';

const makeNode = (
  id: string,
  label: string,
  region: string,
  category: 'clients' | 'compute' | 'messaging' = 'compute',
  throughputLimit = 100,
): Node => ({
  id,
  type: 'systemNode',
  position: { x: 0, y: 0 },
  data: {
    label,
    nodeType: category === 'messaging' ? 'message-queue' : category === 'clients' ? 'web-client' : 'server',
    category,
    region,
    replicas: 1,
    cpu: 2,
    memory: 4,
    throughputLimit,
    latency: 40,
    notes: '',
    currentLoad: 0,
    isBottleneck: false,
    isSpof: false,
    isFailed: false,
  },
});

beforeEach(() => {
  useDesignStore.setState({
    nodes: [],
    edges: [],
    warnings: [],
    selectedNodeId: null,
    selectedEdgeId: null,
    history: [],
    historyIndex: -1,
    simulation: {
      running: true,
      speed: 1,
      rps: 120,
      mode: 'live',
      step: 0,
      maxSteps: 20,
      packetLossPct: 0,
      extraLatencyMs: 0,
      manualFailedNodeIds: [],
      failedNodeIds: [],
      scenario: { type: 'none' },
    },
  });
});

describe('useDesignStore', () => {
  describe('updateNodeConfig', () => {
    it('should update the data configuration of an existing node', () => {
      const nodeA = makeNode('node-a', 'Node A', 'us-east-1');
      useDesignStore.setState({ nodes: [nodeA] });

      const store = useDesignStore.getState();
      store.updateNodeConfig('node-a', { label: 'Updated Node A', replicas: 5 });

      const state = useDesignStore.getState();
      const updatedNode = state.nodes.find((n) => n.id === 'node-a');

      expect(updatedNode).toBeDefined();
      expect(updatedNode?.data.label).toBe('Updated Node A');
      expect(updatedNode?.data.replicas).toBe(5);

      // Verify other fields remain intact
      expect(updatedNode?.data.region).toBe('us-east-1');
      expect(updatedNode?.data.cpu).toBe(2);
    });

    it('should not modify nodes if the nodeId does not exist', () => {
      const nodeA = makeNode('node-a', 'Node A', 'us-east-1');
      useDesignStore.setState({ nodes: [nodeA] });

      const store = useDesignStore.getState();
      store.updateNodeConfig('non-existent-node', { label: 'Should not apply' });

      const state = useDesignStore.getState();

      expect(state.nodes).toHaveLength(1);
      expect(state.nodes[0].data.label).toBe('Node A');
    });

    it('should trigger updateNodeLoads and runAnalysis after updating config', () => {
      const nodeA = makeNode('node-a', 'Node A', 'us-east-1');
      useDesignStore.setState({ nodes: [nodeA] });

      const store = useDesignStore.getState();
      const updateNodeLoadsSpy = vi.spyOn(store, 'updateNodeLoads');
      const runAnalysisSpy = vi.spyOn(store, 'runAnalysis');

      store.updateNodeConfig('node-a', { label: 'Updated Node A' });

      expect(updateNodeLoadsSpy).toHaveBeenCalled();
      expect(runAnalysisSpy).toHaveBeenCalled();
    });
  });
});
