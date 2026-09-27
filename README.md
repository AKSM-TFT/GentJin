<div align="center">

# GENTJIN

### A modular development system for [OpenCode](https://opencode.ai/docs/)

**Less prompt noise. More deliberate engineering.**

GENTJIN gives OpenCode a focused operating system for planning, building,
reviewing, and learning from real software work.

[Explore the workflow](#workflow-at-a-glance) · [Browse the skills](#skills)

</div>

---

## The problem

Most agent setups solve one problem at a time: a giant instruction file, a
forgotten cleanup step, or a review that only happens when someone remembers.

That approach creates noise. Important rules compete with one another, context
gets lost between sessions, and the final review becomes an afterthought.

## The GENTJIN approach

GENTJIN keeps the always-loaded rules small and moves specialized workflows
into focused skills that are activated when they are relevant.

| Everyday problem | GENTJIN response |
| --- | --- |
| One oversized instruction file | Modular skills with clear triggers |
| Skills that only run when remembered | Semantic capability selection, not keyword matching |
| Work disappears between sessions | Continuous knowledge capture and active WIP |
| Long multi-part tasks | Bounded, skill-aware agent delegation |
| “It looked done” | Cleanup, QA, and explicit verification |
| Reviews happen too late | Read-only `/changes-review` and `/project-review` |
| Risky defaults | Read-only data access and guarded Git actions |
| Reports take too long | Consistent, evidence-based reporting |

> **The goal:** make good engineering behavior easier to repeat, not harder to remember.

## Orchestration

GENTJIN behaves as an orchestration layer rather than a folder of optional
instructions. For meaningful work it:

- infers which skills apply from the task itself, instead of waiting for a
  keyword or a named skill;
- delegates independent, substantial workstreams to agents when that genuinely
  helps, while the main agent stays the orchestrator;
- captures durable project knowledge as decisions become established, gated by
  a significance test so notes never become transcripts;
- keeps WIP current during substantial unfinished work, and pauses and resumes
  on plain language such as "hold on" or "let's continue";
- reassesses skills, agents, and knowledge as the task evolves instead of
  locking in the first routing decision;
- verifies before claiming success, and scales orchestration up with complexity
  and risk rather than running everything by default.

Explicit commands remain available for deterministic control. They are a manual
override, not the only way the workflow runs.

## Workflow at a glance

```text
        A clear request
              │
              ▼
     Understand the change
 requirements · architecture
              │
              ▼
          Plan and build
              │
              ▼
        /changes-review
   when the implementation
      needs a review
              │
              ▼
         /cleanup
  when the work is finished
              │
              ▼
     /deployment-check
   before production
              │
              ▼
        /git-push
   when you ask for it
```

`/project-review` is the optional deeper audit of an entire codebase, not
something expected on every feature. GENTJIN supports the full development loop
without forcing every workflow into every conversation.

## Quick start

Clone the repository, open it in OpenCode, and let the agent install GENTJIN
for you:

```bash
git clone https://github.com/frnkgns/GentJin.git
cd GentJin
opencode
```

Then enter this command in OpenCode:

```text
Install GENTJIN by following INSTALL.md
```

OpenCode will detect your operating system and configuration paths, create a
permanent GENTJIN home at `<user-home>/.config/opencode/GentJin/`, preserve
your existing setup, add only the required Knowledge Vault permission to the
global configuration, and, with explicit approval, rename a legacy
`Documents/ObsidianVault` folder to `Documents/KnowledgeVault` so Obsidian keeps
pointing at the same vault. It backs up conflicts and verifies the installed
files. Restart OpenCode when it finishes.

For path detection, conflict handling, updates, and troubleshooting, see
[INSTALL.md](INSTALL.md).

After a `git pull` brings in newer GENTJIN files, run `/update-gentjin` to bring
the installed copy back in line. It uses the manifest to back up and refresh
managed files, asks before replacing anything you modified yourself, and
re-checks the Knowledge Vault permission.

## Commands

| Command | Use it when you want to... |
| --- | --- |
| `/install-gentjin` | Install GENTJIN into your global OpenCode configuration. |
| `/update-gentjin` | Update the installed GENTJIN copy from a newer repository state. |
| `/cleanup` | Finish current work with QA, cleanup, and a final report. |
| `/report` | Turn the current work into a clear, evidence-based report. |
| `/status` | See the branch, pending changes, active WIP, and open questions. |
| `/task` | Handle a general-purpose software or laptop task, with reusable workflow memory and `vscode` and `dev` branches. |
| `/deployment-check` | Analyze deployment readiness, report blockers and warnings, and suggest next steps without modifying the project until you approve. |
| `/changes-review` | Review the current changes and their impact radius without modifying the project until you approve fixes. |
| `/project-review` | After confirmation, perform a comprehensive read-only review of the entire relevant project and suggest improvements before any changes are made. |
| `/pause` | Bring the active WIP current, flush durable knowledge, and record one next action. |
| `/resume` | Reload the WIP and relevant knowledge, verify them against current source, and continue. |
| `/git-push` | Commit and push the current changes on a new branch, asking for approval first. |

Commands are intentionally short entry points into larger, repeatable
workflows.

## Skills

Each skill is a focused playbook. GENTJIN loads the relevant guidance instead
of asking the agent to remember every rule at once.

| Skill | Focus |
| --- | --- |
| `requirements-review` | Ambiguity, constraints, conflicts, and acceptance criteria before implementation. |
| `architecture-review` | Structural changes, module boundaries, data flow, and migration paths. |
| `frontend-review` | Responsive UI, accessibility, UX states, and frontend performance. |
| `backend-review` | Handlers, services, jobs, webhooks, async behavior, retries, and idempotency. |
| `database-review` | Queries, data layers, performance, failures, and migration safety. |
| `api-design` | Request/response contracts, validation, pagination, and versioning. |
| `integration-review` | Defects at the seams between layers and systems. |
| `systematic-debugging` | Root-cause workflow for broken behavior and regressions. |
| `test-strategy` | Risk-driven decisions about what to test and at which level. |
| `security-review` | Authentication, authorization, secrets, input, and data integrity. |
| `performance-review` | Evidence-based measurement, bottlenecks, and safe optimization. |
| `dependency-review` | Dependency additions, upgrades, and replacement risk. |
| `review-orchestrator` | Shared engine behind the review commands; delegates to the skills above. |
| `cleanup` | Pre-merge QA, debugging, cleanup, and production readiness. |
| `git-workflow` | Guarded branches, commits, pull requests, and source control. |
| `work-in-progress` | Pause, resume, and preserve unfinished implementation work. |
| `knowledge-vault` | Project discovery and persistent knowledge in the Knowledge Vault. |
| `reporting` | Concise console reports and durable vault documentation. |

## Built for the whole lifecycle

### Before the work

- Discover the project and its existing knowledge.
- Check active WIP, open questions, and recent decisions.
- Start from the current source code rather than assumptions.
- Use `requirements-review` and `architecture-review` when the request is
  ambiguous or the change is structural.

### During the work

- Keep the active context small and relevant.
- Use the right review skill at the right trust boundary.
- Preserve decisions, rejected approaches, and meaningful discoveries.

### Before handoff

- Review the diff and affected user flows.
- Check loading, error, empty, nullable, and failure states.
- Run the project's real test, lint, typecheck, and build commands.
- Remove temporary artifacts and unnecessary logs.
- Run `/changes-review` when the work needs a read-only second opinion before
  fixes.

### After the work

- Write an evidence-based report.
- Capture reusable knowledge where it belongs.
- Keep unfinished work visible with one clear next action.

## Safe by default

GENTJIN is designed to make the cautious path the easy path:

- Database access is read-only unless write access is explicitly authorized.
- Commits, pushes, merges, and history changes require an explicit request.
- Global OpenCode configuration is additive: GENTJIN adds only its required
  Knowledge Vault permission and never removes existing entries.
- The legacy `Documents/ObsidianVault` folder is renamed to
  `Documents/KnowledgeVault` only with explicit approval, and Obsidian's saved
  path is updated to follow it.
- Credentials and environment values stay out of the repository.
- Verification is reported honestly; checks are never claimed without evidence.
- Real application data is preferred over mock or placeholder data.
- Security and data-integrity checks are applied when the change warrants them.

## Repository map

```text
.
├── AGENTS.md                 Global behavior and project-agnostic rules
├── INSTALL.md                Agent-assisted installation runbook
├── command/                  Reusable slash commands
│   ├── changes-review.md
│   ├── cleanup.md
│   ├── deployment-check.md
│   ├── git-push.md
│   ├── install-gentjin.md
│   ├── pause.md
│   ├── project-review.md
│   ├── report.md
│   ├── resume.md
│   ├── status.md
│   ├── task.md
│   └── update-gentjin.md
├── skills/                   Focused, trigger-based workflows
│   ├── api-design/
│   ├── architecture-review/
│   ├── backend-review/
│   ├── cleanup/
│   ├── database-review/
│   ├── dependency-review/
│   ├── frontend-review/
│   ├── git-workflow/
│   ├── integration-review/
│   ├── knowledge-vault/
│   ├── performance-review/
│   ├── reporting/
│   ├── requirements-review/
│   ├── review-orchestrator/
│   ├── security-review/
│   ├── systematic-debugging/
│   ├── test-strategy/
│   └── work-in-progress/
└── opencode.jsonc            Local OpenCode configuration (not installed)
```

## Contributing

Improvements are welcome when they make the system clearer, safer, or more
useful:

- Keep skills focused on one recognizable trigger or outcome.
- Write descriptions that explain both **what** the skill does and **when** it
  should be used.
- Avoid secrets, machine-specific paths, and generated artifacts.
- Preserve the project's existing conventions before adding new ones.

Open an issue or pull request with a focused proposal and a short explanation
of the problem it solves.

<div align="center">

**Build with context. Review with rigor. Remember what matters.**

</div>
