import { create } from "zustand";
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from "@xyflow/react";
import type {
  NodeConfig,
  EdgeConfig,
  SimulationState,
  SimulationScenario,
  ReplayTrace,
  AnalysisWarning,
  SystemNodeType,
  NodeCategory,
  CapacityPlanSummary,
} from "@/types/system-design";
import {
  DEFAULT_NODE_CONFIG,
  DEFAULT_EDGE_CONFIG,
  NODE_CATALOG,
} from "@/types/system-design";

export interface SystemNodeData extends NodeConfig {
  nodeType: SystemNodeType;
  category: NodeCategory;
  currentLoad: number;
  isBottleneck: boolean;
  isSpof: boolean;
  isFailed: boolean;
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
  advanceSimulationStep: () => void;
  resetSimulationReplay: () => void;
  toggleNodeFailure: (nodeId: string) => void;
  refreshSimulationState: () => void;
  buildCapacityPlan: (
    growthFactor: number,
    spikeMultiplier?: number,
  ) => CapacityPlanSummary;

  autoLayout: () => void;

  undo: () => void;
  redo: () => void;
  saveHistory: () => void;

  exportJSON: () => string;
  importJSON: (json: string) => void;
  clearCanvas: () => void;
}

let nodeIdCounter = 0;

const getNodeData = (n: Node): SystemNodeData =>
  n.data as unknown as SystemNodeData;
const getEdgeData = (e: Edge): EdgeConfig =>
  (e.data || {}) as unknown as EdgeConfig;

const CPU_HOURLY_USD = 0.04;
const MEMORY_HOURLY_USD = 0.005;
const DEFAULT_BACKLOG_SEVERITY = 65;
const DEFAULT_SIMULATION_SCENARIO: SimulationScenario = { type: "none" };
const EMPTY_REPLAY_TRACE: ReplayTrace = {
  pathNodeIds: [],
  pathEdgeIds: [],
  currentNodeId: null,
  currentEdgeId: null,
  accumulatedLatencyMs: 0,
  totalLatencyMs: 0,
  estimatedRetries: 0,
  bottleneckNodeIds: [],
  completedPct: 0,
};

const computeReplicaHourlyCost = (
  data: Pick<NodeConfig, "cpu" | "memory" | "hourlyCost">,
): number => {
  if ((data.hourlyCost ?? 0) > 0) return data.hourlyCost ?? 0;
  return (
    Math.max(data.cpu, 0) * CPU_HOURLY_USD +
    Math.max(data.memory, 0) * MEMORY_HOURLY_USD
  );
};

const computeHourlyCost = (
  data: Pick<NodeConfig, "cpu" | "memory" | "hourlyCost">,
  replicas: number,
): number => {
  return computeReplicaHourlyCost(data) * Math.max(replicas, 0);
};

const getManualFailedNodeIds = (simulation: SimulationState): string[] =>
  simulation.manualFailedNodeIds ?? simulation.failedNodeIds ?? [];

const getNormalizedScenario = (
  scenario?: SimulationScenario,
): SimulationScenario => {
  if (!scenario) return { ...DEFAULT_SIMULATION_SCENARIO };
  if (scenario.type === "queue-backlog") {
    return {
      ...scenario,
      backlogSeverity: scenario.backlogSeverity ?? DEFAULT_BACKLOG_SEVERITY,
      queueNodeIds: scenario.queueNodeIds ?? [],
    };
  }
  return { ...scenario, queueNodeIds: undefined, backlogSeverity: undefined };
};

const getScenarioFailedNodeIds = (
  nodes: Node[],
  scenario: SimulationScenario,
): string[] => {
  if (scenario.type !== "zone-outage" || !scenario.region) return [];
  return nodes
    .filter((node) => getNodeData(node).region === scenario.region)
    .map((node) => node.id);
};

const getScenarioBacklogNodeIds = (
  nodes: Node[],
  scenario: SimulationScenario,
): string[] => {
  if (scenario.type !== "queue-backlog") return [];
  if (scenario.queueNodeIds && scenario.queueNodeIds.length > 0)
    return scenario.queueNodeIds;
  return nodes
    .filter((node) => getNodeData(node).category === "messaging")
    .map((node) => node.id);
};

const buildScenarioContext = (nodes: Node[], simulation: SimulationState) => {
  const scenario = getNormalizedScenario(simulation.scenario);
  const manualFailedNodeIds = getManualFailedNodeIds(simulation);
  const scenarioFailedNodeIds = getScenarioFailedNodeIds(nodes, scenario);
  const failedNodeIds = [
    ...new Set([...manualFailedNodeIds, ...scenarioFailedNodeIds]),
  ];
  const backlogNodeIds = getScenarioBacklogNodeIds(nodes, scenario);
  return {
    scenario,
    manualFailedNodeIds,
    scenarioFailedNodeIds,
    failedNodeIds,
    failedSet: new Set(failedNodeIds),
    backlogNodeIds,
    backlogSet: new Set(backlogNodeIds),
  };
};

const normalizeSimulation = (
  nodes: Node[],
  simulation: SimulationState,
): SimulationState => {
  const { scenario, manualFailedNodeIds, failedNodeIds } = buildScenarioContext(
    nodes,
    simulation,
  );
  return {
    ...simulation,
    scenario,
    manualFailedNodeIds,
    failedNodeIds,
    replayTrace: simulation.replayTrace ?? { ...EMPTY_REPLAY_TRACE },
  };
};

const getBacklogThrottle = (
  simulation: SimulationState,
  nodeId: string,
  nodes: Node[],
): number => {
  const { scenario, backlogSet } = buildScenarioContext(nodes, simulation);
  if (scenario.type !== "queue-backlog" || !backlogSet.has(nodeId)) return 1;
  return Math.max(
    0.15,
    1 - (scenario.backlogSeverity ?? DEFAULT_BACKLOG_SEVERITY) / 100,
  );
};

const getScenarioLatencyForNode = (
  data: SystemNodeData,
  simulation: SimulationState,
): number => {
  const scenario = getNormalizedScenario(simulation.scenario);
  if (
    scenario.type === "regional-latency" &&
    scenario.region &&
    data.region === scenario.region
  ) {
    return scenario.latencyMs ?? 150;
  }
  return 0;
};

const getRetrySuccessProbability = (
  packetLossPct: number,
  retryAttempts: number,
): number => {
  const lossRate = Math.max(0, Math.min(100, packetLossPct)) / 100;
  const attempts = Math.max(1, Math.floor(retryAttempts) + 1);
  return 1 - lossRate ** attempts;
};

const getExpectedAttempts = (
  packetLossPct: number,
  retryAttempts: number,
): number => {
  const lossRate = Math.max(0, Math.min(100, packetLossPct)) / 100;
  const attempts = Math.max(1, Math.floor(retryAttempts) + 1);

  let expectedAttempts = 0;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const probability =
      attempt === attempts
        ? lossRate ** (attempt - 1)
        : (1 - lossRate) * lossRate ** (attempt - 1);
    expectedAttempts += attempt * probability;
  }

  return Math.max(1, expectedAttempts);
};

const getReplayNodeLatency = (
  data: SystemNodeData,
  simulation: SimulationState,
): number =>
  Math.max(data.latency, 0) +
  Math.max(simulation.extraLatencyMs, 0) +
  getScenarioLatencyForNode(data, simulation);

const buildReplayTrace = (
  nodes: Node[],
  edges: Edge[],
  simulation: SimulationState,
): ReplayTrace => {
  const normalizedSimulation = normalizeSimulation(nodes, simulation);
  const { failedSet } = buildScenarioContext(nodes, normalizedSimulation);
  const activeEdges = edges.filter(
    (edge) => !failedSet.has(edge.source) && !failedSet.has(edge.target),
  );
  const sourceNodes = nodes.filter(
    (node) =>
      !failedSet.has(node.id) &&
      !activeEdges.some((edge) => edge.target === node.id),
  );

  if (nodes.length === 0 || sourceNodes.length === 0) {
    return {
      ...EMPTY_REPLAY_TRACE,
      blockedReason:
        nodes.length === 0
          ? "Add nodes to simulate a request path."
          : "Connect an entry node to a downstream sink to replay traffic.",
    };
  }

  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const edgeMap = new Map(activeEdges.map((edge) => [edge.id, edge]));
  let bestPath: { nodeIds: string[]; edgeIds: string[]; score: number } | null =
    null;

  const visit = (
    nodeId: string,
    pathNodeIds: string[],
    pathEdgeIds: string[],
    visited: Set<string>,
    latencySoFar: number,
    bottleneckCount: number,
  ) => {
    if (visited.has(nodeId) || failedSet.has(nodeId)) return;
    const node = nodeMap.get(nodeId);
    if (!node) return;

    const nodeData = getNodeData(node);
    const nextNodeIds = [...pathNodeIds, nodeId];
    const nextLatency =
      latencySoFar + getReplayNodeLatency(nodeData, normalizedSimulation);
    const nextBottlenecks =
      bottleneckCount +
      (nodeData.currentLoad >= nodeData.throughputLimit * 0.85 ? 1 : 0);
    const outgoing = activeEdges.filter((edge) => edge.source === nodeId);

    if (outgoing.length === 0) {
      const score =
        nextLatency + nextNodeIds.length * 18 + nextBottlenecks * 160;
      if (!bestPath || score > bestPath.score) {
        bestPath = { nodeIds: nextNodeIds, edgeIds: pathEdgeIds, score };
      }
      return;
    }

    const nextVisited = new Set(visited);
    nextVisited.add(nodeId);

    outgoing.forEach((edge) => {
      visit(
        edge.target,
        nextNodeIds,
        [...pathEdgeIds, edge.id],
        nextVisited,
        nextLatency + Math.max(getEdgeData(edge).latency || 0, 0),
        nextBottlenecks,
      );
    });
  };

  sourceNodes.forEach((sourceNode) => {
    visit(sourceNode.id, [], [], new Set<string>(), 0, 0);
  });

  if (!bestPath) {
    return {
      ...EMPTY_REPLAY_TRACE,
      blockedReason:
        normalizedSimulation.failedNodeIds.length > 0
          ? "Replay path is interrupted by the current failure injection."
          : "No reachable sink was found for the current diagram.",
    };
  }

  const expectedAttempts = getExpectedAttempts(
    normalizedSimulation.packetLossPct,
    normalizedSimulation.retryAttempts,
  );
  const estimatedRetries = Math.max(
    0,
    Math.round((expectedAttempts - 1) * bestPath.edgeIds.length),
  );
  const bottleneckNodeIds = bestPath.nodeIds.filter((nodeId) => {
    const node = nodeMap.get(nodeId);
    if (!node) return false;
    const data = getNodeData(node);
    return data.currentLoad >= data.throughputLimit * 0.85;
  });

  const segments: Array<{
    type: "node" | "edge";
    id: string;
    latency: number;
  }> = [];
  bestPath.nodeIds.forEach((nodeId, index) => {
    const node = nodeMap.get(nodeId);
    if (node) {
      segments.push({
        type: "node",
        id: nodeId,
        latency: getReplayNodeLatency(getNodeData(node), normalizedSimulation),
      });
    }

    const edgeId = bestPath.edgeIds[index];
    if (edgeId) {
      const edge = edgeMap.get(edgeId);
      if (edge) {
        segments.push({
          type: "edge",
          id: edgeId,
          latency: Math.max(getEdgeData(edge).latency || 0, 0),
        });
      }
    }
  });

  const completedPct =
    normalizedSimulation.mode === "replay"
      ? Math.round(
          (normalizedSimulation.step /
            Math.max(normalizedSimulation.maxSteps, 1)) *
            100,
        )
      : 100;
  const currentSegmentIndex =
    segments.length > 0
      ? Math.min(
          Math.floor((completedPct / 100) * Math.max(segments.length - 1, 0)),
          Math.max(segments.length - 1, 0),
        )
      : 0;
  const currentSegment = segments[currentSegmentIndex];
  const baseLatency = segments.reduce(
    (sum, segment) => sum + segment.latency,
    0,
  );
  const totalLatencyMs =
    baseLatency +
    estimatedRetries * Math.max(normalizedSimulation.retryBackoffMs, 0);

  return {
    pathNodeIds: bestPath.nodeIds,
    pathEdgeIds: bestPath.edgeIds,
    currentNodeId: currentSegment?.type === "node" ? currentSegment.id : null,
    currentEdgeId: currentSegment?.type === "edge" ? currentSegment.id : null,
    accumulatedLatencyMs: Math.min(
      totalLatencyMs,
      Math.round(totalLatencyMs * (completedPct / 100)),
    ),
    totalLatencyMs,
    estimatedRetries,
    bottleneckNodeIds,
    completedPct,
  };
};

const computeLoadMap = (
  nodes: Node[],
  edges: Edge[],
  simulation: SimulationState,
): Record<string, number> => {
  const { failedSet, backlogSet } = buildScenarioContext(nodes, simulation);
  const activeNodes = nodes.filter((n) => !failedSet.has(n.id));

  const sourceNodes = activeNodes.filter(
    (n) =>
      !edges.some(
        (e) =>
          e.target === n.id &&
          !failedSet.has(e.source) &&
          !failedSet.has(e.target),
      ),
  );

  const progressFactor =
    simulation.mode === "replay"
      ? Math.min((simulation.step + 1) / Math.max(simulation.maxSteps, 1), 1)
      : 1;
  const effectiveRps = simulation.rps * progressFactor;
  const rpsPerSource =
    sourceNodes.length > 0 ? effectiveRps / sourceNodes.length : 0;

  const loadMap: Record<string, number> = {};
  const inDegree: Record<string, number> = {};
  const queue: string[] = [];
  const activeEdgeSet = edges.filter(
    (e) => !failedSet.has(e.source) && !failedSet.has(e.target),
  );

  nodes.forEach((n) => {
    loadMap[n.id] = 0;
    inDegree[n.id] = 0;
  });

  activeEdgeSet.forEach((e) => {
    inDegree[e.target] = (inDegree[e.target] || 0) + 1;
  });
  sourceNodes.forEach((n) => {
    loadMap[n.id] = rpsPerSource;
    queue.push(n.id);
  });

  const processed = new Set<string>();
  const deliveryFactor = getRetrySuccessProbability(
    simulation.packetLossPct,
    simulation.retryAttempts,
  );
  const attemptMultiplier = getExpectedAttempts(
    simulation.packetLossPct,
    simulation.retryAttempts,
  );
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (processed.has(id) || failedSet.has(id)) continue;
    processed.add(id);

    const outgoing = activeEdgeSet.filter((e) => e.source === id);
    const backlogThrottle = backlogSet.has(id)
      ? getBacklogThrottle(simulation, id, nodes)
      : 1;
    loadMap[id] = loadMap[id] * (outgoing.length > 0 ? attemptMultiplier : 1);
    const logicalThroughput =
      loadMap[id] / Math.max(outgoing.length > 0 ? attemptMultiplier : 1, 1);
    const loadPerEdge = logicalThroughput / Math.max(outgoing.length, 1);
    outgoing.forEach((e) => {
      const delivered = loadPerEdge * deliveryFactor * backlogThrottle;
      loadMap[e.target] = (loadMap[e.target] || 0) + delivered;
      inDegree[e.target]--;
      if (inDegree[e.target] <= 0) {
        queue.push(e.target);
      }
    });
  }

  return loadMap;
};

export const useDesignStore = create<DesignStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  simulation: {
    running: false,
    speed: 1,
    rps: 100,
    mode: "live",
    step: 0,
    maxSteps: 20,
    packetLossPct: 0,
    retryAttempts: 2,
    retryBackoffMs: 80,
    extraLatencyMs: 0,
    manualFailedNodeIds: [],
    failedNodeIds: [],
    scenario: { ...DEFAULT_SIMULATION_SCENARIO },
    replayTrace: { ...EMPTY_REPLAY_TRACE },
  },
  warnings: [],
  history: [],
  historyIndex: -1,

  onNodesChange: (changes) => {
    set((state) => {
      const nodes = applyNodeChanges(changes, state.nodes);
      return {
        nodes,
        simulation: normalizeSimulation(nodes, state.simulation),
      };
    });
  },
  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },
  onConnect: (connection) => {
    const newEdge: Edge = {
      ...connection,
      id: `e-${Date.now()}`,
      type: "systemEdge",
      data: { ...DEFAULT_EDGE_CONFIG } as unknown as Record<string, unknown>,
      source: connection.source!,
      target: connection.target!,
    };
    set({ edges: addEdge(newEdge, get().edges) });
    get().refreshSimulationState();
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
      isFailed: false,
    };
    const newNode: Node = {
      id,
      type: "systemNode",
      position,
      data: data as unknown as Record<string, unknown>,
    };
    set((state) => {
      const nodes = [...state.nodes, newNode];
      return {
        nodes,
        simulation: normalizeSimulation(nodes, state.simulation),
      };
    });
    get().refreshSimulationState();
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
        newEdges.push({
          ...e,
          id: `e-${Date.now()}-${Math.random()}`,
          source: newId,
        });
      }
      if (e.target === nodeId) {
        newEdges.push({
          ...e,
          id: `e-${Date.now()}-${Math.random()}`,
          target: newId,
        });
      }
    });
    set((state) => {
      const nextNodes = [...nodes, newNode];
      return {
        nodes: nextNodes,
        edges: [...edges, ...newEdges],
        simulation: normalizeSimulation(nextNodes, state.simulation),
      };
    });
    get().refreshSimulationState();
    get().saveHistory();
  },

  updateNodeConfig: (nodeId, config) => {
    set((state) => {
      const nodes = state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...config } } : n,
      );
      return {
        nodes,
        simulation: normalizeSimulation(nodes, state.simulation),
      };
    });
    get().refreshSimulationState();
  },

  updateEdgeConfig: (edgeId, config) => {
    set({
      edges: get().edges.map((e) =>
        e.id === edgeId ? { ...e, data: { ...e.data, ...config } } : e,
      ),
    });
    get().refreshSimulationState();
  },

  selectNode: (nodeId) => set({ selectedNodeId: nodeId, selectedEdgeId: null }),
  selectEdge: (edgeId) => set({ selectedEdgeId: edgeId, selectedNodeId: null }),

  deleteSelected: () => {
    const { selectedNodeId, selectedEdgeId, nodes, edges } = get();
    if (selectedNodeId) {
      set((state) => {
        const nextNodes = nodes.filter((n) => n.id !== selectedNodeId);
        return {
          nodes: nextNodes,
          edges: edges.filter(
            (e) => e.source !== selectedNodeId && e.target !== selectedNodeId,
          ),
          selectedNodeId: null,
          simulation: normalizeSimulation(nextNodes, state.simulation),
        };
      });
    } else if (selectedEdgeId) {
      set({
        edges: edges.filter((e) => e.id !== selectedEdgeId),
        selectedEdgeId: null,
      });
    }
    get().refreshSimulationState();
    get().saveHistory();
  },

  setSimulation: (sim) =>
    set((state) => {
      const scenario = sim.scenario
        ? { ...state.simulation.scenario, ...sim.scenario }
        : state.simulation.scenario;
      const nextSimulation = normalizeSimulation(state.nodes, {
        ...state.simulation,
        ...sim,
        scenario,
      });

      return { simulation: nextSimulation };
    }),

  advanceSimulationStep: () => {
    const { simulation } = get();
    if (simulation.mode !== "replay") return;

    const nextStep = Math.min(simulation.step + 1, simulation.maxSteps);
    const nextRunning = nextStep < simulation.maxSteps;
    set((state) => ({
      simulation: normalizeSimulation(state.nodes, {
        ...simulation,
        step: nextStep,
        running: nextRunning,
      }),
    }));
    get().refreshSimulationState();
  },

  resetSimulationReplay: () => {
    const { simulation } = get();
    if (simulation.mode !== "replay") return;

    set((state) => ({
      simulation: normalizeSimulation(state.nodes, {
        ...simulation,
        step: 0,
        running: false,
      }),
    }));
    get().refreshSimulationState();
  },

  toggleNodeFailure: (nodeId) => {
    const { simulation } = get();
    const manualFailedNodeIds = getManualFailedNodeIds(simulation);
    const exists = manualFailedNodeIds.includes(nodeId);
    const nextManualFailedNodeIds = exists
      ? manualFailedNodeIds.filter((id) => id !== nodeId)
      : [...manualFailedNodeIds, nodeId];

    set((state) => ({
      simulation: normalizeSimulation(state.nodes, {
        ...simulation,
        manualFailedNodeIds: nextManualFailedNodeIds,
      }),
    }));
    get().refreshSimulationState();
  },

  refreshSimulationState: () => {
    const { nodes, edges } = get();
    const simulation = normalizeSimulation(nodes, get().simulation);
    const loadMap = computeLoadMap(nodes, edges, simulation);
    const { failedSet, backlogSet, scenario } = buildScenarioContext(
      nodes,
      simulation,
    );
    const warnings: AnalysisWarning[] = [];

    const updatedNodes = nodes.map((n) => {
      const data = getNodeData(n);
      const currentLoad =
        simulation.running || simulation.mode === "replay"
          ? loadMap[n.id] || 0
          : 0;
      const backlogPressure = backlogSet.has(n.id)
        ? 1 / Math.max(getBacklogThrottle(simulation, n.id, nodes), 0.15)
        : 1;
      const effectiveLoad =
        (currentLoad / Math.max(data.replicas, 1)) * backlogPressure;
      const effectiveThroughputLimit = Math.max(
        data.throughputLimit * getBacklogThrottle(simulation, n.id, nodes),
        1,
      );
      const isFailed = failedSet.has(n.id);

      if (isFailed) {
        warnings.push({
          id: `failure-${n.id}`,
          type: "failure",
          nodeId: n.id,
          message:
            scenario.type === "zone-outage" &&
            scenario.region &&
            data.region === scenario.region
              ? `${data.label} is unavailable due to a ${scenario.region} zone outage`
              : `${data.label} is marked as failed during simulation`,
          severity: "critical",
        });
      }

      if (backlogSet.has(n.id)) {
        warnings.push({
          id: `backlog-${n.id}`,
          type: "backlog",
          nodeId: n.id,
          message: `${data.label} is experiencing queue backlog pressure and reduced throughput`,
          severity:
            effectiveLoad > effectiveThroughputLimit ? "critical" : "warning",
        });
      }

      if (effectiveLoad > effectiveThroughputLimit) {
        warnings.push({
          id: `bn-${n.id}`,
          type: "bottleneck",
          nodeId: n.id,
          message: `${data.label} is overloaded (${Math.round(effectiveLoad)}/${Math.round(effectiveThroughputLimit)} req/s effective)`,
          severity:
            effectiveLoad > effectiveThroughputLimit * 1.5
              ? "critical"
              : "warning",
        });
      }

      if (data.replicas <= 1) {
        const hasIncoming = edges.some((e) => e.target === n.id);
        const hasOutgoing = edges.some((e) => e.source === n.id);
        if (hasIncoming && hasOutgoing) {
          warnings.push({
            id: `spof-${n.id}`,
            type: "spof",
            nodeId: n.id,
            message: `${data.label} is a single point of failure (1 replica)`,
            severity: "warning",
          });
        }
      }

      const spofNodeIds = new Set(
        warnings.filter((w) => w.type === "spof").map((w) => w.nodeId),
      );

      return {
        ...n,
        data: {
          ...n.data,
          currentLoad: isFailed ? 0 : effectiveLoad,
          isBottleneck: !isFailed && effectiveLoad > effectiveThroughputLimit,
          isFailed,
          isSpof: spofNodeIds.has(n.id),
        },
      };
    });

    const nextSimulation = {
      ...simulation,
      replayTrace: buildReplayTrace(updatedNodes, edges, simulation),
    };

    const sourceNodes = updatedNodes.filter(
      (n) => !edges.some((e) => e.target === n.id),
    );
    sourceNodes.forEach((src) => {
      const visited = new Set<string>();
      const dfs = (nodeId: string, cumLatency: number, path: string[]) => {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);
        const nodeData = getNodeData(
          updatedNodes.find((n) => n.id === nodeId)!,
        );
        const totalLatency =
          cumLatency + getReplayNodeLatency(nodeData, nextSimulation);
        const outgoing = edges.filter((e) => e.source === nodeId);
        if (outgoing.length === 0 && totalLatency > 200) {
          const retryLabel =
            nextSimulation.replayTrace.estimatedRetries > 0
              ? `, ~${nextSimulation.replayTrace.estimatedRetries} retries`
              : "";
          warnings.push({
            id: `lat-${nodeId}-${Date.now()}`,
            type: "latency",
            nodeId,
            message:
              scenario.type === "regional-latency" &&
              scenario.region &&
              nodeData.region === scenario.region
                ? `High latency through ${scenario.region}: ${path.join(" → ")} (${totalLatency}ms${retryLabel})`
                : `High latency: ${path.join(" → ")} (${totalLatency}ms${retryLabel})`,
            severity: totalLatency > 500 ? "critical" : "warning",
          });
        }
        outgoing.forEach((e) => {
          const edgeLatency = getEdgeData(e)?.latency || 0;
          dfs(e.target, totalLatency + edgeLatency, [
            ...path,
            nodeData?.label || nodeId,
          ]);
        });
        visited.delete(nodeId);
      };
      dfs(src.id, 0, []);
    });

    set({
      simulation: nextSimulation,
      nodes: updatedNodes,
      warnings,
    });
  },

  buildCapacityPlan: (growthFactor, spikeMultiplier = 1) => {
    const { nodes } = get();
    const simulation = normalizeSimulation(nodes, {
      ...get().simulation,
      mode: "live",
      step: get().simulation.maxSteps,
    });
    const safeGrowth = Math.max(growthFactor, 1);
    const safeSpikeMultiplier = Math.max(spikeMultiplier, 1);
    const totalProjectedMultiplier = safeGrowth * safeSpikeMultiplier;
    const baselineLoadMap = computeLoadMap(nodes, get().edges, {
      ...simulation,
      running: true,
    });
    const planNodes = nodes.map((n) => {
      const d = getNodeData(n);
      const currentRps = simulation.failedNodeIds.includes(n.id)
        ? 0
        : (baselineLoadMap[n.id] || 0) / Math.max(d.replicas, 1);
      const projectedRps = currentRps * totalProjectedMultiplier;
      const perReplicaLimit = Math.max(
        d.throughputLimit * getBacklogThrottle(simulation, n.id, nodes),
        1,
      );
      const requiredReplicas = Math.max(
        1,
        Math.ceil(projectedRps / perReplicaLimit),
      );
      const currentHourlyCost = computeHourlyCost(d, Math.max(d.replicas, 1));
      const projectedHourlyCost = computeHourlyCost(d, requiredReplicas);

      return {
        nodeId: n.id,
        label: d.label,
        currentRps,
        projectedRps,
        replicas: Math.max(d.replicas, 1),
        requiredReplicas,
        throughputLimit: d.throughputLimit,
        projectedUtilizationPct: Math.min(
          (projectedRps / Math.max(requiredReplicas, 1) / perReplicaLimit) *
            100,
          999,
        ),
        estimatedHourlyCost: currentHourlyCost,
        projectedHourlyCost,
      };
    });

    return {
      growthFactor: safeGrowth,
      spikeMultiplier: safeSpikeMultiplier,
      totalProjectedMultiplier,
      totalHourlyCost: planNodes.reduce(
        (sum, n) => sum + n.estimatedHourlyCost,
        0,
      ),
      projectedHourlyCost: planNodes.reduce(
        (sum, n) => sum + n.projectedHourlyCost,
        0,
      ),
      projectedBottlenecks: planNodes.filter(
        (n) => n.projectedRps > n.throughputLimit * n.replicas,
      ).length,
      nodes: planNodes.sort((a, b) => b.projectedRps - a.projectedRps),
    };
  },

  autoLayout: () => {
    const { nodes, edges } = get();
    if (nodes.length === 0) return;

    // BFS layered layout
    const inDeg: Record<string, number> = {};
    nodes.forEach((n) => {
      inDeg[n.id] = 0;
    });
    edges.forEach((e) => {
      inDeg[e.target] = (inDeg[e.target] || 0) + 1;
    });

    const layers: string[][] = [];
    const assigned = new Set<string>();
    let queue = nodes.filter((n) => inDeg[n.id] === 0).map((n) => n.id);

    while (queue.length > 0) {
      layers.push([...queue]);
      queue.forEach((id) => assigned.add(id));
      const next: string[] = [];
      queue.forEach((id) => {
        edges
          .filter((e) => e.source === id)
          .forEach((e) => {
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
      set({
        nodes: prev.nodes,
        edges: prev.edges,
        historyIndex: historyIndex - 1,
      });
      get().refreshSimulationState();
    }
  },

  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      set({
        nodes: next.nodes,
        edges: next.edges,
        historyIndex: historyIndex + 1,
      });
      get().refreshSimulationState();
    }
  },

  saveHistory: () => {
    const { nodes, edges, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    });
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
      set((state) => ({
        nodes,
        edges,
        selectedNodeId: null,
        selectedEdgeId: null,
        simulation: normalizeSimulation(nodes, state.simulation),
      }));
      get().refreshSimulationState();
      get().saveHistory();
    } catch (e) {
      console.error("Invalid JSON import", e);
    }
  },

  clearCanvas: () => {
    set((state) => ({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      warnings: [],
      simulation: normalizeSimulation([], state.simulation),
    }));
    get().refreshSimulationState();
    get().saveHistory();
  },
}));
