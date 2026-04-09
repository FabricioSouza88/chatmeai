# Project Guidelines – Frontend

## Project Overview
This is a modern frontend web application. Use this file to guide AI agents working in this repository.

---

## Tech Stack
- **Language:** TypeScript
- **Framework:** React (Vite or Next.js)
- **Styling:** Tailwind CSS
- **State Management:** Zustand / React Query
- **Testing:** Vitest, React Testing Library

---

## Project Structure
```
src/
  components/        # Reusable UI components
  pages/             # Page-level components or Next.js routes
  hooks/             # Custom React hooks
  services/          # API client and data-fetching logic
  store/             # Global state management
  utils/             # Helper functions
  types/             # TypeScript type definitions
  assets/            # Static assets (images, icons)
public/
tests/
.env
package.json
tsconfig.json
```

---

## Coding Guidelines
- Use PascalCase for React components and their file names.
- Use `camelCase` for variables, functions, and hooks.
- Prefer functional components with hooks over class components.
- Keep components small and focused; extract logic into custom hooks.
- Always type props and function signatures with TypeScript.
- Do not use `any`; prefer explicit types or `unknown`.

---

## Running the Project
```bash
npm install
npm run dev
```

## Running Tests
```bash
npm run test
```

## Building for Production
```bash
npm run build
```

---

## Notes for AI Agents
- Do not commit `.env` files; use `.env.example` as reference.
- Always add or update tests when adding new components or hooks.
- Run `npm run lint` before finalizing changes.
