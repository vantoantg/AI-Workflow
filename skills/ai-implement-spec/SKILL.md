---
name: ai-implement-spec
description: Use when the user wants to implement a Jira ticket that already has an approved spec artifact folder in .ai/specs/. Reads spec.md/plan.md/test-cases.md/tasks.md, follows the implementation checklist in tasks.md, applies TDD from test-cases.md, tracks retry attempts, and updates the workflow state file as it goes.
argument-hint: "JIRA-ID-1234"
---

# KL Implement Spec

## Overview
Read the `.ai/specs/TICKET-ID-Slug/` artifact folder produced and approved via `ai-ticket-spec`, then execute the implementation end-to-end: source changes, tests first (TDD) from `test-cases.md`, lint, coverage check, and state file updates at every phase boundary.

## Process

### Step 1 — Locate the spec folder
Given a ticket ID (e.g. `JIRA-ID-1234`), find the matching spec folder:

```bash
find .ai/specs -type d -name "JIRA-ID-1234-*" | head -1
```

Read `spec.md`, `research.md` (if present), `plan.md`, `test-cases.md`, and `tasks.md` in full. If no spec folder exists, stop and tell the user to run `/ai-ticket-spec TICKET-ID` first. If `test-cases.md` is missing, stop and ask the user to regenerate or update the spec artifacts before implementation.

### Step 2 — Load the workflow state file
Read `.ai/workflow/TICKET-ID.json`. It tells you:
- Which phases are already complete
- Human approvals already granted
- Current `retryCount.implementation` value
- Previous test results

If the state file does not exist, create it now:

```json
{
  "ticket": "TICKET-ID",
  "status": "implementation-in-progress",
  "specDir": ".ai/specs/TICKET-ID-Slug",
  "artifacts": {
    "spec": ".ai/specs/TICKET-ID-Slug/spec.md",
    "plan": ".ai/specs/TICKET-ID-Slug/plan.md",
    "testCases": ".ai/specs/TICKET-ID-Slug/test-cases.md",
    "tasks": ".ai/specs/TICKET-ID-Slug/tasks.md"
  },
  "branch": "<current branch>",
  "humanApprovals": { "spec": true, "highRisk": false, "diff": false },
  "retryCount": { "implementation": 0, "selfReview": 0 },
  "testsRun": [],
  "blockers": []
}
```

### Step 3 — Load context
Before touching any code, read every file listed in the **Codebase Context** section of `spec.md` and the **Affected Files/Modules** section of `plan.md`. Use `test-cases.md` to identify required test files, concrete scenarios, expected assertions, and verification commands. Understand current behaviour fully before proposing changes.

Also read the relevant test files so you know what already exists.

### Step 4 — High-risk check
Before writing any code, check if this implementation touches any high-risk area:

```text
Extra model shape          ExtraDataProvider interface
calculateTax               applyTaxClassDefaults
ResponseCache              DynamoDB persistence
OpenAPI spec               provider mappings
Authentication/authZ       CI/CD or infrastructure
```

If yes → **stop** and present the risk to the human before continuing. Record `humanApprovals.highRisk: true` in the state file before proceeding.

### Step 5 — Implement using TDD

Follow the checklist in `tasks.md`, in order, and use `test-cases.md` as the required test contract. For every source change:

1. **Write the test first** — implement the matching TC-N.N scenario from `test-cases.md`
2. **Watch it fail** — run the specific test file to confirm RED
3. **Write minimal source code** to make it pass (GREEN)
4. **Run the full test suite** to catch regressions

```bash
# Run a single test file
npm test -- test/unit/path/to/file.test.ts

# Run full suite
npm test
```

**REQUIRED:** This project enforces 100% lines/functions/branches/statements. Every new code path must be covered.

### Step 6 — Test failure handling

When a test fails, determine the root cause before retrying:

| Root cause | Action |
|---|---|
| Implementation bug | Fix code → increment `retryCount.implementation` in state file → re-run |
| Spec was wrong or incomplete | **Stop** — update spec, ask human to re-approve before continuing |
| Pre-existing failure (unrelated) | Document in state file, do not count against retry cap |

**Retry cap:** If `retryCount.implementation` reaches **3**, stop immediately. Do not attempt further fixes. Present the structured blocker (see Blocker Format below) to the human and wait for guidance.

### Step 7 — Tick off checklist items
As each checklist item is completed, update `tasks.md`: change `- [ ]` to `- [x]` for that item only after its tests/code pass. When a TC-N.N verification command passes, update the matching row in `test-cases.md` to `Passed`. If a planned test case is intentionally not implemented, mark it `Skipped` and include a clear reason in its Notes.

### Step 8 — Final verification
After all checklist items are done, run the full verification sequence:

```bash
npm test          # All tests pass, coverage 100%
npm run lint      # No ESLint errors
```

If the API surface changed (new/modified endpoints, request/response shapes):
```bash
npm run compile-docs   # Regenerate src/docs/schema.ts
npm run spectral-lint  # Validate against NetDirector standards
```

Record every command and its result in `testsRun` in the state file. Before finishing, verify every required test case in `test-cases.md` is `Passed` or `Skipped` with a reason. Update `status` to `"implementation-complete"`.

### Step 9 — Report completion
Summarise:
- What was implemented
- Any deviations from the spec (and why)
- Retry events that occurred (`retryCount.implementation`)
- Test cases completed, passed, or skipped with reasons
- Checklist items that remain open (if any), with reason

---

## Key Conventions for This Repo

| Convention | Rule |
|------------|------|
| Tax calculation | Runs twice: once per provider on raw extras, once on merged results at final sale price. Don't break this two-pass pattern. |
| Provider interface | `activate()` + `requestExtras()` required; `calculateTax()` optional (throws `NotImplementedError` if absent). |
| MockMapper | Always call `MockMapper.reset()` in `beforeEach` — never share state between tests. |
| DynamoDB keys | Extra uses `dataset` (HASH) + `id` (RANGE). Composite IDs: `vehicleIdentifier#extraIdentifier`. |
| Env vars | Never hardcode table names or endpoints — always use `process.env.*`. |
| Date in tests | `MockDate` locks to `2021-06-10T07:40:38.933Z` — don't use `new Date()` in test assertions. |

## Red Flags — Stop and Reassess

- Writing source code before a failing test exists
- Checklist items skipped because they "seem straightforward"
- Coverage drops below 100% — fix before moving on
- `calculateTax` two-pass pattern altered without explicit spec instruction
- `process.env` replaced with a hardcoded value
- Weakening or removing assertions to make a test pass
- Incrementing `retryCount.implementation` past 3 without stopping

## Blocker Format

When a retry cap is hit or the spec appears wrong, output this structure before stopping:

```md
## Workflow Blocked

**Phase:** Implementation (retry N/3)

**Reason:** <what is failing and why>

**Failing tests:**
- `test/unit/...` — <error message>

**What I tried:**
1. <attempt 1>
2. <attempt 2>
3. <attempt 3>

**What I need from you:**
- Guidance on correct expected behaviour, OR
- Permission to try a different approach, OR
- Spec update if the requirement is unclear

Reply with `continue: <guidance>` or `stop workflow`.
```

## Related Skills
- **REQUIRED PREDECESSOR:** `ai-ticket-spec` — run this first to produce and approve the spec file
- **REQUIRED APPROACH:** `superpowers:test-driven-development` — follow TDD strictly; this project's 100% threshold enforces it
