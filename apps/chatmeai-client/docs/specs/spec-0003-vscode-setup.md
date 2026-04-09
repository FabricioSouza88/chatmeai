# spec-0003-vscode-setup

**Status:** done
**Version:** v1.0

## Objective

Add `.vscode/` configuration files so any developer can open the project and immediately run, debug, and format code without manual setup.

## Context

The project uses Vite, Vitest, TypeScript, ESLint, and Prettier (defined in `spec-0001`). VSCode is the team's primary editor. The `.vscode/` folder already has `extensions.json` preserved by `.gitignore` (`!.vscode/extensions.json`); this spec extends it with `settings.json`, `launch.json`, and `tasks.json`.

## Requirements

### 1. `extensions.json`

1.1. The file **must** list the following recommended extensions:

| Extension ID | Purpose |
|---|---|
| `dbaeumer.vscode-eslint` | ESLint integration |
| `esbenp.prettier-vscode` | Prettier formatter |
| `bradlc.vscode-tailwindcss` | Tailwind CSS IntelliSense |
| `vitejs.vite` | Vite project support |
| `vitest.explorer` | Vitest test runner UI |
| `ms-vscode.vscode-typescript-next` | Latest TypeScript language server |

---

### 2. `settings.json`

2.1. The file **must** configure:

| Setting | Value | Reason |
|---|---|---|
| `editor.defaultFormatter` | `"esbenp.prettier-vscode"` | Use Prettier for all files |
| `editor.formatOnSave` | `true` | Auto-format on save |
| `editor.codeActionsOnSave` | `{ "source.fixAll.eslint": "explicit" }` | Auto-fix ESLint on save |
| `editor.tabSize` | `2` | Match Prettier config |
| `typescript.tsdk` | `"node_modules/typescript/lib"` | Use workspace TypeScript version |
| `typescript.enablePromptUseWorkspaceTsdk` | `true` | Prompt to use workspace TS |
| `eslint.validate` | `["javascript", "javascriptreact", "typescript", "typescriptreact"]` | Enable ESLint for TS/TSX |
| `tailwindCSS.experimental.classRegex` | Pattern to enable IntelliSense inside `cn()` and `clsx()` calls | IntelliSense in utility functions |
| `files.associations` | `{ "*.css": "tailwindcss" }` | Treat CSS files as Tailwind |

---

### 3. `launch.json`

3.1. The file **must** define the following debug configurations:

#### 3.1.1. `Dev Server (Chrome)`
- **Type:** `chrome`
- **Request:** `launch`
- **URL:** `http://localhost:5173`
- **webRoot:** `${workspaceFolder}/src`
- **Prerequisite:** `npm run dev` must already be running (or triggered via `preLaunchTask`).
- **Purpose:** Opens Chrome with source maps attached to the Vite dev server.

#### 3.1.2. `Vitest: Current File`
- **Type:** `node`
- **Request:** `launch`
- **Program:** `${workspaceFolder}/node_modules/vitest/vitest.mjs`
- **Args:** `["run", "${relativeFile}"]`
- **Purpose:** Run only the test file currently open in the editor.

#### 3.1.3. `Vitest: All Tests`
- **Type:** `node`
- **Request:** `launch`
- **Program:** `${workspaceFolder}/node_modules/vitest/vitest.mjs`
- **Args:** `["run"]`
- **Purpose:** Run the full test suite with the debugger attached.

---

### 4. `tasks.json`

4.1. The file **must** define the following tasks, all using `npm` as the shell command:

| Label | Script | Group | Presentation |
|---|---|---|---|
| `dev` | `npm run dev` | `build` (default) | Panel: `new`, reveal: `always` |
| `build` | `npm run build` | `build` | Panel: `shared` |
| `lint` | `npm run lint` | `test` | Panel: `shared` |
| `typecheck` | `npm run typecheck` | `test` | Panel: `shared` |
| `test` | `npm run test` | `test` (default) | Panel: `shared` |
| `format` | `npm run format` | — | Panel: `shared` |

4.2. The `dev` task **must** have `"isBackground": true` and a `problemMatcher` that detects when the Vite server is ready (pattern: `"VITE v"` in stdout).

4.3. The `dev` task **must** be set as the `preLaunchTask` for the `Dev Server (Chrome)` launch configuration.

---

## Out of Scope

- CI/CD pipeline configuration.
- Remote development or Dev Container setup.
- Editor-specific configurations for editors other than VSCode.

## Dependencies

- `spec-0001-project-setup.md` — must be `done` (scripts `dev`, `build`, `lint`, `typecheck`, `test`, `format` must exist in `package.json`).

## Acceptance Criteria

- [ ] Opening the project in VSCode shows extension recommendations.
- [ ] Saving a `.ts` or `.tsx` file triggers Prettier format and ESLint auto-fix.
- [ ] Running the `dev` task from the Command Palette starts the Vite server in the terminal.
- [ ] The `Dev Server (Chrome)` launch config opens Chrome with breakpoints working in `src/` files.
- [ ] The `Vitest: Current File` launch config runs the currently open test file with the debugger.
- [ ] The `Vitest: All Tests` launch config runs the full suite.
- [ ] Tailwind CSS class IntelliSense works in `.tsx` files.
