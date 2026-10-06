# KL PR Ready

Prepare an existing branch for a draft PR. Use this when implementation is already done and you want AI verification, self-review, and a generated PR description before pushing.

**Usage:** `/ai-pr-ready JIRA-ID-1234`

---

## When to use

- Implementation was done manually (not via `/ai-dev-ticket`)
- You already have a branch with commits and want to prepare the PR
- You want a late-stage verification and review pass before pushing

---

## How This Command Works

Like `/ai-dev-ticket`, this command manages human gates. The `ai-orchestrator` agent handles the autonomous work.

```
main session (this command)
  │
  ├─ [pre-flight]
  │
  ├─ ai-orchestrator → "run verify-and-review phase for TICKET-ID"
  │       returns: test results + review findings
  │
  ├─ [GATE: human reviews diff — STOP]
  │
  └─ ai-orchestrator → "run pr phase for TICKET-ID"
          returns: PR URL
```

---

## Phase 0 — Pre-flight (main session)

1. **Resolve ticket ID** — scan the user's message for `[A-Z]+-[0-9]+`. If not found, read `.ai/current.json` and use the `ticket` field. If still not found, ask the user to provide the ticket ID.
2. Run `git status`. Flag any accidental unrelated changes, secrets, debug logs, or temp files.
3. Run `git diff develop...HEAD --stat`. Show the human a summary of changed files.
4. If a `.ai/specs/TICKET-ID-*/test-cases.md` file exists, use it as the primary verification checklist. If not, continue with changed-file-based verification.
5. Check if `.ai/workflow/TICKET-ID.json` exists. If not, create it:
   ```json
   {
     "ticket": "TICKET-ID",
     "status": "implementation-complete",
     "branch": "<current branch from git>",
     "humanApprovals": { "spec": false, "highRisk": false, "diff": false },
     "retryCount": { "implementation": 0, "selfReview": 0 },
     "testsRun": [],
     "blockers": []
   }
   ```

---

## Phase 1 — Verify and Review (delegated)

Call the `ai-orchestrator` agent:
```
Run verify-and-review phase for TICKET-ID
```

The orchestrator runs tests and all three reviewer agents. Handle any `blocked` results by relaying them to the human and resuming with guidance.

---

## Phase 2 — Human Diff Approval (main session gate)

Present the result from the orchestrator:

```
## Ready for Diff Review

<test results, review findings, retry events>

STOP: Review the diff with `git diff develop...HEAD`.
Reply "approve diff" to allow commit, push, and draft PR creation.
```

After approval, write `humanApprovals.diff: true` to the state file.

---

## Phase 3 — PR (delegated)

Call the `ai-orchestrator` agent:
```
Run pr phase for TICKET-ID
```

Return the PR URL.
