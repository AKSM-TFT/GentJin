export function sanitize(text) {
  return String(text ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .trim()
}

export function renderItems(items) {
  return items
    .map((item, index) => {
      const label = item.title ?? item.subject
      const detail = item.detail ? " — " + item.detail : ""
      return (index + 1) + ". **" + label + "**" + detail
    })
    .join("\n")
}

export function renderReleaseBody(options) {
  const project = sanitize(options.project) || "Project"
  const theme = sanitize(options.theme) || "Update"
  const intro = Array.isArray(options.intro) ? options.intro : [options.intro].filter(Boolean)
  const why = sanitize(options.why)
  const repository = sanitize(options.repository)
  const context = sanitize(options.projectContext)
  const limitations = (options.limitations ?? []).map((l) => sanitize(l)).filter(Boolean)
  const breaking = (options.breaking ?? []).map((b) => sanitize(b)).filter(Boolean)

  const lines = []
  lines.push("# " + project + " — " + theme)
  lines.push("")
  for (const paragraph of intro.map(sanitize).filter(Boolean)) {
    lines.push(paragraph)
    lines.push("")
  }

  lines.push("## What's New")
  lines.push("")
  lines.push(renderItems(options.items ?? []))
  lines.push("")

  if (why) {
    lines.push("## Why This Matters")
    lines.push("")
    lines.push(why)
    lines.push("")
  }

  if (breaking.length > 0) {
    lines.push("## Breaking Changes")
    lines.push("")
    for (const b of breaking) lines.push("- " + b)
    lines.push("")
  }

  if (limitations.length > 0) {
    lines.push("## Limitations")
    lines.push("")
    for (const l of limitations) lines.push("- " + l)
    lines.push("")
  }

  lines.push("## Project")
  lines.push("")
  lines.push("Repository: [" + repository + "](" + repository + ")")
  lines.push("")
  if (context) {
    lines.push(context)
    lines.push("")
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n"
}

export function releaseUrl({ repository, tag }) {
  if (!repository || !tag) return null
  return repository.replace(/\.git$/, "") + "/releases/new?tag=" + encodeURIComponent(tag)
}

export function renderReleasePackage(options) {
  const body = renderReleaseBody(options)
  const version = options.version?.version ?? null
  const tag = version ?? options.tag ?? null

  return {
    repository: options.repository ?? null,
    title: version ?? "Unreleased",
    proposedTag: tag,
    provisionalVersion: Boolean(options.version?.provisional),
    versionReason: options.version?.reason ?? null,
    targetBranch: options.target?.branch ?? options.targetBranch ?? null,
    targetSha: options.target?.sha ?? null,
    previousBoundary: options.boundary?.tag ?? options.boundary?.sha ?? null,
    previousBoundarySelected: Boolean(options.boundary?.selected ?? options.boundary?.verified),
    previousBoundaryVerified: Boolean(options.boundary?.verified),
    previousReleasePublished: Boolean(options.boundary?.publication?.verified),
    previousReleasePublicationState: options.boundary?.publication?.state ?? "unknown",
    publicationNote: options.boundary?.publication?.note ?? null,
    boundaryWarning: options.boundary?.warning ?? null,
    releaseUrl: releaseUrl({ repository: options.repository, tag }),
    body,
    status: "prepared",
    published: false,
    boundaryAdvanced: false,
    createsTag: false,
    createsRelease: false,
    evidence: options.evidence ?? [],
  }
}
