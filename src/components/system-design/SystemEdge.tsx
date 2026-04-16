import { memo, useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import type { EdgeConfig } from '@/types/system-design';
import { PROTOCOL_KNOWLEDGE } from '@/types/system-design';

function SystemEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const d = (data || {}) as unknown as EdgeConfig;
  const [hovered, setHovered] = useState(false);
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  });

  const protocol = d.protocol || 'HTTP';
  const info = PROTOCOL_KNOWLEDGE[protocol];
  const color = info?.color ? `hsl(${info.color})` : 'hsl(var(--muted-foreground))';

  const isAsync = protocol === 'Pub/Sub' || protocol === 'AMQP';
  const isStream = protocol === 'WebSocket' || protocol === 'MQTT';
  const dashArray = isAsync ? '8,5' : isStream ? '3,4' : undefined;

  const active = selected || hovered;

  return (
    <>
      {/* Invisible wider hit area */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: active ? 'hsl(var(--primary))' : color,
          strokeWidth: active ? 2.5 : 1.5,
          strokeDasharray: dashArray,
          opacity: active ? 1 : 0.6,
        }}
        className={(isAsync || isStream) ? 'edge-animated-dash' : ''}
      />
      {/* Animated flow dot */}
      <circle r={active ? 4 : 3} fill={color} opacity={active ? 0.8 : 0.5}>
        <animateMotion dur={`${Math.max(1, 3 - (d.latency || 5) / 10)}s`} repeatCount="indefinite" path={edgePath} />
      </circle>
      <EdgeLabelRenderer>
        <div
          className={`absolute text-[10px] border rounded-md px-1.5 py-0.5 pointer-events-none font-medium shadow-sm ${
            active
              ? 'bg-card border-primary/30 text-foreground'
              : 'bg-card/80 backdrop-blur-sm border-border text-muted-foreground'
          }`}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: color }} />
            <span style={{ color: active ? color : undefined }}>{protocol}</span>
          </span>
          {d.label && (
            <>
              <span className="mx-0.5 opacity-40">·</span>
              <span className="text-foreground/70">{d.label}</span>
            </>
          )}
          <span className="mx-0.5 opacity-40">·</span>
          <span className="font-mono">{d.latency || 0}ms</span>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(SystemEdgeComponent);
