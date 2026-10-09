import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

export function releaseSlug(pkg) {
  const base = pkg.proposedTag ?? "unreleased"
  return String(base).replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "")
}

export function releaseNotePath(knowledgeRoot, pkg) {
  return join(knowledgeRoot, "reports", "releases", releaseSlug(pkg) + ".md")
}

export function renderMetadata(pkg) {
  return [
    "---",
    "type: release-notes",
    "status: " + pkg.status,
    "published: false",
    "repository: " + (pkg.repository ?? ""),
    "proposed_version: " + (pkg.title ?? ""),
    "provisional_version: " + String(Boolean(pkg.provisionalVersion)),
    "target_branch: " + (pkg.targetBranch ?? ""),
    "target_sha: " + (pkg.targetSha ?? ""),
    "previous_boundary: " + (pkg.previousBoundary ?? ""),
    "previous_boundary_verified: " + String(Boolean(pkg.previousBoundaryVerified)),
    "previous_boundary_selected: " + String(Boolean(pkg.previousBoundarySelected)),
    "previous_release_published: " + String(Boolean(pkg.previousReleasePublished)),
    "previous_release_publication_state: " + (pkg.previousReleasePublicationState ?? "unknown"),
    "boundary_advanced: false",
    "created_tag: false",
    "created_release: false",
    "boundary_warning: " + (pkg.boundaryWarning ? JSON.stringify(pkg.boundaryWarning) : '""'),
    "release_url: " + (pkg.releaseUrl ?? ""),
    "date: " + new Date().toISOString().slice(0, 10),
    "evidence:",
    ...(pkg.evidence ?? []).map((e) => "  - " + JSON.stringify(e)),
    "---",
    "",
  ].join("\n")
}

/**
 * Saves the exact rendered body beside its metadata. Repeated generation for the same candidate
 * updates that note instead of creating a duplicate, and a failure is reported rather than thrown
 * so the caller can still hand the notes to the user.
 */
export function saveReleaseNote({ knowledgeRoot, pkg, body = pkg.body }) {
  if (!knowledgeRoot) {
    return { ok: false, error: "no knowledge root was resolved for this project" }
  }

  const path = releaseNotePath(knowledgeRoot, pkg)
  const existing = existsSync(path)
  const priorEvidence = existing ? readPriorEvidence(path) : []

  try {
    mkdirSync(join(knowledgeRoot, "reports", "releases"), { recursive: true })
    const metadata = renderMetadata({
      ...pkg,
      evidence: [...priorEvidence, ...(pkg.evidence ?? [])],
      repository: pkg.repository,
    })
    writeFileSync(path, metadata + body, "utf8")
    return { ok: true, path, updated: existing }
  } catch (error) {
    return { ok: false, error: error.message, path }
  }
}

function readPriorEvidence(path) {
  try {
    const text = readFileSync(path, "utf8")
    const block = /^evidence:\n((?:  - .*\n)*)/m.exec(text)
    if (!block) return []
    return block[1]
      .split("\n")
      .filter(Boolean)
      .map((line) => line.replace(/^  - /, ""))
  } catch {
    return []
  }
}
