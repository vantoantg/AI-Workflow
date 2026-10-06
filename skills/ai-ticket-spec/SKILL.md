---
name: ai-ticket-spec
description: Use when the user provides a Jira ticket ID (e.g. JIRA-ID-1234) to analyze before implementation. Fetch, analyze, align with codebase, surface risks, and write a .ai/specs/TICKET-ID-Slug/ artifact folder ready for human review.
argument-hint: "JIRA-ID-1234 [optional: additional context about the task]"
---

# KL Ticket Spec

## Overview
Given a Jira ticket ID, produce a structured artifact folder at `.ai/specs/TICKET-ID-Slug/` — `spec.md` (analysis, codebase context, risks), `research.md` (conditional), `plan.md` (solution approach, test strategy), `test-cases.md` (AC-linked executable test design), and `tasks.md` (implementation checklist) — ready for human review and then execution with `/ai-implement-spec`.

## Process

### Step 0 — Resolve ticket ID
Scan `$ARGUMENTS` for a pattern matching `[A-Z]+-[0-9]+` (e.g. `JIRA-ID-1234`). If found, use it. If not found, check `.ai/current.json` for an active ticket. If still not found, ask the user to provide the ticket ID.

### Step 1 — Fetch the ticket
Use `mcp__atlassian__getJiraIssue` with the ticket ID.

Extract:
- Summary, description, type, priority, status
- Acceptance criteria (look in description or custom fields)
- Linked issues / parent epic

### Step 2 — Explore the codebase

**Step 2a — Resolve PKB project config.** Check `.ai/config.json` for a `pkbProjectId` field.
- If present, use it as the `project_id` filter for PKB MCP calls below.
- If `.ai/config.json` does not exist or lacks `pkbProjectId`, ask the user once: "What PKB project_id should this repo use for PKB MCP searches (e.g. NOP)?" Then create `.ai/config.json`:
  ```json
  {
    "pkbProjectId": "NOP"
  }
  ```
- If the user has no PKB project set up, skip 2b and go straight to 2c.

**Step 2b — Semantic search via PKB MCP.** If PKB MCP is available, use it as a first pass to narrow down affected areas:
- `search_codebase` with a natural-language description of the ticket's affected behaviour, `project_id` from config — surfaces relevant classes/functions/controllers.
- `search_docs` with the ticket's domain terms, `project_id` from config — surfaces prior business logic/architecture context.

Treat PKB results as a starting point, not ground truth — the index can be stale.

**Step 2c — Confirm with grep/find.** Based on ticket content and any PKB hits, search with `grep`/`find` for symbols, function names, and file paths mentioned in the ticket, to verify PKB's results and catch anything the index missed.

Key areas in this repo:

| Area | Path |
|------|------|
| Providers | `src/module/provider/` |
| Handlers | `src/common/handler/` |
| Models | `src/common/model/` |
| Config | `src/common/config/` |
| Unit tests | `test/unit/` |
| Functional tests | `test/functional/` |

Read the relevant files. Understand current behaviour before proposing changes.

### Step 3 — Identify risks

For every affected area ask:

- **Contract break** — does this change the `ExtraDataProvider` interface or `Extra` model shape?
- **Tax impact** — does this affect `calculateTax`, `applyTaxClassDefaults`, or the two-pass tax calculation?
- **Provider cache** — does this touch `ResponseCache` (LRU, 5-min TTL) that persists across warm Lambdas?
- **DynamoDB** — does this add/remove attributes, change key structure, or require a data migration?
- **Coverage** — will 100% branch/line/statement thresholds still hold after this change?
- **Cold-start / performance** — does this add latency on the Lambda critical path?
- **OpenAPI spec** — does the public API surface change? If yes, `npm run compile-docs` + `npm run spectral-lint` required.

### Step 4 — Write the spec artifacts

**Folder:** `.ai/specs/TICKET-ID-Slug/`
- Slug: lowercase hyphenated summary derived from the ticket title (max ~6 words)
- Example: `.ai/specs/JIRA-ID-1234-add-tax-class-for-extras/`

Create the folder if it does not exist. Write these files, using the templates in `templates/` (relative to this skill file). Fill every section — do not leave placeholder text.

| File | Template | When |
|------|----------|------|
| `spec.md` | `templates/spec-template.md` | Always |
| `research.md` | `templates/research-template.md` | Conditional — only when real uncertainties exist that need deeper investigation beyond the ticket + codebase context |
| `plan.md` | `templates/plan-template.md` | Always |
| `test-cases.md` | `templates/test-cases-template.md` | Always — derive concrete positive, negative, edge, and failure-mode tests from every AC and high-risk area |
| `tasks.md` | `templates/tasks-template.md` | Always — derive tasks from `plan.md`'s Solution Approach and `test-cases.md`; every test task must reference a TC-N.N ID |

---

### Step 5 — Self-validate the spec

Before surfacing the artifacts to the human, validate against this checklist. Fix any failures and re-validate (up to 3 iterations):

| Check | Pass if... |
|-------|------------|
| Acceptance criteria in BDD format | Every AC from the Jira ticket is a Given/When/Then scenario with an AC-N label — no bare bullet points |
| All risks answered | All 7 risk checklist items addressed (not skipped) |
| Plan is WHAT/WHY | `plan.md` Solution Approach has no TypeScript implementation details or specific function signatures |
| Test cases are traceable | `test-cases.md` maps every AC to at least one required test case with target file, concrete assertions, and verification command |
| High-risk test coverage | High-risk ACs include negative, edge, or failure-mode test cases, or a documented reason why not |
| Tasks are testable | Every item in `tasks.md` is specific — no vague tasks like "update tests" |
| Tasks reference test cases | Test and verification tasks reference TC-N.N IDs from `test-cases.md` |
| Assumptions documented | Any uncertainty converted to an assumption in `spec.md`, not left as an open question |
| Clarifications ≤ 3 | At most 3 items, each with an A/B/C option table |
| No placeholder text | No unfilled template fields remain across any artifact |

If all checks pass → proceed to Step 6.  
If a check fails → fix the relevant artifact → re-run. After 3 failed iterations → proceed and flag which checks remain open.

---

### Step 6 — Write pointer file

Write `.ai/current.json` so downstream commands can locate this ticket without requiring the user to re-enter it:

```json
{
  "ticket": "TICKET-ID",
  "specDir": ".ai/specs/TICKET-ID-Slug",
  "artifacts": {
    "spec": ".ai/specs/TICKET-ID-Slug/spec.md",
    "research": ".ai/specs/TICKET-ID-Slug/research.md",
    "plan": ".ai/specs/TICKET-ID-Slug/plan.md",
    "testCases": ".ai/specs/TICKET-ID-Slug/test-cases.md",
    "tasks": ".ai/specs/TICKET-ID-Slug/tasks.md"
  }
}
```

Omit `artifacts.research` if `research.md` was not created.

---

## Output

After writing the artifacts, confirm with:
```
Spec written → .ai/specs/TICKET-ID-Slug/
  spec.md
  research.md   (if created)
  plan.md
  test-cases.md
  tasks.md
```

Then briefly summarise:
- The top 1–2 risks found
- Any clarifications that should be resolved before the human approves the spec

**Stop here.** Wait for the human to review and approve the spec before proceeding to `/ai-implement-spec`.
