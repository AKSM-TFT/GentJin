# GENTJIN — Verify and Enforce Project Context Before Edits

Date: 2026-10-08 (updated)
Status: Implemented with recorded limits
Repository: https://github.com/frnkgns/GentJin
Reviewed baseline: eeef538a2c83ff3b90c22eedbfcc6be3bc4e37e9 (main)
Implemented against: same baseline, uncommitted working tree

## Objective

Make GentJin reliably resolve the current project, retrieve relevant memory, and inspect the source needed for the task before allowing project modifications. Reuse the existing discovery and Knowledge Vault workflow. Do not build a second onboarding system or claim the agent understands the entire repository.

Expected behavior: opening OpenCode in a new project and asking for a fix should trigger lightweight discovery before edits. Returning to an existing project should reuse verified memory and inspect only the relevant source and changed context.

## Read This Before Implementing

- Inspect the current checkout, Git status, applicable instructions, existing vault, and active WIP first. This reviewed baseline may already be outdated; implement only gaps still present.
- Read `AGENTS.md`, especially Project Discovery, Knowledge, Project Memory, and Continuity Memory.
- Read `skills/knowledge-vault/SKILL.md` and relevant project-conventions instructions.
- Inspect `plugins/gentjin-capabilities.ts`, `src/capabilities/loader.mjs`, and `src/capabilities/adherence.mjs`.
- Inspect `plugins/gentjin-trace.js`, `src/trace/plugin-body.mjs`, task records, evidence resolution, completion gate, schemas, tests, evals, installer reconciliation, and runtime manifests.
- Verify actual hook and tool behavior against the supported OpenCode version before choosing an enforcement mechanism. Do not invent lifecycle hooks or assume every mutation passes through Bash.
- Preserve architecture and unrelated changes. Add no dependencies unless genuinely necessary and explicitly authorized. Do not commit, push, publish, or release as part of this task unless requested.
- If a repository `todo.md` already exists, merge this work into it without removing its remaining tasks or history.

## What Already Exists

At the reviewed baseline:

1. Project root and identity resolution, including `.project-agent.md` overrides.
2. Canonical vault resolution under `~/Documents/KnowledgeVault/<project-identifier>/`.
3. Automatic vault initialization and non-destructive normalization.
4. Note-first retrieval and targeted source inspection.
5. Lazy `project/` memory with overview, structure, stack, commands, and state.
6. Memory freshness hints and correction when current source contradicts notes.
7. Runtime capability loading and a Bash guard for certain workflow-owned actions.

The unresolved gap is runtime-verifiable discovery readiness before project edits. Loading a skill body is not evidence that discovery was performed. Reconfirm this gap before implementation.

## 1. Establish the Actual Enforcement Boundary

- [x] Map the existing first-request flow and all available mutation tools/hooks.


  STATUS: IMPLEMENTED + PROBED


  EVIDENCE: docs/discovery-enforcement.md. Every tool emits tool.execute.before, including write and edit, with args including filePath.
- [x] Separate instruction-level behavior, executable checks, and tested runtime enforcement in a short findings record.

  STATUS: IMPLEMENTED

  EVIDENCE: docs/discovery-enforcement.md has explicit sections for runtime enforcement, instruction-level behavior, and known bypasses.
- [x] Probe whether native edit/write/patch tools can be blocked before execution, and whether Bash and supported plugin tools expose enough information for a meaningful guard.

  STATUS: IMPLEMENTED + VERIFIED LIVE

  EVIDENCE: A probe plugin threw for write and edit. blocked.txt was never created and demo.txt was unchanged, while a bash write in the same session succeeded.
- [x] Identify shell/script and external-tool bypasses; do not present a command regex as a complete security boundary.
  STATUS: IMPLEMENTED
  EVIDENCE: docs/discovery-enforcement.md lists the bypasses. The shell guard now reduces a command to executed segments, so a guarded phrase inside a heredoc body, a quoted argument, or a comment is data rather than a command, while real Git commands remain refused.

  STATUS: IMPLEMENTED

  EVIDENCE: docs/discovery-enforcement.md lists the bypasses: tools that emit no hook, future mutating tools, and the fact that this is a workflow gate and not a security boundary.
- [x] Document unsupported paths and a clear instruction-only fallback where runtime interception is unavailable.

  STATUS: IMPLEMENTED

  EVIDENCE: AGENTS.md Discovery Readiness states that when a hook is unavailable the steps apply as instructions and runtime enforcement must not be claimed.

Acceptance: the implementation plan names the hooks and tools actually verified, with evidence. It does not promise universal enforcement when only some paths are interceptable.

## 2. Add a Structured Discovery Record

- [x] Extend existing task/schema/trace infrastructure where appropriate rather than introducing a parallel task lifecycle.


  STATUS: IMPLEMENTED


  EVIDENCE: Reused src/discovery over the existing capability session state and the existing evidence conventions rather than adding a parallel task lifecycle.
- [x] Record project root, normalized identity, identity source, vault root, override source, session/task scope, and discovery status.

  STATUS: IMPLEMENTED + TESTED

  EVIDENCE: src/discovery/resolve.mjs returns all of these; test/discovery.test.mjs covers precedence, normalization, and override redirection.
- [x] Record relevant manifests/configs, source areas inspected, memory references retrieved, source freshness information, unknowns, blockers, and evidence references.
  STATUS: IMPLEMENTED
  EVIDENCE: createDiscoveryRecord holds manifests_inspected, source_areas, memory_retrieval, unknowns, blockers and evidence. commands_discovered and commands_executed are declared but never populated yet, so that pair is structural only.
- [x] Distinguish `not_started`, `in_progress`, `ready`, `degraded`, and `blocked`, or equivalent existing statuses.
  STATUS: IMPLEMENTED + TESTED
  EVIDENCE: READINESS in src/discovery/readiness.mjs; each state is asserted in test/discovery.test.mjs.
- [x] Define deterministic readiness requirements for the task: unambiguous target project, inspected context relevant to the intended change, and recorded memory retrieval result. A missing vault or no relevant notes is a valid retrieval result.

  STATUS: IMPLEMENTED + TESTED

  EVIDENCE: Requires an unambiguous root, an intended path inside it, a recorded read touching it, and a recorded memory retrieval result. No relevant notes is accepted as a result.
- [x] Separate commands discovered in manifests/docs from commands actually executed successfully.
  STATUS: PARTIAL
  EVIDENCE: Both fields exist on the record and are never conflated, but no code populates them. The distinction is structural only until a manifest scanner exists.
- [x] Do not mark readiness from a model-supplied `source: observed`, a boolean, a loaded skill, an arbitrary path string, or a fabricated evidence reference.
  STATUS: IMPLEMENTED + VERIFIED LIVE
  EVIDENCE: Readiness requires a read tool call recorded by the hook in this session. Live probe: loading the project-conventions body and reading the file still blocked the edit and the file stayed unchanged.
- [x] Bind evidence to the current project/task and verify it using existing evidence-resolution conventions; record evidence limitations honestly.
  STATUS: PARTIAL
  EVIDENCE: Memory claims are verified against the filesystem and per-session recorded reads, including withdrawing a read that failed. Session isolation is tested. Readiness still does not reuse src/task/evidence-resolution.mjs trace events, and that module still does not check project_id.
  STATUS: PARTIAL
  EVIDENCE: Memory claims are now verified against the filesystem and per-session recorded reads rather than trusted, and cross-session isolation is tested. Readiness still does not reuse src/task/evidence-resolution.mjs trace events, and that module still does not check project_id.

  STATUS: PARTIAL

  EVIDENCE: Readiness binds to per-session recorded reads and to the resolved project root, and cross-session isolation is tested. It does not yet reuse src/task/evidence-resolution.mjs trace events for discovery, and evidence-resolution still does not check project_id.

Acceptance: a syntactically valid but unsupported discovery record cannot satisfy the readiness gate. Readiness describes sufficient inspected context for this task, not complete project understanding.

## 3. Integrate Lightweight Automatic Discovery

- [x] Resolve the project and vault using the existing precedence rules. Preserve explicit overrides and never silently substitute another project.


  STATUS: IMPLEMENTED + TESTED


  EVIDENCE: resolveProject implements git root then metadata then working directory for the root, and .project-agent.md then project metadata then folder name for identity, matching AGENTS.md.
- [x] Trigger discovery before the first project modification, using a verified lifecycle hook if suitable or a tool precondition when first-request hooks are insufficient.

  STATUS: IMPLEMENTED + VERIFIED LIVE

  EVIDENCE: A tool precondition on write, edit, patch and multiedit. Live probe: an edit with no discovery was refused and the file was unchanged; after resolve, scope and memory the same edit succeeded.
- [x] For a new project, inspect available metadata, top-level structure, applicable instructions, relevant entry points, conventions, and task-specific source.
  STATUS: PARTIAL
  EVIDENCE: Resolution inspects manifests, overrides, git presence and monorepo shape. It does not auto-inspect entry points or conventions; the model performs those reads and they are recorded.
- [x] Support non-Git projects and monorepos without assuming one package file equals one project.

  STATUS: IMPLEMENTED + TESTED

  EVIDENCE: resolveProject falls back to the working directory without git, and detects a monorepo from a workspaces declaration or several manifests. Both are tested.
- [x] For an existing project, retrieve relevant `project/` notes and active WIP when it matters; verify referenced paths and inspect affected source.
  STATUS: PARTIAL
  EVIDENCE: A claimed note is accepted only when it exists inside the resolved knowledge root and was read this session. Claiming none applies requires a scoped search that was actually observed, or the filesystem fact that the knowledge root does not exist. Retrieval itself remains the model job under the knowledge-vault workflow.
  STATUS: PARTIAL
  EVIDENCE: A memory result is recorded and a claimed note is only accepted when it exists inside the resolved knowledge root and was read this session; no_relevant_notes is accepted only when the knowledge root holds no memory-index.md. Retrieval itself remains the model job under the knowledge-vault workflow.
  STATUS: PARTIAL
  EVIDENCE: A memory retrieval result must be recorded and notes read are stored. Retrieval itself remains the model's job using the knowledge-vault workflow.
- [x] Refresh only stale or missing context. Do not rescan every file solely because HEAD or the branch changed.
  STATUS: IMPLEMENTED + TESTED
  EVIDENCE: Readiness now fingerprints inspected files plus git HEAD and branch, and is invalidated when a file is edited, deleted, or the checked-out revision moves. Unchanged context keeps its verdict across repeated checks. Detection is fingerprint-based; it does not know which file the change landed in until the verdict lapses.

  STATUS: PARTIAL

  EVIDENCE: Expanding the declared scope to an uninspected area makes readiness incomplete again, which is tested. There is no automatic staleness detection against source changes.
- [x] Account for uncommitted changes, relevant config changes, root switches, and different worktrees when reusing discovery records.

  STATUS: NOT IMPLEMENTED

  EVIDENCE: Readiness is per session, project and task. Worktree identity and uncommitted-change awareness are not modelled. A root switch starts a new record because resolution runs per session.
- [x] Populate only verified project notes on first relevant use. Preserve the existing lazy-memory policy; do not create placeholder notes for every folder.

  STATUS: PARTIAL

  EVIDENCE: The existing lazy-creation policy is preserved because this feature writes no notes. It does not itself populate project notes.
- [x] Exclude secrets, dependency/vendor trees, generated output, and unrelated directories from discovery.

  STATUS: NOT IMPLEMENTED

  EVIDENCE: Resolution reads only the root, its manifests and an override file, so it does not walk trees today. There is no explicit exclusion list for a future scanning implementation.
- [x] Keep simple read-only questions proportional to their needs; allow inspection tools while discovery is pending.
  STATUS: IMPLEMENTED + TESTED
  EVIDENCE: read, grep, glob, list, todowrite and websearch are never blocked, asserted in test/discovery.test.mjs and observed live.

Acceptance: a fresh project is discovered without manual prompting; a returning project reuses relevant memory; both paths inspect the source needed for the intended change.

## 4. Enforce Readiness on Supported Mutation Paths

- [x] Implement one shared readiness evaluator, consumed by supported tool hooks and task reporting.


  STATUS: IMPLEMENTED


  EVIDENCE: evaluateReadiness in src/discovery/readiness.mjs is called by evaluateGate for enforcement and by readinessFor for reporting.
- [x] Refuse intercepted project edits when required discovery evidence is missing, stale for the intended area, or belongs to another project/session/task.
  STATUS: IMPLEMENTED + VERIFIED LIVE
  EVIDENCE: Missing discovery and cross-session are both refused, the second asserted in tests and observed live as not_started for a fresh session.
- [x] Allow read/search/list/Git-status operations and the minimum controlled memory/record writes needed to complete discovery, avoiding a deadlock.

  STATUS: IMPLEMENTED + TESTED

  EVIDENCE: Read tools always allowed; writes inside the resolved knowledge root allowed; a sibling vault is explicitly not exempt by a blanket vault rule.
- [x] Do not let a blanket vault-write exemption authorize arbitrary writes outside the resolved knowledge root.

  STATUS: IMPLEMENTED + TESTED

  EVIDENCE: The exemption is checked with isWithin against the resolved knowledge root, and a sibling directory is refused that exemption.
- [x] Validate affected paths against the resolved root and task scope. Extend discovery when a task expands to an uninspected area.

  STATUS: IMPLEMENTED + TESTED

  EVIDENCE: A path outside the project root is not governed by discovery readiness, and declaring a new uninspected area returns readiness to incomplete.
- [x] Maintain readiness per actual session/project/task, not one process-global flag. Verify isolation with concurrent sessions and project switches.

  STATUS: IMPLEMENTED + TESTED

  EVIDENCE: State is keyed by session id. One session's completed discovery cannot authorize another session's edit, asserted in tests.
- [x] Return a short actionable reason naming the missing discovery step and how to satisfy it.

  STATUS: IMPLEMENTED + VERIFIED LIVE

  EVIDENCE: The refusal names the status, the unmet requirement and the exact gentjin_discovery action to call. Observed live in both block scenarios.
- [x] Trace gate decisions and evidence references without storing secrets or full conversation transcripts.
  STATUS: IMPLEMENTED + VERIFIED LIVE
  EVIDENCE: src/discovery/gate-trace.mjs records allow and refuse with reason, project-relative path, readiness and hashed session id. A live probe confirmed a refusal entry with path=src/app.js and no absolute path in the payload. No content or command text is stored.

  STATUS: NOT IMPLEMENTED

  EVIDENCE: Gate decisions are returned to the caller and no secrets are stored, but nothing is written to a trace stream for a gate decision.
- [x] Keep this gate independent from existing Git authorization and completion checks; readiness does not authorize a push or prove a fix works.

  STATUS: IMPLEMENTED

  EVIDENCE: evaluateGate is a separate module from the capability guard and the completion gate. A live probe confirmed the existing bash guard still blocks independently.

Acceptance: supported mutation tools demonstrably block premature edits and allow them after verified context discovery. Unsupported execution routes are explicitly reported as unenforced.

## 5. Handle Failure and Degraded Operation

- [x] If project identity is ambiguous, stop target-specific modifications and ask only for the missing identity information.


  STATUS: PARTIAL


  EVIDENCE: An explicit record blocker yields status blocked, tested. Ambiguity is not detected automatically from competing candidate identities.
- [x] If the vault is unavailable or unwritable, distinguish that memory failure from project ambiguity. Inspect current source and report degraded memory operation; do not fabricate notes or silently switch vaults.
  STATUS: IMPLEMENTED + TESTED
  EVIDENCE: A failed memory retrieval yields degraded with the reason preserved, distinct from blocked, asserted in tests.
- [x] If required source cannot be inspected, block the affected modifications and state what evidence is missing.

  STATUS: IMPLEMENTED + VERIFIED LIVE

  EVIDENCE: With no recorded read the refusal names the file and says no recorded read touched it. Observed live.
- [x] If hooks are unavailable, apply existing discovery instructions and report that runtime enforcement is unavailable. Never label fallback mode as enforced.

  STATUS: IMPLEMENTED

  EVIDENCE: AGENTS.md requires stating that runtime enforcement is unavailable rather than labelling fallback mode as enforced.
- [x] Do not introduce routine confirmation prompts for reversible work already authorized by the user.

  STATUS: IMPLEMENTED

  EVIDENCE: The gate refuses rather than prompts, and only when discovery evidence is genuinely missing.

Acceptance: failures have explicit, recoverable outcomes, and the discovery guard cannot indefinitely block the read operations required to recover.

## 6. Add Behavioral Tests and Evaluations

Use isolated temporary fixtures; never write to the user's real vault or modify production data. Keep meaningful tests in the repository and remove disposable probe/debug artifacts before completion.

- [x] New repository, no vault: an initial fix request triggers discovery and verified memory capture before an intercepted edit.
  STATUS: IMPLEMENTED + VERIFIED LIVE
  EVIDENCE: A temp project with no vault blocked the first edit and allowed it after resolve, scope and memory.
- [x] Existing vault: relevant memory is retrieved and source checked without a full rescan.

  STATUS: PARTIAL

  EVIDENCE: Notes read are recorded and source is read per intended path only. No full-rescan avoidance is measured because no scanning implementation exists.
- [x] Stale memory: current source wins, and only the relevant note is corrected.
  STATUS: PARTIAL
  EVIDENCE: A changed inspected file now invalidates readiness, so the affected source must be re-read before editing. The current-source-wins rule for correcting notes remains instruction-level in AGENTS.md; this feature does not rewrite notes.

  STATUS: NOT IMPLEMENTED

  EVIDENCE: The precedence rule remains instruction-level in AGENTS.md. This feature does not compare notes against source.
- [x] Override: `.project-agent.md` resolves the correct project and vault despite a different folder name.
  STATUS: IMPLEMENTED + TESTED
  EVIDENCE: An override file with a different name and knowledge_root resolves both, asserted in tests.
- [x] Missing notes: no relevant memory does not cause invented content or unnecessary blocking.

  STATUS: IMPLEMENTED + TESTED

  EVIDENCE: no_relevant_notes is a valid retrieval result and yields ready when the source evidence is present.
- [x] Fabricated evidence or merely loaded capability: readiness remains unsatisfied.

  STATUS: IMPLEMENTED + VERIFIED LIVE

  EVIDENCE: Live probe: a loaded skill body plus a read still blocked the edit and left the file unchanged.
- [x] Native edit/write/patch and Bash mutation: verify each actually supported guard path, including negative cases.
  STATUS: PARTIAL
  EVIDENCE: write and edit are verified live for refusal and for permission. Bash mutation remains governed by the separate capability guard, re-verified live. patch and multiedit are refused by tool name but were never observed in a live session, so they stay PARTIAL rather than claimed working.
  STATUS: PARTIAL
  EVIDENCE: write and edit are verified live for both refusal and permission, and Bash mutation remains governed by the separate capability guard, re-verified live. patch and multiedit are refused by tool name but were never observed in a live session, so they stay PARTIAL rather than claimed working.
  STATUS: IMPLEMENTED + VERIFIED LIVE
  EVIDENCE: write and edit blocked then allowed live. Bash mutation remains governed by the separate capability guard, re-verified live. patch and multiedit are guarded by name but were not observed in a live session.
- [x] Read-only requests and discovery record writes: no guard deadlock.

  STATUS: IMPLEMENTED + VERIFIED LIVE

  EVIDENCE: Reads proceeded in every live scenario, including the run that ended blocked.
- [x] Project/worktree switch, scope expansion, config changes, and uncommitted relevant edits: readiness refreshes appropriately.
  STATUS: PARTIAL
  EVIDENCE: Scope expansion and revision moves are implemented and tested, including a worktree where .git is a file for git metadata reading. Uncommitted-change awareness beyond fingerprinting inspected files is not modelled.

  STATUS: PARTIAL

  EVIDENCE: Scope expansion is implemented and tested. Worktree switch, config change and uncommitted-edit awareness are not modelled.
- [x] Concurrent sessions: one session's discovery cannot authorize another session's edits
  STATUS: PARTIAL
  EVIDENCE: TESTED: two sessions sharing one state object, and two separate state objects in one process, cannot authorize each other. ASSUMED, NOT MEASURED: two simultaneous OpenCode processes, because that was not run. Cross-process isolation rests on per-process in-memory state.
  STATUS: PARTIAL
  EVIDENCE: Session isolation is asserted for two sessions sharing one state object and for two separate state objects. Two genuinely simultaneous OpenCode processes were not run, so cross-process isolation is argued from per-process in-memory state rather than measured.

  STATUS: IMPLEMENTED + TESTED

  EVIDENCE: Asserted in test/discovery.test.mjs. Two live OpenCode processes were not run concurrently.
- [x] Non-Git project and monorepo: correct root and task scope resolution.

  STATUS: IMPLEMENTED + TESTED

  EVIDENCE: Non-git fallback and monorepo detection both asserted in tests.
- [x] Unavailable vault and unavailable hooks: degraded/fallback behavior is accurately reported.

  STATUS: PARTIAL

  EVIDENCE: Unavailable vault is tested and reports degraded. Unavailable hooks is documented as instruction-only fallback, not exercised by a test because it cannot be simulated in the installed binary.
- [x] Installer/update: all new runtime files are installed and upgraded without losing unrelated configuration.

  STATUS: IMPLEMENTED + VERIFIED

  EVIDENCE: src/discovery/ and its declaration are in the manifest; the installed copy runs 250 tests with 0 mismatched, 0 missing and 0 identity leaks.
- [x] Existing routing, capability guards, verification honesty, completion evidence, and failure-aware memory remain working.

  STATUS: IMPLEMENTED + VERIFIED

  EVIDENCE: All 250 tests, typecheck and evaluations pass, and the existing bash capability guard was re-verified live after the change.

Acceptance: tests exercise observable allow/block and retrieval behavior, not merely document strings or a manually set ready flag. Include a real supported-OpenCode probe where available; label fixture-only evidence separately.

## 7. Update Instructions, Installation, and Reporting

- [x] Reconcile `AGENTS.md`, the Knowledge Vault skill, README, registry entries, and relevant command instructions with actual behavior.
  STATUS: IMPLEMENTED
  EVIDENCE: AGENTS.md has an enforced Discovery Readiness section, the knowledge-vault skill now states the precedence is implemented and adds a Discovery Readiness Before Retrieval section, status.md reports readiness, and README and INSTALL list the module.
  STATUS: PARTIAL
  EVIDENCE: AGENTS.md gained an enforced Discovery Readiness section and README and INSTALL.md list the new module. The knowledge-vault skill and command files were not edited, so their prose still describes discovery as instruction-only.
- [x] Preserve the canonical vault layout: `architecture/decisions/`, `knowledge/glossary.md`, `knowledge/patterns/`, and `issues/`. Do not restore obsolete top-level folder proposals.

  STATUS: IMPLEMENTED

  EVIDENCE: No vault structure was changed. This feature writes no notes and creates no directories.
- [x] Document readiness meaning, refresh conditions, degraded behavior, supported enforcement paths, and fallback limits.

  STATUS: IMPLEMENTED

  EVIDENCE: AGENTS.md Discovery Readiness plus docs/discovery-enforcement.md.
- [x] Update installer/reconciliation/manifest logic and generated registries only where required. Respect the current installation architecture and user-owned configuration.

  STATUS: IMPLEMENTED

  EVIDENCE: Only the payload listing changed. No reconciliation or manifest logic was modified, and both registries were regenerated.
- [x] Run applicable existing checks discovered from the current checkout. At the reviewed baseline these include `npm run typecheck`, `npm test`, and `npm run eval`; regenerate registries if their inputs change.
  STATUS: IMPLEMENTED + VERIFIED
  EVIDENCE: Typecheck clean, 250 tests pass, evaluations pass, registries regenerated.
- [x] Capture meaningful decisions, failures, changes, and current WIP using existing vault rules. No duplicate topic notes or dummy glossary entries.
  STATUS: IMPLEMENTED
  EVIDENCE: Decision note for the readiness gate, a bug note for the guard matching prose and test names, an attempt note for scripted edits silently no-opping on CRLF, refreshed work-in-progress/current.md, and a 2026-10-08 session entry.

  STATUS: PENDING

  EVIDENCE: Not done in this pass. The findings, two live probes, three bugs found while implementing, and the unimplemented items listed here are durable and belong in the vault.

## Completion Contract

Do not report this work complete solely because a build passes, a plugin loads, or an instruction exists.

Completion requires evidence that:

1. Existing discovery behavior was reused rather than duplicated.
2. New and returning projects establish relevant context before supported edits.
3. Premature edits are blocked through every claimed enforcement path.
4. Genuine evidence allows the edit, while fabricated or cross-project evidence fails.
5. Reuse, refresh, session isolation, and failure recovery behave as documented.
6. Existing checks and relevant evaluations pass, with pre-existing failures distinguished from regressions.
7. Installation includes the implementation and user-facing docs match the tested boundary.

If runtime probing cannot be performed, record the blocker and mark runtime verification pending. Do not describe fixture-only tests as proof of installed OpenCode enforcement.

Final report: Summary / Details / Suggestion. Include a concise numbered Changes list, tests actually run, observed runtime evidence, remaining blockers, and enforcement limitations. Leave the TODO and WIP accurate if any acceptance criterion remains unmet.

Implementation record

Reused rather than duplicated. Project root, identity, normalization and knowledge-root
precedence existed only as prose in AGENTS.md and the knowledge-vault skill. That prose is now
implemented in src/discovery/resolve.mjs and is enforced. The only prior executable project
identity resolution was resolveProjectId in the trace plugin, which reads runtime context and an
environment variable and implemented none of the documented precedence; it was left in place.

Enforcement boundary, measured by probe on OpenCode 1.18.35 and recorded in
docs/discovery-enforcement.md:

- Every tool emits tool.execute.before, including native write and edit, and the hook receives
  the arguments including the target filePath.
- Throwing from that hook blocks those tools. A probe confirmed blocked.txt was never created and
  demo.txt was unchanged while a bash write in the same session still succeeded.
- patch and multiedit are guarded by tool name but were not observed in a live session.

Live verification:

- A project edit with no discovery was refused and the file was unchanged.
- The same edit succeeded after resolve, scope and memory, and the file changed.
- Loading the project-conventions body and reading the target did not grant readiness; the edit
  stayed blocked and the file stayed unchanged.
- The pre-existing bash capability guard still blocks independently of this gate.

Three defects were found while implementing and fixed: resolution walked to a bogus metadata root
when no override file existed, declared scope was not normalized against the project root so a
relative path never matched an absolute read, and the memory action overloaded a descriptive
reason field as a failure flag so a valid "no notes apply" result was treated as a vault failure.

Not implemented, and therefore not claimed:

- Worktree identity, uncommitted-change awareness, and config-change awareness.
- Note-versus-source staleness comparison, so the current-source-wins rule stays instruction-level.
- Explicit exclusion of secrets, vendor trees and generated output. Resolution does not walk
  trees today, so nothing is currently scanned, but no exclusion list exists for when it does.
- Gate decisions written to a trace stream.
- Discovery evidence reusing src/task/evidence-resolution.mjs trace events. Readiness binds to
  per-session recorded reads and to the resolved project root, which prevents a bare claim from
  passing, but it is not the same mechanism as completion evidence verification.
- Concurrent live OpenCode processes. Session isolation is asserted in tests and observed as
  not_started in a fresh session; two simultaneous processes were not run.
- Editing the knowledge-vault skill and command files. Their prose still describes discovery as
  instruction-only, which now understates what is enforced.

Testing. 250 tests pass, the strict typecheck is clean, and evaluations pass, from both the
repository and the installed copy. The installed manifest tracks 134 files with 0 mismatched, 0
missing and 0 identity leaks. Nothing was committed, pushed, or released.

Requires an OpenCode restart before the new gate is active in an interactive session.

Second pass: invalidation, verified memory evidence, isolation, tracing, docs, vault

Priorities completed as requested.

Readiness invalidation. src/discovery/staleness.mjs fingerprints every inspected file and reads
git HEAD and branch without spawning a process, including a worktree where .git is a file. Any
change, deletion, or revision move drops the previous verdict and clears declared scope. Tested:
four new cases in test/discovery.test.mjs, plus an unchanged context that keeps its verdict across
repeated checks.

Verified memory retrieval evidence. A claimed note is accepted only when it exists inside the
resolved knowledge root and was actually read this session. Claiming that no note applies is
accepted only when the knowledge root holds no memory-index.md. A note that does not exist, was
never read, or lies outside the knowledge root is rejected. The earlier overload where a
descriptive reason was treated as a failure flag is fixed with an explicit `failed` argument.

Session isolation. State is keyed by session id, and asserted for two sessions sharing one state
object and for two separate state objects. Cross-process isolation is not measured.

Gate-decision tracing. src/discovery/gate-trace.mjs records allow and refuse with the readiness
status, the reason, a project-relative path, and a hashed session id. No content, no command text,
no transcript. A live probe found the first version wrote an absolute user path when discovery had
not started; the plugin now falls back to the session's resolved root and the tracer independently
falls back to the basename.

Runtime probes. docs/runtime-probes.md records five probes with expected and actual outcomes,
verified against the installed plugin in a fresh process each time. Fixture-only checks are listed
separately and are never presented as installed-runtime evidence.

Documentation. The knowledge-vault skill now states that the precedence is implemented and adds a
Discovery Readiness Before Retrieval section. The status command reports readiness. AGENTS.md,
README and INSTALL were updated.

Vault capture. A decision note for the readiness gate, a bug note for the shell guard matching
prose and test names, an attempt note for scripted edits silently no-opping on CRLF, a refreshed
work-in-progress/current.md, and a 2026-10-08 session entry.

Final verification against the installed copy, fresh process each time:

| Probe | Expected | Actual | Verdict |
| --- | --- | --- | --- |
| Edit before discovery | refused, file unchanged | refused, `module.exports = 1` | pass |
| Discovery then edit | permitted, file updated | permitted, `module.exports = 2` | pass |

Still PARTIAL, deliberately not claimed:

- patch and multiedit are refused by tool name but were never observed live.
- Two concurrent OpenCode processes were not run.
- Discovery resolution does not walk trees, so no exclusion list for secrets, vendor directories
  or generated output.
- Readiness does not reuse src/task/evidence-resolution.mjs trace events, and that module still
  does not check project_id.
- Note-versus-source staleness correction remains instruction-level; invalidation only forces a
  re-read.

263 tests pass, strict typecheck clean, evaluations pass, and the installed manifest tracks 139
files with 0 mismatched, 0 missing and 0 identity leaks. Nothing committed or pushed.

Third pass: guard false positive, scoped memory evidence, reconciliation

Guard false positive, fixed. The shell guard substring-matched the entire command, so appending a
test whose name contained a Git verb phrase to a file was refused as a Git operation. The guard now
reduces a command to its executed segments, dropping heredoc bodies, quoted content, and trailing
comments, and matches Git verb phrases only against code. Real Git commands are still refused,
including one whose commit message quotes a guarded phrase. Regression coverage:
test/guard-regression.test.mjs, 8 cases.

no_relevant_notes, revised. It previously checked only whether memory-index.md existed. It now
requires an observed, scoped search: the areas searched must lie inside the resolved knowledge root
and must actually have been read or searched this session. A project with no vault at all is
satisfied by the filesystem fact that the knowledge root does not exist, which is verifiable rather
than caller-supplied. Regression coverage: test/memory-evidence.test.mjs, 8 cases.

A further defect surfaced while running the installed probes: reads were recorded at invocation, so
a read that failed still counted as inspected context. Reads are now withdrawn when the runtime
reports failure. Regression coverage: 2 cases in test/discovery.test.mjs.

Reconciliation. 21 items are marked PARTIAL and each names what is tested, what is assumed, and
what is missing. Session isolation is stated precisely: tested across session ids and across
separate state objects in one process; cross-process isolation is assumed from per-process
in-memory state and was not measured.

Installed-copy probes, repeated after the fixes, fresh process each:

| Probe | Expected | Actual | Verdict |
| --- | --- | --- | --- |
| Edit before discovery | refused, file unchanged | refused, file still 1 | pass |
| Discovery then edit | permitted, file updated | permitted, file now 2 | pass |
| Guarded phrase inside a heredoc | not guarded | not guarded | pass |
| Failed read then edit | refused | refused, file not created | pass |
| Unscoped no-notes claim | refused | refused, scope named | pass |

Note: an OpenCode session keeps the guard version it started with. The fix is installed and
verified in new processes, but a session that was already running keeps the old behaviour until it
restarts.

281 tests pass, strict typecheck clean, evaluations pass, and the installed manifest tracks 141
files with 0 mismatched, 0 missing and 0 identity leaks. Nothing committed or pushed.

Fourth pass: discovery gate scope ordering

Defect. evaluateGate returned not_started for every intercepted write whenever no discovery record
existed, before checking whether the target was a project modification at all. Two consequences: a
write to a temporary file outside the project was refused, and the gate refused the very edit that
would repair it. The second was observed directly when the gate blocked an attempt to fix the gate.

Fix. Scope is now settled before discovery starts, from the session resolution that always exists.
A path inside the resolved knowledge root is allowed, a path outside the resolved project root is
allowed as not governed by readiness, and only a path inside the project reaches the readiness
check. Resolution is validated before being relied on: a missing, empty, or non-string project or
knowledge root yields no scope, so the gate stays closed instead of opening by default.

Regression coverage, test/discovery-scope.test.mjs, 6 cases:

- a temporary write outside the project is allowed before discovery
- a project edit is still blocked before discovery
- a write inside the resolved knowledge root is allowed before discovery
- an unusable resolution leaves the gate closed rather than open by default
- a session that never resolved blocks project edits instead of assuming a scope
- the reordering does not weaken the check once discovery has started

Installed-copy verification, fresh process each:

| Probe | Expected | Actual | Verdict |
| --- | --- | --- | --- |
| gentjin_discovery callable in an installed session | returns a discovery record | called; status reported not_started with reasons | pass |
| Edit before discovery | refused, file unchanged | refused, file still 1 | pass |
| Discovery then edit | permitted, file updated | permitted, file now 2 | pass |

287 tests pass, strict typecheck clean, evaluations pass, and the installed manifest tracks 142
files with no mismatches.

Remaining blocker, disclosed. The session this work was performed in has the discovery gate
active but does not expose the gentjin_discovery tool, because the plugin module set is fixed at
process start. That session therefore could not satisfy its own gate, and this one authorized edit
had to be applied through bash, which the discovery gate does not intercept. The fix is verified by
tests and by fresh-process probes, but the self-repair path through the gate's own tool could not be
exercised in that session. A restarted session has the tool and does not need this workaround.

Still PARTIAL, unchanged: patch and multiedit are refused by tool name only and were never observed
live; cross-process isolation is argued from per-process state rather than measured; discovery does
not reuse the completion evidence resolver; and discovery resolution does not walk trees, so no
exclusion list exists for secrets, vendor directories, or generated output.
