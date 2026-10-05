# TODO — GentJin Change Audit + Pre-Push Development Artifact Cleanup

## Goal

Enhance GentJin so every task that changes a project leaves behind a durable, human-readable audit trail explaining:

1. **What the previous code/behavior was**
2. **What changed**
3. **Why the change was necessary**
4. **Which files were affected**
5. **How the change was verified**
6. **What temporary QA / TEST / DEBUG / SEED artifacts were created**
7. **Whether those temporary artifacts were removed before GitHub push**

The purpose is to make project history understandable later. If the user asks:

- "Why did we change this?"
- "What was the old implementation?"
- "What did we do yesterday?"
- "Which file changed?"
- "What was the reason for this fix?"
- "Did we add temporary test or seed files?"
- "Where is the documentation for this task?"

GentJin should be able to point to a durable note in the project knowledge vault instead of relying on chat/session memory.

---

# Important Implementation Rule

**Do not immediately create new skills or duplicate existing behavior.**

First inspect the CURRENT GentJin repository and determine where this belongs in the existing architecture.

Preserve the current architecture and naming conventions.

Prefer extending existing components such as:

- `AGENTS.md`
- `knowledge-vault`
- `work-in-progress`
- `reporting`
- `git-workflow`
- `git-push`
- `changes-review`
- `project-review`
- existing templates / vault initialization logic

Only create a new skill such as `change-audit` if the current architecture genuinely has no clean owner for the workflow.

Do not create duplicate rules that can drift apart.

---

# Phase 0 — Inspect the Current GentJin Repository

Before making changes:

- [ ] Read the current root `AGENTS.md`.
- [ ] Inspect every existing GentJin command.
- [ ] Inspect the current `skills/` structure.
- [ ] Read the current knowledge-vault implementation.
- [ ] Read the current work-in-progress/session-memory behavior.
- [ ] Read the current reporting behavior.
- [ ] Read the current git workflow.
- [ ] Read the current git push workflow.
- [ ] Inspect `changes-review` and `project-review` if currently present.
- [ ] Inspect deployment/release checks if currently present.
- [ ] Inspect vault initialization, templates, indexes, and migration/update logic.
- [ ] Inspect INSTALL/update behavior so existing GentJin installations can receive the new behavior safely.
- [ ] Search for any existing change-log, task-history, session-history, audit, decision, or report format before adding another one.

After inspection, write a short implementation plan identifying the exact existing files that should be modified.

Do not change files until the existing architecture is understood.

---

# Phase 1 — Add a Durable Change Audit

## Required Behavior

Whenever GentJin/OpenCode performs a task that modifies:

- source code
- application behavior
- configuration
- database schema/query logic
- APIs
- UI behavior
- deployment configuration
- build configuration
- project architecture
- documentation that changes project behavior/instructions

GentJin must create or update a durable change audit note.

This should happen automatically as part of task completion.

The user should not need to manually say:

> "Save this to memory."

The audit must be part of the normal GentJin workflow.

---

# Phase 2 — Change Audit Format

Use the current project knowledge-vault structure if an appropriate location already exists.

If there is no suitable durable location, add a dedicated location similar to:

```text
<project-vault>/
└── changes/
    └── YYYY/
        └── YYYY-MM-DD-<task-slug>.md
```

Do not force this exact structure if the current GentJin vault already has a better canonical location.

Avoid creating duplicate `changes`, `reports`, or `sessions` systems.

## Minimum Audit Content

Each modifying task should capture:

```markdown
# <Task / Change Title>

Date:
Status:
Task / Ticket:
Branch:
Base Commit:
Current Commit:

## Summary
Short explanation of what the task changed.

## Previous Implementation / Last Code
Explain what existed before the change.

Include:
- previous behavior
- relevant file path(s)
- relevant function/component/query/module
- a SMALL relevant code snippet when useful
- previous commit/hash when available

Do NOT copy entire source files into the vault.

## What Changed
Explain the implementation that was changed.

Include:
- files changed
- functions/components/modules affected
- database/query changes
- UI/API behavior changes
- configuration changes
- deleted/replaced logic

## Why We Changed It
Explain the actual reason.

Examples:
- bug being fixed
- user request
- incorrect previous behavior
- performance problem
- duplicated logic
- architecture requirement
- security issue
- compatibility problem
- business rule

Do not write vague reasons such as:
"updated code"
"fixed issue"
"improved implementation"

The note must preserve the reasoning.

## Before → After
Describe the important behavioral difference.

Example:

Before:
The post-discharge API returned records but the Angular table did not render them.

After:
The table correctly binds the returned records and displays patient rows.

## Files Changed
- `path/to/file.ts` — reason
- `path/to/component.html` — reason

## Verification
Record what was ACTUALLY verified.

Examples:
- build passed
- typecheck passed
- lint passed
- specific page manually checked
- API response inspected
- browser behavior confirmed
- query result verified

Never claim a test or verification was performed if it was not actually performed.

## Temporary Development Artifacts
Record anything created only to help development.

Examples:
- temporary seed script
- test data
- throwaway unit test
- debug script
- debug route
- temporary SQL
- QA fixture
- mock data
- console logging
- screenshots/log dumps
- temporary feature flags

For each artifact record:

- path
- purpose
- whether it must be removed before push
- cleanup status

## Cleanup Result
State whether temporary development artifacts were removed.

## Related Knowledge
Link relevant:
- bug notes
- decisions
- architecture notes
- module notes
- reports
- previous change audits
```

---

# Phase 3 — Capture the "Last Code" Correctly

The user specifically wants the audit to preserve:

- **the last code**
- **what changed**
- **why it needed to change**

Do NOT store complete copies of every modified file.

Instead preserve the smallest useful previous-state evidence.

Preferred order:

1. Base Git commit/hash
2. Previous file/function/component name
3. Small relevant code snippet if needed for understanding
4. Short explanation of previous behavior

Git remains the source of truth for the full historical source code.

The knowledge vault explains the human reasoning behind that history.

Example:

```markdown
## Previous Implementation / Last Code

Base commit: `abc1234`

File:
`src/modules/post-discharge/post-discharge.component.ts`

Previous behavior:
The API result was assigned to the paginator count, but the table datasource
was not receiving/rendering the same records.

Relevant previous code:

```ts
this.totalRecords = response.total;
```
```

The goal is not to duplicate Git.

The goal is to make Git history understandable.

---

# Phase 4 — Track Temporary QA / TEST / DEBUG / SEED Artifacts During the Task

GentJin must track temporary development artifacts **when they are created**, not try to guess everything only at push time.

The WIP/task state should maintain a temporary-artifact ledger.

Example:

```markdown
## Temporary Artifact Ledger

| File | Type | Purpose | Created By Task | Remove Before Push |
|---|---|---|---|---|
| scripts/debug-post-discharge.ts | DEBUG | Inspect API response | Yes | Yes |
| db/seed-post-discharge.ts | SEED | Create local QA records | Yes | Yes |
| src/foo/foo.test.ts | TEST | Temporary regression check | Yes | Yes |
```

Possible classifications:

- TEST
- QA
- DEBUG
- SEED
- MOCK
- FIXTURE
- TEMP
- LOCAL-ONLY

This ledger should follow the task until completion or push.

---

# Phase 5 — Mandatory Pre-Push Cleanup Gate

This is a NON-NEGOTIABLE GentJin rule.

When the user asks OpenCode/GentJin to push code to GitHub, GentJin must first audit the working tree for development-only artifacts.

## Core Rule

**Anything created solely for QA, TEST, DEBUG, SEEDING, temporary local verification, or development investigation must NOT be pushed to GitHub unless the user explicitly says that artifact is intended to become a permanent part of the repository.**

Examples of files that may be temporary:

```text
seed*.ts
seed*.js
seed*.sql
debug*.ts
debug*.js
debug*.py
qa*.ts
test-data.*
mock-data.*
tmp.*
temp.*
scripts/debug/*
scripts/qa/*
scripts/test/*
scripts/seed/*
qa/*
debug/*
tmp/*
```

Test-looking files such as:

```text
*.test.*
*.spec.*
tests/*
test/*
__tests__/*
```

must **NOT** be blindly deleted.

The cleanup decision must consider:

1. Did this file exist before the current task?
2. Was it created by OpenCode during this task?
3. Was it created solely for temporary QA/testing/debugging?
4. Did the user explicitly request it as a permanent project test?
5. Is it part of the project's existing permanent test suite?

Never delete an existing permanent project test suite just because the filename contains `test` or `spec`.

The target is **temporary task-created development artifacts**.

---

# Phase 6 — Detect Temporary Debug Changes Inside Real Source Files

Cleanup is not limited to standalone files.

Before push, inspect modified production files for temporary development code such as:

- `console.log`
- `console.debug`
- temporary print statements
- temporary debug panels
- hardcoded IDs
- hardcoded users/patients/accounts
- temporary mock responses
- bypassed authentication
- bypassed authorization
- disabled validation
- temporary feature flags
- forced success responses
- temporary routes/endpoints
- commented-out replacement logic
- TODO/FIXME notes created only for the debugging session
- local-only URLs
- localhost overrides
- temporary database values
- temporary API keys/tokens
- artificial delays
- debug UI labels
- test buttons
- manually injected QA data

Restore or remove development-only changes before push.

Do not remove legitimate logging or existing project behavior without evidence that it was introduced only for the current debugging task.

---

# Phase 7 — Pre-Push Audit Procedure

Before ANY GitHub push:

- [ ] Inspect `git status`.
- [ ] Inspect staged files.
- [ ] Inspect unstaged files.
- [ ] Inspect untracked files.
- [ ] Inspect the complete diff.
- [ ] Compare the diff against the task's temporary-artifact ledger.
- [ ] Search for task-created QA files.
- [ ] Search for task-created test files.
- [ ] Search for task-created seed files.
- [ ] Search for task-created debug files.
- [ ] Search for temporary mock/fixture data.
- [ ] Search modified production files for temporary debug logic.
- [ ] Remove task-created temporary development artifacts.
- [ ] Revert temporary modifications made only for testing/debugging.
- [ ] Confirm no secrets or credentials are being committed.
- [ ] Confirm no `.env` or production credential files are included.
- [ ] Run the appropriate build/typecheck/lint/verification AFTER cleanup.
- [ ] Re-inspect `git status` and the final diff.
- [ ] Update the change audit with the cleanup result.
- [ ] Only then continue with commit/push.

If cleanup changes production behavior or causes verification to fail:

**STOP.**

Do not push.

Investigate first.

---

# Phase 8 — Git Push Must Report What It Removed

When cleanup removes temporary files before a push, GentJin should tell the user.

Example:

```text
Pre-push cleanup

Removed development-only artifacts:
- scripts/debug-patient-response.ts
- db/seed-post-discharge.ts
- src/post-discharge/post-discharge.temp.test.ts

Removed temporary debug code:
- console logging from post-discharge.service.ts

Retained:
- existing permanent test suite
- production migration
- actual feature implementation

Verification after cleanup:
- build: passed
- typecheck: passed

Change audit:
<project-vault>/changes/2026/2026-10-02-post-discharge-rendering.md
```

Do not silently remove unrelated files.

---

# Phase 9 — Update GentJin's Core Rules

Add a concise always-on invariant to the appropriate root instruction file.

Do NOT duplicate the entire workflow in `AGENTS.md`.

`AGENTS.md` should contain a short rule similar in meaning to:

> Every task that modifies the project must leave a durable change audit containing the previous implementation, what changed, and why. Temporary artifacts created solely for QA, TEST, DEBUG, SEEDING, mocks, or local development must be tracked during the task and removed before GitHub push unless the user explicitly requires them as permanent repository artifacts.

The detailed procedure should live in the correct skill/workflow files.

---

# Phase 10 — Update Knowledge Vault Behavior

Extend the existing knowledge-vault behavior so that change audits are first-class project knowledge.

Required capabilities:

- [ ] Automatically write change audits after modifying tasks.
- [ ] Search change audits when the user asks why something changed.
- [ ] Search change audits when investigating regressions.
- [ ] Link changes to relevant bugs/decisions/modules.
- [ ] Include recent changes in daily briefs.
- [ ] Include relevant change history when resuming WIP.
- [ ] Avoid loading the entire change history into context.
- [ ] Retrieve only relevant change notes.

Questions GentJin should be able to answer later:

```text
What did we change yesterday?
Why was this query changed?
What was the old implementation?
When did we change this component?
Which files were involved?
Why did we remove this logic?
Did we create temporary seed data for this task?
Did we clean the QA files before pushing?
Show me the documentation for this fix.
```

---

# Phase 11 — Update Work-In-Progress Behavior

The WIP system should track:

```text
Task
↓
Initial repository state
↓
Base commit
↓
Files being modified
↓
Important previous implementation
↓
Temporary artifact ledger
↓
Reasoning / decisions
↓
Implementation
↓
Verification
↓
Cleanup
↓
Durable change audit
↓
Final report
```

If the session ends unexpectedly, the next GentJin session should be able to recover:

- what task was being done
- what had already changed
- what temporary files still exist
- whether cleanup is still required
- whether the durable audit has already been written

---

# Phase 12 — Update Reporting

The normal GentJin final report should include the documentation location.

Keep the existing GentJin reporting format if one already exists.

Add something equivalent to:

```markdown
## Documentation

Change audit:
`<vault-path>/changes/<change-note>.md`

Temporary artifacts:
Removed / None / Pending cleanup
```

The user should always know where to read the detailed history.

Do not dump the entire audit into the chat response.

Point to the durable note.

---

# Phase 13 — Integrate With `changes-review`

If `changes-review` currently exists, extend it so the review also checks:

- [ ] Is there a change audit for this modifying task?
- [ ] Does it describe the previous implementation?
- [ ] Does it explain what changed?
- [ ] Does it explain WHY?
- [ ] Does it list affected files?
- [ ] Does it record actual verification?
- [ ] Are temporary task artifacts still in the diff?
- [ ] Are there temporary debug statements?
- [ ] Are there seed/QA/test files that should not ship?
- [ ] Are there secrets or local configuration artifacts?
- [ ] Does the final diff match the intended feature/fix?

Do not turn `changes-review` into an auto-delete command.

It should identify problems and feed the cleanup/push workflow.

---

# Phase 14 — Integrate With `project-review`

If `project-review` exists, it may inspect historical audit quality at the project level.

Possible checks:

- undocumented major changes
- missing reason/decision history
- stale WIP notes
- orphaned change audits
- temporary QA/debug artifacts accidentally committed
- project knowledge that contradicts current code

Keep `project-review` analysis-first.

Do not modify the project during a review unless the user explicitly approves implementation.

---

# Phase 15 — Integrate With Daily Brief / Project Memory

Recent change audits should become one of the primary sources for:

```text
"What changed yesterday?"
"What was the last thing we worked on?"
"Give me a briefing."
```

A daily brief should be able to summarize:

- task/change title
- what changed
- why
- important files
- status
- unresolved WIP
- cleanup/push status

Do not rely only on commit messages because commit messages often do not preserve enough reasoning.

---

# Phase 16 — Avoid Documentation Noise

Do not create dozens of notes for tiny edits inside the same task.

One meaningful task should normally produce one primary change audit.

Append/update the same audit as the task evolves.

Create separate durable notes only when there are genuinely separate decisions, bugs, architecture changes, or independently useful knowledge.

Examples:

```text
Task: Implement post-discharge table
    ↓
1 change audit

During task:
- API fix
- table binding fix
- pagination fix
- temporary seed
- temporary debug script

All belong to the same task audit unless they represent separate durable decisions.
```

---

# Phase 17 — Update Installation / Upgrade Logic

The feature must work for:

1. New GentJin installations
2. Existing GentJin installations being updated

Inspect the current GentJin installation/update architecture before editing.

If a new vault folder/template is necessary:

- create it safely
- do not overwrite existing user notes
- preserve custom vault paths
- preserve `.project-agent.md` overrides if currently supported
- preserve existing GentJin backups/manifest behavior
- update installation verification accordingly

If no new directory is necessary, do not create one.

---

# Phase 18 — Add/Update Templates

If GentJin currently uses templates, add or update the appropriate change-audit template.

Do not hardcode project-specific examples into the reusable GentJin runtime.

The template should be technology-agnostic.

Suggested sections:

```markdown
# {{change_title}}

Date:
Status:
Task:
Branch:
Base Commit:
Current Commit:

## Summary

## Previous Implementation / Last Code

## What Changed

## Why We Changed It

## Before → After

## Files Changed

## Verification

## Temporary Development Artifacts

## Cleanup Result

## Related Knowledge
```

---

# Phase 19 — Important Git Safety Rules

Do NOT:

- delete pre-existing tests merely because they are tests
- delete permanent fixtures already tracked by the repository
- delete migrations required by the feature
- delete permanent seed infrastructure used by the application
- delete user-created files without knowing their purpose
- use broad destructive commands to clean the repository
- reset unrelated user changes
- run destructive database cleanup
- remove files just because their filename matches a pattern
- silently alter production credentials
- claim cleanup succeeded without inspecting the final diff

Cleanup must be **task-aware and provenance-aware**.

The question is:

> "Was this created or modified solely to help us QA, TEST, DEBUG, SEED, mock, or investigate the current task?"

If yes, it should normally be removed before GitHub push.

If no, leave it alone.

---

# Phase 20 — Definition of Done

This GentJin enhancement is complete only when all of the following are true:

- [ ] Current GentJin architecture was inspected before implementation.
- [ ] Existing skills were extended instead of duplicated where possible.
- [ ] Every modifying task produces/updates a durable change audit.
- [ ] Audit records the previous implementation / last code.
- [ ] Audit records what changed.
- [ ] Audit records why it changed.
- [ ] Audit records affected files.
- [ ] Audit records actual verification.
- [ ] WIP tracks temporary QA/TEST/DEBUG/SEED artifacts.
- [ ] Push workflow performs a mandatory pre-push cleanup audit.
- [ ] Temporary task-created development artifacts are removed before push.
- [ ] Existing permanent test infrastructure is preserved.
- [ ] Temporary debug modifications inside production files are cleaned.
- [ ] Build/typecheck/lint/appropriate verification is rerun after cleanup.
- [ ] Final diff is inspected after cleanup.
- [ ] Final report tells the user where the change documentation lives.
- [ ] Daily brief can use these audits as a source.
- [ ] Existing GentJin installs can be updated safely.
- [ ] New GentJin installs receive the behavior automatically.
- [ ] Documentation explains the behavior.
- [ ] No unrelated changes were introduced.

---

# Required Validation Scenario

Before declaring this feature complete, simulate or perform a safe local scenario similar to:

```text
User:
"Debug this API issue."

GentJin:
1. Starts/updates WIP.
2. Records base commit.
3. Creates `scripts/debug-api.ts`.
4. Records it in the temporary-artifact ledger.
5. Modifies the real API implementation.
6. Runs the debug script.
7. Records verification.
8. Writes/updates the change audit:
   - previous implementation
   - what changed
   - why

User:
"Push it to GitHub."

GentJin:
9. Runs pre-push audit.
10. Detects `scripts/debug-api.ts` as task-created DEBUG-only artifact.
11. Removes it.
12. Removes any temporary debug logging.
13. Re-runs appropriate verification.
14. Re-inspects the final diff.
15. Updates the audit cleanup status.
16. Reports what was removed.
17. Continues normal Git push workflow.
```

Expected final repository:

```text
Production fix              ✅
Required migration          ✅
Required production config  ✅
Permanent existing tests    ✅
Temporary debug script      ❌
Temporary seed              ❌
Temporary QA data           ❌
Temporary throwaway test    ❌
Temporary console logging   ❌
Secrets/local credentials   ❌
```

Expected knowledge vault:

```text
WIP / session history       ✅
Durable change audit        ✅
Previous implementation     ✅
What changed                ✅
Why                         ✅
Verification                ✅
Cleanup history             ✅
```

---

# Final Instruction to OpenCode

Do not merely add documentation describing this workflow.

**Implement the behavior into GentJin itself.**

GentJin should enforce this automatically during normal work.

The intended lifecycle is:

```text
UNDERSTAND TASK
      ↓
LOAD RELEVANT PROJECT KNOWLEDGE
      ↓
START / UPDATE WIP
      ↓
CAPTURE BASE STATE + LAST IMPLEMENTATION
      ↓
IMPLEMENT
      ↓
TRACK TEMP QA / TEST / DEBUG / SEED ARTIFACTS
      ↓
VERIFY
      ↓
WRITE / UPDATE DURABLE CHANGE AUDIT
      ↓
REPORT DOCUMENTATION LOCATION
      ↓
USER REQUESTS GIT PUSH
      ↓
MANDATORY PRE-PUSH CLEANUP AUDIT
      ↓
REMOVE DEVELOPMENT-ONLY ARTIFACTS
      ↓
RE-VERIFY AFTER CLEANUP
      ↓
UPDATE CHANGE AUDIT
      ↓
FINAL DIFF REVIEW
      ↓
NORMAL COMMIT / PUSH WORKFLOW
```

Do not mark this TODO complete until the behavior is verified end-to-end.


# Phase 21 — Simplify Git Push / Branch Description Output

The current Git push workflow must be enhanced so GentJin/OpenCode does **not** generate a long technical paragraph for the GitHub branch description, pull request summary, or branch-change summary by default.

The user wants the branch description to be:

- short
- numbered
- human-readable
- focused on actual user-visible or behavior-level changes
- easy to scan
- non-repetitive
- free from unnecessary implementation detail

## Required Format

Use a numbered list like this:

```text
1. Added a post-discharge timeline you open by clicking any patient row, in Patient Status Details and LUPA Patients.
2. Fixed the timeline showing empty for patients who did have a discharge date.
3. Fixed search and pagination in Patient Status Details — neither was affecting what you actually saw.
4. Sorted both tables by referral date, newest first.
5. Fixed Visit List showing about 1,300 duplicate visits and missing remarks on most rows.
6. Repaired the Visit Summary remark column and its PDF export, which an earlier change had blanked.
7. Made both tables fully operable from the keyboard, with visible focus and labels for screen readers.
8. Forced the hamburger menu icon to white.
```

## Style Rules

The Git push / branch description must:

- [ ] Use a numbered list.
- [ ] Use one concrete change per numbered item.
- [ ] Explain what changed in plain language.
- [ ] Prefer behavior/result over implementation detail.
- [ ] Mention affected area/page/module when useful.
- [ ] Keep each item concise.
- [ ] Avoid repeating the same change in multiple items.
- [ ] Avoid dense technical paragraphs.
- [ ] Avoid dumping file paths unless the user specifically asks for them.
- [ ] Avoid internal implementation names unless they are necessary to understand the change.
- [ ] Avoid writing a full QA/reporting document into the branch description.
- [ ] Avoid excessive Markdown sections for a simple branch summary.
- [ ] Avoid vague items such as "Updated code" or "Improved logic."
- [ ] Avoid overexplaining root cause unless it helps the reader understand the change.

## What Belongs in the Branch Description

Good:

```text
1. Added post-discharge timeline support to Patient Status Details and LUPA Patients.
2. Fixed discharged patients showing an empty timeline.
3. Fixed search and pagination not updating visible Patient Status records.
4. Sorted patient tables by newest referral date first.
```

Bad:

```text
Refactored PostDischargeService to use a revised observable stream and updated
ChangeDetectorRef behavior while modifying the datasource lifecycle. The paginator
was adjusted to synchronize the returned API result set with the view state, and
several component-level handlers were rewritten...
```

The detailed technical explanation belongs in:

- the durable change audit
- implementation notes
- reports
- commit history
- relevant bug/decision documentation

It does **not** belong in the normal branch description.

---

## Source of the Numbered Change List

Before creating the branch description, GentJin should derive the numbered items from:

1. the current task/WIP
2. the durable change audit
3. the actual final Git diff
4. relevant completed fixes/features on the branch

Do not invent changes that are not present in the final branch.

If the branch contains several commits/tasks, summarize the meaningful final outcomes rather than listing every internal edit.

Example:

```text
Task history:
- changed datasource assignment
- added explicit refresh
- fixed paginator binding
- removed temporary debug code

Branch description:
1. Fixed Patient Status Details so fetched patient records now render correctly.
2. Fixed pagination so changing pages updates the visible patient list.
```

The branch description is a **reader-facing summary**, not a raw engineering log.

---

## Grouping Rules

Combine tightly related implementation details into one user-facing item when they represent one actual change.

Example:

Do this:

```text
1. Fixed Visit List duplicate rows and restored missing remarks.
```

Instead of:

```text
1. Changed Visit List query joins.
2. Updated duplicate filtering.
3. Changed remark mapping.
4. Updated response transformation.
5. Adjusted table datasource.
```

However, keep changes separate when they affect clearly different behavior.

---

## Recommended Length

Default target:

```text
3–10 numbered items
```

Do not force a minimum if the branch only has one or two real changes.

For unusually large branches, summarize the most meaningful changes rather than creating a huge list of tiny implementation details.

If more detail is needed, point the user to the change audit.

---

## Git Push Workflow Integration

Update the existing `git-push` / Git workflow so the sequence becomes:

```text
USER REQUESTS PUSH
      ↓
PRE-PUSH CLEANUP AUDIT
      ↓
REMOVE TEMP QA / TEST / DEBUG / SEED ARTIFACTS
      ↓
RE-VERIFY
      ↓
FINAL DIFF REVIEW
      ↓
UPDATE DURABLE CHANGE AUDIT
      ↓
GENERATE CONCISE NUMBERED BRANCH DESCRIPTION
      ↓
COMMIT / PUSH
```

Before push, GentJin must verify that each numbered branch-description item is supported by the final branch state.

---

## Separation of Documentation Responsibilities

GentJin should now maintain two different levels of documentation:

### Branch / GitHub Description

Purpose:

> Quickly tell another developer or reviewer what changed.

Format:

```text
1. Change
2. Change
3. Change
```

Short, readable, non-technical unless necessary.

### Durable Change Audit

Purpose:

> Preserve the engineering history and reasoning.

May contain:

- previous implementation
- last code/reference
- what changed
- why it changed
- affected files
- verification
- temporary artifacts
- cleanup history
- related decisions
- technical details

Do not collapse these two purposes into one document.

---

## Branch Description Generation Rule

Add an explicit Git workflow rule similar in meaning to:

> When generating a GitHub branch description or change summary, use a concise numbered list of meaningful completed changes. Do not output a long technical paragraph. Keep implementation details in the project's durable change audit unless the user explicitly requests a technical description.

This behavior should be the default for GentJin Git pushes.

---

## Phase 21 Definition of Done

- [ ] Existing `git-push` behavior was inspected.
- [ ] Long paragraph-style branch descriptions are no longer the default.
- [ ] Branch descriptions use numbered change items.
- [ ] Items describe meaningful outcomes in plain language.
- [ ] Technical details remain available in the durable change audit.
- [ ] Final diff is used to verify the summary.
- [ ] Temporary/deleted development artifacts are not described as shipped changes.
- [ ] Multiple internal edits can be grouped into one meaningful change.
- [ ] No real branch changes are invented or omitted merely to make the list look cleaner.
- [ ] User can still explicitly request a technical or detailed branch description when needed.
