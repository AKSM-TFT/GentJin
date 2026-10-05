# GENTJIN — Evaluated Agentic Workflow TODO

Date: 2026-10-05
Status: Phase 0 complete. Phases 1-5 not started.

## Phase 0 evidence

Full analysis recorded in the project vault at `architecture/phase-0-baseline-and-gap-analysis.md`, with the toolchain decision at `architecture/decisions/2026-10-05 - Implementation Language and Toolchain.md`.

Baseline: 64 tracked files, of which 39 Markdown, 23 YAML, 1 JSONC, and 0 executable source files. The 23 YAML files are per-skill `agents/openai.yaml` interface stubs containing only `display_name`. Searches for `task_id`, `acceptance_criteria`, `event_type`, `allowed_actions`, and `"name":` returned zero hits across all tracked files. GENTJIN is currently a pure instruction layer, so every capability in Phases 1 through 5 is net-new code.

Integration surface verified from the installed binary rather than documentation alone. OpenCode 1.18.34 resolves to `node_modules/opencode-ai/bin/opencode.exe`, a Bun single-file executable; strings were extracted from it and cross-checked against official plugin documentation, and both sources agree. Confirmed hooks: `tool.execute.before`, `tool.execute.after`, `chat.message`, `config`, `event`, `auth`, `install`, `shell.env`, `permission.ask`. Confirmed CLI: `opencode run` for non-interactive execution, `opencode serve`, `opencode export`, `opencode stats`, and `--pure` for baseline isolation. Traces can therefore be sourced from real events, live evaluation runs are feasible, and a completion gate can be enforced rather than advised, since `tool.execute.before` can throw to block an action.

Recorded limits of that surface. Skill selection fires no hook and is only inferable from which `SKILL.md` files are read, so any routing metric must be labeled inferred rather than observed. No hook exposes model reasoning. Token and cost data comes from `opencode stats` and session export rather than a hook payload.

Chosen toolchain: Node.js 24, plain ESM JavaScript, zero runtime dependencies. Schemas are authored as JSON Schema documents for portability, with hand-written JavaScript validators, because Node has no built-in JSON Schema validator and `ajv` exists only inside OpenCode's bundle. Contract tests use `node:test`; the live runner is hand-rolled because Phase 5 needs denominators, separated skip and blocked cases, and baseline comparison.

Build order decision: define schemas and registry first, write contract graders against them, then implement runtime behavior, then run live scenarios. Writing graders after the features would produce graders that bless whatever was built.

Blockers recorded: `skills/knowledge-vault/SKILL.md` is 1,271 lines, 48 percent of the corpus and the default router; line 55 of this file names `deployment-check` but the actual skill is `deployment-readiness`; trace storage location is undecided because the roadmap requires traces outside Git-tracked files; and live scenario runs need provider credentials and incur real model cost, which requires separate authorization.

## Instructions to OpenCode

Implement this roadmap in the GENTJIN source repository. Inspect the current implementation first, reconcile this checklist with existing work, and extend what already exists. This is a new enhancement roadmap; do not replace an existing TODO.md or erase unfinished tasks. Merge these tasks into the repository's backlog if necessary.

The goal is to make GENTJIN's workflows measurable, traceable, failure-aware, and verifiable while preserving its role as an OpenCode skill suite with Obsidian project memory.

Work through the phases in order. Complete the core implementation in Phases 0–5 before optional Phase 6. Keep this checklist updated with implemented files, actual checks, evidence, and blockers. Do not stop after writing more prompts: the core deliverable includes executable validation and evaluation tooling.

## Important architecture boundaries

- OpenCode already provides the model runtime, tools, execution, and possibly routing or plugin events. Inspect these capabilities before creating additional layers.
- GENTJIN should add workflow contracts, memory integration, verification, trace collection, and evaluation around those capabilities. Do not build a second agent runtime or duplicate filesystem, Git, database, and test tools.
- A Markdown skill is an instruction, not an independently executable tool. Describe prompt-directed behavior separately from behavior enforced by code.
- Do not claim automatic routing, complete telemetry, or enforced permissions unless the implementation actually supports and verifies them.
- Preserve existing architecture, commands, skill names, configuration, installation behavior, and vault notes. Avoid unrelated changes and new dependencies; use existing tooling or the standard library where possible.
- Keep configuration and credentials untouched. Database operations remain read-only by default. Do not run destructive operations, push changes, or deploy as part of this roadmap without separate authorization.
- Use the repository's actual supported OpenCode version and extension interfaces. If native integration is unavailable, implement an explicit task-recording adapter and label its coverage; do not fabricate hooks.

## Phase 0 — Inspect and establish the baseline

- [x] Read repository instructions, AGENTS.md, existing skills, commands, installers, configuration examples, and relevant vault notes.
- [x] Identify existing routing, memory lifecycle, failure tracking, change audit, verification, reporting, and telemetry functionality.
- [x] Produce a short gap table: requirement, existing implementation, missing behavior, proposed file changes.
- [x] Check current OpenCode integration surfaces from installed source or official documentation. Record the version, supported interfaces, and evidence for the chosen integration.
- [x] Identify the canonical source and runtime paths. Respect the current installer; do not recreate the retired permanent `~/.config/opencode/GentJin` directory if the installer uses runtime files only.
- [x] Record baseline checks using actual commands and outputs. If checks cannot run, record why.
- [x] Choose the smallest implementation using the existing language/toolchain. Record the decision in the vault.

Acceptance: each planned addition has a concrete purpose and integration point; duplicated functionality is reused rather than rebuilt.

## Phase 1 — Task lifecycle and completion contract

- [ ] Introduce one versioned task-record schema with a unique task ID and project ID.
- [ ] Capture: request, scope, explicit acceptance criteria, selected skills and reasons, memory references, plan, attempts, actions, file changes and reasons, verification evidence, blockers, and final outcome.
- [ ] Implement this lifecycle in existing commands/skills and available integration code:
      `Observe → Retrieve → Plan → Act → Verify → Reflect → Store`.
- [ ] Support task states such as `in_progress`, `blocked`, `needs_verification`, `completed`, and `failed`; distinguish intermediate state from final evaluation outcome.
- [ ] Record each acceptance criterion as `pass`, `fail`, `not_run`, or `not_applicable`, with evidence. Require a reason for `not_applicable`.
- [ ] Implement a deterministic completion validator: all applicable mandatory criteria must pass; missing evidence or unavailable required checks cannot count as success.
- [ ] For UI bugs, require behavior evidence tied to the reported symptom. A successful build alone cannot prove that a previously empty table now renders rows.
- [ ] If the browser, environment, or credentials needed to verify behavior are unavailable, report `needs_verification` and the precise remaining check. Do not repeatedly announce completion.
- [ ] Preserve resumable task checkpoints without overwriting prior attempts or user changes.

Acceptance: a task with a passing build and a failed or unverified mandatory UI criterion cannot be validated as completed. Describe whether this gate is advisory or enforced at the integration boundary.

## Phase 2 — Skill routing and tool contracts

- [ ] Reuse the existing skill registry or add a minimal machine-readable registry with skill names, triggers, prerequisites, scope, allowed actions, and required verification.
- [ ] Route based on task context and affected files, allowing multiple skills and user overrides. A generic bug is not automatically a changes-review task.
- [ ] Examples: database investigation → database-review; security-sensitive change → security-review; deployment readiness → deployment-check; recent diff review → changes-review; unknown project context → knowledge-vault.
- [ ] Preserve review-only behavior: selecting a review skill does not authorize code changes. Full project review requires the established explicit scope.
- [ ] Record selected skills, routing reasons, overrides, and unavailable capabilities in the task record.
- [ ] Map existing OpenCode tools to capability contracts: read/search, diff inspection, local edits, verification commands, read-only database inspection, and reporting.
- [ ] Record action results and actual errors. A suggested command or planned action is not an executed action.
- [ ] Respect existing approval boundaries for external writes and destructive actions. Document which restrictions the runtime enforces and which are instructions only.

Acceptance: routing examples produce inspectable decisions, honor explicit scope, and have evaluation cases for correct selection and unsafe scope expansion.

## Phase 3 — Failure-aware project memory

- [ ] Preserve the canonical vault path and project-specific overrides. Discover the project automatically using existing conventions.
- [ ] Represent working context, prior sessions, architecture/patterns, decisions, and failed attempts using existing folders and metadata where possible. Avoid a disruptive folder migration.
- [ ] Add a failure-record template: symptom, environment, hypothesis, exact attempted change, files touched, verification performed, observed outcome, evidence, and next investigation.
- [ ] Retrieve relevant unresolved failures before planning a similar task. Link the retrieved notes in the task record.
- [ ] Distinguish observed failure, unverified attempt, and confirmed resolution. Do not store guesses as proven project knowledge.
- [ ] Detect repeated equivalent attempts within a task. Repeating a failed approach requires new evidence, a changed condition, or an explanation of what differs.
- [ ] Bound retries. After a configurable number of unsuccessful attempts, checkpoint the task, state the blocker, and request missing information only when needed.
- [ ] Search targeted notes rather than loading the whole vault. Keyword search is sufficient initially; embeddings and a vector database are optional future work.
- [ ] Preserve note provenance, timestamps, and task links. Mark superseded conclusions without deleting history.
- [ ] Capture durable change audit entries: what changed, why, verification, unresolved issues, and related task/decision notes.
- [ ] Redact sensitive content. Do not copy credentials, production database records, or patient/customer data into traces or benchmark fixtures.

Acceptance: a seeded note that `detectChanges()` failed is retrieved for a matching scenario, and the workflow does not retry that identical fix without new evidence.

## Phase 4 — Trace collection and reporting

- [ ] Implement a versioned append-only event format using the existing storage approach or JSONL.
- [ ] Include task ID, event ID, parent/span reference where available, timestamp, phase, event type, skill/tool name, outcome, duration, evidence reference, and error category.
- [ ] Connect event collection to supported OpenCode hooks or the explicit adapter selected in Phase 0. Expose missing event coverage in every trace summary.
- [ ] Separate observed runtime events from manually recorded assertions. Never generate fictional tool calls or durations.
- [ ] Store local task traces outside Git-tracked project files by default; keep only schemas, examples with synthetic data, and intentionally approved benchmark reports in the repository.
- [ ] Capture tokens and cost only when usage and pricing information are available. Store model/provider and pricing provenance; otherwise report `unavailable` rather than zero or an invented estimate.
- [ ] Avoid raw prompt/tool payload logging by default. Add bounded output references, redaction, and configurable retention.
- [ ] Ensure a logging failure does not corrupt a task or silently discard its completion evidence. Report incomplete traces.
- [ ] Generate a task report in the established `Summary / Details / Suggestion` format, with a concise numbered Changes list and remaining verification.

Acceptance: a representative task produces a correlated readable trace and report, including failed actions and missing instrumentation without unsupported metrics.

## Phase 5 — Executable evaluation suite

This suite is permanent GENTJIN source. Keep it separate from temporary debug helpers, generated outputs, and production application test artifacts. Cleanup must not delete the benchmark runner or fixtures needed to evaluate GENTJIN.

- [ ] Create an evaluation runner using the existing toolchain. Suggested layout, adapted to the repository:
      `evals/scenarios/`, `evals/fixtures/`, `evals/graders/`, and `evals/run.*`.
- [ ] Give scenarios stable IDs, synthetic fixtures, an initial repository state, user request, acceptance criteria, forbidden actions, expected evidence, grader rules, and reset instructions.
- [ ] Run in isolated temporary workspaces with no production credentials or external mutations. Keep fixtures deterministic and portable.
- [ ] Support two distinct modes:
  1. Contract tests: validate schemas, state transitions, routing rules, trace redaction, and graders without a live model.
  2. Live agent runs: execute scenarios through a real supported OpenCode interface and grade observed outputs, artifacts, and behavior.
- [ ] If live execution is unavailable, implement contract tests and a documented trace-import path. Label results accurately; contract tests do not demonstrate live agent performance.
- [ ] Include at least these scenarios:

| Scenario                           | Required evidence                                                                                  |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| Empty table despite fetched data   | Inspect the full API-to-render path; verify expected rendered rows in an isolated runnable fixture |
| Prior failed fix                   | Retrieve the failed attempt; avoid identical unsupported retries                                   |
| API response mismatch              | Diagnose and repair the mapping; verify the displayed result                                       |
| Missing loading/error/empty states | Observe all relevant states using controlled synthetic responses                                   |
| Scope preservation                 | Compare changed files and diff with the allowed scope                                              |
| Security review                    | Detect a synthetic secret and unsafe SQL example without leaking the secret into traces            |
| Read-only database investigation   | Verify emitted actions contain no mutation commands                                                |
| Verification honesty               | Reject completed status when required evidence is absent or a test was never executed              |
| Routing                            | Check accepted skill combinations, overrides, and scope restrictions                               |
| Concise Git reporting              | Produce a numbered change list following current git-push/reporting conventions                    |
| Resume after interruption          | Restore task context without losing failed attempts or duplicating completed actions               |

- [ ] Prefer deterministic graders: schema checks, exit codes, diff allowlists, runtime assertions, trace ordering, and mandatory evidence validation.
- [ ] Use an optional model judge only for subjective quality, with a fixed rubric and retained explanations. A model's self-assessment cannot override failed functional checks.
- [ ] Make failures produce a nonzero exit code. Treat missing/malformed results as errors; mark unsupported scenarios explicitly, never as passes.
- [ ] Report metric definitions and denominators: routing correctness, functional success, repeated failed attempts, scope violations, unsupported verification claims, tool calls, and duration where observed.
- [ ] Separate skipped/blocked cases from completed runs and show counts. Include run ID, revision, scenario version, model/provider, relevant settings, repeat count, and instrumentation coverage.
- [ ] Compare the existing workflow with the enhanced workflow on the same scenarios and settings. Preserve a reproducible baseline before enabling improvements.
- [ ] Account for model variability with configurable repeats. A single passing run is evidence for that run, not a general success-rate claim.
- [ ] Do not use invented confidence percentages. Summarize criterion results and evidence; any future aggregate score must have a documented formula and cannot bypass completion gates.

Acceptance: the runner detects deliberately invalid completion evidence, scope violations, malformed traces, and repeated failed attempts. Publish only measured results and clearly distinguish offline checks from live runs.

## Phase 6 — Optional extensions after the core works

- [ ] Add a local read-only dashboard for task history, traces, memory references, and evaluation comparisons if it adds value. Start with CLI reports; a dashboard is not required for core completion.
- [ ] Add semantic retrieval only if a measured benchmark shows keyword retrieval is insufficient.
- [ ] Add model routing or external observability integrations only after defining a measured requirement and separately approving any new dependencies/services.
- [ ] Keep a documented list of deferred work; do not describe deferred features as implemented.

## Documentation, installation, and final verification

- [ ] Document the actual architecture: OpenCode runtime, GENTJIN skills/contracts, vault memory, task records, event adapter, validator, and eval runner.
- [ ] Include setup, commands, supported versions, an end-to-end synthetic example, privacy defaults, and known limitations.
- [ ] Update installation/upgrade paths for shipped files without copying credentials, environment files, generated traces, node_modules, or unrelated package/config files into runtime locations.
- [ ] Verify a clean installation and an upgrade preserve existing skills, configuration, and vault content. Use temporary locations rather than replacing the user's live configuration during checks.
- [ ] Run appropriate repository checks and contract evaluations. Run live scenarios when the required runtime is available; document blockers otherwise.
- [ ] Remove temporary QA/debug files and generated scratch artifacts before preparing a commit. Retain intentional evaluation source and fixtures.
- [ ] Record what changed and why in the project vault. Leave a resumable checkpoint for anything incomplete.
- [ ] Report exact commands run, evidence, results, limitations, and numbered changes. Do not claim tests passed unless they ran successfully.

## Definition of done

The core upgrade is complete when task records and workflow integration work, relevant failures are retrieved, traces reflect real actions, completion validation rejects unsupported success, and executable evaluations reproduce documented results. Installation and existing skill behavior must remain compatible.

If the code is implemented but live behavior cannot be evaluated, report that distinction explicitly: implementation complete, live validation pending. Do not market the system as evaluated end to end until live runs support that claim.

Suggested portfolio description after evidence exists:

> GENTJIN is an OpenCode workflow framework with persistent project memory, recorded skill routing, failure-aware task execution, verification contracts, and reproducible agent evaluations.

Use only the capabilities that have actually been implemented and demonstrated.
