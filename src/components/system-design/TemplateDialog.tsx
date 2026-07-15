import type { ElementType } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  LayoutTemplate,
  Globe,
  Brain,
  Radio,
  ShoppingCart,
  MessageSquare,
  Link2,
  Users,
  Clapperboard,
  CarTaxiFront,
  Sparkles,
} from 'lucide-react';
import { useDesignStore, type SystemNodeData } from '@/store/useDesignStore';
import type { Edge, Node } from '@xyflow/react';
import type { EdgeConfig, NodeCategory, SystemNodeType } from '@/types/system-design';
import { useState } from 'react';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';

type TemplateNode = Node<Record<string, unknown>, 'systemNode'>;
type TemplateEdge = Edge<Record<string, unknown>, 'systemEdge'>;

interface Template {
  id: string;
  name: string;
  description: string;
  icon: ElementType;
  color: string;
  rating: 'good' | 'advanced';
  focus: string;
  tags: string[];
  build: () => { nodes: TemplateNode[]; edges: TemplateEdge[] };
}

const TEMPLATE_TAGS = ['read-heavy', 'write-heavy', 'realtime', 'event-driven', 'ai', 'geo', 'media', 'search'] as const;

function makeNode(
  id: string,
  type: SystemNodeType,
  label: string,
  category: NodeCategory,
  x: number,
  y: number,
  overrides: Partial<SystemNodeData> = {},
): TemplateNode {
  const data: SystemNodeData = {
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
  };

  return {
    id,
    type: 'systemNode',
    position: { x, y },
    data: data as Record<string, unknown>,
  };
}

function makeEdge(
  id: string,
  source: string,
  target: string,
  protocol: EdgeConfig['protocol'] = 'HTTP',
  latency = 5,
): TemplateEdge {
  const data: EdgeConfig = { protocol, latency, bandwidth: 100, label: '' };

  return {
    id,
    type: 'systemEdge',
    source,
    target,
    data: data as Record<string, unknown>,
  };
}

const TEMPLATES: Template[] = [
  {
    id: 'microservices',
    name: 'Microservices',
    description: 'Load balancer → API Gateway → multiple services with DB and cache',
    icon: Globe,
    color: '221 83% 53%',
    rating: 'good',
    focus: 'Core service decomposition',
    tags: ['write-heavy', 'event-driven'],
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
    rating: 'advanced',
    focus: 'AI retrieval architecture',
    tags: ['ai', 'search', 'read-heavy'],
    build: () => ({
      nodes: [
        makeNode('r-web', 'web-client', 'Chat UI', 'clients', 350, 0),
        makeNode('r-gw', 'api-gateway', 'API Gateway', 'compute', 350, 130),
        makeNode('r-router', 'model-router', 'Model Router', 'ai-ml', 350, 270, { replicas: 2, throughputLimit: 100 }),
        makeNode('r-cache', 'cache', 'Prompt Cache', 'storage', 100, 420, { replicas: 2 }),
        makeNode('r-rag', 'rag-pipeline', 'RAG Orchestrator', 'ai-ml', 350, 420),
        makeNode('r-emb', 'embedding-service', 'Embedding Service', 'ai-ml', 600, 420, { modelName: 'text-embedding-3-small' }),
        makeNode('r-llm', 'llm', 'GPT-4', 'ai-ml', 350, 570, { modelName: 'gpt-4', contextWindow: 128000, throughputLimit: 50, latency: 800 }),
        makeNode('r-vec', 'vector-db', 'Pinecone', 'storage', 600, 570, { storageSize: 50 }),
        makeNode('r-obj', 'object-storage', 'Document Store', 'storage', 100, 570, { storageSize: 500 }),
      ],
      edges: [
        makeEdge('re-1', 'r-web', 'r-gw', 'HTTP', 5),
        makeEdge('re-2', 'r-gw', 'r-router', 'HTTP', 3),
        makeEdge('re-3', 'r-router', 'r-cache', 'TCP', 1),
        makeEdge('re-4', 'r-router', 'r-rag', 'gRPC', 4),
        makeEdge('re-5', 'r-rag', 'r-emb', 'gRPC', 10),
        makeEdge('re-6', 'r-rag', 'r-llm', 'HTTP', 20),
        makeEdge('re-7', 'r-emb', 'r-vec', 'gRPC', 5),
        makeEdge('re-8', 'r-rag', 'r-vec', 'gRPC', 8),
        makeEdge('re-9', 'r-emb', 'r-obj', 'HTTP', 10),
      ],
    }),
  },
  {
    id: 'event-driven',
    name: 'Event-Driven',
    description: 'Event bus with producers, consumers, and stream processing',
    icon: Radio,
    color: '38 92% 50%',
    rating: 'good',
    focus: 'Async event flow',
    tags: ['event-driven', 'write-heavy'],
    build: () => ({
      nodes: [
        makeNode('ev-api', 'api-gateway', 'API Gateway', 'compute', 350, 0, { replicas: 2 }),
        makeNode('ev-svc1', 'server', 'Producer A', 'compute', 150, 150),
        makeNode('ev-svc2', 'server', 'Producer B', 'compute', 550, 150),
        makeNode('ev-bus', 'event-bus', 'Kafka', 'messaging', 350, 300, { replicas: 3, maxQueueDepth: 100000 }),
        makeNode('ev-dlq', 'dead-letter-queue', 'Failed Event DLQ', 'messaging', 780, 300),
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
        makeEdge('eve-10', 'ev-bus', 'ev-dlq', 'Pub/Sub', 2),
      ],
    }),
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce',
    description: 'Full e-commerce stack with CDN, payments, search, and notifications',
    icon: ShoppingCart,
    color: '142 71% 45%',
    rating: 'good',
    focus: 'Transactional plus async order flow',
    tags: ['write-heavy', 'event-driven', 'search'],
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
        makeNode('ec-cache', 'cache', 'Catalog Cache', 'storage', 600, 550, { replicas: 2 }),
        makeNode('ec-queue', 'message-queue', 'Order Queue', 'messaging', 100, 550),
        makeNode('ec-db', 'sql-db', 'Main DB', 'storage', 350, 550, { replicas: 2 }),
        makeNode('ec-worker', 'job-worker', 'Order Worker', 'compute', 100, 700, { replicas: 2 }),
        makeNode('ec-dlq', 'dead-letter-queue', 'Order DLQ', 'messaging', 350, 700),
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
        makeEdge('ece-10', 'ec-search', 'ec-cache', 'TCP', 1),
        makeEdge('ece-11', 'ec-search', 'ec-db', 'TCP', 4),
        makeEdge('ece-12', 'ec-queue', 'ec-worker', 'Pub/Sub', 1),
        makeEdge('ece-13', 'ec-worker', 'ec-db', 'TCP', 4),
        makeEdge('ece-14', 'ec-worker', 'ec-dlq', 'Pub/Sub', 2),
      ],
    }),
  },
  {
    id: 'chat-app',
    name: 'Real-time Chat',
    description: 'WebSocket-based chat with presence, history, and push notifications',
    icon: MessageSquare,
    color: '199 89% 48%',
    rating: 'good',
    focus: 'Realtime socket architecture',
    tags: ['realtime', 'event-driven'],
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
  {
    id: 'url-shortener',
    name: 'URL Shortener',
    description: 'Optimized redirect hot path with cache-first lookup, persistent store, and async analytics',
    icon: Link2,
    color: '12 76% 56%',
    rating: 'good',
    focus: 'Low-latency read path',
    tags: ['read-heavy', 'write-heavy'],
    build: () => ({
      nodes: [
        makeNode('us-web', 'web-client', 'Browser Client', 'clients', 350, 0),
        makeNode('us-cdn', 'cdn', 'CDN / Edge', 'compute', 350, 100),
        makeNode('us-rate', 'rate-limiter', 'Rate Limiter', 'networking', 350, 220),
        makeNode('us-app', 'server', 'Short URL Service', 'compute', 350, 360, { replicas: 3, throughputLimit: 4000 }),
        makeNode('us-cache', 'cache', 'Redirect Cache', 'storage', 130, 500, { replicas: 2 }),
        makeNode('us-db', 'nosql-db', 'URL Store', 'storage', 350, 500, { replicas: 2 }),
        makeNode('us-bus', 'event-bus', 'Analytics Bus', 'messaging', 570, 500, { replicas: 3 }),
        makeNode('us-worker', 'job-worker', 'Analytics Worker', 'compute', 570, 640, { replicas: 2 }),
        makeNode('us-ts', 'time-series-db', 'Click Metrics', 'storage', 570, 780),
      ],
      edges: [
        makeEdge('use-1', 'us-web', 'us-cdn', 'HTTP', 3),
        makeEdge('use-2', 'us-cdn', 'us-rate', 'HTTP', 2),
        makeEdge('use-3', 'us-rate', 'us-app', 'HTTP', 1),
        makeEdge('use-5', 'us-app', 'us-cache', 'TCP', 1),
        makeEdge('use-6', 'us-app', 'us-db', 'TCP', 4),
        makeEdge('use-7', 'us-app', 'us-bus', 'Pub/Sub', 2),
        makeEdge('use-8', 'us-bus', 'us-worker', 'Pub/Sub', 1),
        makeEdge('use-9', 'us-worker', 'us-ts', 'TCP', 3),
      ],
    }),
  },
  {
    id: 'social-feed',
    name: 'Social Feed',
    description: 'Home feed system with fan-out workers, caches, media storage, and notifications',
    icon: Users,
    color: '338 82% 57%',
    rating: 'advanced',
    focus: 'Fan-out and feed serving',
    tags: ['read-heavy', 'write-heavy', 'event-driven', 'media'],
    build: () => ({
      nodes: [
        makeNode('sf-web', 'web-client', 'Web Feed', 'clients', 120, 0),
        makeNode('sf-mob', 'mobile-client', 'Mobile Feed', 'clients', 560, 0),
        makeNode('sf-gw', 'api-gateway', 'API Gateway', 'compute', 340, 120, { replicas: 2 }),
        makeNode('sf-feed', 'server', 'Feed API', 'compute', 340, 250, { replicas: 4 }),
        makeNode('sf-post', 'server', 'Post Service', 'compute', 110, 380, { replicas: 3 }),
        makeNode('sf-graph', 'graph-db', 'Social Graph', 'storage', 110, 520),
        makeNode('sf-cache', 'cache', 'Timeline Cache', 'storage', 340, 520, { replicas: 3 }),
        makeNode('sf-fanout', 'job-worker', 'Fan-out Worker', 'compute', 570, 380, { replicas: 4 }),
        makeNode('sf-bus', 'event-bus', 'Post Event Bus', 'messaging', 570, 520, { replicas: 3 }),
        makeNode('sf-feeddb', 'nosql-db', 'Feed Store', 'storage', 340, 660, { replicas: 2 }),
        makeNode('sf-media', 'object-storage', 'Media Store', 'storage', 110, 660, { storageSize: 2000 }),
        makeNode('sf-queue', 'message-queue', 'Notification Queue', 'messaging', 570, 660),
      ],
      edges: [
        makeEdge('sfe-1', 'sf-web', 'sf-gw', 'HTTP', 5),
        makeEdge('sfe-2', 'sf-mob', 'sf-gw', 'HTTP', 8),
        makeEdge('sfe-3', 'sf-gw', 'sf-feed', 'HTTP', 2),
        makeEdge('sfe-4', 'sf-gw', 'sf-post', 'HTTP', 2),
        makeEdge('sfe-5', 'sf-feed', 'sf-cache', 'TCP', 1),
        makeEdge('sfe-6', 'sf-feed', 'sf-feeddb', 'TCP', 4),
        makeEdge('sfe-7', 'sf-post', 'sf-media', 'HTTP', 6),
        makeEdge('sfe-8', 'sf-post', 'sf-bus', 'Pub/Sub', 2),
        makeEdge('sfe-9', 'sf-bus', 'sf-fanout', 'Pub/Sub', 1),
        makeEdge('sfe-10', 'sf-fanout', 'sf-graph', 'TCP', 5),
        makeEdge('sfe-11', 'sf-fanout', 'sf-feeddb', 'TCP', 4),
        makeEdge('sfe-12', 'sf-fanout', 'sf-queue', 'Pub/Sub', 2),
      ],
    }),
  },
  {
    id: 'video-streaming',
    name: 'Video Streaming',
    description: 'Separated control plane and media plane with CDN-backed delivery and async transcoding',
    icon: Clapperboard,
    color: '205 85% 52%',
    rating: 'advanced',
    focus: 'Media plane vs control plane',
    tags: ['media', 'read-heavy', 'write-heavy', 'event-driven'],
    build: () => ({
      nodes: [
        makeNode('vs-web', 'web-client', 'Viewer App', 'clients', 140, 0),
        makeNode('vs-mob', 'mobile-client', 'Mobile Viewer', 'clients', 560, 0),
        makeNode('vs-cdn', 'cdn', 'Video CDN', 'compute', 350, 100),
        makeNode('vs-gw', 'api-gateway', 'Streaming API', 'compute', 350, 220, { replicas: 2 }),
        makeNode('vs-meta', 'server', 'Metadata Service', 'compute', 140, 360, { replicas: 2 }),
        makeNode('vs-upload', 'server', 'Upload Service', 'compute', 560, 360, { replicas: 2 }),
        makeNode('vs-db', 'sql-db', 'Video Metadata DB', 'storage', 140, 520, { replicas: 2 }),
        makeNode('vs-obj', 'object-storage', 'Raw / Encoded Videos', 'storage', 350, 520, { storageSize: 10000 }),
        makeNode('vs-queue', 'message-queue', 'Transcode Queue', 'messaging', 560, 520, { maxQueueDepth: 200000 }),
        makeNode('vs-worker', 'job-worker', 'Transcode Worker', 'compute', 560, 660, { replicas: 6, throughputLimit: 300 }),
        makeNode('vs-dlq', 'dead-letter-queue', 'Failed Jobs DLQ', 'messaging', 740, 660),
      ],
      edges: [
        makeEdge('vse-1', 'vs-web', 'vs-cdn', 'HTTP', 4),
        makeEdge('vse-2', 'vs-mob', 'vs-cdn', 'HTTP', 7),
        makeEdge('vse-3', 'vs-web', 'vs-gw', 'HTTP', 5),
        makeEdge('vse-4', 'vs-mob', 'vs-gw', 'HTTP', 8),
        makeEdge('vse-5', 'vs-cdn', 'vs-obj', 'HTTP', 2),
        makeEdge('vse-6', 'vs-gw', 'vs-meta', 'HTTP', 2),
        makeEdge('vse-7', 'vs-gw', 'vs-upload', 'HTTP', 3),
        makeEdge('vse-8', 'vs-meta', 'vs-db', 'TCP', 4),
        makeEdge('vse-9', 'vs-upload', 'vs-obj', 'HTTP', 8),
        makeEdge('vse-10', 'vs-upload', 'vs-queue', 'Pub/Sub', 2),
        makeEdge('vse-11', 'vs-queue', 'vs-worker', 'Pub/Sub', 1),
        makeEdge('vse-12', 'vs-worker', 'vs-obj', 'HTTP', 10),
        makeEdge('vse-13', 'vs-worker', 'vs-dlq', 'Pub/Sub', 2),
      ],
    }),
  },
  {
    id: 'ride-dispatch',
    name: 'Ride Dispatch',
    description: 'Dispatch and matching with live location ingest, geo cache lookups, and trip event streaming',
    icon: CarTaxiFront,
    color: '145 68% 42%',
    rating: 'advanced',
    focus: 'Realtime dispatching',
    tags: ['realtime', 'geo', 'event-driven', 'write-heavy'],
    build: () => ({
      nodes: [
        makeNode('rd-rider', 'mobile-client', 'Rider App', 'clients', 120, 0),
        makeNode('rd-driver', 'mobile-client', 'Driver App', 'clients', 560, 0),
        makeNode('rd-gw', 'api-gateway', 'Dispatch Gateway', 'compute', 340, 120, { replicas: 2 }),
        makeNode('rd-match', 'server', 'Matching Service', 'compute', 340, 250, { replicas: 4, throughputLimit: 2500 }),
        makeNode('rd-location', 'server', 'Location Service', 'compute', 120, 380, { replicas: 3 }),
        makeNode('rd-stream', 'event-bus', 'Trip Event Stream', 'messaging', 560, 380, { replicas: 3 }),
        makeNode('rd-trips', 'sql-db', 'Trips DB', 'storage', 340, 520, { replicas: 2 }),
        makeNode('rd-geo', 'cache', 'Geo Cache', 'storage', 120, 520, { replicas: 2 }),
        makeNode('rd-metrics', 'time-series-db', 'Location History', 'storage', 560, 520),
        makeNode('rd-alerts', 'error-tracker', 'Incident Tracker', 'observability', 740, 520),
      ],
      edges: [
        makeEdge('rde-1', 'rd-rider', 'rd-gw', 'HTTP', 6),
        makeEdge('rde-2', 'rd-driver', 'rd-gw', 'WebSocket', 4),
        makeEdge('rde-3', 'rd-gw', 'rd-match', 'gRPC', 2),
        makeEdge('rde-4', 'rd-gw', 'rd-location', 'gRPC', 2),
        makeEdge('rde-5', 'rd-match', 'rd-trips', 'TCP', 4),
        makeEdge('rde-6', 'rd-match', 'rd-geo', 'TCP', 1),
        makeEdge('rde-7', 'rd-match', 'rd-stream', 'Pub/Sub', 2),
        makeEdge('rde-8', 'rd-location', 'rd-geo', 'TCP', 1),
        makeEdge('rde-9', 'rd-location', 'rd-stream', 'Pub/Sub', 2),
        makeEdge('rde-10', 'rd-location', 'rd-metrics', 'TCP', 3),
        makeEdge('rde-11', 'rd-stream', 'rd-alerts', 'Pub/Sub', 2),
      ],
    }),
  },
  {
    id: 'llm-gateway',
    name: 'LLM Gateway',
    description: 'Prompt API with model routing, caching, vector retrieval, and key management',
    icon: Sparkles,
    color: '272 84% 60%',
    rating: 'advanced',
    focus: 'Multi-model inference gateway',
    tags: ['ai', 'read-heavy', 'search'],
    build: () => ({
      nodes: [
        makeNode('lg-web', 'web-client', 'Prompt Client', 'clients', 350, 0),
        makeNode('lg-gw', 'api-gateway', 'LLM API Gateway', 'compute', 350, 110, { replicas: 2 }),
        makeNode('lg-router', 'model-router', 'Model Router', 'ai-ml', 350, 240, { replicas: 2, throughputLimit: 300 }),
        makeNode('lg-cache', 'cache', 'Prompt Cache', 'storage', 120, 380, { replicas: 2 }),
        makeNode('lg-rag', 'rag-pipeline', 'Context Retriever', 'ai-ml', 350, 380),
        makeNode('lg-vec', 'vector-db', 'Vector Store', 'storage', 580, 380, { storageSize: 300 }),
        makeNode('lg-llm1', 'llm', 'Fast Model', 'ai-ml', 220, 540, { modelName: 'fast-model', latency: 250, throughputLimit: 200 }),
        makeNode('lg-llm2', 'llm', 'Reasoning Model', 'ai-ml', 480, 540, { modelName: 'reasoning-model', latency: 900, throughputLimit: 40 }),
        makeNode('lg-kms', 'kms', 'KMS', 'security', 680, 540),
      ],
      edges: [
        makeEdge('lge-1', 'lg-web', 'lg-gw', 'HTTP', 5),
        makeEdge('lge-2', 'lg-gw', 'lg-router', 'HTTP', 3),
        makeEdge('lge-3', 'lg-router', 'lg-cache', 'TCP', 1),
        makeEdge('lge-4', 'lg-router', 'lg-rag', 'gRPC', 5),
        makeEdge('lge-5', 'lg-rag', 'lg-vec', 'gRPC', 4),
        makeEdge('lge-6', 'lg-router', 'lg-llm1', 'HTTP', 10),
        makeEdge('lge-7', 'lg-router', 'lg-llm2', 'HTTP', 18),
        makeEdge('lge-8', 'lg-router', 'lg-kms', 'HTTP', 2),
      ],
    }),
  },
];

interface TemplateDialogProps {
  trigger?: 'default' | 'sidebar';
}

export default function TemplateDialog({ trigger = 'default' }: TemplateDialogProps) {
  const { importJSON, clearCanvas } = useDesignStore(useShallow((state) => ({
    importJSON: state.importJSON,
    clearCanvas: state.clearCanvas
  })));
  const [open, setOpen] = useState(false);
  const [activeTag, setActiveTag] = useState<string>('all');

  const visibleTemplates = activeTag === 'all'
    ? TEMPLATES
    : TEMPLATES.filter((template) => template.tags.includes(activeTag));

  const loadTemplate = (template: Template) => {
    const { nodes, edges } = template.build();
    clearCanvas();
    importJSON(JSON.stringify({ nodes, edges }));
    setOpen(false);
    toast.success(`Loaded "${template.name}" template`);
  };

  const sidebarTrigger = (
    <button
      type="button"
      className="group flex w-full items-start gap-3 rounded-xl border border-border/70 bg-gradient-to-br from-primary/[0.08] via-background to-background px-3 py-3 text-left transition-all hover:border-primary/30 hover:from-primary/[0.12] hover:shadow-sm"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/10">
        <LayoutTemplate className="h-4.5 w-4.5 transition-transform group-hover:scale-110" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold tracking-tight text-foreground">Start From Template</span>
          <Badge variant="secondary" className="h-5 shrink-0 rounded-full px-1.5 text-[9px]">
            {TEMPLATES.length}
          </Badge>
        </div>
        <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
          Load a production-style architecture and customize it instead of assembling from scratch.
        </p>
      </div>
    </button>
  );

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-dashed">
      <LayoutTemplate className="w-3.5 h-3.5" />
      Templates
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            {trigger === 'sidebar' ? sidebarTrigger : defaultTrigger}
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="right">Browse interview system design templates</TooltipContent>
      </Tooltip>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-border px-5 py-4 pr-12">
          <DialogTitle>Architecture Templates</DialogTitle>
        </DialogHeader>
        <div className="border-b border-border bg-background/95 px-5 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Filter By Topic</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Button
              type="button"
              size="sm"
              variant={activeTag === 'all' ? 'default' : 'outline'}
              className="h-7 px-2.5 text-[10px]"
              onClick={() => setActiveTag('all')}
            >
              All
            </Button>
            {TEMPLATE_TAGS.map((tag) => (
              <Button
                key={tag}
                type="button"
                size="sm"
                variant={activeTag === tag ? 'default' : 'outline'}
                className="h-7 px-2.5 text-[10px]"
                onClick={() => setActiveTag(tag)}
              >
                {tag}
              </Button>
            ))}
          </div>
        </div>
        <ScrollArea className="max-h-[min(72vh,760px)]">
          <div className="grid gap-3 p-5 md:grid-cols-2">
            {visibleTemplates.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => loadTemplate(t)}
                  className="flex min-h-[174px] items-start gap-3 rounded-xl border border-border bg-background p-4 text-left transition-all group hover:border-primary/30 hover:bg-accent/40 hover:shadow-sm"
                >
                  <div
                    className="mt-0.5 rounded-xl p-2.5 shrink-0 transition-colors"
                    style={{ backgroundColor: `hsl(${t.color} / 0.12)` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: `hsl(${t.color})` }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <div className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">{t.name}</div>
                      <Badge variant={t.rating === 'advanced' ? 'default' : 'secondary'} className="h-5 px-1.5 text-[10px]">
                        {t.rating === 'advanced' ? 'Advanced' : 'Good'}
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs leading-5 text-muted-foreground">{t.description}</div>
                    <div className="mt-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      Focus
                    </div>
                    <div className="mt-1 text-[11px] font-medium text-foreground/85">{t.focus}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {t.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="h-5 px-1.5 text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
            {visibleTemplates.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-6 text-center md:col-span-2">
                <div className="text-sm font-medium text-foreground">No templates for `{activeTag}`</div>
                <div className="mt-1 text-xs text-muted-foreground">Choose another topic filter.</div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
