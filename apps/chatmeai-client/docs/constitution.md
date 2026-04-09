# Project Constitution

## 0. Priority Order
1) This Constitution
2) Security & compliance requirements
3) Existing code patterns in the repo
4) Team preferences documented in /docs

If conflicts exist, stop and call them out.

## 1. Non-Negotiables (MUST)
- MUST run and pass: lint, typecheck, tests.
- MUST NOT commit secrets, tokens, or private keys.
- MUST keep changes minimal and scoped to the request.
- MUST update or add tests for bug fixes and new behaviors.
- MUST document user-facing changes.

## 2. Design Rules
- Prefer simple, readable solutions over clever ones.
- Avoid new dependencies unless explicitly approved.
- Preserve public APIs unless breaking change is approved.
- **Documentation must be compact and human-readable**: prefer short sentences, bullet points over paragraphs, and tables over prose. Omit sections that add no information for this specific doc.

## 3. Code Standards
- Follow existing patterns and naming.
- Error handling: never swallow exceptions; provide actionable messages.
- Logging: no PII; include request IDs where applicable.

## 4. Testing Standards
- Add tests for new behavior — cover success, failure, and edge cases.
- Bug fix requires regression test.
- Critical flows require an integration test (when applicable).

## 5. Security Rules
- No secrets in code or logs.
- Validate external inputs.
- Use least-privilege principles.

## 6. Commit Message Standard

Format: `<type>[!]: <subject>`

- Subject must be written in present indicative tense.
- Commit message with `!` to draw attention to breaking change

**Example:**
```
feat: add icon to home screen
^--^ ^------------------------^
|       |
|       +-> Description in present indicative tense.
|      
+-------> Type: feat, fix, docs
```

| Type | When to use | Example subject |
|------|-------------|-----------------|
| `feat` | Adds a new feature | `add parameter search` |
| `fix` | Fixes a bug | `remove broken message on confirmation` |
| `docs` | Documentation changes only | `explain parameter search function` |

## 7. Permissions

### Allowed without prompting
- Read files, list directories
- Single file linting, type checking, formatting
- Unit tests on specific files

### Require approval first
- Package installations
- Git operations (`git push`, `git commit`)
- File deletion
- Running full build or E2E test suites
- Terraform apply/destroy operations

## 8. Definition of Done
- All CI checks pass.
- Tests added/updated.
- Docs updated if needed.
- PR description includes "Constitution: ✅ Read" and key rules applied.