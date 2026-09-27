---
description: Update the GENTJIN installation from the current repository using the ownership manifest, retiring any legacy install, with prompts for unsafe files and verification.
---

Update GENTJIN by following `INSTALL.md` in the current repository.

Use `<opencode-root>/.gentjin/manifest.json` as the ownership record. Update manifest-managed files whose recorded hash matches the installed hash, and ask before replacing any file that is locally modified, unmanaged, or ambiguous. Keep no backup or snapshot copies of anything. Preserve every file under `<opencode-root>/command/` and `<opencode-root>/skills/` that the manifest does not claim.

Run the full sequence:

1. Detect a legacy installation at `<opencode-root>/GentJin/`.
2. Retrieve the current GENTJIN source: prefer an existing GENTJIN checkout, otherwise use a temporary shallow checkout of the recorded branch and remove it when the run finishes. Never keep a permanent copy and never recreate `<opencode-root>/GentJin/`.
3. Reconcile runtime files in `<opencode-root>/AGENTS.md`, `<opencode-root>/command/`, and `<opencode-root>/skills/`, updating only GENTJIN-owned files.
4. Remove stale GENTJIN-owned files that the previous manifest recorded and the current payload no longer contains.
5. Re-run the additive global `opencode.jsonc` permission check and report whether it was `added` or `already present`. Skip the vault migration when `<user-home>/Documents/KnowledgeVault` already exists, and never merge vault directories.
6. Verify both the runtime files and the metadata.
7. Write `<opencode-root>/.gentjin/manifest.json` and `version.json` last.
8. Only after verification succeeds, migrate any remaining legacy metadata and remove `<opencode-root>/GentJin/` completely. If verification fails, leave it in place so the migration can be retried, and report the failure clearly.

This command must support both legacy installations and metadata-only installations. Report the installed skill and command counts, legacy migration state, vault state, permission state, and any skipped unsafe conflicts, then remind the user to restart OpenCode.
