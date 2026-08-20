import { useShallow } from 'zustand/react/shallow';
import { useDesignStore } from '@/store/useDesignStore';
import { getNodeCatalogItem, PROTOCOL_KNOWLEDGE } from '@/types/system-design';
import type { EdgeConfig, ConnectionProtocol } from '@/types/system-design';
import type { SystemNodeData } from '@/store/useDesignStore';
import { CATEGORY_COLORS } from '@/types/system-design';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Trash2, Copy, Settings2, Network, Info } from 'lucide-react';
import ProtocolInfoPopover from './ProtocolInfoPopover';
import NodeInfoContent from './NodeInfoContent';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import ProtocolBadge from './ProtocolBadge';
import ProtocolInfoContent from './ProtocolInfoContent';

const REGIONS = ['us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 'ap-southeast-1', 'ap-northeast-1'];
const PROTOCOLS: ConnectionProtocol[] = ['HTTP', 'gRPC', 'WebSocket', 'TCP', 'Pub/Sub', 'GraphQL', 'MQTT', 'AMQP'];
const getNodeLabel = (data: unknown) => (data as SystemNodeData | undefined)?.label ?? 'Unknown';

interface NodeConfigPanelProps {
  mobile?: boolean;
}

export default function NodeConfigPanel({ mobile = false }: NodeConfigPanelProps) {
  const { nodes, edges, selectedNodeId, selectedEdgeId, selectNode, selectEdge, updateNodeConfig, updateEdgeConfig, deleteSelected, duplicateNode } = useDesignStore(
    useShallow((state) => ({
      nodes: state.nodes,
      edges: state.edges,
      selectedNodeId: state.selectedNodeId,
      selectedEdgeId: state.selectedEdgeId,
      selectNode: state.selectNode,
      selectEdge: state.selectEdge,
      updateNodeConfig: state.updateNodeConfig,
      updateEdgeConfig: state.updateEdgeConfig,
      deleteSelected: state.deleteSelected,
      duplicateNode: state.duplicateNode,
    }))
  );

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  if (!selectedNode && !selectedEdge) return null;

  if (selectedEdge) {
    const d = (selectedEdge.data || {}) as unknown as EdgeConfig;
    const selectedProtocol = d.protocol || 'HTTP';
    return (
      <div className={mobile
        ? 'absolute inset-y-0 right-0 z-30 w-[min(22rem,92vw)] border-l border-border glass h-full overflow-y-auto animate-slide-in-right shadow-2xl'
        : 'w-72 border-l border-border glass h-full overflow-y-auto animate-slide-in-right'}
      >
        <div className="p-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Connection</h3>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={deleteSelected}><Trash2 className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => selectEdge(null)}><X className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
        <div className="p-3 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Protocol</Label>
              <ProtocolInfoPopover protocol={selectedProtocol} />
            </div>
            <Select value={selectedProtocol} onValueChange={(v) => updateEdgeConfig(selectedEdge.id, { protocol: v as ConnectionProtocol })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROTOCOLS.map((p) => (
                  <SelectItem key={p} value={p}>
                    <div className="flex items-center gap-2">
                      <ProtocolBadge protocol={p} compact />
                      <span className="text-[10px] text-muted-foreground">{PROTOCOL_KNOWLEDGE[p].mode}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg border border-border/70 bg-card/60 p-3">
            <ProtocolInfoContent protocol={selectedProtocol} compact />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Label</Label>
            <Input className="h-8 text-xs" placeholder="e.g. auth check" value={d.label ?? ''} onChange={(e) => updateEdgeConfig(selectedEdge.id, { label: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Latency (ms)</Label>
            <Input type="number" className="h-8 text-xs" value={d.latency ?? 5} onChange={(e) => updateEdgeConfig(selectedEdge.id, { latency: +e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Bandwidth (MB/s)</Label>
            <Input type="number" className="h-8 text-xs" value={d.bandwidth ?? 100} onChange={(e) => updateEdgeConfig(selectedEdge.id, { bandwidth: +e.target.value })} />
          </div>
        </div>
      </div>
    );
  }

  const d = selectedNode!.data as unknown as SystemNodeData;
  const isStorage = d.category === 'storage';
  const isMessaging = d.category === 'messaging';
  const isAI = d.category === 'ai-ml';
  const color = CATEGORY_COLORS[d.category] || '221 83% 53%';
  const catalogItem = getNodeCatalogItem(d.nodeType);

  const handleDuplicate = () => {
    if (selectedNodeId) duplicateNode(selectedNodeId);
  };

  const incomingEdges = edges.filter((e) => e.target === selectedNodeId);
  const outgoingEdges = edges.filter((e) => e.source === selectedNodeId);

  return (
    <div className={mobile
      ? 'absolute inset-y-0 right-0 z-30 w-[min(22rem,92vw)] border-l border-border glass h-full flex flex-col animate-slide-in-right shadow-2xl'
      : 'w-72 border-l border-border glass h-full flex flex-col animate-slide-in-right'}
    >
      <div className="p-3 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded" style={{ backgroundColor: `hsl(${color} / 0.15)` }}>
            <Settings2 className="w-3.5 h-3.5" style={{ color: `hsl(${color})` }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">{d.label}</h3>
            <div className="mt-0.5 flex items-center gap-1.5">
              <Badge variant="secondary" className="text-[9px] h-4 px-1" style={{ color: `hsl(${color})` }}>
                {d.nodeType}
              </Badge>
              {catalogItem && (
                <HoverCard openDelay={120}>
                  <HoverCardTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      aria-label={`Show details for ${catalogItem.label}`}
                    >
                      <Info className="h-3 w-3" />
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent side="bottom" align="start" className="w-72">
                    <NodeInfoContent item={catalogItem} compact />
                  </HoverCardContent>
                </HoverCard>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDuplicate} title="Duplicate"><Copy className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={deleteSelected}><Trash2 className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => selectNode(null)}><X className="w-3.5 h-3.5" /></Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Label</Label>
            <Input className="h-8 text-xs" value={d.label} onChange={(e) => updateNodeConfig(selectedNodeId!, { label: e.target.value })} />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Replicas</Label>
              <Input type="number" min={1} className="h-8 text-xs" value={d.replicas} onChange={(e) => updateNodeConfig(selectedNodeId!, { replicas: +e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Region</Label>
              <Select value={d.region} onValueChange={(v) => updateNodeConfig(selectedNodeId!, { region: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">CPU (cores)</Label>
              <Input type="number" min={1} className="h-8 text-xs" value={d.cpu} onChange={(e) => updateNodeConfig(selectedNodeId!, { cpu: +e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Memory (GB)</Label>
              <Input type="number" min={1} className="h-8 text-xs" value={d.memory} onChange={(e) => updateNodeConfig(selectedNodeId!, { memory: +e.target.value })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Replica Cost ($/hr)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              className="h-8 text-xs"
              value={d.hourlyCost ?? 0}
              onChange={(e) => updateNodeConfig(selectedNodeId!, { hourlyCost: +e.target.value || 0 })}
            />
          </div>

          <Separator />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Throughput Limit</Label>
              <Badge variant="outline" className="text-[10px] h-5 font-mono">{d.throughputLimit} req/s</Badge>
            </div>
            <Slider value={[d.throughputLimit]} min={10} max={10000} step={10} onValueChange={([v]) => updateNodeConfig(selectedNodeId!, { throughputLimit: v })} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Latency (ms)</Label>
            <Input type="number" min={0} className="h-8 text-xs" value={d.latency} onChange={(e) => updateNodeConfig(selectedNodeId!, { latency: +e.target.value })} />
          </div>

          {isStorage && (
            <>
              <Separator />
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Storage Size (GB)</Label>
                <Input type="number" min={1} className="h-8 text-xs" value={d.storageSize ?? 100} onChange={(e) => updateNodeConfig(selectedNodeId!, { storageSize: +e.target.value })} />
              </div>
            </>
          )}

          {isMessaging && (
            <>
              <Separator />
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Max Queue Depth</Label>
                <Input type="number" min={1} className="h-8 text-xs" value={d.maxQueueDepth ?? 10000} onChange={(e) => updateNodeConfig(selectedNodeId!, { maxQueueDepth: +e.target.value })} />
              </div>
            </>
          )}

          {isAI && (
            <>
              <Separator />
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Model Name</Label>
                <Input className="h-8 text-xs" value={d.modelName ?? ''} placeholder="e.g. gpt-4" onChange={(e) => updateNodeConfig(selectedNodeId!, { modelName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Context Window</Label>
                <Input type="number" className="h-8 text-xs" value={d.contextWindow ?? 4096} onChange={(e) => updateNodeConfig(selectedNodeId!, { contextWindow: +e.target.value })} />
              </div>
            </>
          )}

          {(incomingEdges.length > 0 || outgoingEdges.length > 0) && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs font-medium">Connections</Label>
                {incomingEdges.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground">← Incoming ({incomingEdges.length})</span>
                    {incomingEdges.map((e) => {
                      const sourceNode = nodes.find((n) => n.id === e.source);
                      const ed = (e.data || {}) as unknown as EdgeConfig;
                      return (
                        <div key={e.id} className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-accent/50 rounded px-2 py-1">
                          <span className="font-medium text-foreground">{getNodeLabel(sourceNode?.data)}</span>
                          <span>via</span>
                          <ProtocolBadge protocol={ed.protocol || 'HTTP'} compact />
                        </div>
                      );
                    })}
                  </div>
                )}
                {outgoingEdges.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground">→ Outgoing ({outgoingEdges.length})</span>
                    {outgoingEdges.map((e) => {
                      const targetNode = nodes.find((n) => n.id === e.target);
                      const ed = (e.data || {}) as unknown as EdgeConfig;
                      return (
                        <div key={e.id} className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-accent/50 rounded px-2 py-1">
                          <span className="font-medium text-foreground">{getNodeLabel(targetNode?.data)}</span>
                          <span>via</span>
                          <ProtocolBadge protocol={ed.protocol || 'HTTP'} compact />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          <Separator />

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Notes</Label>
            <Textarea className="text-xs min-h-[60px] resize-none" placeholder="Add notes..." value={d.notes} onChange={(e) => updateNodeConfig(selectedNodeId!, { notes: e.target.value })} />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
