# TICKET-ID: Implementation Tasks

Ordered, AC-linked and TC-linked test-first tasks derived from `plan.md` and `test-cases.md`. Tick off `- [ ]` → `- [x]` only after the task's tests/code pass.

### Source changes
- [ ] AC-1 / TC-1.1: task description

### Tests
- [ ] TC-1.1 / AC-1: Add failing unit test — `test/unit/...`
- [ ] TC-1.2 / AC-1: Add edge/failure test — `test/unit/...`

### Verification
- [ ] TC-1.1: `npm test -- test/unit/...` — mark TC-1.1 `Passed` in `test-cases.md` only after this passes
- [ ] TC-1.2: `npm test -- test/unit/...` — mark TC-1.2 `Passed` in `test-cases.md` only after this passes
- [ ] `npm test` — all tests pass, coverage maintained
- [ ] `npm run lint` — no lint errors
- [ ] OpenAPI spec updated + `npm run compile-docs` (if API surface changed)
- [ ] `npm run spectral-lint` (if API surface changed)
