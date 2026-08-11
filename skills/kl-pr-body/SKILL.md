---
name: kl-pr-body
description: Use when preparing a pull request body for a Jira-tracked ticket in this repository. Generates a standardized PR description from the workflow spec and state file.
argument-hint: "MNOPVS-1234"
---

# KL PR Description

## Overview
Generate a standardized pull request body file at `.kl/.pr/TICKET-ID.md` from the approved spec and workflow state. Called as part of `/kl-dev-ticket` Phase 7 or `/kl-pr-ready`.

## Process

### Step 1 — Read source artifacts

Read all of:
- `.kl/specs/TICKET-ID-Slug/spec.md` — acceptance criteria, risks
- `.kl/specs/TICKET-ID-Slug/plan.md` — solution approach
- `.kl/workflow/TICKET-ID.json` — tests run, retry events, approval state
- `git diff develop...HEAD` — summarize actual changes

### Step 2 — Write `.kl/.pr/TICKET-ID.md`

Create `.kl/.pr/` if it does not exist.

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
- If `retryCount.implementation > 0` in the state file, document the retry events under Notes for Reviewers.
- Do not invent risks. Use only what the spec and self-review findings surfaced.

## Output

After writing the file:
```
PR body written → .kl/.pr/TICKET-ID.md
```

The file is ready for human review before the PR is created.
