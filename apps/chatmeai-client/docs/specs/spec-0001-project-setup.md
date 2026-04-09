# spec-0001-project-setup

**Status:** done
**Version:** v1.1

## Objective

Bootstrap the `chatme-client` React application with a modern, production-ready setup — tooling, folder structure, styling foundation, and testing infrastructure — ready to receive feature development.

## Context

The application is a single-page chat UI inspired by ChatGPT. It requires a dark-themed, responsive layout with real-time-ready state management and clean API integration patterns. This spec covers only the project skeleton; no chat UI is built here.

## Requirements

### 1. Scaffolding
1.1. The project **must** be initialized with **Vite + React + TypeScript** (template: `react-ts`).
1.2. The TypeScript config **must** enable strict mode (`"strict": true`).
1.3. Path alias `@/` **must** be configured to resolve to `src/` in both `tsconfig.json` and `vite.config.ts`.

### 2. Folder Structure
2.1. The `src/` directory **must** follow the structure defined in `docs/project-guidelines.md`:
```
src/
  components/
  pages/
  hooks/
  services/
  store/
  utils/
  types/
  assets/
```
2.2. Each folder **must** contain a `.gitkeep` file if empty, to preserve the structure in version control.

### 3. Styling
3.1. **Tailwind CSS v4** **must** be installed and configured via its Vite plugin (`@tailwindcss/vite`).
3.2. Dark mode **must** be enabled using the `class` strategy (`darkMode: 'class'`).
3.3. The `Inter` font **must** be loaded (via Google Fonts or `fontsource`) and set as the default `sans` font in the Tailwind theme.
3.4. A global CSS file (`src/index.css`) **must** include the Tailwind directives and apply `dark` class to `<html>` by default (the app defaults to dark mode).

### 4. State Management
4.1. **Zustand** **must** be installed.
4.2. A placeholder store file `src/store/useChatStore.ts` **must** be created, exporting an empty Zustand store as a starting point.

### 5. Data Fetching
5.1. **TanStack Query v5** (`@tanstack/react-query`) **must** be installed.
5.2. A `QueryClient` **must** be instantiated in `src/main.tsx` and provided via `QueryClientProvider` wrapping the app.

### 6. HTTP Client
6.1. **Axios** **must** be installed.
6.2. A base Axios instance **must** be created at `src/services/api.ts`, reading `VITE_API_BASE_URL` from environment variables.

### 7. Linting & Formatting
7.1. **ESLint** **must** be configured with `eslint-plugin-react`, `@typescript-eslint`, and `eslint-plugin-react-hooks`.
7.2. **Prettier** **must** be installed with a `.prettierrc` config (single quotes, trailing commas `es5`, print width 100).
7.3. An `.eslintignore` and `.prettierignore` **must** exclude `dist/` and `node_modules/`.
7.4. `package.json` **must** expose the scripts: `lint`, `format`, `typecheck`.

### 8. Testing
8.1. **Vitest** **must** be installed and configured in `vite.config.ts` with `environment: 'jsdom'`.
8.2. **React Testing Library** (`@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`) **must** be installed.
8.3. A `src/tests/setup.ts` file **must** import `@testing-library/jest-dom` and be referenced in the Vitest `setupFiles` config.
8.4. A smoke test `src/tests/App.test.tsx` **must** exist and assert that the app renders without crashing.
8.5. `package.json` **must** expose the script: `test`, `test:ui`.

### 9. Environment
9.1. A `.env.example` file **must** be committed with the required variable:
```
VITE_API_BASE_URL=http://localhost:3000
```
9.2. `.env` **must** be listed in `.gitignore`.

### 10. Entry Point
10.1. `src/main.tsx` **must** render the `<App />` component wrapped with `QueryClientProvider`.
10.2. `src/App.tsx` **must** be a minimal functional component — no placeholder text or demo content from the Vite template.

## Out of Scope

- Any chat UI components or pages.
- Routing setup (react-router or similar).
- Authentication.
- WebSocket / real-time integration.
- CI/CD pipeline configuration.
- Docker or deployment setup.

## Dependencies

None — this is the first spec.

## Acceptance Criteria

- [x] `npm run dev` starts the app without errors.
- [x] `npm run build` produces a clean `dist/` with no TypeScript errors.
- [x] `npm run lint` exits with code 0.
- [x] `npm run typecheck` exits with code 0.
- [x] `npm run test` runs and the smoke test passes.
- [x] Import alias `@/` resolves correctly in at least one file (e.g., `src/App.tsx`).
- [x] App renders with dark background by default (dark mode class applied).
- [x] `src/services/api.ts` reads `VITE_API_BASE_URL` from `.env`.
- [x] `src/store/useChatStore.ts` exports a valid Zustand store.

## Changelog

### v1.1
- Switched test environment from `jsdom` to `happy-dom` due to ESM incompatibility in `jsdom@27` with Node.js 20.17.0 (`@csstools/css-calc` is ESM-only).
- Requirement 8.1 updated: `environment: 'happy-dom'` instead of `jsdom`.
