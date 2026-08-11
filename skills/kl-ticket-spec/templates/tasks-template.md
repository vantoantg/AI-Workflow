# TICKET-ID: Implementation Tasks

Ordered, AC-linked, test-first tasks derived from `plan.md`. Tick off `- [ ]` → `- [x]` only after the task's tests/code pass.

### Source changes
- [ ] AC-1: task description

### Tests
- [ ] AC-1: Unit test — `test/unit/...`
- [ ] AC-2: Functional test — `test/functional/...`

### Verification
- [ ] `npm test` — all tests pass, 100% coverage maintained
- [ ] `npm run lint` — no lint errors
- [ ] OpenAPI spec updated + `npm run compile-docs` (if API surface changed)
- [ ] `npm run spectral-lint` (if API surface changed)
