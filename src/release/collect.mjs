import { execFileSync } from "node:child_process"

export function runGit(cwd, args) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim()
}

export function gitAvailable(cwd) {
  try {
    runGit(cwd, ["rev-parse", "--git-dir"])
    return true
  } catch {
    return false
  }
}

const SEMVER = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/

export function parseVersion(tag) {
  const match = SEMVER.exec(String(tag ?? "").trim())
  if (!match) return null
  return {
    tag: match[0],
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ?? null,
  }
}

export function listTags(cwd) {
  const out = runGit(cwd, [
    "for-each-ref",
    "refs/tags",
    "--sort=-creatordate",
    "--format=%(refname:short)|%(objectname)|%(creatordate:iso-strict)",
  ])
  if (!out) return []
  return out
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [tag, sha, date] = line.split("|")
      return { tag, sha, date, version: parseVersion(tag) }
    })
}

export function isAncestor(cwd, ancestor, descendant) {
  try {
    runGit(cwd, ["merge-base", "--is-ancestor", ancestor, descendant])
    return true
  } catch {
    return false
  }
}

export function resolveTarget(cwd, ref = "HEAD") {
  const sha = runGit(cwd, ["rev-parse", ref])
  const branch = runGit(cwd, ["rev-parse", "--abbrev-ref", ref])
  return { ref, sha, branch: branch === "HEAD" ? null : branch }
}

export function defaultBranch(cwd) {
  let head = null
  try {
    head = runGit(cwd, ["symbolic-ref", "--quiet", "refs/remotes/origin/HEAD"])
  } catch {
    head = null
  }
  if (head) return head.replace("refs/remotes/origin/", "")
  const local = ["main", "master", "trunk", "develop"]
    .map((name) => {
      try {
        runGit(cwd, ["rev-parse", "--verify", name])
        return name
      } catch {
        return null
      }
    })
    .filter(Boolean)
  return local[0] ?? null
}

export function resolveBoundary(cwd, target, options = {}) {
  const tags = listTags(cwd)
  const parsed = tags.filter((t) => t.version)

  const sameLine = options.releaseLine
    ? parsed.filter((t) => (t.version.prerelease ? "prerelease" : "stable") === options.releaseLine)
    : parsed

  const eligible = sameLine
    .filter((t) => isAncestor(cwd, t.sha, target.sha))
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  if (eligible.length > 0) {
    const boundary = eligible[0]
    return {
      verified: true,
      provisional: false,
      tag: boundary.tag,
      sha: boundary.sha,
      line: boundary.version.prerelease ? "prerelease" : "stable",
      source: "git tag reachable from the target",
      selected: true,
      publication: {
        state: "unknown",
        verified: false,
        note: "a tag marks a code boundary. It is not evidence that a GitHub release was published for it.",
      },
      warning: null,
    }
  }

  if (options.explicitBoundary) {
    let sha
    try {
      sha = runGit(cwd, ["rev-parse", options.explicitBoundary])
    } catch {
      return {
        verified: false,
        provisional: true,
        tag: options.explicitBoundary,
        sha: null,
        line: null,
        source: "explicitly supplied by the user",
        warning: `the supplied boundary ${options.explicitBoundary} could not be resolved`,
      }
    }
    const ancestor = isAncestor(cwd, sha, target.sha)
    return {
      verified: ancestor,
      provisional: true,
      tag: options.explicitBoundary,
      sha,
      line: null,
      source: "explicitly supplied by the user",
      selected: true,
      publication: { state: "unknown", verified: false, note: "an explicitly supplied boundary is a code boundary only" },
      warning: ancestor ? null : "the supplied boundary is not an ancestor of the target",
    }
  }

  return {
    verified: false,
    provisional: true,
    tag: null,
    sha: null,
    line: null,
    selected: false,
    publication: { state: "unknown", verified: false, note: "no boundary could be selected" },
    source: "no verified release boundary found",
    warning:
      "No tag is a verified ancestor of the target. Supply the previous tag or commit, or state an " +
      "explicit first-release baseline. No release history has been invented.",
  }
}

const RECORD = String.fromCharCode(0x1e)

function safeLog(cwd, args) {
  try {
    const out = runGit(cwd, args)
    return out ? out.split(RECORD).map((r) => r.trim()).filter(Boolean) : []
  } catch {
    return []
  }
}

export function collectChanges(cwd, boundarySha, targetSha) {
  const range = boundarySha ? boundarySha + ".." + targetSha : targetSha

  const merges = safeLog(cwd, ["log", "--first-parent", "--merges", "--format=%H%x1f%s%x1e", range])
  const commits = safeLog(cwd, ["log", "--no-merges", "--format=%H%x1f%an%x1f%s%x1f%b%x1e", range])

  const groups = new Map()
  for (const line of commits) {
    const parts = line.split("\x1f")
    const sha = parts[0]
    const author = parts[1]
    const subject = parts[2]
    const body = parts.slice(3).join("\x1f")
    const prMatch = /#(\d+)/.exec(subject + " " + body)
    const key = prMatch ? "pr-" + prMatch[1] : "commit-" + sha.slice(0, 8)
    if (!groups.has(key)) {
      groups.set(key, { key, pr: prMatch ? Number(prMatch[1]) : null, commits: [] })
    }
    groups.get(key).commits.push({ sha: sha.slice(0, 8), author, subject })
  }

  const mergePrs = new Set()
  for (const line of merges) {
    const match = /Merge pull request #(\d+)/.exec(line.split("\x1f")[1] ?? "")
    if (match) mergePrs.add(Number(match[1]))
  }

  return [...groups.values()]
    .map((group) => {
      const reverts = group.commits.filter((c) => /^revert[:\s]/i.test(c.subject))
      const adds = group.commits.filter((c) => !/^revert[:\s]/i.test(c.subject))
      return {
        key: group.key,
        pr: group.pr ?? (group.commits.length > 0 ? null : null),
        subject: group.commits[0]?.subject ?? "",
        commit_count: group.commits.length,
        reverts: reverts.length,
        added: adds.length,
        merged_via_pr: group.pr !== null && mergePrs.has(group.pr),
        reverted: reverts.length > 0 && adds.length === 0,
      }
    })
    .sort((a, b) => (a.pr ?? 99999) - (b.pr ?? 99999) || (a.key < b.key ? -1 : 1))
}

export function suggestVersion(cwd, items, tags = listTags(cwd)) {
  const versions = tags.map((t) => t.version).filter(Boolean)
  if (versions.length === 0) {
    return { version: null, reason: "the repository has no tags, so no version convention is verified" }
  }

  const latest = versions[0]
  const prefix = latest.tag.startsWith("v") ? "v" : ""
  const has = (...patterns) => items.some((i) => patterns.some((p) => p.test(i.subject)))

  const breaking = has(/^(\w+)(\(.+\))?!:/, /^breaking[ -]change/i)
  const feat = has(/^feat(\(.+\))?:/i)
  const fix = has(/^fix(\(.+\))?:/i)

  let next
  let kind
  if (breaking) {
    next = latest.major + 1 + ".0.0"
    kind = "major"
  } else if (feat) {
    next = latest.major + "." + (latest.minor + 1) + ".0"
    kind = "minor"
  } else {
    next = latest.major + "." + latest.minor + "." + (latest.patch + 1)
    kind = fix ? "patch" : "patch (no feat or fix subjects found)"
  }

  return {
    version: prefix + next,
    kind,
    based_on: latest.tag,
    provisional: true,
    reason:
      "proposed from the repository's own latest tag and the change subjects; the user selects the final version",
  }
}

export function hasEligibleChanges(items) {
  return items.some((i) => i.added > 0)
}
