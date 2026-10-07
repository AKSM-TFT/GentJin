TODO — Fix concise commit bodies and manually created PR descriptions
User requirement
When the user manually opens a GitHub pull request after pushing a branch, the description should be a short summary followed by a concise numbered list of meaningful changes.
Use plain-language outcomes. Do not fill the description with investigation history, implementation details, or long verification reports.
This is a focused follow-up to existing Git reporting rules, not another workflow redesign.
Findings verified before writing this TODO
Inspected GentJin default-branch commit:
04cd612b50e8fb182c9911c6d4b44a750e829b6f
It merges PR #17 from GJ-15-engineering-workflow-and-git-guardrails.

1. command/git-push.md, under "Branch Description", already requires a concise numbered list, normally 3–10 items, without file paths, function names, or long technical paragraphs.
2. skills/git-workflow/SKILL.md repeats that requirement.
3. The "Commits" section only asks for a short subject and a concise explanatory body; it does not explicitly apply the numbered change-summary format to that body.
4. The source branch's commit d5780846798442438356508928c4e44fdabb860f contains the exact long description reported by the user, including the plugin investigation, guardrail implementation, and verification counts.
5. The /git-push execution steps do not explicitly generate, inspect, and deliver the concise PR body before committing/pushing.
6. The existing git-reporting evaluation checks a report for numbered lines and sections. That does not establish whether a commit body or actual PR description meets this requirement.
   GitHub documents that when a PR comparison contains one commit, the suggested title and description come from that commit's subject and body:
   https://github.blog/changelog/2022-09-06-better-suggested-pull-request-description-from-commit-message/
   Therefore the supplied commit body explains the observed prefilled text. The UI session and installed OpenCode runtime were not inspected; do not claim a separate runtime defect was proved.
   Scope and constraints

- [x] Inspect current source again; commits above are the inspection baseline, not a requirement to restore an older revision.
- [x] Read applicable instructions and relevant Git/reporting knowledge.
- [x] Update the existing command and skill. Do not create a duplicate git-push skill.
- [x] Preserve branch naming, approval, artifact cleanup, verification honesty, Git permissions, and Vault capture behavior.
- [x] Keep detailed implementation/root-cause/verification records in the existing audit or Vault.
- [x] Do not change unrelated skills or application behavior.
- [x] No new dependencies by default.
- [x] Do not rewrite existing shared commits, force-push, publish a release, or edit old PRs to solve this.
- [x] This TODO authorizes source changes and isolated verification, not remote pushes or PR creation.

1. Establish one shared output contract
   Apply the following default to:

- the body of a new push-workflow commit;
- any proposed or explicitly authorized PR description;
- the ready-to-paste description supplied when the user will create the PR manually.
  Format:
  <One short sentence summarizing the change, if useful.>

1. <Concrete change and observable outcome.>
2. <Another distinct change.>
3. <Another distinct change.>
   Rules:

- [x] Prefer 3–10 numbered items for a substantial change. Use fewer when only one or two meaningful changes exist; never invent filler.
- [x] One outcome per item, usually one sentence. Aim for roughly 15–30 words rather than a rigid truncation limit.
- [x] Use everyday language, mentioning the affected feature/page/skill when useful.
- [x] Group related internal edits by their outcome.
- [x] Cover meaningful developer-facing improvements too; GentJin's users are developers.
- [x] Exclude paths, symbols, loader mechanics, stack traces, internal investigation narratives, and detailed test inventories by default.
- [x] Avoid large sections such as Root Cause, Implementation, Testing, Notes, or Documentation in the default commit/PR body.
- [x] Include a short material limitation when needed to avoid misleading readers. Do not hide genuine unresolved risk for brevity.
- [x] Detailed descriptions remain possible when the user explicitly requests them or mandatory repository policy requires them. Otherwise this concise format wins over a historical verbose commit style.
- [x] Derive the summary from the final branch diff and relevant task/audit evidence, not the latest commit alone or stale memory.
- [x] Never claim tests, installation, or live behavior passed without observed evidence.
      Illustrative concise version of the user's supplied change narrative:
      Do not reuse these items without confirming they match the actual branch.
      Improves tracing, optional Git safeguards, and engineering workflows.

1. Fixed tracing so OpenCode sessions can record activity.
2. Added optional Git safeguards that block restricted commands after setup.
3. Improved bug investigation so fixes start from observed evidence.
4. Strengthened testing guidance to check meaningful behavior.
5. Improved feature planning with clear requirements and implementation tasks.
6. Improved knowledge capture for bugs, terms, and important decisions.
7. Added guidance for creating and maintaining GentJin skills.
   The exact test totals and technical loader explanation belong in the detailed record.
8. Connect the format to the actual push workflow

- [x] In command/git-push.md, add an explicit step before committing: prepare the short subject and concise numbered body from the final logical change.
- [x] Validate the prepared body before using it. Fix verbose output before it becomes a new commit.
- [x] Use a safely written message file for multiline commit text when appropriate; preserve actual newlines and avoid shell interpolation.
- [x] In skills/git-workflow/SKILL.md, apply the same contract to the "Commits" section and connect it to "Branch Description".
- [x] Inspect the resulting commit with git show -s --format=%B before a requested push.
- [x] Keep separate logical commits where appropriate; do not squash/rewrite history just to influence GitHub's prefilling.
- [x] For an existing verbose commit, provide a concise PR body instead of silently amending it.
- [x] Provide a clearly separated ready-to-paste PR title and body after preparing/pushing the branch.
- [x] Keep branch name, commit reference, test results, cleanup details, and required Notes in the console report outside the copyable PR body.
- [x] Push authorization alone must not cause automatic PR creation.
      Manual PR behavior:
- For one commit, a concise commit body supports GitHub's documented default.
- For multiple commits, templates, or other prefill sources, do not guarantee GitHub will show the prepared body automatically.
- Give the user the exact concise body to paste or replace the suggested text.
- A Git push does not itself update a GitHub PR description.
  Authorized automated PR behavior:
- If the user separately authorizes PR creation/update, pass the prepared description explicitly.
- With gh, use a safely written body file and --body-file.
- Never substitute the detailed console/Vault report as the PR body.

3. Check conflicting rules and templates

- [x] Check AGENTS.md, reporting, README, command instructions, PR templates if present, and supported install/update tooling for conflicting formatting.
- [x] Clarify that console Notes/Documentation requirements do not get copied into the commit or PR body.
- [x] Preserve existing templates and mandatory project policy; avoid adding a generic template as the primary fix.
- [x] Update tracked installation/catalog references only where needed.
- [x] Document that merged source changes do not prove the running OpenCode installation has updated rules.
- [x] Verify installed files only if the user's environment is accessible; otherwise provide exact update/restart steps without claiming they were executed.
- [x] Do not overwrite live global configuration without authorization.

4. Add targeted evaluation coverage
   Reuse the existing evaluation framework. Inspect final output artifacts, not just whether instructions contain "numbered list".

- [x] A verbose input narrative is converted to a concise summary and numbered outcomes.
- [x] A fresh commit in an isolated temporary repository has the intended subject/body, confirmed with git show.
- [x] The user's supplied style is a positive example; the long plugin/guardrail narrative is a negative example for the default body.
- [x] A list with one numbered line followed by long technical paragraphs fails the format check.
- [x] A one-change branch produces one honest item rather than padded entries.
- [x] Multi-commit work produces a summary of the whole final branch.
- [x] Existing verbose history remains unchanged and a copyable replacement PR body is provided.
- [x] Console Notes/Documentation stay outside the prepared commit/PR body.
- [x] A missing gh tool or missing PR authorization does not prevent producing the manual copy/paste body.
- [x] Material limitations are retained concisely and unverified success claims are rejected.
- [x] Safely handle multiline bodies and literal shell-sensitive characters.
- [x] Run relevant existing checks and record outcomes.
- [x] Distinguish synthetic formatting/contract evaluations from observed live model behavior and actual GitHub UI verification. Do not claim a deterministic check proves model compliance.
      Do not push to a remote just to test formatting.
      Acceptance criteria
- Existing numbered-list instructions now cover commit bodies and explicit PR-body preparation.
- A freshly created local commit body follows the concise format.
- Manual PR users receive a ready-to-paste title and numbered description.
- Detailed audit information remains available without becoming default PR text.
- Existing history and remote PRs are not rewritten.
- Evaluations catch verbose text even when it contains a token numbered list.
- Any runtime or GitHub UI verification still pending is clearly identified.
  Final report
  Use a short numbered change list, then a concise verification statement and required Notes.
  State:

1. Which rules/files were changed.
2. Whether commit-body and PR-body outputs were actually inspected.
3. Which checks ran and their observed results.
4. Whether the live OpenCode installation was verified or still needs updating.
   Provide one example of the final concise description. Do not recreate the long technical narrative in the user-facing report.
