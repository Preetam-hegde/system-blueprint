import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { useDesignStore } from '@/store/useDesignStore';
import type { Node, Edge } from '@xyflow/react';

describe('useDesignStore - duplicateNode', () => {
  let saveHistorySpy: Mock;

  beforeEach(() => {
    useDesignStore.setState({
      nodes: [],
      edges: [],
      history: [],
      historyIndex: -1,
      simulation: {
        isRunning: false,
        tick: 0,
        scenario: { type: 'none' },
      },
    });

    // We need to spy on the bound function or just replace it since it's defined in the store
    saveHistorySpy = vi.fn();
    useDesignStore.setState({ saveHistory: saveHistorySpy });
  });

  it('does nothing if the node to duplicate is not found', () => {
    useDesignStore.getState().duplicateNode('non-existent-id');

    expect(useDesignStore.getState().nodes).toHaveLength(0);
    expect(saveHistorySpy).not.toHaveBeenCalled();
  });

  it('successfully duplicates a single node (generates new ID, updates position (+180x, +40y), deep clone data, selected=false)', () => {
    const originalNode: Node = {
      id: 'node-1',
      type: 'systemNode',
      position: { x: 100, y: 200 },
      data: { label: 'Original Node', nested: { foo: 'bar' } },
      selected: true,
    };

    useDesignStore.setState({ nodes: [originalNode] });

    useDesignStore.getState().duplicateNode('node-1');

    const nodes = useDesignStore.getState().nodes;
    expect(nodes).toHaveLength(2);

    const newNode = nodes.find(n => n.id !== 'node-1');
    expect(newNode).toBeDefined();

    if (newNode) {
      expect(newNode.id).toMatch(/^node-\d+-\d+$/);
      expect(newNode.position).toEqual({ x: 280, y: 240 });
      expect(newNode.selected).toBe(false);

      // Verify deep clone of data
      expect(newNode.type).toBe(originalNode.type);
      expect(newNode.data).toEqual(originalNode.data);
      expect(newNode.data).not.toBe(originalNode.data);
    }
  });

  it('duplicates incoming and outgoing edges', () => {
    const originalNode: Node = {
      id: 'node-1',
      type: 'systemNode',
      position: { x: 100, y: 200 },
      data: { label: 'Original Node' },
      selected: false,
    };
    const otherNode1: Node = {
      id: 'other-1',
      type: 'systemNode',
      position: { x: 0, y: 0 },
      data: { label: 'Other 1' },
    };
    const otherNode2: Node = {
      id: 'other-2',
      type: 'systemNode',
      position: { x: 200, y: 0 },
      data: { label: 'Other 2' },
    };

    const incomingEdge: Edge = {
      id: 'edge-in',
      source: 'other-1',
      target: 'node-1',
    };
    const outgoingEdge: Edge = {
      id: 'edge-out',
      source: 'node-1',
      target: 'other-2',
    };

    useDesignStore.setState({
      nodes: [originalNode, otherNode1, otherNode2],
      edges: [incomingEdge, outgoingEdge]
    });

    useDesignStore.getState().duplicateNode('node-1');

    const edges = useDesignStore.getState().edges;
    // original edges (2) + duplicate edges (2) = 4
    expect(edges).toHaveLength(4);

    const nodes = useDesignStore.getState().nodes;
    const newNode = nodes.find(n => n.id !== 'node-1' && n.id.startsWith('node-'));
    expect(newNode).toBeDefined();

    if (newNode) {
      const duplicatedIncoming = edges.find(e => e.target === newNode.id);
      expect(duplicatedIncoming).toBeDefined();
      expect(duplicatedIncoming?.source).toBe('other-1');
      expect(duplicatedIncoming?.id).toMatch(/^e-\d+-0\.\d+$/);

      const duplicatedOutgoing = edges.find(e => e.source === newNode.id);
      expect(duplicatedOutgoing).toBeDefined();
      expect(duplicatedOutgoing?.target).toBe('other-2');
      expect(duplicatedOutgoing?.id).toMatch(/^e-\d+-0\.\d+$/);
    }
  });

  it('verifies saveHistory is called upon successful duplication', () => {
    const originalNode: Node = {
      id: 'node-1',
      type: 'systemNode',
      position: { x: 100, y: 200 },
      data: { label: 'Original Node' },
      selected: false,
    };

    useDesignStore.setState({ nodes: [originalNode] });

    useDesignStore.getState().duplicateNode('node-1');

    expect(saveHistorySpy).toHaveBeenCalled();
  });
});
