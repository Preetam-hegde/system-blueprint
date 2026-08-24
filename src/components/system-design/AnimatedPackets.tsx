import { useDesignStore } from '@/store/useDesignStore';
import { useShallow } from 'zustand/react/shallow';
import { useReactFlow } from '@xyflow/react';
import { useEffect, useState, useCallback, useRef } from 'react';
import type { SystemNodeData } from '@/store/useDesignStore';
import { CATEGORY_COLORS, PROTOCOL_KNOWLEDGE, type ConnectionProtocol, type EdgeConfig } from '@/types/system-design';

interface Packet {
  id: string;
  edgeId: string;
  color: string;
  speedScale: number;
  progress: number;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  trail: number[]; // previous progress values for trail effect
}

export default function AnimatedPackets() {
  const { edges, nodes, simulationRunning, simulationFailedNodeIds, simulationSpeed, simulationRps, simulationMode, simulationScenario } = useDesignStore(useShallow((state) => ({
    edges: state.edges,
    nodes: state.nodes,
    simulationRunning: state.simulation.running,
    simulationFailedNodeIds: state.simulation.failedNodeIds,
    simulationSpeed: state.simulation.speed,
    simulationRps: state.simulation.rps,
    simulationMode: state.simulation.mode,
    simulationScenario: state.simulation.scenario,
  })));

  const simulation = {
    running: simulationRunning,
    failedNodeIds: simulationFailedNodeIds,
    speed: simulationSpeed,
    rps: simulationRps,
    mode: simulationMode,
    scenario: simulationScenario,
  };
  const [packets, setPackets] = useState<Packet[]>([]);
  const reactFlow = useReactFlow();
  const viewportRef = useRef({ x: 0, y: 0, zoom: 1 });

  // Keep viewport in sync
  useEffect(() => {
    const update = () => {
      viewportRef.current = reactFlow.getViewport();
    };
    update();
    const interval = setInterval(update, 50);
    return () => clearInterval(interval);
  }, [reactFlow]);

  const getNodeCenter = useCallback((nodeId: string) => {
    try {
      const node = reactFlow.getNode(nodeId);
      if (!node) return null;
      const w = node.measured?.width ?? 140;
      const h = node.measured?.height ?? 60;
      return {
        x: node.position.x + w / 2,
        y: node.position.y + h / 2,
      };
    } catch {
      return null;
    }
  }, [reactFlow]);

  // Spawn packets
  useEffect(() => {
    if (!simulation.running || edges.length === 0) {
      setPackets([]);
      return;
    }

    const failed = new Set(simulation.failedNodeIds);
    const activeEdges = edges.filter((e) => !failed.has(e.source) && !failed.has(e.target));
    if (activeEdges.length === 0) {
      setPackets([]);
      return;
    }

    const interval = setInterval(() => {
      const randomEdge = activeEdges[Math.floor(Math.random() * activeEdges.length)];
      const sourcePos = getNodeCenter(randomEdge.source);
      const targetPos = getNodeCenter(randomEdge.target);
      if (!sourcePos || !targetPos) return;

      // Color by protocol
      const edgeData = (randomEdge.data || {}) as unknown as EdgeConfig;
      const protocol = edgeData.protocol || 'HTTP';
      const protocolInfo = PROTOCOL_KNOWLEDGE[protocol as ConnectionProtocol];
      const color = protocolInfo?.color || '221 83% 53%';
      const sourceNode = nodes.find((node) => node.id === randomEdge.source);
      const targetNode = nodes.find((node) => node.id === randomEdge.target);
      const sourceData = sourceNode?.data as SystemNodeData | undefined;
      const targetData = targetNode?.data as SystemNodeData | undefined;
      const touchesLatencyRegion = simulation.scenario.type === 'regional-latency'
        && simulation.scenario.region
        && (sourceData?.region === simulation.scenario.region || targetData?.region === simulation.scenario.region);
      const touchesBacklog = simulation.scenario.type === 'queue-backlog'
        && Boolean(simulation.scenario.queueNodeIds?.includes(randomEdge.source) || simulation.scenario.queueNodeIds?.includes(randomEdge.target));
      const regionalSpeedScale = touchesLatencyRegion
        ? Math.max(0.35, 1 - (simulation.scenario.latencyMs ?? 150) / 500)
        : 1;
      const backlogSpeedScale = touchesBacklog
        ? Math.max(0.4, 1 - (simulation.scenario.backlogSeverity ?? 65) / 120)
        : 1;

      setPackets((prev) => [
        ...prev.slice(-40),
        {
          id: `pkt-${Date.now()}-${Math.random()}`,
          edgeId: randomEdge.id,
          color,
          speedScale: regionalSpeedScale * backlogSpeedScale,
          progress: 0,
          sourceX: sourcePos.x,
          sourceY: sourcePos.y,
          targetX: targetPos.x,
          targetY: targetPos.y,
          trail: [],
        },
      ]);
    }, Math.max(60, 600 / simulation.speed / Math.max(simulation.rps / 50, 1)));

    return () => clearInterval(interval);
  }, [simulation.running, simulation.speed, simulation.rps, simulation.failedNodeIds, simulation.scenario, edges, nodes, getNodeCenter]);

  // Animate packets
  useEffect(() => {
    if (!simulation.running) return;

    const frame = () => {
      setPackets((prev) =>
        prev
          .map((p) => ({
            ...p,
            trail: [...p.trail.slice(-4), p.progress],
            progress: p.progress + 0.018 * simulation.speed * p.speedScale * (simulation.mode === 'replay' ? 0.75 : 1),
          }))
          .filter((p) => p.progress <= 1)
      );
      rafRef = requestAnimationFrame(frame);
    };
    let rafRef = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef);
  }, [simulation.running, simulation.speed, simulation.mode]);

  if (!simulation.running || packets.length === 0) return null;

  const vp = viewportRef.current;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      <g transform={`translate(${vp.x}, ${vp.y}) scale(${vp.zoom})`}>
        {packets.map((pkt) => {
          const x = pkt.sourceX + (pkt.targetX - pkt.sourceX) * pkt.progress;
          const y = pkt.sourceY + (pkt.targetY - pkt.sourceY) * pkt.progress;
          const opacity = pkt.progress < 0.1 ? pkt.progress * 10 : pkt.progress > 0.9 ? (1 - pkt.progress) * 10 : 1;

          return (
            <g key={pkt.id}>
              {/* Trail */}
              {pkt.trail.map((tp, i) => {
                const tx = pkt.sourceX + (pkt.targetX - pkt.sourceX) * tp;
                const ty = pkt.sourceY + (pkt.targetY - pkt.sourceY) * tp;
                return (
                  <circle
                    key={i}
                    cx={tx}
                    cy={ty}
                    r={2}
                    fill={`hsl(${pkt.color})`}
                    opacity={((i + 1) / pkt.trail.length) * 0.15}
                  />
                );
              })}
              {/* Glow */}
              <circle cx={x} cy={y} r={8} fill={`hsl(${pkt.color})`} opacity={opacity * 0.15} />
              {/* Core */}
              <circle cx={x} cy={y} r={3.5} fill={`hsl(${pkt.color})`} opacity={opacity * 0.9} />
            </g>
          );
        })}
      </g>
    </svg>
  );
}
