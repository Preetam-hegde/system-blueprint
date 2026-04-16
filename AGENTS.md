# Repository Guidelines

## Project Structure & Module Organization
This project is a Vite-based React 18 + TypeScript app. Application code lives in `src/`. Use `src/components/system-design/` for feature-specific UI, `src/components/ui/` for reusable shadcn-style primitives, `src/pages/` for route targets, `src/store/` for Zustand state, `src/hooks/` for shared hooks, `src/lib/` for utilities, and `src/types/` for shared types. Static assets live in `public/`. Tests live under `src/test/` and may also sit beside source files as `*.test.ts` or `*.spec.tsx`.

## Build, Test, and Development Commands
Install dependencies with `npm install` or `bun install`. Use:

- `npm run dev` to start the Vite dev server.
- `npm run build` to produce a production bundle in `dist/`.
- `npm run build:dev` to test a development-mode build.
- `npm run preview` to serve the built app locally.
- `npm run lint` to run ESLint across the repo.
- `npm run test` to run Vitest once in `jsdom`.
- `npm run test:watch` for interactive test runs while developing.

## Coding Style & Naming Conventions
Write TypeScript with ES modules and 2-space indentation to match the existing codebase. Prefer functional React components, path aliases from `@/`, and PascalCase for components (`SystemNode.tsx`), camelCase for hooks/utilities (`useDesignStore.ts`, `utils.ts`), and kebab-free route files (`Index.tsx`, `NotFound.tsx`). Keep feature code near its owning module. Linting is enforced with `eslint.config.js`; React Hooks rules and React Refresh checks are enabled.

## Testing Guidelines
Vitest is configured in `vitest.config.ts` with `jsdom`, globals, and `src/test/setup.ts` for shared browser mocks. Name tests `*.test.ts`, `*.test.tsx`, `*.spec.ts`, or `*.spec.tsx`. Prefer Testing Library patterns for UI behavior and add coverage for new store logic, route behavior, and critical system-design interactions before merging.

## Commit & Pull Request Guidelines
Local Git history is not available in this workspace, so no repository-specific commit convention could be verified. Use short, imperative commit subjects with a clear scope, for example: `feat: add protocol info popover tests` or `fix: guard empty canvas selection`. Pull requests should include a concise summary, linked issue or task, test evidence (`npm run test`, `npm run lint`), and screenshots or short recordings for UI changes.
