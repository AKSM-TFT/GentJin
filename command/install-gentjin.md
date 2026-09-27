---
description: Install GENTJIN directly into OpenCode's native runtime directories, with metadata-only tracking, guarded vault migration, and verification.
---

Perform a first-time installation of GENTJIN by following `INSTALL.md` in the current repository.

Resolve the source repository, `<opencode-root>` (`<user-home>/.config/opencode`), and `<metadata-root>` (`<opencode-root>/.gentjin`) exactly as the runbook specifies, then execute every step in order: preflight, keep-no-copies, install runtime files directly, remove stale GENTJIN-owned files, guarded legacy Knowledge Vault migration, additive global permission, verification, metadata written last, and retirement of any legacy `<opencode-root>/GentJin/` directory.

GENTJIN installs into `<opencode-root>/AGENTS.md`, `<opencode-root>/command/`, and `<opencode-root>/skills/`. It keeps only installation metadata under `<opencode-root>/.gentjin/`. Never create `<opencode-root>/GentJin/` and never retain a full GENTJIN source copy inside the OpenCode configuration directory. Keep no backup or snapshot copies of anything. When the run finishes, only the runtime files, `<opencode-root>/.gentjin/`, and the user's own configuration should exist.

If a GENTJIN installation already exists, use `/update-gentjin` instead of restarting the architecture.

Print the runbook's final summary, including the OpenCode root, metadata root, installed skill and command counts, legacy migration state, vault state, permission state, and skipped conflicts, then remind the user to restart OpenCode. Tell the user that the cloned repository can be deleted after a successful installation.
