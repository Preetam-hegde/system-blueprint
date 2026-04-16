export type NodeCategory = 'compute' | 'storage' | 'messaging' | 'ai-ml' | 'networking' | 'clients' | 'observability' | 'security';

export type SystemNodeType =
  | 'server' | 'api-gateway' | 'load-balancer' | 'cdn' | 'serverless'
  | 'sql-db' | 'nosql-db' | 'vector-db' | 'cache' | 'object-storage' | 'data-lake' | 'graph-db'
  | 'message-queue' | 'event-bus' | 'stream-processor' | 'webhook'
  | 'llm' | 'rag-pipeline' | 'ml-model' | 'embedding-service' | 'ai-agent' | 'fine-tuning'
  | 'dns' | 'firewall' | 'rate-limiter' | 'service-mesh' | 'reverse-proxy'
  | 'web-client' | 'mobile-client' | 'iot-device' | 'desktop-client'
  | 'log-aggregator' | 'metrics-server' | 'tracing' | 'alerting'
  | 'waf' | 'vault' | 'identity-provider' | 'oauth-server';

export type ConnectionProtocol = 'HTTP' | 'gRPC' | 'WebSocket' | 'TCP' | 'Pub/Sub' | 'GraphQL' | 'MQTT' | 'AMQP';

export interface ProtocolInfo {
  name: string;
  description: string;
  useCases: string[];
  pros: string[];
  cons: string[];
  defaultLatency: number;
  color: string;
}

export const PROTOCOL_KNOWLEDGE: Record<ConnectionProtocol, ProtocolInfo> = {
  'HTTP': {
    name: 'HTTP/HTTPS',
    description: 'Standard request-response protocol for web communication. Stateless and widely supported.',
    useCases: ['REST APIs', 'Web applications', 'Microservice communication'],
    pros: ['Universal support', 'Simple to implement', 'Cacheable', 'Load balancer friendly'],
    cons: ['Higher overhead per request', 'Not ideal for streaming', 'Stateless (no persistent connection)'],
    defaultLatency: 5,
    color: '221 83% 53%',
  },
  'gRPC': {
    name: 'gRPC (HTTP/2)',
    description: 'High-performance RPC framework using Protocol Buffers for serialization over HTTP/2.',
    useCases: ['Inter-service communication', 'Low-latency microservices', 'Polyglot systems'],
    pros: ['Binary protocol (faster)', 'Streaming support', 'Type-safe contracts', 'Multiplexing'],
    cons: ['Browser support limited', 'More complex setup', 'Harder to debug'],
    defaultLatency: 2,
    color: '271 81% 56%',
  },
  'WebSocket': {
    name: 'WebSocket',
    description: 'Full-duplex persistent connection for real-time bidirectional communication.',
    useCases: ['Chat applications', 'Live dashboards', 'Gaming', 'Collaborative editing'],
    pros: ['Real-time bidirectional', 'Low latency', 'Persistent connection', 'Less overhead per message'],
    cons: ['Stateful (harder to scale)', 'Load balancing complexity', 'Connection management overhead'],
    defaultLatency: 1,
    color: '142 71% 45%',
  },
  'TCP': {
    name: 'Raw TCP',
    description: 'Direct TCP socket connection for low-level, high-performance communication.',
    useCases: ['Database connections', 'Custom protocols', 'File transfers'],
    pros: ['Lowest overhead', 'Full control', 'Reliable delivery'],
    cons: ['No built-in framing', 'Manual protocol design', 'Firewall issues'],
    defaultLatency: 1,
    color: '220 9% 46%',
  },
  'Pub/Sub': {
    name: 'Publish/Subscribe',
    description: 'Asynchronous messaging pattern where publishers broadcast events to subscribers.',
    useCases: ['Event-driven architecture', 'Notifications', 'Data replication', 'Decoupled services'],
    pros: ['Decoupled architecture', 'Scalable fan-out', 'Async processing', 'Backpressure handling'],
    cons: ['Eventual consistency', 'Message ordering challenges', 'Debugging complexity'],
    defaultLatency: 3,
    color: '38 92% 50%',
  },
  'GraphQL': {
    name: 'GraphQL',
    description: 'Query language for APIs that allows clients to request exactly the data they need.',
    useCases: ['Frontend-driven APIs', 'Mobile apps', 'Data aggregation', 'BFF pattern'],
    pros: ['Flexible queries', 'No over-fetching', 'Strong typing', 'Single endpoint'],
    cons: ['Complex caching', 'N+1 query risk', 'Learning curve'],
    defaultLatency: 8,
    color: '330 70% 55%',
  },
  'MQTT': {
    name: 'MQTT',
    description: 'Lightweight messaging protocol designed for IoT and constrained devices.',
    useCases: ['IoT sensors', 'Telemetry', 'Remote monitoring', 'Smart home'],
    pros: ['Extremely lightweight', 'Low bandwidth', 'QoS levels', 'Retained messages'],
    cons: ['Limited payload size', 'No request-response', 'Broker dependency'],
    defaultLatency: 5,
    color: '160 60% 45%',
  },
  'AMQP': {
    name: 'AMQP',
    description: 'Advanced Message Queuing Protocol for enterprise-grade message routing.',
    useCases: ['Enterprise messaging', 'Task queues', 'RabbitMQ', 'Financial systems'],
    pros: ['Rich routing', 'Transaction support', 'Acknowledgments', 'Enterprise-grade'],
    cons: ['Higher complexity', 'More overhead than MQTT', 'Steeper learning curve'],
    defaultLatency: 3,
    color: '25 80% 50%',
  },
};

export interface NodeConfig {
  label: string;
  replicas: number;
  region: string;
  cpu: number;
  memory: number;
  throughputLimit: number;
  latency: number;
  notes: string;
  storageSize?: number;
  maxQueueDepth?: number;
  modelName?: string;
  contextWindow?: number;
}

export interface EdgeConfig {
  protocol: ConnectionProtocol;
  latency: number;
  bandwidth: number;
  label: string;
}

export interface SimulationState {
  running: boolean;
  speed: number;
  rps: number;
}

export interface AnalysisWarning {
  id: string;
  type: 'bottleneck' | 'spof' | 'latency';
  nodeId: string;
  message: string;
  severity: 'warning' | 'critical';
}

export const CATEGORY_COLORS: Record<NodeCategory, string> = {
  'compute': '221 83% 53%',
  'storage': '142 71% 45%',
  'messaging': '38 92% 50%',
  'ai-ml': '271 81% 56%',
  'networking': '0 84% 60%',
  'clients': '199 89% 48%',
  'observability': '173 58% 39%',
  'security': '340 75% 55%',
};

export const NODE_CATALOG: { type: SystemNodeType; label: string; category: NodeCategory; description: string }[] = [
  // Compute
  { type: 'server', label: 'Server', category: 'compute', description: 'Application server instance' },
  { type: 'api-gateway', label: 'API Gateway', category: 'compute', description: 'Request routing & auth' },
  { type: 'load-balancer', label: 'Load Balancer', category: 'compute', description: 'Distribute traffic across nodes' },
  { type: 'cdn', label: 'CDN', category: 'compute', description: 'Content delivery network' },
  { type: 'serverless', label: 'Serverless', category: 'compute', description: 'Event-driven functions (Lambda)' },
  // Storage
  { type: 'sql-db', label: 'SQL DB', category: 'storage', description: 'Relational database (PostgreSQL)' },
  { type: 'nosql-db', label: 'NoSQL DB', category: 'storage', description: 'Document store (MongoDB)' },
  { type: 'vector-db', label: 'Vector DB', category: 'storage', description: 'Embeddings store (Pinecone)' },
  { type: 'cache', label: 'Cache', category: 'storage', description: 'In-memory store (Redis)' },
  { type: 'object-storage', label: 'Object Storage', category: 'storage', description: 'Blob storage (S3)' },
  { type: 'data-lake', label: 'Data Lake', category: 'storage', description: 'Large-scale raw data storage' },
  { type: 'graph-db', label: 'Graph DB', category: 'storage', description: 'Relationship-focused (Neo4j)' },
  // Messaging
  { type: 'message-queue', label: 'Message Queue', category: 'messaging', description: 'Async task queue (SQS)' },
  { type: 'event-bus', label: 'Event Bus', category: 'messaging', description: 'Event streaming (Kafka)' },
  { type: 'stream-processor', label: 'Stream Processor', category: 'messaging', description: 'Real-time processing (Flink)' },
  { type: 'webhook', label: 'Webhook', category: 'messaging', description: 'HTTP callback endpoint' },
  // AI / ML
  { type: 'llm', label: 'LLM', category: 'ai-ml', description: 'Large language model (GPT-4)' },
  { type: 'rag-pipeline', label: 'RAG Pipeline', category: 'ai-ml', description: 'Retrieval-augmented generation' },
  { type: 'ml-model', label: 'ML Model', category: 'ai-ml', description: 'Custom ML inference endpoint' },
  { type: 'embedding-service', label: 'Embeddings', category: 'ai-ml', description: 'Text/image embedding service' },
  { type: 'ai-agent', label: 'AI Agent', category: 'ai-ml', description: 'Autonomous AI agent (tool use)' },
  { type: 'fine-tuning', label: 'Fine-Tuning', category: 'ai-ml', description: 'Model fine-tuning pipeline' },
  // Networking
  { type: 'dns', label: 'DNS', category: 'networking', description: 'Domain name resolution' },
  { type: 'firewall', label: 'Firewall', category: 'networking', description: 'Network traffic filtering' },
  { type: 'rate-limiter', label: 'Rate Limiter', category: 'networking', description: 'Request throttling' },
  { type: 'service-mesh', label: 'Service Mesh', category: 'networking', description: 'Sidecar proxy (Istio)' },
  { type: 'reverse-proxy', label: 'Reverse Proxy', category: 'networking', description: 'Request forwarding (Nginx)' },
  // Clients
  { type: 'web-client', label: 'Web Client', category: 'clients', description: 'Browser-based application' },
  { type: 'mobile-client', label: 'Mobile Client', category: 'clients', description: 'iOS / Android app' },
  { type: 'iot-device', label: 'IoT Device', category: 'clients', description: 'Connected sensor/device' },
  { type: 'desktop-client', label: 'Desktop App', category: 'clients', description: 'Native desktop application' },
  // Observability
  { type: 'log-aggregator', label: 'Log Aggregator', category: 'observability', description: 'Centralized logging (ELK)' },
  { type: 'metrics-server', label: 'Metrics', category: 'observability', description: 'Metrics collection (Prometheus)' },
  { type: 'tracing', label: 'Tracing', category: 'observability', description: 'Distributed tracing (Jaeger)' },
  { type: 'alerting', label: 'Alerting', category: 'observability', description: 'Alert management (PagerDuty)' },
  // Security
  { type: 'waf', label: 'WAF', category: 'security', description: 'Web application firewall' },
  { type: 'vault', label: 'Vault', category: 'security', description: 'Secrets management (HashiCorp)' },
  { type: 'identity-provider', label: 'Identity Provider', category: 'security', description: 'SSO / SAML / OIDC' },
  { type: 'oauth-server', label: 'OAuth Server', category: 'security', description: 'Authorization server' },
];

export const DEFAULT_NODE_CONFIG: NodeConfig = {
  label: '',
  replicas: 1,
  region: 'us-east-1',
  cpu: 2,
  memory: 4,
  throughputLimit: 1000,
  latency: 10,
  notes: '',
};

export const DEFAULT_EDGE_CONFIG: EdgeConfig = {
  protocol: 'HTTP',
  latency: 5,
  bandwidth: 100,
  label: '',
};
