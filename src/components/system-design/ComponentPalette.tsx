import { NODE_CATALOG, CATEGORY_COLORS, type NodeCategory, type SystemNodeType } from '@/types/system-design';
import {
  Server, Shield, Globe, Zap, Cloud,
  Database, HardDrive, Box, Cpu,
  Mail, Radio, Activity,
  Brain, Workflow, Cog, Binary,
  Wifi, ShieldCheck, Gauge,
  Monitor, Smartphone, CircuitBoard,
  Search, PanelLeftClose, PanelLeft,
  Webhook, Bot, GraduationCap, Layers, ArrowLeftRight,
  Laptop, FileText, BarChart3, GitBranch, Bell,
  ShieldAlert, Lock, UserCheck, KeyRound,
  Hammer, Clock3, Inbox, Radar, ChartNoAxesColumn, Bug, Key, Route,
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useState, useCallback } from 'react';
import NodeInfoContent from './NodeInfoContent';
import TemplateDialog from './TemplateDialog';

const ICON_MAP: Record<SystemNodeType, React.ElementType> = {
  'server': Server, 'api-gateway': Shield, 'load-balancer': Globe, 'cdn': Zap, 'serverless': Cloud,
  'job-worker': Hammer, 'scheduler': Clock3,
  'sql-db': Database, 'nosql-db': HardDrive, 'vector-db': Box, 'cache': Cpu, 'object-storage': HardDrive,
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

const NODE_CATALOG_MAP = new Map(NODE_CATALOG.map((n) => [n.type, n]));

const CATEGORY_LABELS: Record<NodeCategory, string> = {
  compute: 'Compute', storage: 'Storage', messaging: 'Messaging', 'ai-ml': 'AI / ML',
  networking: 'Networking', clients: 'Clients', observability: 'Observability', security: 'Security',
};

const CATEGORY_DESCRIPTIONS: Record<NodeCategory, string> = {
  compute: 'Processing & routing', storage: 'Data persistence', messaging: 'Async communication',
  'ai-ml': 'Intelligence layer', networking: 'Traffic control', clients: 'End-user devices',
  observability: 'Monitoring & alerts', security: 'Auth & protection',
};

const categories = Object.keys(CATEGORY_LABELS) as NodeCategory[];

// Track recently used
const RECENT_KEY = 'sd-recent-components';
const getRecent = (): SystemNodeType[] => {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').slice(0, 6); } catch { return []; }
};
const addRecent = (type: SystemNodeType) => {
  const recent = getRecent().filter((t) => t !== type);
  recent.unshift(type);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 6)));
};

interface Props {
  collapsed: boolean;
  mobile?: boolean;
  onToggle: () => void;
  onSelectComponent?: (type: SystemNodeType) => void;
}

export default function ComponentPalette({ collapsed, mobile = false, onToggle, onSelectComponent }: Props) {
  const [search, setSearch] = useState('');
  const [recent, setRecent] = useState<SystemNodeType[]>(getRecent);

  const onDragStart = useCallback((event: React.DragEvent, nodeType: SystemNodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
    addRecent(nodeType);
    setRecent(getRecent());
  }, []);

  const handleSelect = useCallback((nodeType: SystemNodeType) => {
    addRecent(nodeType);
    setRecent(getRecent());
    onSelectComponent?.(nodeType);
  }, [onSelectComponent]);

  const filteredCatalog = search
    ? NODE_CATALOG.filter((n) =>
        n.label.toLowerCase().includes(search.toLowerCase()) ||
        n.description.toLowerCase().includes(search.toLowerCase()) ||
        n.category.toLowerCase().includes(search.toLowerCase())
      )
    : NODE_CATALOG;

  if (collapsed) {
    return (
      <div className={mobile
        ? 'absolute left-3 top-3 z-30 flex flex-col items-center gap-1'
        : 'w-12 border-r border-border glass h-full flex flex-col items-center py-2 gap-1'}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={mobile ? 'h-10 w-10 rounded-xl border border-border bg-background/90 shadow-lg backdrop-blur mb-1' : 'h-8 w-8 mb-2'}
              onClick={onToggle}
            >
              <PanelLeft className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Expand component sidebar</TooltipContent>
        </Tooltip>
        {!mobile && categories.map((cat) => {
          const color = CATEGORY_COLORS[cat];
          const items = NODE_CATALOG.filter((n) => n.category === cat);
          return (
            <Tooltip key={cat}>
              <TooltipTrigger asChild>
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer hover:scale-110"
                  style={{ backgroundColor: `hsl(${color} / 0.12)` }}
                >
                  <span className="text-[9px] font-bold" style={{ color: `hsl(${color})` }}>
                    {items.length}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-xs font-medium">{CATEGORY_LABELS[cat]}</p>
                <p className="text-[10px] text-muted-foreground">{items.length} components</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    );
  }

  return (
    <div className={mobile
      ? 'absolute inset-y-0 left-0 z-30 w-[min(18rem,88vw)] border-r border-border glass h-full overflow-y-auto flex flex-col shadow-2xl'
      : 'w-60 border-r border-border glass h-full overflow-y-auto flex flex-col'}
    >
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground tracking-tight">Components</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {mobile ? 'Tap to add on canvas' : 'Drag & drop onto canvas'}
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggle}>
                <PanelLeftClose className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Collapse component sidebar</TooltipContent>
          </Tooltip>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search components..."
            className="h-7 text-xs pl-7 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="mt-3">
          <TemplateDialog trigger="sidebar" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {/* Recently used */}
        {!search && recent.length > 0 && (
          <div className="px-3 pt-2 pb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Recent</span>
            <div className="grid grid-cols-3 gap-1 mt-1.5">
              {recent.map((type) => {
                const item = NODE_CATALOG_MAP.get(type);
                if (!item) return null;
                const Icon = ICON_MAP[item.type];
                const color = CATEGORY_COLORS[item.category];
                const content = (
                  <div
                    draggable={!mobile}
                    onDragStart={(e) => onDragStart(e, item.type)}
                    onClick={() => mobile && handleSelect(item.type)}
                    className="flex flex-col items-center gap-1 p-1.5 rounded-md border border-border/50 bg-background cursor-grab active:cursor-grabbing hover:border-primary/40 hover:scale-[1.03]"
                    role={mobile ? 'button' : undefined}
                    tabIndex={mobile ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (!mobile) return;
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelect(item.type);
                      }
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: `hsl(${color})` }} />
                    <span className="text-[8px] text-muted-foreground truncate w-full text-center">{item.label}</span>
                  </div>
                );

                if (mobile) return <div key={type}>{content}</div>;

                return (
                  <HoverCard key={type} openDelay={120}>
                    <HoverCardTrigger asChild>{content}</HoverCardTrigger>
                    <HoverCardContent side="right" align="start" className="w-[min(18rem,calc(100vw-1rem))]">
                      <NodeInfoContent item={item} compact />
                    </HoverCardContent>
                  </HoverCard>
                );
              })}
            </div>
            <div className="border-b border-border mt-2" />
          </div>
        )}

        <Accordion type="multiple" defaultValue={categories} className="px-2">
          {categories.map((cat) => {
            const items = filteredCatalog.filter((n) => n.category === cat);
            if (items.length === 0) return null;
            const color = CATEGORY_COLORS[cat];
            return (
              <AccordionItem key={cat} value={cat} className="border-none">
                <AccordionTrigger className="text-xs font-semibold py-2 hover:no-underline">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: `hsl(${color})` }} />
                    <span className="flex flex-col items-start">
                      <span className="flex items-center gap-1.5">
                        {CATEGORY_LABELS[cat]}
                        <span className="text-[9px] font-normal text-muted-foreground bg-muted rounded px-1">{items.length}</span>
                      </span>
                      <span className="text-[9px] font-normal text-muted-foreground">{CATEGORY_DESCRIPTIONS[cat]}</span>
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-2">
                  <div className="grid grid-cols-2 gap-1.5">
                    {items.map((item) => {
                      const Icon = ICON_MAP[item.type];
                      const content = (
                        <div
                          draggable={!mobile}
                          onDragStart={(e) => onDragStart(e, item.type)}
                          onClick={() => mobile && handleSelect(item.type)}
                          className="group flex flex-col items-center gap-1.5 rounded-lg border border-border/50 bg-background p-2.5 text-center cursor-grab active:cursor-grabbing hover:border-primary/40 hover:shadow-sm hover:scale-[1.02]"
                          role={mobile ? 'button' : undefined}
                          tabIndex={mobile ? 0 : undefined}
                          onKeyDown={(e) => {
                            if (!mobile) return;
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleSelect(item.type);
                            }
                          }}
                        >
                          <div className="p-1.5 rounded-md" style={{ backgroundColor: `hsl(${color} / 0.1)` }}>
                            <Icon className="w-4 h-4 group-hover:scale-110" style={{ color: `hsl(${color})` }} />
                          </div>
                          <span className="text-[10px] font-medium text-foreground/80 leading-tight">{item.label}</span>
                        </div>
                      );

                      if (mobile) return <div key={item.type}>{content}</div>;

                      return (
                        <HoverCard key={item.type} openDelay={120}>
                          <HoverCardTrigger asChild>{content}</HoverCardTrigger>
                          <HoverCardContent side="right" align="start" className="w-[min(18rem,calc(100vw-1rem))]">
                            <NodeInfoContent item={item} compact />
                          </HoverCardContent>
                        </HoverCard>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}
