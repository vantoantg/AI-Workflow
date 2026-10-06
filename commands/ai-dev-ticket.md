# KL Dev Ticket

Full ticket-to-draft-PR workflow with human review gates.

**Usage:** `/ai-dev-ticket JIRA-ID-1234`

---

## How This Command Works

This command is the **human gate manager**. It does not implement code itself — it delegates autonomous phases to the `ai-orchestrator` agent and handles the human review gates in between.

```
main session (this command)
  │
  ├─ [pre-flight]
  │
  ├─ ai-orchestrator → "run spec phase"
  │       returns: spec file + risks + open questions
  │
  ├─ [GATE 1: human reviews spec — STOP]
  │
  ├─ ai-orchestrator → "run branch phase"
  │
  ├─ ai-orchestrator → "run impl phase"
  │       may return: awaiting-gate (high-risk) → relay to human → resume
  │       may return: blocked → relay to human → resume with guidance
  │       returns: diff summary + test results + review findings
  │
  ├─ [GATE 2: human reviews diff — STOP]
  │
  └─ ai-orchestrator → "run pr phase"
          returns: PR URL
```

---

## Phase 0 — Pre-flight (main session)

1. **Resolve ticket ID** — scan the user's message for `[A-Z]+-[0-9]+`. If not found, read `.ai/current.json` and use the `ticket` field. If still not found, ask the user to provide the ticket ID.
2. Run `git status`. If uncommitted changes exist that are unrelated to this ticket → **stop** and ask the human how to proceed.
3. Run `git branch --show-current`. Confirm the branch is sensible.
4. Check if `.ai/workflow/TICKET-ID.json` exists.
   - **If it exists:** Read it. Resume from `status`. Skip phases already completed and honour recorded human approvals.
   - **If it does not exist:** Proceed fresh.

---

## Phase 1 — Spec (delegated)

Call the `ai-orchestrator` agent:
```
Run spec phase for TICKET-ID
```

When the orchestrator returns `result: awaiting-gate` (gate type: spec):

**Present to human:**
```
Spec ready for review → .ai/specs/TICKET-ID-Slug/
  spec.md, plan.md, test-cases.md, tasks.md (and research.md if created)

Top risks:
<from orchestrator result>

Open questions:
<from orchestrator result>

STOP: Review the spec file. Reply "approve spec" to continue, or provide feedback.
```

Do not proceed until the human replies `approve spec`.

---

## Phase 2 — Branch (delegated)

After spec approval, call the `ai-orchestrator` agent:
```
Run branch phase for TICKET-ID
```

Confirm the branch name from the orchestrator result.

---

## Phase 3-5 — Implement, Verify, Self-review (delegated)

Call the `ai-orchestrator` agent:
```
Run impl phase for TICKET-ID
```

The orchestrator handles implementation, tests, and AI self-review autonomously. It may return intermediate results that need relaying to the human:

**If orchestrator returns `awaiting-gate` (gate type: high-risk):**
```
STOP: High-risk area detected.

<details from orchestrator>

Reply "approve high-risk approach" to continue, or "request changes: <details>".
```
After approval, update `.ai/workflow/TICKET-ID.json` with `humanApprovals.highRisk: true`, then re-call the orchestrator:
```
Run impl phase for TICKET-ID (high-risk approved, continue from where you left off)
```

**If orchestrator returns `blocked`:**
```
STOP: Workflow blocked.

<blocker details from orchestrator>

Reply "continue: <guidance>" or "stop workflow".
```
After guidance, relay it to the orchestrator:
```
Run impl phase for TICKET-ID — guidance: <human's guidance>
```

**When orchestrator returns `awaiting-gate` (gate type: diff):**
Proceed to Phase 6.

---

## Phase 6 — Human Diff Approval (main session gate)

Present the diff summary from the orchestrator result:

```
## Ready for Diff Review

<changed files, test results, review findings, retry events>
— from orchestrator result —

STOP: Review the diff with `git diff develop...HEAD`.
Reply "approve diff" to allow commit, push, and draft PR creation.
```

After approval:
- Write `humanApprovals.diff: true` to `.ai/workflow/TICKET-ID.json`.

---

## Phase 7 — PR (delegated)

Call the `ai-orchestrator` agent:
```
Run pr phase for TICKET-ID
```

Return the PR URL from the orchestrator result to the human.

---

## Approval Language Reference

| Human says | Action |
|---|---|
| `approve spec` | Proceed to Phase 2 |
| `approve high-risk approach` | Write approval to state file, re-call orchestrator to resume impl |
| `approve diff` | Write approval to state file, proceed to Phase 7 |
| `continue: <guidance>` | Relay guidance to orchestrator, resume blocked phase |
| `request changes: <details>` | Relay to orchestrator or revise spec as needed |
| `stop workflow` | Halt immediately |
