---
name: ai-verify
description: Use when deciding which tests to run after an implementation change, or when recording verification results into the workflow state file. Covers unit, functional, full suite, and docs checks.
argument-hint: "JIRA-ID-1234 [optional: unit|functional|full]"
---

# KL Test Verification

## Overview
Standardize how the AI selects, runs, and records verification commands in this repository. `test-cases.md` is the source of truth for required scenario-level checks, and the state file `testsRun` array is the source of truth for commands actually run and their real results.

## Test Case Driven Verification

Before choosing commands, read `.ai/specs/TICKET-ID-Slug/test-cases.md` when it exists.

For every required test case:
1. Confirm the target test file exists or was created during implementation.
2. Run the listed `Verification Command`, or the closest project-correct equivalent if the command is stale.
3. Record the command result in `.ai/workflow/TICKET-ID.json`.
4. Mark the test case `Passed` in `test-cases.md` only if the command passed and the test case is covered by that command.
5. If a required test case cannot be run, leave it as `Planned` or mark it `Skipped` only with a reason.

Do not mark a verification task in `tasks.md` as done until the corresponding TC-N.N row in `test-cases.md` is `Passed` or explicitly `Skipped` with a reason.

## Selection Rules

### When to run targeted unit tests only
Run when:
- Changes are isolated to a single provider, model method, or utility function
- No cross-module behaviour is involved

```bash
npm test -- test/unit/path/to/relevant.test.ts
```

### When to run functional tests as well
Run when:
- Changes cross handler → provider → model boundaries
- Middleware, response merging, or tax calculation is affected
- Provider activation logic changed

```bash
npm test -- test/functional/path/to/relevant.test.ts
```

### When to run the full suite (`npm test`)
Run when:
- Any of these are touched: `Extra` model, `mergeExtraSets`, `applyTaxClassDefaults`, handler middleware stack, `ConfigCache`, DynamoDB key structure
- A refactor spans more than one module
- You are not confident which tests are affected

```bash
npm test
```

### When to run docs checks
Run when the public API surface changes (new/modified endpoints, request or response shape changes):

```bash
npm run compile-docs   # Regenerate src/docs/schema.ts from api-spec.yaml
npm run spectral-lint  # Validate against NetDirector standards
```

## Recording Results

After every command, record an entry in `.ai/workflow/TICKET-ID.json`:

```json
{
  "testsRun": [
    {
      "command": "npm test -- test/unit/module/provider/omni/client.test.ts",
      "result": "passed",
      "timestamp": "2026-07-29T10:00:00Z"
    },
    {
      "command": "npm test",
      "result": "not-run",
      "reason": "environment missing SST outputs; targeting unit tests only"
    }
  ]
}
```

Valid `result` values: `"passed"` | `"failed"` | `"not-run"`.

## Rules

- **Never claim tests passed unless they were actually run.** If a command could not run due to environment constraints, record `"not-run"` with a reason.
- **Never skip to a broader suite before fixing a targeted failure.** Passing `npm test` when targeted tests fail does not make them pass.
- **100% coverage is required** — if `npm run test-coverage` shows a drop below 100% on lines/functions/branches/statements, fix the gap before proceeding.
- Do not run integration tests (`npm run test-integration`) as part of this workflow — they require a deployed stack.

## Verification Output Format

When reporting verification to the human:

```md
## Verification

- [x] `npm test -- test/unit/module/provider/omni/client.test.ts` — passed
- [x] `npm test` — passed, coverage 100%
- [ ] `npm run compile-docs` — not applicable, no API surface changed
- [ ] `npm run spectral-lint` — not applicable, no OpenAPI spec change
```

Use `[x]` only for passed. Use `[ ]` with a reason for not-run or not-applicable.
