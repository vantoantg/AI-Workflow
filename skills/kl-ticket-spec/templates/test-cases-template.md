# TICKET-ID: Test Cases

Concrete, AC-linked test cases that implementation and verification must follow. Every acceptance criterion from `spec.md` should have at least one positive test case. High-risk behavior should also have negative, edge, or failure-mode test cases.

## Traceability Matrix

| Test Case | AC | Type | Scenario | Target File | Verification Command | Status |
|---|---|---|---|---|---|---|
| TC-1.1 | AC-1 | Unit | happy-path behavior to verify | `test/unit/...` | `npm test -- test/unit/...` | Planned |
| TC-1.2 | AC-1 | Unit | edge or failure behavior to verify | `test/unit/...` | `npm test -- test/unit/...` | Planned |

Allowed status values:
- `Planned` — generated during spec phase, not implemented yet
- `Implemented` — test exists but has not passed yet
- `Passed` — test exists and the listed verification command passed
- `Skipped` — intentionally not implemented; include the reason in Notes

## Test Case Details

### TC-1.1: [Short scenario title]

| Field | Value |
|---|---|
| Acceptance Criterion | AC-1 |
| Type | Unit / Functional / Integration / Contract / Docs |
| Priority | Required / Recommended |
| Target File | `test/unit/...` |
| Verification Command | `npm test -- test/unit/...` |

**Given**
- concrete setup, fixtures, existing records, request payload, or mocked dependency state

**When**
- action under test

**Then**
- specific observable assertions; avoid vague expectations like "works" or "is defined"

**Notes**
- test data, mock requirements, or reason if skipped

---

### TC-1.2: [Short scenario title]

| Field | Value |
|---|---|
| Acceptance Criterion | AC-1 |
| Type | Unit / Functional / Integration / Contract / Docs |
| Priority | Required / Recommended |
| Target File | `test/unit/...` |
| Verification Command | `npm test -- test/unit/...` |

**Given**
- concrete setup, fixtures, existing records, request payload, or mocked dependency state

**When**
- action under test

**Then**
- specific observable assertions; avoid vague expectations like "works" or "is defined"

**Notes**
- test data, mock requirements, or reason if skipped

## Coverage Checklist

- [ ] Every AC has at least one positive test case.
- [ ] High-risk ACs have negative, edge, or failure-mode test cases.
- [ ] Every required test case has a target file.
- [ ] Every required test case has a verification command.
- [ ] Expected assertions are concrete and observable.
- [ ] Skipped or out-of-scope cases include a reason.
