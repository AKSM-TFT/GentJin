import { validate } from "../schema/validate.mjs"

const registrySchema = {
  type: "object",
  required: ["schema_version", "skills", "capabilities", "forbidden", "routing_observability"],
  properties: {
    schema_version: { const: 1 },
    routing_observability: {
      type: "object",
      required: ["basis", "reason"],
      properties: { basis: { enum: ["observed", "inferred"] }, reason: { type: "string", minLength: 10 } },
    },
    capabilities: {
      type: "object",
      additionalProperties: {
        type: "object",
        required: ["tools", "mutating", "requires_approval", "records"],
        properties: {
          tools: { type: "array", items: { type: "string" }, minItems: 1 },
          mutating: { type: "boolean" },
          requires_approval: { type: "boolean" },
          records: { type: "string" },
          note: { type: "string" },
        },
      },
    },
    forbidden: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["capability", "reason"],
        properties: { capability: { type: "string" }, reason: { type: "string" } },
      },
    },
    skills: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: [
          "skill",
          "version",
          "description",
          "triggers",
          "scope",
          "allowed_actions",
          "required_verification",
          "review_only",
          "grants_code_change_authority",
        ],
        properties: {
          skill: { type: "string", pattern: "^[a-z][a-z0-9-]*$" },
          version: { const: 1 },
          description: { type: "string", minLength: 1 },
          triggers: { type: "array", minItems: 1, items: { type: "string" } },
          prerequisites: { type: "array" },
          scope: { enum: ["review_and_report", "implement_and_verify"] },
          allowed_actions: { type: "array", minItems: 1, items: { type: "string" } },
          required_verification: { type: "array", minItems: 1, items: { type: "string" } },
          review_only: { type: "boolean" },
          grants_code_change_authority: { const: false },
          path: { type: "string" },
          has_description: { type: "boolean" },
        },
      },
    },
  },
}

export function validateRegistry(registry) {
  return validate(registry, registrySchema)
}

const DEFECT_SIGNALS = [
  "is empty",
  "doesn't work",
  "does not work",
  "not working",
  "unexpected",
  "wrong",
  "missing",
  "stale",
  "blank",
  "nothing renders",
  "no rows",
  "fails",
  "failed",
  "broken",
  "bug",
  "regression",
]

const ROUTES = [
  { terms: ["sql", "database query", "schema migration", "why is this query slow"], expect: "database-review" },
  { terms: ["sql injection", "leaked secret", "auth bypass", "exposed token"], expect: "security-review" },
  { terms: ["are we ready to deploy", "rollback plan", "production release"], expect: "deployment-readiness" },
  { terms: ["review my recent diff", "review these changes", "review what i changed", "review my changes", "review the diff"], expect: "changes-review" },
  { terms: ["what did we decide about auth", "remember this workflow", "open question"], expect: "knowledge-vault" },
  { terms: ["the table is empty but the API returned data", "regression", "this broke"], expect: "systematic-debugging" },
  { terms: ["accessible on mobile", "responsive layout", "focus state"], expect: "frontend-review" },
  { terms: ["the webhook handler retries twice"], expect: "backend-review" },
  { terms: ["add the stripe package", "upgrade this dependency"], expect: "dependency-review" },
  { terms: ["pause, continue tomorrow"], expect: "work-in-progress" },
]

export function routeForRequest(registry, request, options = {}) {
  const text = request.toLowerCase()
  const scored = []

  for (const route of ROUTES) {
    let score = 0
    for (const term of route.terms) if (text.includes(term)) score += term.includes(" ") ? 2 : 1
    if (score > 0) scored.push({ skill: route.expect, score, matched: route.terms.filter((t) => text.includes(t)) })
  }

  if (options.userOverride) {
    return {
      basis: "user_specified",
      skills: [{ skill: options.userOverride, reason: "explicit user override" }],
      considered: scored,
      scope_expanded: false,
    }
  }

  scored.sort((a, b) => b.score - a.score)

  const defectSignal = DEFECT_SIGNALS.find((signal) => text.includes(signal))
  if (defectSignal) {
    const specific = scored.filter((s) => s.skill !== "changes-review" && s.skill !== "systematic-debugging")
    if (specific.length === 0) {
      return {
        basis: "inferred",
        skills: [
          {
            skill: "systematic-debugging",
            reason: `unexplained defect signal "${defectSignal}" with no domain-specific owner matched`,
          },
        ],
        considered: scored,
        scope_expanded: false,
        note: "A generic defect routes to root-cause investigation, never to a review task.",
      }
    }
  }

  const changeReviewMatches = scored.filter((s) => s.skill === "changes-review")
  const betterMatches = scored.filter((s) => s.skill !== "changes-review")

  if (betterMatches.length > 0 && (changeReviewMatches.length === 0 || betterMatches[0].score >= changeReviewMatches[0].score)) {
    const best = betterMatches[0]
    return {
      basis: "inferred",
      skills: [{ skill: best.skill, reason: `matched: ${best.matched.join(", ")}` }],
      considered: scored,
      scope_expanded: false,
      note: "changes-review is not a fallback for a generic defect; a defect-specific owner was selected instead.",
    }
  }

  if (changeReviewMatches.length > 0) {
    const best = changeReviewMatches[0]
    return {
      basis: "inferred",
      skills: [{ skill: best.skill, reason: `matched: ${best.matched.join(", ")}` }],
      considered: scored,
      scope_expanded: false,
    }
  }

  return {
    basis: "inferred",
    skills: [{ skill: "knowledge-vault", reason: "project context unknown; resolve project before assuming a task" }],
    considered: [],
    scope_expanded: false,
  }
}

export function scopeCheck(registry, selection, task) {
  const entries = selection.skills
    .map((s) => registry.skills.find((e) => e.skill === s.skill))
    .filter(Boolean)

  if (entries.length === 0) return { permitted: true, reasons: [] }

  const reviewOnlyEntries = entries.filter((e) => e.review_only)
  if (reviewOnlyEntries.length === entries.length && task.allow_code_changes) {
    return {
      permitted: false,
      reasons: [
        `review-only skill(s) selected (${reviewOnlyEntries.map((e) => e.skill).join(", ")}) but the task allows code changes. ` +
          "Selecting a review skill does not authorize edits; either narrow the scope to review-only or state the change explicitly.",
      ],
    }
  }

  const reasons = []
  for (const entry of reviewOnlyEntries) {
    if (task.changed_paths?.length > 0) {
      reasons.push(`${entry.skill} is review-only but the task recorded ${task.changed_paths.length} changed path(s)`)
    }
  }
  return { permitted: reasons.length === 0, reasons }
}

export function readOnlyDatabaseCheck(actions) {
  const mutations = /\b(insert|update|delete|drop|alter|truncate|create\s+table|replace)\b/i
  const offenders = actions.filter(
    (a) => a.kind === "db_read" && a.executed && mutations.test(a.description ?? ""),
  )
  return { permitted: offenders.length === 0, offenders }
}