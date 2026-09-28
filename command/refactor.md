---
description: Refactor code into framework-native structure without changing behavior. Accepts an optional file, directory, or feature target.
---

Refactor the given target per the `refactoring` skill: behavior-preserving splits of mixed-responsibility code into framework-native components, hooks, services, utils, and similar.

Accept a file, directory, or feature name after the command (for example `/refactor <file>`). If no target is given, ask which file or area to refactor instead of guessing. If the target is ambiguous or matches multiple files, ask for clarification before touching code.

Ensure `<project-root>/ARCHITECTURE.md` exists and is current for the target area before moving code: create it when missing, refresh it when stale, and place each extracted file per its category mapping (hooks, components, types, utils each go to their own directory, never all into the source folder).

Present the recommended split before moving code when the change is structural, and implement only after approval in that case. Small in-scope extractions may proceed directly. Never change features, fix unrelated bugs, or refactor code the request does not touch.
