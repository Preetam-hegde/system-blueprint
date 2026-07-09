import { beforeEach, describe, expect, it } from "vitest";
import type { Edge, Node } from "@xyflow/react";
import { useDesignStore } from "@/store/useDesignStore";

const makeNode = (
  id: string,
  label: string,
  region: string,
  category: "clients" | "compute" | "messaging" = "compute",
  throughputLimit = 100,
): Node => ({
  id,
  type: "systemNode",
  position: { x: 0, y: 0 },
  data: {
    label,
    nodeType:
      category === "messaging"
        ? "message-queue"
        : category === "clients"
          ? "web-client"
          : "server",
    category,
    region,
    replicas: 1,
    cpu: 2,
    memory: 4,
    throughputLimit,
    latency: 40,
    notes: "",
    currentLoad: 0,
    isBottleneck: false,
    isSpof: false,
    isFailed: false,
  },
});

const makeEdge = (
  id: string,
  source: string,
  target: string,
  latency = 25,
): Edge => ({
  id,
  type: "systemEdge",
  source,
  target,
  data: {
    protocol: "HTTP",
    latency,
    bandwidth: 100,
    label: "",
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
      mode: "live",
      step: 0,
      maxSteps: 20,
      packetLossPct: 0,
      extraLatencyMs: 0,
      retryAttempts: 2,
      retryBackoffMs: 80,
      manualFailedNodeIds: [],
      failedNodeIds: [],
      scenario: { type: "none" },
      replayTrace: {
        pathNodeIds: [],
        pathEdgeIds: [],
        currentNodeId: null,
        currentEdgeId: null,
        accumulatedLatencyMs: 0,
        totalLatencyMs: 0,
        estimatedRetries: 0,
        bottleneckNodeIds: [],
        completedPct: 0,
      },
    },
  });
});

describe("simulation scenarios", () => {
  it("marks all nodes in an outage region as failed", () => {
    useDesignStore.setState({
      nodes: [
        makeNode("a", "API", "us-east-1"),
        makeNode("b", "Worker", "us-west-2"),
      ],
    });

    const store = useDesignStore.getState();
    store.setSimulation({
      scenario: { type: "zone-outage", region: "us-east-1" },
    });
    store.refreshSimulationState();

    const state = useDesignStore.getState();
    expect(state.simulation.failedNodeIds).toEqual(["a"]);
    expect(
      state.warnings.some(
        (warning) => warning.type === "failure" && warning.nodeId === "a",
      ),
    ).toBe(true);
  });

  it("emits a regional latency warning for the affected path", () => {
    useDesignStore.setState({
      nodes: [
        makeNode("client", "Client", "us-west-2", "clients", 500),
        makeNode("api", "API", "us-east-1", "compute", 200),
      ],
      edges: [makeEdge("e1", "client", "api", 30)],
    });

    const store = useDesignStore.getState();
    store.setSimulation({
      scenario: {
        type: "regional-latency",
        region: "us-east-1",
        latencyMs: 220,
      },
    });
    store.refreshSimulationState();

    const state = useDesignStore.getState();
    expect(
      state.warnings.some(
        (warning) =>
          warning.type === "latency" && warning.message.includes("us-east-1"),
      ),
    ).toBe(true);
  });

  it("adds a backlog warning for the targeted messaging node", () => {
    useDesignStore.setState({
      nodes: [
        makeNode("client", "Client", "us-east-1", "clients", 500),
        makeNode("queue", "Orders Queue", "us-east-1", "messaging", 80),
      ],
      edges: [makeEdge("e1", "client", "queue", 10)],
    });

    const store = useDesignStore.getState();
    store.setSimulation({
      scenario: {
        type: "queue-backlog",
        queueNodeIds: ["queue"],
        backlogSeverity: 70,
      },
    });
    store.refreshSimulationState();

    const state = useDesignStore.getState();
    expect(
      state.warnings.some(
        (warning) => warning.type === "backlog" && warning.nodeId === "queue",
      ),
    ).toBe(true);
  });
});
