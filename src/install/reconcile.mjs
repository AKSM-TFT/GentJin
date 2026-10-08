import { createHash } from "node:crypto"
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { preflightPayload } from "./apply.mjs"

const PRESERVED_DIRECTORIES = ["command", "skills"]

export function sha256OfFile(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex")
}

function listFiles(root, prefix, out = []) {
  const dir = join(root, prefix)
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) listFiles(root, relative, out)
    else out.push(relative)
  }
  return out
}

export function listUnclaimed(root, manifest) {
  const claimed = new Set(manifest.managedFiles.map((f) => f.path))
  const found = []
  for (const directory of PRESERVED_DIRECTORIES) {
    for (const relative of listFiles(root, directory)) {
      if (!claimed.has(relative)) found.push(relative)
    }
  }
  return found.sort()
}

/**
 * Decides, without writing anything, which payload files may replace an installed file
 * and which must be raised with the user first. A managed file is safe only when the
 * installed bytes still match the hash the manifest recorded; anything else is a conflict.
 */
export function planReconcile({ root, payloadRoot, manifest }) {
  const preflight = preflightPayload(payloadRoot)
  if (!preflight.ok) {
    return {
      refused: true,
      reason: preflight.reason,
      safe: [],
      conflicts: [],
      unchanged: [],
      stale: [],
      unclaimed: [],
      preserved: [],
      writes_metadata_last: true,
    }
  }

  const safe = []
  const conflicts = []
  const unchanged = []
  const stale = []

  for (const entry of manifest.managedFiles) {
    const installedPath = join(root, entry.path)
    const payloadPath = join(payloadRoot, entry.path)

    if (!existsSync(payloadPath)) {
      stale.push(entry.path)
      continue
    }

    if (!existsSync(installedPath)) {
      safe.push({ path: entry.path, reason: "missing_locally" })
      continue
    }

    const installedHash = sha256OfFile(installedPath)
    const payloadHash = sha256OfFile(payloadPath)

    if (installedHash !== entry.sha256) {
      conflicts.push({
        path: entry.path,
        reason: "locally_modified",
        recorded: entry.sha256,
        installed: installedHash,
        payload: payloadHash,
      })
      continue
    }

    if (installedHash === payloadHash) {
      unchanged.push(entry.path)
      continue
    }

    safe.push({ path: entry.path, reason: "upstream_changed", from: installedHash, to: payloadHash })
  }

  const unclaimed = listUnclaimed(root, manifest)

  return {
    safe,
    conflicts,
    unchanged,
    stale,
    unclaimed,
    preserved: unclaimed,
    writes_metadata_last: true,
  }
}

export function isDirectory(path) {
  return existsSync(path) && statSync(path).isDirectory()
}