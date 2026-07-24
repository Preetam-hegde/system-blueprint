import { memo } from 'react';
import { Handle, Position, type NodeProps, useEdges } from '@xyflow/react';
import { useDesignStore, type SystemNodeData } from '@/store/useDesignStore';
import { useShallow } from 'zustand/react/shallow';
import { CATEGORY_COLORS } from '@/types/system-design';
import {
  Server, Shield, Globe, Zap, Cloud,
  Database, HardDrive, Box, Cpu,
  Mail, Radio, Activity,
  Brain, Workflow, Cog, Binary,
  Wifi, ShieldCheck, Gauge,
  Monitor, Smartphone, CircuitBoard,
  Webhook, Bot, GraduationCap, Layers, ArrowLeftRight,
  Laptop, FileText, BarChart3, GitBranch, Bell,
  ShieldAlert, Lock, UserCheck, KeyRound,
  Hammer, Clock3, Inbox, Radar, ChartNoAxesColumn, Bug, Key, Route,
} from 'lucide-react';
import type { SystemNodeType } from '@/types/system-design';

const ICON_MAP: Record<SystemNodeType, React.ElementType> = {
  'server': Server, 'api-gateway': Shield, 'load-balancer': Globe,
  'cdn': Zap, 'serverless': Cloud, 'job-worker': Hammer, 'scheduler': Clock3,
  'sql-db': Database, 'nosql-db': HardDrive, 'vector-db': Box,
  'cache': Cpu, 'object-storage': HardDrive,
  'data-lake': Layers, 'graph-db': GitBranch, 'time-series-db': ChartNoAxesColumn,
  'message-queue': Mail, 'event-bus': Radio, 'stream-processor': Activity, 'webhook': Webhook, 'dead-letter-queue': Inbox,
  'llm': Brain, 'rag-pipeline': Workflow, 'ml-model': Cog, 'embedding-service': Binary,
  'ai-agent': Bot, 'fine-tuning': GraduationCap, 'model-router': Route,
  'dns': Wifi, 'firewall': ShieldCheck, 'rate-limiter': Gauge, 'service-discovery': Radar,
  'service-mesh': ArrowLeftRight, 'reverse-proxy': Globe,
  'web-client': Monitor, 'mobile-client': Smartphone, 'iot-device': CircuitBoard, 'desktop-client': Laptop,
  'log-aggregator': FileText, 'metrics-server': BarChart3, 'tracing': GitBranch, 'alerting': Bell, 'error-tracker': Bug,
  'waf': ShieldAlert, 'vault': Lock, 'identity-provider': UserCheck, 'oauth-server': KeyRound, 'kms': Key,
};

function SystemNodeComponent({ data, selected, id }: NodeProps) {
  const d = data as unknown as SystemNodeData;
  const Icon = ICON_MAP[d.nodeType] || Server;
  const color = CATEGORY_COLORS[d.category] || '221 83% 53%';
  const { mode, replayTrace } = useDesignStore(useShallow((state) => ({ mode: state.simulation.mode, replayTrace: state.simulation.replayTrace })));
  const loadPct = d.throughputLimit > 0 ? (d.currentLoad / d.throughputLimit) * 100 : 0;
  const isFailed = Boolean(d.isFailed);
  const isReplayMode = mode === 'replay';
  const isReplayCurrent = isReplayMode && replayTrace.currentNodeId === id;
  const isReplayPath = isReplayMode && replayTrace.pathNodeIds.includes(id);
  const isReplayBottleneck = isReplayMode && replayTrace.bottleneckNodeIds.includes(id);

  const isOverloaded = d.isBottleneck;
  const isWarning = d.isSpof;

  // Connection count
  const edges = useEdges();
  const connCount = edges.filter((e) => e.source === id || e.target === id).length;

  // Status
  const status = isFailed
    ? 'failed'
    : isReplayCurrent
      ? 'replay'
      : isOverloaded
        ? 'overloaded'
        : isWarning
          ? 'warning'
          : loadPct > 60
            ? 'busy'
            : 'healthy';
  const statusColor = status === 'failed'
    ? '0 84% 60%'
    : status === 'replay'
      ? '221 83% 53%'
    : status === 'overloaded'
      ? '0 84% 60%'
      : status === 'warning'
        ? '38 92% 50%'
        : status === 'busy'
          ? '38 92% 50%'
          : '142 71% 45%';

  const borderColor = isFailed
    ? 'hsl(0 84% 60%)'
    : isReplayCurrent
      ? 'hsl(var(--primary))'
    : isOverloaded
      ? 'hsl(0 84% 60%)'
      : isReplayPath
        ? `hsl(${color})`
        : isWarning
          ? 'hsl(38 92% 50%)'
          : selected
            ? `hsl(${color})`
            : 'hsl(var(--border))';

  const shadowStyle = isFailed
    ? '0 0 20px hsl(0 84% 60% / 0.5), 0 0 40px hsl(0 84% 60% / 0.15)'
    : isReplayCurrent
      ? '0 0 22px hsl(var(--primary) / 0.35), 0 0 48px hsl(var(--primary) / 0.12)'
    : isOverloaded
      ? '0 0 20px hsl(0 84% 60% / 0.4), 0 0 40px hsl(0 84% 60% / 0.1)'
      : isReplayPath
        ? `0 0 18px hsl(${color} / 0.22)`
        : isWarning
          ? '0 0 16px hsl(38 92% 50% / 0.3)'
          : selected
            ? `0 0 16px hsl(${color} / 0.25)`
            : '0 2px 8px hsl(var(--foreground) / 0.04)';

  const handleStyle = {
    background: `hsl(${color})`,
    borderColor: 'hsl(var(--card))',
  };

  return (
    <div
      className="relative rounded-xl border-2 bg-card px-4 py-3 min-w-[155px] hover:-translate-y-0.5 hover:shadow-lg"
      style={{ borderColor, boxShadow: shadowStyle }}
    >
      {isFailed && <div className="absolute inset-0 rounded-xl bg-destructive/10 pointer-events-none" />}
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !border-2 !-top-1.5" style={handleStyle} />
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !border-2 !-left-1.5" style={handleStyle} />

      <div className="absolute top-2 right-2 flex items-center gap-1">
        {isReplayCurrent && (
          <span className="rounded bg-primary/10 px-1 py-0.5 text-[8px] font-black tracking-[0.18em] text-primary">
            NOW
          </span>
        )}
        {!isReplayCurrent && isReplayPath && (
          <span className="rounded bg-primary/10 px-1 py-0.5 text-[8px] font-bold text-primary/80">
            PATH
          </span>
        )}
        {connCount > 0 && (
          <span className="text-[8px] font-mono text-muted-foreground bg-muted rounded px-1">
            {connCount}
          </span>
        )}
        <div
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: `hsl(${statusColor})`,
            boxShadow: status !== 'healthy' ? `0 0 6px hsl(${statusColor} / 0.5)` : 'none',
          }}
        />
      </div>

      <div className="flex items-center gap-2.5 mb-1 pr-8">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `hsl(${color} / 0.12)` }}>
          <Icon className="w-4.5 h-4.5" style={{ color: `hsl(${color})` }} />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-foreground leading-tight truncate">{d.label}</span>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[9px] text-muted-foreground font-medium">{d.replicas}x</span>
            <span className="text-[9px] text-muted-foreground opacity-40">·</span>
            <span className="text-[9px] text-muted-foreground">{d.region}</span>
          </div>
        </div>
      </div>

      {d.currentLoad > 0 && (
        <div className="mt-2">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(loadPct, 100)}%`,
                background: loadPct > 90
                  ? 'linear-gradient(90deg, hsl(38 92% 50%), hsl(0 84% 60%))'
                  : loadPct > 60
                    ? 'linear-gradient(90deg, hsl(142 71% 45%), hsl(38 92% 50%))'
                    : `hsl(${color})`,
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[9px] text-muted-foreground font-mono">
              {Math.round(d.currentLoad)}/{d.throughputLimit}
            </span>
            <span className={`text-[9px] font-bold ${loadPct > 90 ? 'text-destructive' : loadPct > 60 ? 'text-amber-500' : 'text-muted-foreground'}`}>
              {Math.round(loadPct)}%
            </span>
          </div>
        </div>
      )}

      {(isOverloaded || isWarning) && (
        <div className="absolute -top-1.5 -right-1.5">
          <div
            className="w-3 h-3 rounded-full animate-pulse"
            style={{
              backgroundColor: isOverloaded ? 'hsl(0 84% 60%)' : 'hsl(38 92% 50%)',
              boxShadow: `0 0 8px ${isOverloaded ? 'hsl(0 84% 60% / 0.6)' : 'hsl(38 92% 50% / 0.6)'}`,
            }}
          />
        </div>
      )}

      {isReplayBottleneck && !isFailed && (
        <div className="mt-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">
          Replay bottleneck
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !border-2 !-bottom-1.5" style={handleStyle} />
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !border-2 !-right-1.5" style={handleStyle} />
    </div>
  );
}

export default memo(SystemNodeComponent);
