import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LayoutTemplate, Globe, Brain, Radio, ShoppingCart, MessageSquare } from 'lucide-react';
import { useDesignStore } from '@/store/useDesignStore';
import { useState } from 'react';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  build: () => { nodes: any[]; edges: any[] };
}

function makeNode(id: string, type: string, label: string, category: string, x: number, y: number, overrides?: Record<string, any>) {
  return {
    id,
    type: 'systemNode',
    position: { x, y },
    data: {
      label,
      nodeType: type,
      category,
      replicas: 1,
      region: 'us-east-1',
      cpu: 2,
      memory: 4,
      throughputLimit: 1000,
      latency: 10,
      notes: '',
      currentLoad: 0,
      isBottleneck: false,
      isSpof: false,
      ...overrides,
    },
  };
}

function makeEdge(id: string, source: string, target: string, protocol = 'HTTP', latency = 5) {
  return {
    id,
    type: 'systemEdge',
    source,
    target,
    data: { protocol, latency, bandwidth: 100, label: '' },
  };
}

const TEMPLATES: Template[] = [
  {
    id: 'microservices',
    name: 'Microservices',
    description: 'Load balancer → API Gateway → multiple services with DB and cache',
    icon: Globe,
    color: '221 83% 53%',
    build: () => ({
      nodes: [
        makeNode('t-web', 'web-client', 'Web Client', 'clients', 400, 0),
        makeNode('t-lb', 'load-balancer', 'Load Balancer', 'compute', 400, 120, { replicas: 2 }),
        makeNode('t-gw', 'api-gateway', 'API Gateway', 'compute', 400, 250, { replicas: 2 }),
        makeNode('t-svc1', 'server', 'User Service', 'compute', 150, 400, { replicas: 3 }),
        makeNode('t-svc2', 'server', 'Order Service', 'compute', 400, 400, { replicas: 3 }),
        makeNode('t-svc3', 'server', 'Product Service', 'compute', 650, 400, { replicas: 2 }),
        makeNode('t-cache', 'cache', 'Redis Cache', 'storage', 150, 560, { replicas: 2 }),
        makeNode('t-db1', 'sql-db', 'Users DB', 'storage', 400, 560, { replicas: 2 }),
        makeNode('t-db2', 'nosql-db', 'Products DB', 'storage', 650, 560, { replicas: 2 }),
      ],
      edges: [
        makeEdge('te-1', 't-web', 't-lb', 'HTTP', 2),
        makeEdge('te-2', 't-lb', 't-gw', 'HTTP', 1),
        makeEdge('te-3', 't-gw', 't-svc1', 'gRPC', 3),
        makeEdge('te-4', 't-gw', 't-svc2', 'gRPC', 3),
        makeEdge('te-5', 't-gw', 't-svc3', 'gRPC', 3),
        makeEdge('te-6', 't-svc1', 't-cache', 'TCP', 1),
        makeEdge('te-7', 't-svc2', 't-db1', 'TCP', 5),
        makeEdge('te-8', 't-svc3', 't-db2', 'TCP', 5),
      ],
    }),
  },
  {
    id: 'rag-pipeline',
    name: 'RAG Pipeline',
    description: 'LLM with embedding service, vector DB, and document storage',
    icon: Brain,
    color: '271 81% 56%',
    build: () => ({
      nodes: [
        makeNode('r-web', 'web-client', 'Chat UI', 'clients', 350, 0),
        makeNode('r-gw', 'api-gateway', 'API Gateway', 'compute', 350, 130),
        makeNode('r-rag', 'rag-pipeline', 'RAG Orchestrator', 'ai-ml', 350, 270),
        makeNode('r-emb', 'embedding-service', 'Embedding Service', 'ai-ml', 100, 420, { modelName: 'text-embedding-3-small' }),
        makeNode('r-llm', 'llm', 'GPT-4', 'ai-ml', 350, 420, { modelName: 'gpt-4', contextWindow: 128000, throughputLimit: 50, latency: 800 }),
        makeNode('r-vec', 'vector-db', 'Pinecone', 'storage', 600, 420, { storageSize: 50 }),
        makeNode('r-obj', 'object-storage', 'Document Store', 'storage', 100, 570, { storageSize: 500 }),
      ],
      edges: [
        makeEdge('re-1', 'r-web', 'r-gw', 'HTTP', 5),
        makeEdge('re-2', 'r-gw', 'r-rag', 'HTTP', 3),
        makeEdge('re-3', 'r-rag', 'r-emb', 'gRPC', 10),
        makeEdge('re-4', 'r-rag', 'r-llm', 'HTTP', 20),
        makeEdge('re-5', 'r-emb', 'r-vec', 'gRPC', 5),
        makeEdge('re-6', 'r-rag', 'r-vec', 'gRPC', 8),
        makeEdge('re-7', 'r-emb', 'r-obj', 'HTTP', 10),
      ],
    }),
  },
  {
    id: 'event-driven',
    name: 'Event-Driven',
    description: 'Event bus with producers, consumers, and stream processing',
    icon: Radio,
    color: '38 92% 50%',
    build: () => ({
      nodes: [
        makeNode('ev-api', 'api-gateway', 'API Gateway', 'compute', 350, 0, { replicas: 2 }),
        makeNode('ev-svc1', 'server', 'Producer A', 'compute', 150, 150),
        makeNode('ev-svc2', 'server', 'Producer B', 'compute', 550, 150),
        makeNode('ev-bus', 'event-bus', 'Kafka', 'messaging', 350, 300, { replicas: 3, maxQueueDepth: 100000 }),
        makeNode('ev-sp', 'stream-processor', 'Stream Processor', 'messaging', 150, 450),
        makeNode('ev-c1', 'server', 'Consumer A', 'compute', 350, 450, { replicas: 2 }),
        makeNode('ev-c2', 'server', 'Consumer B', 'compute', 550, 450, { replicas: 2 }),
        makeNode('ev-db', 'nosql-db', 'Events Store', 'storage', 150, 600),
        makeNode('ev-cache', 'cache', 'State Cache', 'storage', 550, 600),
      ],
      edges: [
        makeEdge('eve-1', 'ev-api', 'ev-svc1', 'HTTP', 3),
        makeEdge('eve-2', 'ev-api', 'ev-svc2', 'HTTP', 3),
        makeEdge('eve-3', 'ev-svc1', 'ev-bus', 'Pub/Sub', 2),
        makeEdge('eve-4', 'ev-svc2', 'ev-bus', 'Pub/Sub', 2),
        makeEdge('eve-5', 'ev-bus', 'ev-sp', 'Pub/Sub', 1),
        makeEdge('eve-6', 'ev-bus', 'ev-c1', 'Pub/Sub', 1),
        makeEdge('eve-7', 'ev-bus', 'ev-c2', 'Pub/Sub', 1),
        makeEdge('eve-8', 'ev-sp', 'ev-db', 'TCP', 5),
        makeEdge('eve-9', 'ev-c2', 'ev-cache', 'TCP', 1),
      ],
    }),
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce',
    description: 'Full e-commerce stack with CDN, payments, search, and notifications',
    icon: ShoppingCart,
    color: '142 71% 45%',
    build: () => ({
      nodes: [
        makeNode('ec-cdn', 'cdn', 'CDN', 'compute', 350, 0),
        makeNode('ec-web', 'web-client', 'Storefront', 'clients', 100, 0),
        makeNode('ec-mob', 'mobile-client', 'Mobile App', 'clients', 600, 0),
        makeNode('ec-lb', 'load-balancer', 'Load Balancer', 'compute', 350, 130, { replicas: 2 }),
        makeNode('ec-gw', 'api-gateway', 'API Gateway', 'compute', 350, 260, { replicas: 2 }),
        makeNode('ec-cart', 'server', 'Cart Service', 'compute', 100, 400),
        makeNode('ec-pay', 'server', 'Payment Service', 'compute', 350, 400),
        makeNode('ec-search', 'server', 'Search Service', 'compute', 600, 400),
        makeNode('ec-queue', 'message-queue', 'Order Queue', 'messaging', 100, 550),
        makeNode('ec-db', 'sql-db', 'Main DB', 'storage', 350, 550, { replicas: 2 }),
        makeNode('ec-es', 'nosql-db', 'Elasticsearch', 'storage', 600, 550),
      ],
      edges: [
        makeEdge('ece-1', 'ec-web', 'ec-cdn', 'HTTP', 5),
        makeEdge('ece-2', 'ec-mob', 'ec-lb', 'HTTP', 10),
        makeEdge('ece-3', 'ec-cdn', 'ec-lb', 'HTTP', 2),
        makeEdge('ece-4', 'ec-lb', 'ec-gw', 'HTTP', 1),
        makeEdge('ece-5', 'ec-gw', 'ec-cart', 'gRPC', 3),
        makeEdge('ece-6', 'ec-gw', 'ec-pay', 'gRPC', 3),
        makeEdge('ece-7', 'ec-gw', 'ec-search', 'gRPC', 3),
        makeEdge('ece-8', 'ec-cart', 'ec-queue', 'Pub/Sub', 2),
        makeEdge('ece-9', 'ec-pay', 'ec-db', 'TCP', 5),
        makeEdge('ece-10', 'ec-search', 'ec-es', 'TCP', 3),
      ],
    }),
  },
  {
    id: 'chat-app',
    name: 'Real-time Chat',
    description: 'WebSocket-based chat with presence, history, and push notifications',
    icon: MessageSquare,
    color: '199 89% 48%',
    build: () => ({
      nodes: [
        makeNode('ch-web', 'web-client', 'Web Chat', 'clients', 150, 0),
        makeNode('ch-mob', 'mobile-client', 'Mobile Chat', 'clients', 500, 0),
        makeNode('ch-lb', 'load-balancer', 'WS Load Balancer', 'compute', 350, 130, { replicas: 2 }),
        makeNode('ch-ws', 'server', 'WS Server', 'compute', 350, 270, { replicas: 4 }),
        makeNode('ch-pub', 'event-bus', 'Redis PubSub', 'messaging', 150, 400, { replicas: 3 }),
        makeNode('ch-api', 'server', 'REST API', 'compute', 550, 400, { replicas: 2 }),
        makeNode('ch-db', 'nosql-db', 'Message Store', 'storage', 150, 550),
        makeNode('ch-cache', 'cache', 'Presence Cache', 'storage', 350, 550),
        makeNode('ch-queue', 'message-queue', 'Push Queue', 'messaging', 550, 550),
      ],
      edges: [
        makeEdge('che-1', 'ch-web', 'ch-lb', 'WebSocket', 5),
        makeEdge('che-2', 'ch-mob', 'ch-lb', 'WebSocket', 10),
        makeEdge('che-3', 'ch-lb', 'ch-ws', 'WebSocket', 1),
        makeEdge('che-4', 'ch-ws', 'ch-pub', 'Pub/Sub', 1),
        makeEdge('che-5', 'ch-ws', 'ch-api', 'gRPC', 3),
        makeEdge('che-6', 'ch-pub', 'ch-db', 'TCP', 5),
        makeEdge('che-7', 'ch-ws', 'ch-cache', 'TCP', 1),
        makeEdge('che-8', 'ch-api', 'ch-queue', 'Pub/Sub', 2),
      ],
    }),
  },
];

export default function TemplateDialog() {
  const { importJSON, clearCanvas } = useDesignStore();
  const [open, setOpen] = useState(false);

  const loadTemplate = (template: Template) => {
    const { nodes, edges } = template.build();
    clearCanvas();
    importJSON(JSON.stringify({ nodes, edges }));
    setOpen(false);
    toast.success(`Loaded "${template.name}" template`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-dashed">
          <LayoutTemplate className="w-3.5 h-3.5" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Architecture Templates</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2 mt-2">
          {TEMPLATES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => loadTemplate(t)}
                className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background hover:bg-accent/50 hover:border-primary/30 transition-all text-left group"
              >
                <div
                  className="p-2 rounded-lg shrink-0 transition-colors"
                  style={{ backgroundColor: `hsl(${t.color} / 0.12)` }}
                >
                  <Icon className="w-5 h-5" style={{ color: `hsl(${t.color})` }} />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{t.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
