# System Blueprint

System Blueprint is a visual system design workspace for drawing architectures, loading interview-style templates, simulating traffic, and stress-testing scaling assumptions.

It is built with React 18, TypeScript, Vite, Zustand, Tailwind, and React Flow.

## What It Does

- Drag and drop system design components across compute, storage, messaging, AI/ML, networking, observability, security, and client categories.
- Inspect component purpose and common use cases from the palette and right-side config panel.
- Configure protocols, latency, bandwidth, regions, replicas, CPU, memory, throughput, and per-replica hourly cost.
- Start from prebuilt templates such as microservices, RAG, event-driven systems, e-commerce, chat, URL shortener, social feed, video streaming, ride dispatch, and LLM gateway.
- Filter templates by interview-oriented tags like `read-heavy`, `write-heavy`, `realtime`, `event-driven`, `ai`, `geo`, `media`, and `search`.
- Run live or replay simulation modes with request-rate controls.
- Inject failures and degradations including:
  - packet loss
  - extra latency
  - retry attempts and retry backoff
  - manual node failures
  - zone outage
  - regional latency
  - queue backlog
- Highlight replay paths directly on the graph, including current path position, accumulated latency, retries, and bottlenecks.
- Use the capacity planner for growth and spike what-if scenarios with replica recommendations, utilization risk, and projected cost.
- Export/import designs as JSON, export diagrams as PNG, and create shareable URLs.

## Stack

- `react` + `typescript`
- `vite` for development and production builds
- `vitest` + Testing Library for tests
- `zustand` for editor and simulation state
- `@xyflow/react` for the diagram canvas
- `tailwindcss` + Radix UI primitives for interface components

## Getting Started

### Requirements

- Node.js 20+
- npm 10+

### Install

```bash
npm install
```

If you want to validate the exact CI path locally:

```bash
npm clean-install --progress=false
```

### Run Locally

```bash
npm run dev
```

The app runs with Vite and is typically available at `http://localhost:8080`.

## Scripts

```bash
npm run dev
npm run build
npm run build:dev
npm run preview
npm run lint
npm run test
npm run test:watch
```

## Deployment Notes

- The project is pinned to Vite 6-compatible tooling so Cloudflare Wrangler can auto-detect and build it correctly.
- A repo-level `.npmrc` forces the public npm registry so VPN or corporate mirror settings do not leak Oracle-specific registry URLs into installs or lockfiles.
- Production output is generated in `dist/`.

## Project Structure

```text
src/
  components/
    system-design/   feature UI for canvas, templates, simulation, planner
    ui/              reusable primitives
  hooks/             shared hooks
  lib/               utilities
  pages/             route targets
  store/             Zustand editor state
  test/              test setup and specs
  types/             shared system design types and catalog data
public/              static assets
```

## Core Areas

### Templates

Templates are designed as starting points for common interview and production architecture discussions. They are not static screenshots; each template loads editable nodes and connections directly into the canvas.

### Simulation

Simulation supports two modes:

- `Live`: continuously recomputes load while the design is running.
- `Replay`: steps through a representative request path and surfaces path progress, latency buildup, retries, and bottlenecks.

### Capacity Planner

The planner uses current node configuration and simulated load to estimate:

- current versus projected RPS
- required replicas
- utilization risk
- current versus projected hourly cost
- bottlenecks under growth and spike scenarios

## Quality Checks

Run the standard checks before pushing changes:

```bash
npm run lint
npm run test
npm run build
```

## Testing

Vitest is configured with `jsdom` and Testing Library. Current tests cover the baseline setup and simulation scenario behavior. Add tests for store logic, route behavior, and critical editor interactions when extending the product.
