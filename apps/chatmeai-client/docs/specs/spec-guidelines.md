# Specs Guidelines

## General

- Each spec must have a single, well-defined objective. Avoid mixing unrelated concerns in the same spec.
- Write specs in a way that is implementation-agnostic when possible — describe *what* the system should do, not *how*.
- Keep specs concise. If a spec grows too large, split it into smaller, focused specs with clear dependencies.
- Always review existing specs before creating a new one to avoid duplication or contradictions.
- Specs must be written before implementation begins, not as documentation after the fact.

## Spec structure

Each spec file must contain:

1. **Title** — A short, descriptive name for the feature or change.
2. **Status** — One of: `draft`, `approved`, `in-progress`, `done`, `cancelled`.
3. **Objective** — One or two sentences describing the goal.
4. **Context** — Background information necessary to understand the spec.
5. **Requirements** — A numbered list of what must be implemented or changed.
6. **Out of scope** — Explicitly list what this spec does NOT cover.
7. **Dependencies** — Other specs that must be completed first (if any).
8. **Acceptance criteria** — Clear, testable conditions that define when the spec is done.

## Naming conventions

- File names must follow the pattern: `spec-NNNN-short-description.md`
  - `NNNN` is a zero-padded sequential number (e.g., `0001`, `0042`)
  - The short description uses kebab-case and summarizes the spec in 2–4 words
- Examples:
  ```
  spec-0001-project-setup.md
  spec-0002-auth-routes.md
  spec-0015-payment-integration.md
  ```

## Requirements writing

- Each requirement must be independently verifiable.
- Use imperative language: "The system **must**...", "The API **must return**...", "Users **must be able to**...".
- Distinguish between mandatory (`must`) and optional (`should`) requirements.
- Avoid vague terms like "fast", "simple", or "user-friendly" without measurable criteria.

## Specs versioning

- Always keep a `spec-version.txt` file listing all specs already executed, one per line.
- When a spec is updated after approval, increment a minor version in the file header (e.g., `v1.0` → `v1.1`) and add a changelog entry at the bottom of the spec.
- Never delete a completed spec — set its status to `done` or `cancelled` instead.

Example `spec-version.txt`:
```
spec-0001-project-setup.md
spec-0002-auth-routes.md
spec-0003-user-profile.md
```