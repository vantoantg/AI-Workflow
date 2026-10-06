# KL Workflow Framework Design

## Purpose

`ai-workflow` is a reusable framework for AI-assisted development workflows. It packages Claude Code commands, agents, skills, and starter `.ai` configuration so other repositories can adopt a consistent ticket-to-draft-PR process.

The framework is intentionally **human-in-the-loop**. AI can perform analysis, implementation, verification, review, and draft PR preparation, but humans approve intent, risk, final diffs, PR review, merge, and deployment.

## Current Project Structure

This repository is both the source of truth for the workflow assets and the distributable CLI package that installs those assets into target projects.

```text
ai-workflow/
├── README.md
├── Workflow-design.md
├── package.json
├── bin/
│   └── index.js
├── agents/
│   ├── ai-orchestrator.md
│   ├── ai-senior-code-reviewer.md
│   ├── ai-test-reviewer.md
│   └── ai-typescript-reviewer.md
├── commands/
│   ├── ai-dev-ticket.md
│   └── ai-pr-ready.md
├── skills/
│   ├── ai-implement-spec/
│   │   └── SKILL.md
│   ├── ai-pr-body/
│   │   └── SKILL.md
│   ├── ai-ticket-spec/
│   │   ├── SKILL.md
│   │   └── templates/
│   │       ├── plan-template.md
│   │       ├── research-template.md
│   │       ├── spec-template.md
│   │       └── tasks-template.md
│   └── ai-verify/
│       └── SKILL.md
└── templates/
    └── config.json
```

The package exposes one CLI command:

```json
{
  "bin": {
    "ai-wfl": "bin/index.js"
  }
}
```

## Installation Model

Running `ai-wfl` in a target project copies the framework assets into the target project's Claude Code folders:

```text
ai-workflow package                  Target project
├── agents/              ───────►    .claude/agents/
├── commands/            ───────►    .claude/commands/
├── skills/              ───────►    .claude/skills/
└── templates/config.json ──────►    .ai/config.json
```

The CLI behavior is:

1. Scan the target project's `.claude/agents`, `.claude/commands`, and `.claude/skills` folders for conflicts.
2. If conflicts exist, print the conflicting paths and ask before overwriting.
3. Copy framework assets into `.claude/`.
4. Create `.ai/config.json` from `templates/config.json` if it does not already exist.
5. Warn if `.ai/config.json` has no `pkbProjectId`.

Current `.ai/config.json` template:

```json
{
  "pkbProjectId": ""
}
```

## Framework Responsibilities

The framework owns:

- A reusable command flow for ticket intake, implementation, verification, AI review, and draft PR creation.
- Standard artifact locations under `.ai/`.
- Human approval gates and resume state.
- A consistent orchestration pattern where commands manage gates and `ai-orchestrator` performs autonomous phases.
- Baseline reviewer roles for senior engineering review, TypeScript review, and test-quality review.
- A seed PKB project configuration file for scoped semantic search.

Target projects own:

- Repository-specific paths, test commands, build commands, domain-risk lists, branch conventions, PR base branch, and issue tracker conventions.
- Any local Claude instructions such as `CLAUDE.md`.
- Any customization needed for project-specific architecture, security, persistence, APIs, CI/CD, or release requirements.

## Installed Claude Assets

### Commands

| Command | Role | Human-facing behavior |
|---|---|---|
| `/ai-dev-ticket TICKET-ID` | Full ticket-to-draft-PR workflow | Runs pre-flight, delegates spec/branch/implementation/PR phases, and stops at human gates. |
| `/ai-pr-ready TICKET-ID` | Existing-branch PR preparation | Verifies and reviews an already implemented branch, then stops for diff approval before draft PR creation. |

Commands are **gate managers only**. They should not implement code directly.

### Orchestrator Agent

| Agent | Role |
|---|---|
| `ai-orchestrator` | Executes one autonomous phase at a time, reads and writes `.ai/workflow/TICKET-ID.json`, and returns structured results to the command/main session. |

Supported phases:

| Phase | Triggered by | Responsibility |
|---|---|---|
| `spec` | `/ai-dev-ticket` | Run ticket-spec workflow and create spec artifacts. |
| `branch` | `/ai-dev-ticket` after spec approval | Create branch and update workflow state. |
| `impl` | `/ai-dev-ticket` after branch phase | Implement, verify, and run AI self-review. |
| `verify-and-review` | `/ai-pr-ready` | Run verification and AI self-review for existing changes. |
| `pr` | Both commands after diff approval | Generate PR body, commit, push, and create draft PR. |

### Reviewer Agents

| Agent | Focus |
|---|---|
| `ai-senior-code-reviewer` | Architecture, correctness, SOLID, clean code, edge cases, security, performance, and scope control. |
| `ai-typescript-reviewer` | Type safety, strict-mode correctness, unsafe casts, generics, async typing, and idiomatic TypeScript. |
| `ai-test-reviewer` | Test quality, meaningful assertions, realistic mocks, failure modes, isolation, and test weakening. |

These agents are spawned by the orchestrator during implementation or PR readiness checks.

### Skills

| Skill | Purpose |
|---|---|
| `ai-ticket-spec` | Fetch and analyze a ticket, search the codebase, and write `.ai/specs/TICKET-ID-Slug/` artifacts, including `test-cases.md`. |
| `ai-implement-spec` | Implement an approved spec using `tasks.md` and `test-cases.md`, TDD, retry caps, and state updates. |
| `ai-verify` | Run verification from `test-cases.md` first, then changed-file-based checks, and record results in workflow state. |
| `ai-pr-body` | Generate `.ai/pr/TICKET-ID.md` from spec artifacts, state, and the actual diff. |

## Target Project Runtime Structure

After installation and during workflow execution, target projects use this structure:

```text
target-project/
├── .claude/
│   ├── agents/
│   │   ├── ai-orchestrator.md
│   │   ├── ai-senior-code-reviewer.md
│   │   ├── ai-test-reviewer.md
│   │   └── ai-typescript-reviewer.md
│   ├── commands/
│   │   ├── ai-dev-ticket.md
│   │   └── ai-pr-ready.md
│   └── skills/
│       ├── ai-implement-spec/
│       ├── ai-pr-body/
│       ├── ai-ticket-spec/
│       │   └── templates/
│       │       └── test-cases-template.md
│       └── ai-verify/
└── .ai/
    ├── config.json
    ├── current.json
    ├── specs/
    │   └── TICKET-ID-slug/
    │       ├── spec.md
    │       ├── research.md
    │       ├── plan.md
    │       ├── test-cases.md
    │       └── tasks.md
    ├── workflow/
    │   └── TICKET-ID.json
    └── pr/
        └── TICKET-ID.md
```

`.claude/` contains installed framework instructions. `.ai/` contains target-project runtime state and generated artifacts.

## End-to-end Workflow

Input:

```text
/ai-dev-ticket ABC-1234
```

Target output:

```text
Draft GitHub Pull Request
```

High-level flow:

```text
main session: pre-flight
  │
  ├─ ai-orchestrator: spec phase
  │    └─ writes .ai/specs/ABC-1234-slug/
  │
  ├─ GATE 1: human reviews spec
  │
  ├─ ai-orchestrator: branch phase
  │    └─ creates branch + updates .ai/current.json and .ai/workflow/ABC-1234.json
  │
  ├─ ai-orchestrator: impl phase
  │    ├─ validates spec readiness
  │    ├─ stops for high-risk approval when needed
  │    ├─ implements via TDD
  │    ├─ verifies changes
  │    └─ runs reviewer agents
  │
  ├─ GATE 2: human reviews final diff
  │
  ├─ ai-orchestrator: pr phase
  │    ├─ writes .ai/pr/ABC-1234.md
  │    ├─ commits approved files
  │    ├─ pushes branch
  │    └─ creates draft PR
  │
  └─ GATE 3: CI + human PR review + human merge
```

## Human Gates

| Gate | Required? | Owner | Purpose |
|---|---:|---|---|
| Pre-flight intervention | Conditional | Human + command | Protect unrelated local work and clarify missing ticket/branch context. |
| Spec review | Yes | Human | Approve intent, scope, acceptance criteria, assumptions, and risk framing. |
| Spec quality | Conditional | Orchestrator + human | Block implementation when required spec artifacts or clarifications are unresolved. |
| High-risk review | Conditional | Human | Approve changes touching project-specific high-risk areas. |
| Diff review | Yes | Human | Catch unrelated changes, secrets, bad tests, scope creep, or implementation mismatch. |
| PR review and merge | Yes | Human reviewers | Maintain code ownership, CI governance, and deployment safety. |

Commands should stop at gates and wait for explicit approval language such as:

```text
approve spec
approve high-risk approach
approve diff
continue: <guidance>
request changes: <details>
stop workflow
```

## Generated Artifacts

### Spec folder

`ai-ticket-spec` writes:

```text
.ai/specs/ABC-1234-ticket-slug/
├── spec.md
├── research.md   # conditional
├── plan.md
├── test-cases.md
└── tasks.md
```

| Artifact | Required? | Responsibility |
|---|---:|---|
| `spec.md` | Yes | Business-facing WHAT/WHY, acceptance criteria, codebase context, assumptions, risks, and clarifications. |
| `research.md` | Conditional | Decision-oriented analysis for meaningful uncertainty, trade-offs, and rejected options. |
| `plan.md` | Yes | Design-level HOW, affected files/modules, test strategy, verification strategy, and compatibility notes. |
| `test-cases.md` | Yes | Concrete AC-linked test design: positive, negative, edge, and failure-mode cases with target files, expected assertions, verification commands, and pass/skip status. |
| `tasks.md` | Yes | Ordered, AC-linked and TC-linked implementation checklist that the AI can execute test-first. |

Acceptance criteria should be written in BDD form:

```md
### AC-1: Short behavior name
- **Given** the relevant starting condition
- **When** the user/system action occurs
- **Then** the expected observable result is produced
```

`test-cases.md` should map every AC to executable tests:

```md
| Test Case | AC | Type | Scenario | Target File | Verification Command | Status |
|---|---|---|---|---|---|---|
| TC-1.1 | AC-1 | Unit | valid input returns expected output | `test/unit/...` | `npm test -- test/unit/...` | Planned |
| TC-1.2 | AC-1 | Unit | invalid input is rejected safely | `test/unit/...` | `npm test -- test/unit/...` | Planned |
```

During implementation and verification, a test case may be marked `Passed` only after its verification command passes. It may be marked `Skipped` only with a documented reason.

### Workflow state

`.ai/workflow/TICKET-ID.json` is the source of truth for resumability, approvals, retry caps, blockers, and test results.

Recommended schema:

```json
{
  "ticket": "ABC-1234",
  "status": "spec-created",
  "specDir": ".ai/specs/ABC-1234-ticket-slug",
  "artifacts": {
    "spec": ".ai/specs/ABC-1234-ticket-slug/spec.md",
    "research": ".ai/specs/ABC-1234-ticket-slug/research.md",
    "plan": ".ai/specs/ABC-1234-ticket-slug/plan.md",
    "testCases": ".ai/specs/ABC-1234-ticket-slug/test-cases.md",
    "tasks": ".ai/specs/ABC-1234-ticket-slug/tasks.md"
  },
  "branch": null,
  "humanApprovals": {
    "spec": false,
    "highRisk": false,
    "diff": false
  },
  "retryCount": {
    "implementation": 0,
    "selfReview": 0
  },
  "testsRun": [],
  "blockers": [],
  "specValidation": {
    "passed": true,
    "failedChecks": []
  }
}
```

Suggested statuses:

```text
initialized
spec-created
spec-approved
branch-created
implementation-in-progress
implementation-complete
verification-complete
ai-review-complete
diff-approved
draft-pr-created
blocked
```

### Active ticket pointer

`.ai/current.json` lets commands resume without the user re-entering the ticket ID:

```json
{
  "ticket": "ABC-1234",
  "specDir": ".ai/specs/ABC-1234-ticket-slug",
  "artifacts": {
    "spec": ".ai/specs/ABC-1234-ticket-slug/spec.md",
    "plan": ".ai/specs/ABC-1234-ticket-slug/plan.md",
    "testCases": ".ai/specs/ABC-1234-ticket-slug/test-cases.md",
    "tasks": ".ai/specs/ABC-1234-ticket-slug/tasks.md"
  },
  "stateFile": ".ai/workflow/ABC-1234.json",
  "branch": "feature/ABC-1234-ticket-slug"
}
```

### PR body

`ai-pr-body` writes:

```text
.ai/pr/ABC-1234.md
```

The PR body should include the ticket link, summary, changes, acceptance criteria checklist, test-case summary, commands actually run, risks, and reviewer notes.

## Pre-flight Rules

Before any autonomous phase changes files, the main session should:

1. Resolve ticket ID from the user message, then `.ai/current.json`, then human input.
2. Run `git status`.
3. Run `git branch --show-current`.
4. Check for an existing `.ai/workflow/TICKET-ID.json`.
5. Resume completed phases from state instead of repeating them.
6. Stop when the working tree contains unrelated or unsafe local changes.

The AI must not overwrite unrelated local work, mix changes from unrelated tickets, or push without explicit diff approval.

## Spec Quality Rules

Before implementation, the orchestrator should confirm:

- `spec.md`, `plan.md`, `test-cases.md`, and `tasks.md` exist.
- `research.md` exists when there are meaningful unresolved design choices.
- Acceptance criteria are BDD scenarios with stable `AC-N` labels.
- `plan.md` identifies affected files/modules, risk controls, and test strategy.
- `test-cases.md` maps every AC to concrete required test cases with target files, expected assertions, verification commands, and pass/skip status.
- High-risk ACs include negative, edge, or failure-mode test cases unless a reason is documented.
- `tasks.md` is ordered, specific, AC-linked, TC-linked, and test-first.
- Clarifications are resolved or converted into documented assumptions.
- `specValidation.passed` is true when present in state.

If these checks fail, the orchestrator returns `awaiting-gate` with `gateType: "spec-quality"` and does not write implementation code.

## Implementation Rules

The implementation phase should:

- Read all spec artifacts before editing.
- Re-read relevant source and test files before changing them.
- Follow `tasks.md` in order and use `test-cases.md` as the test contract.
- Prefer TDD: write or update a failing test for the next TC-N.N case, implement the smallest passing change, then verify.
- Tick task checkboxes only after the corresponding tests/code pass.
- Mark test cases `Passed` only after their verification command passes; mark `Skipped` only with a reason.
- Keep scope limited to the approved spec.
- Update spec artifacts and require human confirmation if implementation reveals the approved spec is wrong or incomplete.
- Record verification commands and results in `testsRun`.
- Return blockers instead of silently bypassing failures.

## Verification Rules

`ai-verify` chooses verification from `test-cases.md` first, then adds changed-file-based checks from target-project conventions.

The framework-level rules are:

- Read `test-cases.md` and run each required test case's verification command when available.
- Mark each test case `Passed` only after the command covering it passes.
- Run targeted checks for isolated changes.
- Run broader checks for cross-module, public contract, persistence, security, or high-risk changes.
- Run documentation/API validation when public interfaces change and the target project provides those commands.
- Never claim a command passed unless it was actually run and passed.
- Record skipped commands as `not-run` with a reason.

Target projects should customize concrete commands such as:

```bash
npm test -- path/to/relevant.test.ts
npm test
npm run lint
npm run build
npm run typecheck
npm run compile-docs
```

## Retry and Escalation Policy

Autonomous retry loops are capped so the AI cannot spin indefinitely or degrade quality to make progress.

| Phase | Trigger | Default cap | On cap |
|---|---|---:|---|
| Implementation | Test failure caused by implementation bug | 3 | Stop and return a structured blocker. |
| Self-review | Blocking reviewer findings remain after fixes | 2 | Stop and return unresolved findings. |

When blocked, the orchestrator should report:

```md
## Workflow Blocked

**Phase:** Implementation (retry 3/3)

**Reason:** <what is still failing>

**Failing checks:**
- `<command or reviewer>` — <failure summary>

**What I tried:**
1. <attempt>
2. <attempt>
3. <attempt>

**What I need from you:**
- Guidance on correct expected behavior, OR
- Permission to try a different approach, OR
- Spec update if the requirement is unclear
```

The AI must never weaken tests, skip failing checks silently, remove assertions, broaden mocks to hide incorrect behavior, or push past retry caps without human guidance.

## High-risk Change Policy

Each target project should customize its high-risk list. Framework defaults should include:

- Public API or schema changes.
- Authentication or authorization changes.
- Persistence model, migration, or data compatibility changes.
- Finance, price, tax, entitlement, permission, or compliance logic.
- CI/CD, deployment, infrastructure, or secrets handling.
- Large refactors, code deletion, or broad test rewrites.
- Cross-service or provider contract changes.

When high-risk areas are detected, the orchestrator returns `awaiting-gate` with `gateType: "high-risk"` and waits for explicit human approval before continuing.

## PR Phase Rules

The orchestrator may create a draft PR only after `humanApprovals.diff` is true in `.ai/workflow/TICKET-ID.json`.

Before committing, it should:

- Confirm the current diff matches the approved work.
- Stage specific changed files rather than blindly staging everything.
- Exclude secrets, local config, temporary files, debug output, and unrelated changes.
- Generate `.ai/pr/TICKET-ID.md` using `ai-pr-body`.
- Use the target project's configured base branch.

Default command shape:

```bash
git add <specific approved files>
git commit -m "ABC-1234: short description"
git push -u origin <branch>
gh pr create --draft \
  --base <target-base-branch> \
  --title "ABC-1234: ticket summary" \
  --body-file .ai/pr/ABC-1234.md
```

## Customization Guidelines for Target Projects

Because this repository is a framework, project-specific details should be explicit and easy to replace after installation.

Recommended customization points:

| Area | Where to customize |
|---|---|
| PKB project ID | `.ai/config.json` |
| Issue key examples | Command/skill examples if not Jira-style `ABC-1234` |
| Ticket provider | `ai-ticket-spec` skill |
| Repository paths | `ai-ticket-spec`, `ai-implement-spec`, reviewer agents |
| Test/build/lint commands | `ai-verify`, `ai-implement-spec`, reviewer agents |
| Test-case template | `skills/ai-ticket-spec/templates/test-cases-template.md` |
| High-risk domain list | `ai-orchestrator`, `ai-implement-spec`, reviewer agents |
| PR base branch | `ai-orchestrator`, `ai-pr-body` |
| PR template expectations | `ai-pr-body` |
| Review standards | Reviewer agents and project `CLAUDE.md` |

Project-specific guidance should live in the installed assets or in the target project's own `CLAUDE.md`. The framework design should remain generic enough to support multiple repositories.

## Framework Maintenance Guidelines

When changing this repository:

- Keep `README.md`, `Workflow-design.md`, `package.json`, and `bin/index.js` aligned.
- Add new installable assets under `agents/`, `commands/`, `skills/`, or `templates/`, and ensure `package.json.files` includes them.
- Keep CLI sync behavior safe: detect conflicts before overwrite and avoid modifying unrelated target files.
- Prefer generic framework defaults over one project's domain rules.
- If domain-specific examples are necessary, mark them as examples and make the customization path clear.
- Preserve the separation of responsibilities: commands manage gates, orchestrator executes phases, skills define task procedures, reviewer agents critique focused dimensions.

## Success Criteria

The framework is successful when a target project can:

- Install the workflow with `ai-wfl`.
- Configure `.ai/config.json`.
- Start from a ticket ID.
- Produce human-reviewable spec artifacts.
- Resume workflow state across sessions.
- Implement approved work with bounded retries.
- Record verification accurately.
- Receive focused AI code, TypeScript, and test-quality review.
- Stop for human spec and diff approval.
- Create a draft PR without bypassing CI, human PR review, merge, or deployment ownership.
