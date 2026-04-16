import { create } from 'zustand';
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';
import type {
  NodeConfig,
  EdgeConfig,
  SimulationState,
  AnalysisWarning,
  SystemNodeType,
  NodeCategory,
} from '@/types/system-design';
import { DEFAULT_NODE_CONFIG, DEFAULT_EDGE_CONFIG, NODE_CATALOG } from '@/types/system-design';

export interface SystemNodeData extends NodeConfig {
  nodeType: SystemNodeType;
  category: NodeCategory;
  currentLoad: number;
  isBottleneck: boolean;
  isSpof: boolean;
  [key: string]: unknown;
}

interface DesignStore {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  simulation: SimulationState;
  warnings: AnalysisWarning[];
  history: { nodes: Node[]; edges: Edge[] }[];
  historyIndex: number;

  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;

  addNode: (type: SystemNodeType, position: { x: number; y: number }) => void;
  duplicateNode: (nodeId: string) => void;
  updateNodeConfig: (nodeId: string, config: Partial<SystemNodeData>) => void;
  updateEdgeConfig: (edgeId: string, config: Partial<EdgeConfig>) => void;
  selectNode: (nodeId: string | null) => void;
  selectEdge: (edgeId: string | null) => void;
  deleteSelected: () => void;

  setSimulation: (sim: Partial<SimulationState>) => void;
  updateNodeLoads: () => void;
  runAnalysis: () => void;

  autoLayout: () => void;

  undo: () => void;
  redo: () => void;
  saveHistory: () => void;

  exportJSON: () => string;
  importJSON: (json: string) => void;
  clearCanvas: () => void;
}

let nodeIdCounter = 0;

const getNodeData = (n: Node): SystemNodeData => n.data as unknown as SystemNodeData;
const getEdgeData = (e: Edge): EdgeConfig => (e.data || {}) as unknown as EdgeConfig;

export const useDesignStore = create<DesignStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  simulation: { running: false, speed: 1, rps: 100 },
  warnings: [],
  history: [],
  historyIndex: -1,

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },
  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },
  onConnect: (connection) => {
    const newEdge: Edge = {
      ...connection,
      id: `e-${Date.now()}`,
      type: 'systemEdge',
      data: { ...DEFAULT_EDGE_CONFIG } as unknown as Record<string, unknown>,
      source: connection.source!,
      target: connection.target!,
    };
    set({ edges: addEdge(newEdge, get().edges) });
    get().saveHistory();
  },

  addNode: (type, position) => {
    const catalog = NODE_CATALOG.find((n) => n.type === type)!;
    const id = `node-${++nodeIdCounter}-${Date.now()}`;
    const data: SystemNodeData = {
      ...DEFAULT_NODE_CONFIG,
      label: catalog.label,
      nodeType: type,
      category: catalog.category,
      currentLoad: 0,
      isBottleneck: false,
      isSpof: false,
    };
    const newNode: Node = {
      id,
      type: 'systemNode',
      position,
      data: data as unknown as Record<string, unknown>,
    };
    set({ nodes: [...get().nodes, newNode] });
    get().saveHistory();
  },

  duplicateNode: (nodeId) => {
    const { nodes, edges } = get();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const d = getNodeData(node);
    const newId = `node-${++nodeIdCounter}-${Date.now()}`;
    const newNode: Node = {
      ...node,
      id: newId,
      position: { x: node.position.x + 180, y: node.position.y + 40 },
      data: { ...node.data } as Record<string, unknown>,
      selected: false,
    };
    // Also duplicate connections
    const newEdges: Edge[] = [];
    edges.forEach((e) => {
      if (e.source === nodeId) {
        newEdges.push({ ...e, id: `e-${Date.now()}-${Math.random()}`, source: newId });
      }
      if (e.target === nodeId) {
        newEdges.push({ ...e, id: `e-${Date.now()}-${Math.random()}`, target: newId });
      }
    });
    set({ nodes: [...nodes, newNode], edges: [...edges, ...newEdges] });
    get().saveHistory();
  },

  updateNodeConfig: (nodeId, config) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...config } } : n
      ),
    });
  },

  updateEdgeConfig: (edgeId, config) => {
    set({
      edges: get().edges.map((e) =>
        e.id === edgeId ? { ...e, data: { ...e.data, ...config } } : e
      ),
    });
  },

  selectNode: (nodeId) => set({ selectedNodeId: nodeId, selectedEdgeId: null }),
  selectEdge: (edgeId) => set({ selectedEdgeId: edgeId, selectedNodeId: null }),

  deleteSelected: () => {
    const { selectedNodeId, selectedEdgeId, nodes, edges } = get();
    if (selectedNodeId) {
      set({
        nodes: nodes.filter((n) => n.id !== selectedNodeId),
        edges: edges.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId),
        selectedNodeId: null,
      });
    } else if (selectedEdgeId) {
      set({
        edges: edges.filter((e) => e.id !== selectedEdgeId),
        selectedEdgeId: null,
      });
    }
    get().saveHistory();
  },

  setSimulation: (sim) => set({ simulation: { ...get().simulation, ...sim } }),

  updateNodeLoads: () => {
    const { nodes, edges, simulation } = get();
    if (!simulation.running) return;

    const sourceNodes = nodes.filter((n) => !edges.some((e) => e.target === n.id));
    const rpsPerSource = sourceNodes.length > 0 ? simulation.rps / sourceNodes.length : 0;

    // BFS with proper fan-in accumulation
    const loadMap: Record<string, number> = {};
    const inDegree: Record<string, number> = {};
    const queue: string[] = [];

    // Initialize
    nodes.forEach((n) => { loadMap[n.id] = 0; inDegree[n.id] = 0; });
    edges.forEach((e) => { inDegree[e.target] = (inDegree[e.target] || 0) + 1; });
    sourceNodes.forEach((n) => { loadMap[n.id] = rpsPerSource; queue.push(n.id); });

    const processed = new Set<string>();
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (processed.has(id)) continue;
      processed.add(id);

      const outgoing = edges.filter((e) => e.source === id);
      const loadPerEdge = loadMap[id] / Math.max(outgoing.length, 1);
      outgoing.forEach((e) => {
        loadMap[e.target] = (loadMap[e.target] || 0) + loadPerEdge;
        // Only process once all incoming loads have been accumulated
        inDegree[e.target]--;
        if (inDegree[e.target] <= 0) {
          queue.push(e.target);
        }
      });
    }

    set({
      nodes: nodes.map((n) => {
        const data = getNodeData(n);
        const currentLoad = loadMap[n.id] || 0;
        const effectiveLoad = currentLoad / Math.max(data.replicas, 1);
        return {
          ...n,
          data: {
            ...n.data,
            currentLoad: effectiveLoad,
            isBottleneck: effectiveLoad > data.throughputLimit,
          },
        };
      }),
    });
  },

  runAnalysis: () => {
    const { nodes, edges } = get();
    const warnings: AnalysisWarning[] = [];

    nodes.forEach((n) => {
      const data = getNodeData(n);

      if (data.currentLoad > data.throughputLimit) {
        warnings.push({
          id: `bn-${n.id}`,
          type: 'bottleneck',
          nodeId: n.id,
          message: `${data.label} is overloaded (${Math.round(data.currentLoad)}/${data.throughputLimit} req/s)`,
          severity: data.currentLoad > data.throughputLimit * 1.5 ? 'critical' : 'warning',
        });
      }

      if (data.replicas <= 1) {
        const hasIncoming = edges.some((e) => e.target === n.id);
        const hasOutgoing = edges.some((e) => e.source === n.id);
        if (hasIncoming && hasOutgoing) {
          warnings.push({
            id: `spof-${n.id}`,
            type: 'spof',
            nodeId: n.id,
            message: `${data.label} is a single point of failure (1 replica)`,
            severity: 'warning',
          });
        }
      }
    });

    const sourceNodes = nodes.filter((n) => !edges.some((e) => e.target === n.id));
    sourceNodes.forEach((src) => {
      const visited = new Set<string>();
      const dfs = (nodeId: string, cumLatency: number, path: string[]) => {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);
        const nodeData = getNodeData(nodes.find((n) => n.id === nodeId)!);
        const totalLatency = cumLatency + (nodeData?.latency || 0);
        const outgoing = edges.filter((e) => e.source === nodeId);
        if (outgoing.length === 0 && totalLatency > 200) {
          warnings.push({
            id: `lat-${nodeId}-${Date.now()}`,
            type: 'latency',
            nodeId,
            message: `High latency: ${path.join(' → ')} (${totalLatency}ms)`,
            severity: totalLatency > 500 ? 'critical' : 'warning',
          });
        }
        outgoing.forEach((e) => {
          const edgeLatency = getEdgeData(e)?.latency || 0;
          dfs(e.target, totalLatency + edgeLatency, [...path, nodeData?.label || nodeId]);
        });
        visited.delete(nodeId);
      };
      dfs(src.id, 0, []);
    });

    set({ warnings });

    const spofNodeIds = new Set(warnings.filter((w) => w.type === 'spof').map((w) => w.nodeId));
    set({
      nodes: get().nodes.map((n) => ({
        ...n,
        data: { ...n.data, isSpof: spofNodeIds.has(n.id) },
      })),
    });
  },

  autoLayout: () => {
    const { nodes, edges } = get();
    if (nodes.length === 0) return;

    // BFS layered layout
    const inDeg: Record<string, number> = {};
    nodes.forEach((n) => { inDeg[n.id] = 0; });
    edges.forEach((e) => { inDeg[e.target] = (inDeg[e.target] || 0) + 1; });

    const layers: string[][] = [];
    const assigned = new Set<string>();
    let queue = nodes.filter((n) => inDeg[n.id] === 0).map((n) => n.id);

    while (queue.length > 0) {
      layers.push([...queue]);
      queue.forEach((id) => assigned.add(id));
      const next: string[] = [];
      queue.forEach((id) => {
        edges.filter((e) => e.source === id).forEach((e) => {
          if (!assigned.has(e.target) && !next.includes(e.target)) {
            // Check if all parents assigned
            const allParentsAssigned = edges
              .filter((ed) => ed.target === e.target)
              .every((ed) => assigned.has(ed.source));
            if (allParentsAssigned) next.push(e.target);
          }
        });
      });
      // Handle orphans
      if (next.length === 0) {
        const remaining = nodes.filter((n) => !assigned.has(n.id));
        if (remaining.length > 0) next.push(remaining[0].id);
      }
      queue = next;
      if (layers.length > 50) break; // safety
    }

    const LAYER_GAP = 160;
    const NODE_GAP = 200;

    const positioned = nodes.map((n) => {
      let layerIdx = layers.findIndex((l) => l.includes(n.id));
      if (layerIdx === -1) layerIdx = layers.length;
      const layer = layers[layerIdx] || [n.id];
      const posInLayer = layer.indexOf(n.id);
      const layerWidth = layer.length * NODE_GAP;
      return {
        ...n,
        position: {
          x: posInLayer * NODE_GAP - layerWidth / 2 + 400,
          y: layerIdx * LAYER_GAP + 50,
        },
      };
    });

    set({ nodes: positioned });
    get().saveHistory();
  },

  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      set({ nodes: prev.nodes, edges: prev.edges, historyIndex: historyIndex - 1 });
    }
  },

  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      set({ nodes: next.nodes, edges: next.edges, historyIndex: historyIndex + 1 });
    }
  },

  saveHistory: () => {
    const { nodes, edges, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) });
    if (newHistory.length > 50) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  exportJSON: () => {
    const { nodes, edges } = get();
    return JSON.stringify({ nodes, edges }, null, 2);
  },

  importJSON: (json) => {
    try {
      const { nodes, edges } = JSON.parse(json);
      set({ nodes, edges, selectedNodeId: null, selectedEdgeId: null });
      get().saveHistory();
    } catch (e) {
      console.error('Invalid JSON import', e);
    }
  },

  clearCanvas: () => {
    set({ nodes: [], edges: [], selectedNodeId: null, selectedEdgeId: null, warnings: [] });
    get().saveHistory();
  },
}));
