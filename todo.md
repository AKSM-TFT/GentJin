# TODO — GentJin Engineering Workflow Improvements

## Objective

Improve GENTJIN's modular OpenCode workflow using selected engineering ideas from:

- GentJin: https://github.com/frnkgns/GentJin
- Reference: https://github.com/mattpocock/skills

Adapt useful concepts to GentJin's architecture, Obsidian Knowledge Vault, and existing rules. Do not install or copy the entire reference suite.

This TODO authorizes implementing the improvements below in the GentJin source repository. It does not authorize pushing, publishing, deploying, changing account settings, or overwriting a user's global OpenCode installation.

## Execution rules

- Inspect the actual repository and applicable instructions before editing.
- The current code and documentation are authoritative. This file proposes GentJin names; it does not claim matching upstream skills exist under those names.
- Verify upstream paths, content, and license before adapting anything. Record the inspected commit or version. If access fails, identify what could not be verified and implement only clearly specified local requirements.
- Preserve existing architecture, commands, preferences, working tree changes, and user data.
- Reuse existing skills and supporting scripts before adding equivalents. Do not create duplicate workflows.
- Keep the global entry point small; detailed instructions belong in skills or references loaded when needed.
- No new runtime dependencies or services by default. No mandatory MCP connection, paid tool, specific model, or issue tracker.
- Database access stays read-only by default. Never modify production credentials or include secrets, patient data, or private customer information in notes or fixtures.
- Reviews and planning remain read-only unless the user's task authorizes implementation.
- Continue through all phases. Report a genuine blocker precisely and continue independent work.
- Do not claim a scenario passed without running it or observing the required behavior.
- Do not remove legitimate regression tests as cleanup. Remove only disposable fixtures, debugging files, and generated artifacts introduced for temporary investigation.
- Do not implement parallel agents, worktree orchestration, or automatic self-modification in this task.

## Phase 1 — Inventory and integration plan

- [x] Confirm the GentJin source root, branch, working tree state, and applicable AGENTS.md instructions.
- [x] Read the README, current skill/command catalog, project discovery rules, installation/update workflow, and relevant Knowledge Vault notes.
- [x] Inspect existing equivalents of routing, issue triage, planning, TDD, domain modeling, skill creation, Git safeguards, and hook setup.
- [x] Inspect relevant reference skills and their supporting files; verify actual current paths rather than trusting names from a prior conversation.
- [x] Create a concise integration map in the repository's established documentation location:

| Proposed capability               | Existing GentJin owner                | Action         | Verified reference      |
| --------------------------------- | ------------------------------------- | -------------- | ----------------------- |
| Routing                           | Determine from source                 | Enhance or add | Exact path and revision |
| Bug triage                        | Determine from source                 | Enhance or add | Exact path and revision |
| Specification and task planning   | Determine from source                 | Enhance or add | Exact path and revision |
| TDD                               | Determine from source                 | Enhance or add | Exact path and revision |
| Active knowledge capture          | knowledge-vault or current equivalent | Enhance        | Exact path and revision |
| Domain and architecture knowledge | Determine from source                 | Integrate      | Exact path and revision |
| Git safeguards and hook setup     | git-workflow or current equivalent    | Enhance        | Exact path and revision |
| Skill authoring                   | Determine from source                 | Enhance or add | Exact path and revision |

- [x] Preserve required attribution and license notices for any reused material. Prefer original GentJin instructions adapted from concepts.
- [x] Establish source versus runtime ownership. Do not recreate obsolete permanent installation directories or assume a previous installation layout still applies.

Acceptance: every proposed capability has one clear owner, and overlapping skills have a documented resolution.

## Phase 2 — Routing and project context

### Routing (suggested name: gentjin-router)

- [x] Add or enhance a lightweight routing entry point.
- [x] Recognize task intent, authorized scope, changed files, affected layers, and available tools.
- [x] Select the smallest sufficient workflow. Do not run every reviewer for every task.
- [x] Respect explicit skill requests and review-only instructions.
- [x] Run skills in dependency order; avoid recursive routing and repeated context discovery.
- [x] Escalate questions only when an unresolved choice materially changes scope or safety. Do not require a long questionnaire for routine fixes.
- [x] If a needed tool is unavailable, report the limit and use an appropriate local fallback.

Routing examples to document and validate:

- "Review what I changed" → changes-review; include relevant specialist checks for affected code.
- "Review the whole project" → project-review; report findings without applying fixes.
- "This table has data but renders no rows" → issue-triage before proposing a fix.
- "Plan this feature" → feature-planning; no implementation implied.
- "Build this feature" → proportional planning, implementation, relevant review, verification, and capture.
- "Prepare my changes for push" → Git inspection and checks; do not push from preparation alone.

### Project context

- [x] Extend the existing discovery mechanism and .project-agent.md convention if still current.
- [x] Record only necessary stable context: project identity, Vault path, stack, validation commands, documentation locations, and optional issue tracker.
- [x] Infer context from the repository first; ask only for information that cannot be safely inferred.
- [x] Preserve existing fields and overrides. Do not introduce a competing project configuration.
- [x] Work without an issue tracker or MCP server.
- [x] Load only relevant context and notes rather than the entire Vault.

Acceptance: natural-language requests select the appropriate scope and skills without duplicate execution or unrelated edits.

## Phase 3 — Evidence-based issue triage

Suggested name: issue-triage, unless a suitable owner exists.

- [x] Capture expected behavior, actual behavior, reproduction steps, affected environment, and available evidence.
- [x] Trace the relevant flow end to end. For UI failures, inspect response shape, mapping, state, filters, pagination, template conditions, and rendered output where applicable.
- [x] Separate observations from hypotheses. Rank plausible causes and choose checks that can distinguish them.
- [x] After a failed fix, record the attempt and change the investigation based on evidence. Do not repeatedly offer the same patch without new evidence.
- [x] Treat a successful build as build evidence only; it does not prove the original bug is fixed.
- [x] For an authorized fix, reproduce the failure when feasible, implement the smallest supported correction, and verify the original reproduction.
- [x] If runtime access is unavailable, report "implemented; runtime verification pending" with exact remaining steps.
- [x] Capture meaningful root causes and failed approaches in the established bugs/WIP locations.

Acceptance: triage produces an evidence-backed diagnosis or a precise blocker, with no unsupported "fixed" claims.

## Phase 4 — Specification and task planning

Suggested name: feature-planning. Keep one skill with optional reference files unless splitting has a clear benefit.

- [x] Scale planning to the work: a small fix needs a short plan; a larger feature may need a specification.
- [x] Establish the problem, user flow, constraints, scope, non-goals, acceptance criteria, affected modules, and validation approach.
- [x] Distinguish confirmed requirements from assumptions and unresolved questions.
- [x] Inspect current behavior and existing interfaces before proposing an architecture.
- [x] Include loading, error, empty, authorization, accessibility, and data-handling behavior when relevant.
- [x] Break larger work into tasks with dependencies, expected outcomes, and concrete verification.
- [x] Use existing local task/issue conventions. Draft external issues locally unless publication is explicitly authorized.
- [x] Record meaningful product and architecture choices in the existing Vault locations.
- [x] Planning-only requests must not alter application code.

Acceptance: tasks are implementable and acceptance criteria can be checked without expanding scope.

## Phase 5 — Proportional TDD and regression verification

Suggested name: tdd, or integrate into the existing implementation workflow.

- [x] Reuse the project's existing runner and test conventions.
- [x] For behavior changes where testing is appropriate, write a meaningful failing test, confirm the intended failure, make it pass, then refactor without changing behavior.
- [x] Prefer public behavior and useful boundaries over tests that mirror implementation details.
- [x] Include edge cases appropriate to the change; do not create a large testing framework for trivial work.
- [x] If no runner exists, use existing tools or propose the smallest suitable setup. Do not silently add dependencies.
- [x] Distinguish regression tests, build checks, static checks, and manual runtime verification.
- [x] Preserve permanent regression tests. Keep real customer data and credentials out of test fixtures.
- [x] When automation is impractical, document exact manual verification and its limits.

Acceptance: test claims include commands and observed outcomes, and bug fixes retain useful regression coverage.

## Phase 6 — Active Knowledge Vault capture and domain modeling

Enhance the existing knowledge-vault skill rather than replacing its structure.

- [x] Add a brief capture decision after meaningful work and before the final report.
- [x] Search for existing relevant notes before creating new ones.
- [x] Use the current canonical structure. The mappings below are conceptual; adapt paths to the repository's actual convention.
- [x] Make capture selective. Empty folders are acceptable when no useful knowledge exists; do not manufacture notes to fill them.

| Evidence discovered                         | Destination  | Minimum useful content                       |
| ------------------------------------------- | ------------ | -------------------------------------------- |
| Confirmed failure and correction            | bugs         | Symptom, cause, correction, verification     |
| Meaningful choice and rejected alternatives | decisions    | Context, choice, alternatives, consequence   |
| Significant architecture choice             | ADRs         | Decision, rationale, tradeoffs, status       |
| New or clarified business term              | glossary     | Meaning, relevant rules, code/doc links      |
| Reusable implementation approach            | patterns     | Context, approach, applicability             |
| Changed component responsibility            | modules      | Responsibility, interfaces, dependencies     |
| Changed system relationship                 | architecture | Updated relationship and rationale           |
| Important unfinished work                   | sessions/WIP | State, attempts, next step, blockers         |
| Approved future improvement                 | enhancements | Problem, intended outcome, priority if known |

- [x] Use one canonical note for a decision; link an ADR from the decision index instead of duplicating the same narrative.
- [x] Update existing notes while preserving history and marking superseded assumptions.
- [x] Link claims to relevant files, symbols, commits, or task references when available.
- [x] Mark user-confirmed rules, code-derived behavior, and uncertain interpretations distinctly.
- [x] Track meaningful changes and why they were made using the existing audit/session mechanism. Avoid recording every trivial edit in every folder.
- [x] Prefer a glossary index that links existing notes over another competing CONTEXT.md/GLOSSARY.md system.
- [x] Do not infer business policy from variable names alone.
- [x] Final reporting states useful notes created/updated, or a concise reason no durable note was needed.

Acceptance: a real decision, business term, or root cause triggers the appropriate capture; unsupported information is not presented as established knowledge.

## Phase 7 — Git safeguards and optional pre-commit setup

Enhance git-workflow/git-push and add setup-pre-commit only if missing and justified.

- [x] Inspect branch, diff, staged changes, remote, and existing safeguards before acting.
- [x] Never stage unrelated user changes or include credentials and generated debug artifacts.
- [x] Do not reset, force-push, rewrite shared history, or bypass hooks without explicit authorization for that action.
- [x] Keep "review," "prepare," "commit," and "push" permissions distinct.
- [x] Preserve concise numbered change descriptions for branches/PRs; avoid long internal process narratives.
- [x] Do not claim checks ran when they were unavailable or skipped.
- [x] Make hook setup an explicitly invoked capability, not a surprise side effect of ordinary coding tasks.
- [x] Inspect existing hooks and tooling; preserve them and reuse existing validation commands.
- [x] Keep local hooks fast and leave expensive checks to existing CI where appropriate.
- [x] Provide setup, verification, and rollback instructions. Explain that hooks alone do not enforce server-side merge protection.
- [x] Do not install hook tooling into unrelated projects or change remote branch rules in this task.

Acceptance: Git preparation reports exact scope and validation; existing hooks remain functional and external actions require the corresponding authorization.

## Phase 8 — Controlled skill authoring

Suggested name: skill-authoring; adapt to existing naming conventions.

- [x] Define when a reusable skill is justified and when to extend an existing one.
- [x] Include purpose, precise triggers, exclusions, inputs, workflow, permissions, outputs, fallbacks, and examples.
- [x] Use GentJin/OpenCode's actual supported skill format and discovery mechanism.
- [x] Keep core instructions concise and move optional detail into references.
- [x] Detect overlapping triggers, contradictory safeguards, broken references, and recursive calls.
- [x] Require representative scenario evaluation before registering a new skill.
- [x] Changes to shared skills occur only in response to authorized skill work. Discovering a pattern during another task does not authorize rewriting global behavior.
- [x] Record changes and rationale in the existing audit mechanism.
- [x] Do not build an autonomous self-modifying agent.

Acceptance: a newly authored skill is discoverable, narrowly triggered, compatible with existing rules, and supported by scenario evidence.

## Phase 9 — Documentation, installation, and evaluation

- [x] Update the README/catalog with final names, triggers, examples, and overlap boundaries.
- [x] Keep entry points and command references consistent; add commands only where GentJin's conventions need them.
- [x] Update tracked installation/update/manifest tooling so the new and enhanced skills are included.
- [x] Preserve current exclusions for credentials, local configuration, dependencies, and unrelated files.
- [x] Validate installation in an isolated temporary OpenCode config location. Do not overwrite the user's live installation.
- [x] Use existing repository checks; add a small maintainable validation mechanism only if needed.
- [x] Verify frontmatter, skill discovery, relative references, command links, and ownership of each workflow.
- [x] Run scenario evaluations below. For each, record expected route, actual result, evidence, and pass/fail/blocked.
- [x] Keep useful evaluation fixtures and results; remove disposable debug output.
- [x] Review the final diff for unrelated changes and copied platform-specific assumptions.

Required scenarios:

1. Changed-code review selects relevant skills and makes no unauthorized fixes.
2. Whole-project review remains read-only.
3. Empty UI with a populated response prompts evidence gathering; build success is not reported as runtime success.
4. A failed attempted fix changes the investigation rather than repeating the same suggestion.
5. A business-term discovery updates or links the glossary.
6. A meaningful architecture choice creates or updates a canonical decision/ADR.
7. Routine formatting does not create unnecessary domain notes.
8. Planning-only work produces a plan without changing application code.
9. A behavior fix retains a meaningful regression test when feasible.
10. Git preparation preserves unrelated changes and does not push.
11. A project without an issue tracker/MCP still works locally.
12. Existing hooks and project overrides survive setup/update.
13. A new skill with overlapping triggers is revised or merged into an existing skill.
14. Isolated installation discovers the final skills without obsolete runtime copies.

## Completion requirements

Mark a checkbox complete only when its behavior is implemented and its applicable verification is recorded. Use "blocked" or "deferred" with a concrete explanation for unmet items.

Finish with the established GentJin report format:

### Summary

What changed and what is usable.

### Details

1. Concise numbered changes.
2. Final skills added/enhanced and files changed.
3. Upstream references inspected and their revision; attribution if applicable.
4. Verification commands/scenarios and observed outcomes.
5. Durable notes captured.
6. Blockers, deferred items, and verification still pending.

### Suggestion

Only practical next steps, including how to update the user's runtime if needed.

Do not describe prompt routing alone as an evaluated autonomous engineering system. Report the behavior and evaluation evidence actually delivered.
