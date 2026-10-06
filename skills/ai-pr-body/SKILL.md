---
name: ai-pr-body
description: Use when preparing a pull request body for a Jira-tracked ticket in this repository. Generates a standardized PR description from the workflow spec and state file.
argument-hint: "JIRA-ID-1234"
---

# KL PR Description

## Overview
Generate a standardized pull request body file at `.ai/pr/TICKET-ID.md` from the approved spec and workflow state. Called as part of `/ai-dev-ticket` Phase 7 or `/ai-pr-ready`.

## Process

### Step 1 — Read source artifacts

Read all of:
- `.ai/specs/TICKET-ID-Slug/spec.md` — acceptance criteria, risks
- `.ai/specs/TICKET-ID-Slug/plan.md` — solution approach
- `.ai/specs/TICKET-ID-Slug/test-cases.md` — planned, passed, and skipped test cases
- `.ai/workflow/TICKET-ID.json` — tests run, retry events, approval state
- `git diff develop...HEAD` — summarize actual changes

### Step 2 — Write `.ai/pr/TICKET-ID.md`

Create `.ai/pr/` if it does not exist.

Use the template below. Fill every section from the source artifacts — do not leave placeholder text.

---

## PR Body Template

```markdown
## Summary

Implements [TICKET-ID](https://keyloop.atlassian.net/browse/TICKET-ID).

<1–3 sentence description of what changed and why.>

## Changes

- <specific change 1>
- <specific change 2>

## Acceptance Criteria

- [x] <criterion from spec — mark checked only if implementation is complete>
- [ ] <criterion not yet met — note if out of scope>

## Testing

<!-- List every command actually run. Never claim passed if not run. -->
- [x] `<command>` — passed
- [ ] `<command>` — not run, reason: <why>

## Test Cases

<!-- Summarize test-cases.md. Required cases should be Passed or explicitly Skipped with a reason. -->
- [x] `TC-1.1` / `AC-1` — passed via `<command>`
- [ ] `TC-1.2` / `AC-1` — skipped, reason: <why>

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| <from spec risks section> | High / Med / Low | <mitigation> |

## Notes for Reviewers

- <any retry events: "implementation required 2 retries due to X">
- <any non-blocking self-review findings>
- <any deviations from the spec and why>
- <any follow-up tickets raised>
```

---

## Rules

- Only mark an acceptance criterion `[x]` if the implementation actually satisfies it and tests confirm it.
- Only mark a test command `[x]` if it was run and passed during this workflow — the `testsRun` array in the state file is the source of truth.
- Only mark a test case `[x]` if its `test-cases.md` status is `Passed`. If it is `Skipped`, include the reason.
- If `retryCount.implementation > 0` in the state file, document the retry events under Notes for Reviewers.
- Do not invent risks. Use only what the spec and self-review findings surfaced.

## Output

After writing the file:
```
PR body written → .ai/pr/TICKET-ID.md
```

The file is ready for human review before the PR is created.
