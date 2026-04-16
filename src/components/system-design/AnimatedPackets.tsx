import { useDesignStore } from '@/store/useDesignStore';
import { useReactFlow } from '@xyflow/react';
import { useEffect, useState, useCallback, useRef } from 'react';
import type { SystemNodeData } from '@/store/useDesignStore';
import { CATEGORY_COLORS, PROTOCOL_KNOWLEDGE, type ConnectionProtocol, type EdgeConfig } from '@/types/system-design';

interface Packet {
  id: string;
  edgeId: string;
  color: string;
  progress: number;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  trail: number[]; // previous progress values for trail effect
}

export default function AnimatedPackets() {
  const { edges, nodes, simulation } = useDesignStore();
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

    const interval = setInterval(() => {
      const randomEdge = edges[Math.floor(Math.random() * edges.length)];
      const sourcePos = getNodeCenter(randomEdge.source);
      const targetPos = getNodeCenter(randomEdge.target);
      if (!sourcePos || !targetPos) return;

      // Color by protocol
      const edgeData = (randomEdge.data || {}) as unknown as EdgeConfig;
      const protocol = edgeData.protocol || 'HTTP';
      const protocolInfo = PROTOCOL_KNOWLEDGE[protocol as ConnectionProtocol];
      const color = protocolInfo?.color || '221 83% 53%';

      setPackets((prev) => [
        ...prev.slice(-40),
        {
          id: `pkt-${Date.now()}-${Math.random()}`,
          edgeId: randomEdge.id,
          color,
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
  }, [simulation.running, simulation.speed, simulation.rps, edges, nodes, getNodeCenter]);

  // Animate packets
  useEffect(() => {
    if (!simulation.running) return;

    const frame = () => {
      setPackets((prev) =>
        prev
          .map((p) => ({
            ...p,
            trail: [...p.trail.slice(-4), p.progress],
            progress: p.progress + 0.018 * simulation.speed,
          }))
          .filter((p) => p.progress <= 1)
      );
      rafRef = requestAnimationFrame(frame);
    };
    let rafRef = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef);
  }, [simulation.running, simulation.speed]);

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
