export type NodeCategory =
  | "compute"
  | "storage"
  | "messaging"
  | "ai-ml"
  | "networking"
  | "clients"
  | "observability"
  | "security";

export type SystemNodeType =
  | "server"
  | "api-gateway"
  | "load-balancer"
  | "cdn"
  | "serverless"
  | "job-worker"
  | "scheduler"
  | "sql-db"
  | "nosql-db"
  | "vector-db"
  | "cache"
  | "object-storage"
  | "data-lake"
  | "graph-db"
  | "time-series-db"
  | "message-queue"
  | "event-bus"
  | "stream-processor"
  | "webhook"
  | "dead-letter-queue"
  | "llm"
  | "rag-pipeline"
  | "ml-model"
  | "embedding-service"
  | "ai-agent"
  | "fine-tuning"
  | "model-router"
  | "dns"
  | "firewall"
  | "rate-limiter"
  | "service-mesh"
  | "reverse-proxy"
  | "service-discovery"
  | "web-client"
  | "mobile-client"
  | "iot-device"
  | "desktop-client"
  | "log-aggregator"
  | "metrics-server"
  | "tracing"
  | "alerting"
  | "error-tracker"
  | "waf"
  | "vault"
  | "identity-provider"
  | "oauth-server"
  | "kms";

export type ConnectionProtocol =
  | "HTTP"
  | "gRPC"
  | "WebSocket"
  | "TCP"
  | "Pub/Sub"
  | "GraphQL"
  | "MQTT"
  | "AMQP";

export interface NodeCatalogItem {
  type: SystemNodeType;
  label: string;
  category: NodeCategory;
  description: string;
  whatItDoes: string;
  usedFor: string[];
}

export interface ProtocolInfo {
  name: string;
  description: string;
  mode: string;
  bestFor: string;
  useCases: string[];
  pros: string[];
  cons: string[];
  defaultLatency: number;
  color: string;
}

export const PROTOCOL_KNOWLEDGE: Record<ConnectionProtocol, ProtocolInfo> = {
  HTTP: {
    name: "HTTP/HTTPS",
    description:
      "Standard request-response protocol for web communication. Stateless and widely supported.",
    mode: "Request/response",
    bestFor: "Web APIs and browser-friendly service calls.",
    useCases: ["REST APIs", "Web applications", "Microservice communication"],
    pros: [
      "Universal support",
      "Simple to implement",
      "Cacheable",
      "Load balancer friendly",
    ],
    cons: [
      "Higher overhead per request",
      "Not ideal for streaming",
      "Stateless (no persistent connection)",
    ],
    defaultLatency: 5,
    color: "221 83% 53%",
  },
  gRPC: {
    name: "gRPC (HTTP/2)",
    description:
      "High-performance RPC framework using Protocol Buffers for serialization over HTTP/2.",
    mode: "Binary RPC",
    bestFor: "Low-latency internal service-to-service communication.",
    useCases: [
      "Inter-service communication",
      "Low-latency microservices",
      "Polyglot systems",
    ],
    pros: [
      "Binary protocol (faster)",
      "Streaming support",
      "Type-safe contracts",
      "Multiplexing",
    ],
    cons: ["Browser support limited", "More complex setup", "Harder to debug"],
    defaultLatency: 2,
    color: "271 81% 56%",
  },
  WebSocket: {
    name: "WebSocket",
    description:
      "Full-duplex persistent connection for real-time bidirectional communication.",
    mode: "Bidirectional stream",
    bestFor: "Real-time user experiences with live updates.",
    useCases: [
      "Chat applications",
      "Live dashboards",
      "Gaming",
      "Collaborative editing",
    ],
    pros: [
      "Real-time bidirectional",
      "Low latency",
      "Persistent connection",
      "Less overhead per message",
    ],
    cons: [
      "Stateful (harder to scale)",
      "Load balancing complexity",
      "Connection management overhead",
    ],
    defaultLatency: 1,
    color: "142 71% 45%",
  },
  TCP: {
    name: "Raw TCP",
    description:
      "Direct TCP socket connection for low-level, high-performance communication.",
    mode: "Transport connection",
    bestFor: "Databases and custom binary protocols.",
    useCases: ["Database connections", "Custom protocols", "File transfers"],
    pros: ["Lowest overhead", "Full control", "Reliable delivery"],
    cons: ["No built-in framing", "Manual protocol design", "Firewall issues"],
    defaultLatency: 1,
    color: "220 9% 46%",
  },
  "Pub/Sub": {
    name: "Publish/Subscribe",
    description:
      "Asynchronous messaging pattern where publishers broadcast events to subscribers.",
    mode: "Async eventing",
    bestFor: "Decoupled event-driven systems and fan-out workflows.",
    useCases: [
      "Event-driven architecture",
      "Notifications",
      "Data replication",
      "Decoupled services",
    ],
    pros: [
      "Decoupled architecture",
      "Scalable fan-out",
      "Async processing",
      "Backpressure handling",
    ],
    cons: [
      "Eventual consistency",
      "Message ordering challenges",
      "Debugging complexity",
    ],
    defaultLatency: 3,
    color: "38 92% 50%",
  },
  GraphQL: {
    name: "GraphQL",
    description:
      "Query language for APIs that allows clients to request exactly the data they need.",
    mode: "Schema query",
    bestFor: "Frontend-driven APIs needing flexible data fetches.",
    useCases: [
      "Frontend-driven APIs",
      "Mobile apps",
      "Data aggregation",
      "BFF pattern",
    ],
    pros: [
      "Flexible queries",
      "No over-fetching",
      "Strong typing",
      "Single endpoint",
    ],
    cons: ["Complex caching", "N+1 query risk", "Learning curve"],
    defaultLatency: 8,
    color: "330 70% 55%",
  },
  MQTT: {
    name: "MQTT",
    description:
      "Lightweight messaging protocol designed for IoT and constrained devices.",
    mode: "Lightweight messaging",
    bestFor: "Low-bandwidth telemetry and device messaging.",
    useCases: ["IoT sensors", "Telemetry", "Remote monitoring", "Smart home"],
    pros: [
      "Extremely lightweight",
      "Low bandwidth",
      "QoS levels",
      "Retained messages",
    ],
    cons: ["Limited payload size", "No request-response", "Broker dependency"],
    defaultLatency: 5,
    color: "160 60% 45%",
  },
  AMQP: {
    name: "AMQP",
    description:
      "Advanced Message Queuing Protocol for enterprise-grade message routing.",
    mode: "Queued messaging",
    bestFor: "Reliable brokered messaging and task distribution.",
    useCases: [
      "Enterprise messaging",
      "Task queues",
      "RabbitMQ",
      "Financial systems",
    ],
    pros: [
      "Rich routing",
      "Transaction support",
      "Acknowledgments",
      "Enterprise-grade",
    ],
    cons: [
      "Higher complexity",
      "More overhead than MQTT",
      "Steeper learning curve",
    ],
    defaultLatency: 3,
    color: "25 80% 50%",
  },
};

export interface NodeConfig {
  label: string;
  replicas: number;
  region: string;
  cpu: number;
  memory: number;
  hourlyCost?: number;
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

export type SimulationScenarioType =
  | "none"
  | "zone-outage"
  | "regional-latency"
  | "queue-backlog";

export interface SimulationScenario {
  type: SimulationScenarioType;
  region?: string;
  latencyMs?: number;
  queueNodeIds?: string[];
  backlogSeverity?: number;
}

export interface ReplayTrace {
  pathNodeIds: string[];
  pathEdgeIds: string[];
  currentNodeId: string | null;
  currentEdgeId: string | null;
  accumulatedLatencyMs: number;
  totalLatencyMs: number;
  estimatedRetries: number;
  bottleneckNodeIds: string[];
  blockedReason?: string;
  completedPct: number;
}

export interface SimulationState {
  running: boolean;
  speed: number;
  rps: number;
  mode: "live" | "replay";
  step: number;
  maxSteps: number;
  packetLossPct: number;
  retryAttempts: number;
  retryBackoffMs: number;
  extraLatencyMs: number;
  manualFailedNodeIds: string[];
  failedNodeIds: string[];
  scenario: SimulationScenario;
  replayTrace: ReplayTrace;
}

export interface SavedSimulationPreset {
  id: string;
  name: string;
  createdAt: string;
  simulation: Pick<
    SimulationState,
    | "speed"
    | "rps"
    | "mode"
    | "maxSteps"
    | "packetLossPct"
    | "retryAttempts"
    | "retryBackoffMs"
    | "extraLatencyMs"
    | "manualFailedNodeIds"
    | "scenario"
  >;
}

export interface CapacityPlanNode {
  nodeId: string;
  label: string;
  currentRps: number;
  projectedRps: number;
  replicas: number;
  requiredReplicas: number;
  throughputLimit: number;
  projectedUtilizationPct: number;
  estimatedHourlyCost: number;
  projectedHourlyCost: number;
}

export interface CapacityPlanSummary {
  growthFactor: number;
  spikeMultiplier: number;
  totalProjectedMultiplier: number;
  totalHourlyCost: number;
  projectedHourlyCost: number;
  projectedBottlenecks: number;
  nodes: CapacityPlanNode[];
}

export interface AnalysisWarning {
  id: string;
  type: "bottleneck" | "spof" | "latency" | "failure" | "backlog";
  nodeId: string;
  message: string;
  severity: "warning" | "critical";
}

export const CATEGORY_COLORS: Record<NodeCategory, string> = {
  compute: "221 83% 53%",
  storage: "142 71% 45%",
  messaging: "38 92% 50%",
  "ai-ml": "271 81% 56%",
  networking: "0 84% 60%",
  clients: "199 89% 48%",
  observability: "173 58% 39%",
  security: "340 75% 55%",
};

export const NODE_CATALOG: NodeCatalogItem[] = [
  // Compute
  {
    type: "server",
    label: "Server",
    category: "compute",
    description: "Application server instance",
    whatItDoes:
      "Runs application logic and handles requests from other services or clients.",
    usedFor: [
      "Monoliths and microservices",
      "Backend APIs",
      "Business logic processing",
    ],
  },
  {
    type: "api-gateway",
    label: "API Gateway",
    category: "compute",
    description: "Request routing & auth",
    whatItDoes:
      "Acts as the front door for APIs by routing requests, enforcing auth, and shaping traffic.",
    usedFor: [
      "Public API entry points",
      "Authentication and rate limiting",
      "Request aggregation for services",
    ],
  },
  {
    type: "load-balancer",
    label: "Load Balancer",
    category: "compute",
    description: "Distribute traffic across nodes",
    whatItDoes:
      "Spreads incoming traffic across multiple instances to improve availability and performance.",
    usedFor: [
      "Horizontal scaling",
      "High availability setups",
      "Traffic distribution across replicas",
    ],
  },
  {
    type: "cdn",
    label: "CDN",
    category: "compute",
    description: "Content delivery network",
    whatItDoes:
      "Caches and serves content from edge locations closer to users.",
    usedFor: [
      "Static asset delivery",
      "Global web apps",
      "Reducing origin latency and load",
    ],
  },
  {
    type: "serverless",
    label: "Serverless",
    category: "compute",
    description: "Event-driven functions (Lambda)",
    whatItDoes:
      "Executes short-lived code on demand without managing long-running servers.",
    usedFor: [
      "Event-driven workflows",
      "Lightweight APIs",
      "Background tasks and automations",
    ],
  },
  {
    type: "job-worker",
    label: "Job Worker",
    category: "compute",
    description: "Async background worker",
    whatItDoes:
      "Consumes queued work and processes tasks outside the user request path.",
    usedFor: [
      "Email and notification jobs",
      "Image or document processing",
      "Long-running background tasks",
    ],
  },
  {
    type: "scheduler",
    label: "Scheduler",
    category: "compute",
    description: "Time-based job trigger",
    whatItDoes: "Starts jobs or workflows on a schedule or at specific times.",
    usedFor: [
      "Cron-style tasks",
      "Nightly batch jobs",
      "Periodic syncs and cleanups",
    ],
  },
  // Storage
  {
    type: "sql-db",
    label: "SQL DB",
    category: "storage",
    description: "Relational database (PostgreSQL)",
    whatItDoes:
      "Stores structured data with schemas, transactions, and relational queries.",
    usedFor: ["Transactional systems", "User and order data", "ACID workloads"],
  },
  {
    type: "nosql-db",
    label: "NoSQL DB",
    category: "storage",
    description: "Document store (MongoDB)",
    whatItDoes:
      "Stores flexible or semi-structured data with schema-light access patterns.",
    usedFor: [
      "Document data models",
      "Rapidly evolving schemas",
      "High-scale read/write workloads",
    ],
  },
  {
    type: "vector-db",
    label: "Vector DB",
    category: "storage",
    description: "Embeddings store (Pinecone)",
    whatItDoes:
      "Indexes embeddings so similar items can be retrieved through nearest-neighbor search.",
    usedFor: [
      "RAG systems",
      "Semantic search",
      "Recommendation and similarity matching",
    ],
  },
  {
    type: "cache",
    label: "Cache",
    category: "storage",
    description: "In-memory store (Redis)",
    whatItDoes:
      "Keeps hot data in memory to reduce latency and offload primary databases.",
    usedFor: [
      "Session storage",
      "Read caching",
      "Rate limiting and ephemeral state",
    ],
  },
  {
    type: "object-storage",
    label: "Object Storage",
    category: "storage",
    description: "Blob storage (S3)",
    whatItDoes:
      "Stores files and large blobs durably with simple key-based access.",
    usedFor: [
      "Images and media",
      "Documents and backups",
      "Data exports and archives",
    ],
  },
  {
    type: "data-lake",
    label: "Data Lake",
    category: "storage",
    description: "Large-scale raw data storage",
    whatItDoes:
      "Collects large volumes of raw data for later processing, analytics, or machine learning.",
    usedFor: [
      "Analytics pipelines",
      "Batch data ingestion",
      "Historical raw event storage",
    ],
  },
  {
    type: "graph-db",
    label: "Graph DB",
    category: "storage",
    description: "Relationship-focused (Neo4j)",
    whatItDoes:
      "Stores entities and their relationships so traversal-heavy queries stay fast.",
    usedFor: [
      "Fraud detection",
      "Knowledge graphs",
      "Social and dependency graphs",
    ],
  },
  {
    type: "time-series-db",
    label: "Time-Series DB",
    category: "storage",
    description: "Timestamped metric storage",
    whatItDoes:
      "Stores time-indexed measurements efficiently for querying trends and recent values.",
    usedFor: [
      "Metrics retention",
      "IoT telemetry history",
      "Operational trend analysis",
    ],
  },
  // Messaging
  {
    type: "message-queue",
    label: "Message Queue",
    category: "messaging",
    description: "Async task queue (SQS)",
    whatItDoes:
      "Buffers work items so producers and consumers can operate independently.",
    usedFor: ["Background jobs", "Retryable tasks", "Smoothing traffic spikes"],
  },
  {
    type: "event-bus",
    label: "Event Bus",
    category: "messaging",
    description: "Event streaming (Kafka)",
    whatItDoes:
      "Distributes events to multiple consumers without tightly coupling producers to them.",
    usedFor: [
      "Event-driven systems",
      "Audit/event streams",
      "Fan-out integrations",
    ],
  },
  {
    type: "stream-processor",
    label: "Stream Processor",
    category: "messaging",
    description: "Real-time processing (Flink)",
    whatItDoes:
      "Consumes continuous event streams and transforms or aggregates them in real time.",
    usedFor: [
      "Real-time analytics",
      "Fraud and anomaly detection",
      "Live ETL pipelines",
    ],
  },
  {
    type: "webhook",
    label: "Webhook",
    category: "messaging",
    description: "HTTP callback endpoint",
    whatItDoes:
      "Receives outbound event notifications over HTTP from third-party or internal systems.",
    usedFor: [
      "Third-party integrations",
      "Payment callbacks",
      "Triggering downstream workflows",
    ],
  },
  {
    type: "dead-letter-queue",
    label: "Dead Letter Queue",
    category: "messaging",
    description: "Failed message holding queue",
    whatItDoes:
      "Captures messages or jobs that could not be processed successfully after retries.",
    usedFor: [
      "Failure isolation",
      "Poison message handling",
      "Operational replay and debugging",
    ],
  },
  // AI / ML
  {
    type: "llm",
    label: "LLM",
    category: "ai-ml",
    description: "Large language model (GPT-4)",
    whatItDoes:
      "Generates, summarizes, or transforms language based on prompts and context.",
    usedFor: [
      "Chat and assistants",
      "Content generation",
      "Reasoning over text",
    ],
  },
  {
    type: "rag-pipeline",
    label: "RAG Pipeline",
    category: "ai-ml",
    description: "Retrieval-augmented generation",
    whatItDoes:
      "Fetches relevant context before passing it to an LLM so responses are grounded in external data.",
    usedFor: [
      "Enterprise search assistants",
      "Document question answering",
      "Knowledge-grounded copilots",
    ],
  },
  {
    type: "ml-model",
    label: "ML Model",
    category: "ai-ml",
    description: "Custom ML inference endpoint",
    whatItDoes:
      "Serves predictions from a trained model over an inference API.",
    usedFor: [
      "Classification and ranking",
      "Recommendation systems",
      "Custom predictive models",
    ],
  },
  {
    type: "embedding-service",
    label: "Embeddings",
    category: "ai-ml",
    description: "Text/image embedding service",
    whatItDoes:
      "Converts content into vectors so machines can compare meaning or similarity.",
    usedFor: [
      "Semantic search",
      "Clustering and retrieval",
      "RAG indexing pipelines",
    ],
  },
  {
    type: "ai-agent",
    label: "AI Agent",
    category: "ai-ml",
    description: "Autonomous AI agent (tool use)",
    whatItDoes:
      "Plans steps, invokes tools, and coordinates actions toward a higher-level goal.",
    usedFor: [
      "Workflow automation",
      "Tool-using assistants",
      "Multi-step task execution",
    ],
  },
  {
    type: "fine-tuning",
    label: "Fine-Tuning",
    category: "ai-ml",
    description: "Model fine-tuning pipeline",
    whatItDoes:
      "Adapts a base model to a specific task or domain using additional training data.",
    usedFor: [
      "Domain-specific behavior",
      "Style adaptation",
      "Improving task accuracy",
    ],
  },
  {
    type: "model-router",
    label: "Model Router",
    category: "ai-ml",
    description: "Routes requests across models",
    whatItDoes:
      "Chooses which model or provider should handle a request based on cost, latency, or capability rules.",
    usedFor: [
      "Multi-model systems",
      "Fallback and failover routing",
      "Cost-aware inference selection",
    ],
  },
  // Networking
  {
    type: "dns",
    label: "DNS",
    category: "networking",
    description: "Domain name resolution",
    whatItDoes:
      "Maps human-readable domain names to IP addresses or service endpoints.",
    usedFor: [
      "Public domain routing",
      "Internal service discovery",
      "Failover and traffic steering",
    ],
  },
  {
    type: "firewall",
    label: "Firewall",
    category: "networking",
    description: "Network traffic filtering",
    whatItDoes: "Allows or blocks traffic based on network and security rules.",
    usedFor: [
      "Perimeter defense",
      "Segmentation between services",
      "Restricting inbound or outbound access",
    ],
  },
  {
    type: "rate-limiter",
    label: "Rate Limiter",
    category: "networking",
    description: "Request throttling",
    whatItDoes:
      "Caps how many requests a client or service can make in a time window.",
    usedFor: [
      "Abuse prevention",
      "Protecting backend capacity",
      "Enforcing tenant quotas",
    ],
  },
  {
    type: "service-mesh",
    label: "Service Mesh",
    category: "networking",
    description: "Sidecar proxy (Istio)",
    whatItDoes:
      "Manages service-to-service communication policies, routing, and telemetry.",
    usedFor: [
      "Microservice observability",
      "Traffic shaping and retries",
      "mTLS between services",
    ],
  },
  {
    type: "reverse-proxy",
    label: "Reverse Proxy",
    category: "networking",
    description: "Request forwarding (Nginx)",
    whatItDoes:
      "Receives client traffic and forwards it to upstream services or applications.",
    usedFor: [
      "TLS termination",
      "Static content serving",
      "Routing to backend services",
    ],
  },
  {
    type: "service-discovery",
    label: "Service Discovery",
    category: "networking",
    description: "Tracks service endpoints",
    whatItDoes:
      "Maintains a registry of healthy service instances so clients can find them dynamically.",
    usedFor: [
      "Microservice endpoint lookup",
      "Dynamic scaling environments",
      "Internal name resolution",
    ],
  },
  // Clients
  {
    type: "web-client",
    label: "Web Client",
    category: "clients",
    description: "Browser-based application",
    whatItDoes: "Provides the browser UI that end users interact with.",
    usedFor: ["Customer-facing apps", "Admin dashboards", "Internal web tools"],
  },
  {
    type: "mobile-client",
    label: "Mobile Client",
    category: "clients",
    description: "iOS / Android app",
    whatItDoes: "Provides a native or hybrid mobile experience for end users.",
    usedFor: [
      "Consumer mobile apps",
      "Field and on-the-go workflows",
      "Push notification experiences",
    ],
  },
  {
    type: "iot-device",
    label: "IoT Device",
    category: "clients",
    description: "Connected sensor/device",
    whatItDoes:
      "Produces telemetry or receives commands from the platform over a network.",
    usedFor: [
      "Sensor networks",
      "Smart devices",
      "Industrial telemetry systems",
    ],
  },
  {
    type: "desktop-client",
    label: "Desktop App",
    category: "clients",
    description: "Native desktop application",
    whatItDoes:
      "Delivers an installed desktop interface with local OS integration.",
    usedFor: [
      "Power-user tools",
      "Internal enterprise clients",
      "Offline-capable applications",
    ],
  },
  // Observability
  {
    type: "log-aggregator",
    label: "Log Aggregator",
    category: "observability",
    description: "Centralized logging (ELK)",
    whatItDoes: "Collects logs from many systems into one searchable place.",
    usedFor: [
      "Operational debugging",
      "Audit trails",
      "Incident investigation",
    ],
  },
  {
    type: "metrics-server",
    label: "Metrics",
    category: "observability",
    description: "Metrics collection (Prometheus)",
    whatItDoes:
      "Scrapes or receives time-series measurements about system health and performance.",
    usedFor: [
      "Dashboards",
      "Capacity planning",
      "SLO and performance monitoring",
    ],
  },
  {
    type: "tracing",
    label: "Tracing",
    category: "observability",
    description: "Distributed tracing (Jaeger)",
    whatItDoes:
      "Tracks a request across services so latency and failure points are visible.",
    usedFor: [
      "Microservice debugging",
      "Latency analysis",
      "Dependency mapping",
    ],
  },
  {
    type: "alerting",
    label: "Alerting",
    category: "observability",
    description: "Alert management (PagerDuty)",
    whatItDoes:
      "Routes operational alerts to the right people or escalation policies.",
    usedFor: [
      "Incident response",
      "On-call workflows",
      "Threshold or anomaly notifications",
    ],
  },
  {
    type: "error-tracker",
    label: "Error Tracker",
    category: "observability",
    description: "Captures application exceptions",
    whatItDoes:
      "Collects runtime exceptions, stack traces, and release context for faster debugging.",
    usedFor: [
      "Frontend and backend error monitoring",
      "Release regression tracking",
      "Crash triage",
    ],
  },
  // Security
  {
    type: "waf",
    label: "WAF",
    category: "security",
    description: "Web application firewall",
    whatItDoes:
      "Inspects and filters HTTP traffic to block common web attacks before they hit the app.",
    usedFor: [
      "Bot and exploit protection",
      "Internet-facing apps",
      "Edge security controls",
    ],
  },
  {
    type: "vault",
    label: "Vault",
    category: "security",
    description: "Secrets management (HashiCorp)",
    whatItDoes:
      "Stores and controls access to secrets, credentials, and encryption material.",
    usedFor: [
      "Database credentials",
      "API keys and tokens",
      "Secret rotation workflows",
    ],
  },
  {
    type: "identity-provider",
    label: "Identity Provider",
    category: "security",
    description: "SSO / SAML / OIDC",
    whatItDoes: "Authenticates users and issues identity assertions or tokens.",
    usedFor: [
      "Single sign-on",
      "Enterprise auth",
      "Centralized user identity management",
    ],
  },
  {
    type: "oauth-server",
    label: "OAuth Server",
    category: "security",
    description: "Authorization server",
    whatItDoes:
      "Issues access tokens and manages delegated permissions between clients and APIs.",
    usedFor: [
      "API authorization",
      "Third-party app access",
      "Scoped token issuance",
    ],
  },
  {
    type: "kms",
    label: "KMS",
    category: "security",
    description: "Key management service",
    whatItDoes:
      "Creates, stores, and rotates encryption keys used by applications and infrastructure.",
    usedFor: [
      "Envelope encryption",
      "Token and data key management",
      "Key rotation and access control",
    ],
  },
];

export const getNodeCatalogItem = (type: SystemNodeType) =>
  NODE_CATALOG.find((item) => item.type === type);

export const DEFAULT_NODE_CONFIG: NodeConfig = {
  label: "",
  replicas: 1,
  region: "us-east-1",
  cpu: 2,
  memory: 4,
  hourlyCost: 0,
  throughputLimit: 1000,
  latency: 10,
  notes: "",
};

export const DEFAULT_EDGE_CONFIG: EdgeConfig = {
  protocol: "HTTP",
  latency: 5,
  bandwidth: 100,
  label: "",
};
