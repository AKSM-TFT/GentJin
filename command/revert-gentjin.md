---
description: Revert the GENTJIN installation to a previous repository state using the ownership manifest and git history, with prompts for unsafe files and verification.
---

Revert GENTJIN by following `INSTALL.md` in the current repository.

Use `<opencode-root>/.gentjin/manifest.json` as the ownership record. Reconcile only GENTJIN-owned files, and ask before replacing any file that is locally modified, unmanaged, or ambiguous. Keep no backup or snapshot copies of anything. Preserve every file under `<opencode-root>/command/` and `<opencode-root>/skills/` that the manifest does not claim.

## Modes

- `/revert-gentjin` with no argument: full rollback to a previous repository state (see below).
- `/revert-gentjin <feature>`: targeted removal of one feature's command and skills from the runtime (see Targeted feature removal). Example: `/revert-gentjin refactor` removes the refactoring skill files.

## Targeted feature removal

1. Normalize the argument (lowercase, trim). Resolve it against manifest-managed paths only:
   - A command matches when `command/<name>.md` equals the argument or starts with it.
   - A skill matches when any path segment under `skills/<name>/` equals the argument or starts with it (so `refactor` matches the `refactoring` skill).
2. Collect every manifest-managed file under the matched command and skill directories, including `agents/` files.
3. If nothing matches, stop and list the available command and skill names instead of guessing.
4. If the argument matches more than one feature, list the candidates and ask which one to remove.
5. Never match `AGENTS.md`, `opencode.jsonc`, version metadata, or anything outside `command/` and `skills/`. Never remove a file the manifest does not claim (user-owned or third-party files stay untouched).
6. Show the exact file list and ask for confirmation before deleting. If the target includes the `revert-gentjin` command itself, call that out explicitly in the confirmation.
7. Delete only the confirmed manifest-managed files, remove directories left empty, then drop those entries from `<opencode-root>/.gentjin/manifest.json` (write manifest last, after verification).
8. Verify: matched files are gone, unrelated runtime files still exist, and nothing outside the manifest was removed.
9. State clearly that removal is runtime-only: a later `/update-gentjin` from a source that still contains the feature will reinstall it. To remove it permanently, delete it from the source repository as well.

## Resolve the rollback target

1. If the user names a commit, branch, or tag (for example `revert to <commit>`), use it as the revert target after verifying it exists in the source repository.
2. Otherwise default to the previous payload-changing commit before `installedCommit` in the source repository history. Never default to uncommitted working-tree changes; if the user wants to revert to uncommitted work, ask them to commit it first so the target is addressable.
3. If the target cannot be resolved confidently, stop and ask instead of guessing.

## Run the full sequence

1. Detect a legacy installation at `<opencode-root>/GentJin/`.
2. Retrieve the revert source: prefer the existing GENTJIN checkout's git history, otherwise use a temporary checkout of the recorded branch at the target commit and remove it when the run finishes. Never keep a permanent copy and never recreate `<opencode-root>/GentJin/`.
3. Reconcile runtime files in `<opencode-root>/AGENTS.md`, `<opencode-root>/command/`, and `<opencode-root>/skills/` to the target payload, updating only GENTJIN-owned files whose installed hash matches the manifest.
4. Remove stale GENTJIN-owned files that the current manifest records but the target payload no longer contains (for example a skill added by a later update). Never remove a file the manifest does not claim.
5. Re-run the additive global `opencode.jsonc` permission check and report whether it was `added` or `already present`. Never remove or weaken existing configuration. Skip the vault migration when `<user-home>/Documents/KnowledgeVault` already exists, and never merge vault directories.
6. Verify both the runtime files and the metadata: every reverted payload file matches the target source byte-for-byte, unrelated files still exist, and nothing outside the manifest was removed.
7. Write `<opencode-root>/.gentjin/manifest.json` and `version.json` last, with the target commit recorded as the installed version.
8. Only after verification succeeds, migrate any remaining legacy metadata and remove `<opencode-root>/GentJin/` completely. If verification fails, leave it in place so the operation can be retried, and report the failure clearly.

This command must support both legacy installations and metadata-only installations. For a full rollback, report the reverted-from and reverted-to commits; for targeted removal, report the removed feature and file list. In both modes report the installed skill and command counts, legacy migration state, vault state, permission state, and any skipped unsafe conflicts, then remind the user to restart OpenCode.
