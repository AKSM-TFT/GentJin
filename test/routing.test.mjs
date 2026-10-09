import test from "node:test"
import assert from "node:assert/strict"
import { buildRegistry, parseFrontmatter, CAPABILITY_CONTRACTS, FORBIDDEN_CAPABILITIES } from "../scripts/build-registry.mjs"
import { validateRegistry, routeForRequest, scopeCheck, readOnlyDatabaseCheck } from "../src/routing/route.mjs"

test("frontmatter parser handles quoted and unquoted values", () => {
  const fm = parseFrontmatter(`---\nname: "x"\ndescription: plain value\n---\n\nbody`)
  assert.equal(fm.name, "x")
  assert.equal(fm.description, "plain value")
  assert.deepEqual(parseFrontmatter("no frontmatter here"), {})
})

test("generated registry is schema-valid", () => {
  const result = validateRegistry(buildRegistry())
  assert.equal(result.valid, true, JSON.stringify(result.errors, null, 1))
})

test("registry covers every skill on disk with a description", () => {
  const registry = buildRegistry()
  assert.ok(registry.skills.length >= 23)
  assert.equal(registry.skills.filter((s) => !s.has_description).length, 0)
  const names = registry.skills.map((s) => s.skill)
  assert.equal(new Set(names).size, names.length, "skill names must be unique")
})

test("no skill grants code-change authority by selecting a review skill", () => {
  const registry = buildRegistry()
  for (const skill of registry.skills) {
    assert.equal(skill.grants_code_change_authority, false, skill.skill)
  }
})

test("routing observability is declared inferred, never observed", () => {
  const registry = buildRegistry()
  assert.equal(registry.routing_observability.basis, "inferred")
  assert.match(registry.routing_observability.reason, /fires no OpenCode hook/)
})

test("capability contracts separate mutating from read-only and name an evidence event", () => {
  const db = CAPABILITY_CONTRACTS["read-only database inspection"]
  assert.equal(db.mutating, false)
  assert.equal(db.records, "action.executed")
  assert.equal(CAPABILITY_CONTRACTS["local edits"].mutating, true)
  assert.equal(CAPABILITY_CONTRACTS["verification commands"].records, "verification.evidence")
  assert.ok(FORBIDDEN_CAPABILITIES.some((f) => /database mutation/i.test(f.capability)))
})

const registry = buildRegistry()

test("database investigation routes to database-review", () => {
  const decision = routeForRequest(registry, "this sql query is slow, investigate the schema")
  assert.equal(decision.skills[0].skill, "database-review")
  assert.equal(decision.basis, "inferred")
})

test("security-sensitive change routes to security-review", () => {
  const decision = routeForRequest(registry, "found a sql injection risk and a leaked secret in the handler")
  assert.ok(["security-review", "database-review"].includes(decision.skills[0].skill))
  assert.match(decision.skills[0].reason, /matched/)
})

test("deployment readiness routes to deployment-readiness", () => {
  const decision = routeForRequest(registry, "are we ready to deploy? need a rollback plan")
  assert.equal(decision.skills[0].skill, "deployment-readiness")
})

test("recent diff review routes to changes-review", () => {
  const decision = routeForRequest(registry, "review my recent diff")
  assert.equal(decision.skills[0].skill, "changes-review")
})

test("unknown project context routes to knowledge-vault", () => {
  const decision = routeForRequest(registry, "what did we decide about the tokenizer")
  assert.equal(decision.skills[0].skill, "knowledge-vault")
})

test("a generic bug is not routed to changes-review", () => {
  const decision = routeForRequest(registry, "the table is empty but the API returned data")
  assert.equal(decision.skills[0].skill, "systematic-debugging")
  assert.notEqual(decision.skills[0].skill, "changes-review")
  assert.match(decision.note ?? "", /never to a review task/)
})

test("an explicit user override wins and is labeled user_specified", () => {
  const decision = routeForRequest(registry, "this sql query is slow", { userOverride: "performance-review" })
  assert.equal(decision.skills[0].skill, "performance-review")
  assert.equal(decision.basis, "user_specified")
})

test("routing decision is inspectable", () => {
  const decision = routeForRequest(registry, "the webhook handler retries twice")
  assert.ok(Array.isArray(decision.considered))
  assert.ok(decision.skills[0].reason.length > 0)
  assert.ok(["observed", "inferred", "user_specified"].includes(decision.basis))
})

test("review-only selection does not authorize code changes", () => {
  const result = scopeCheck(registry, { skills: [{ skill: "security-review" }] }, { allow_code_changes: true })
  assert.equal(result.permitted, false)
  assert.match(result.reasons.join(" "), /does not authorize edits/)
})

test("review-only selection with recorded changes is flagged", () => {
  const result = scopeCheck(registry, { skills: [{ skill: "frontend-review" }] }, {
    allow_code_changes: false,
    changed_paths: ["src/app.tsx"],
  })
  assert.equal(result.permitted, false)
  assert.match(result.reasons.join(" "), /review-only but the task recorded 1 changed path/)
})

test("implementing skills permit edits", () => {
  const result = scopeCheck(registry, { skills: [{ skill: "frontend-review" }] }, {
    allow_code_changes: true,
    changed_paths: ["src/app.tsx"],
  })
  assert.equal(result.permitted, false, "frontend-review is still review-only")

  const impl = scopeCheck(registry, { skills: [{ skill: "systematic-debugging" }] }, {
    allow_code_changes: true,
    changed_paths: ["src/app.tsx"],
  })
  assert.equal(impl.permitted, true)
})

test("read-only database contract rejects mutation verbs", () => {
  const ok = readOnlyDatabaseCheck([
    { kind: "db_read", executed: true, description: "SELECT * FROM users LIMIT 10" },
  ])
  assert.equal(ok.permitted, true)

  const bad = readOnlyDatabaseCheck([
    { kind: "db_read", executed: true, description: "SELECT 1" },
    { kind: "db_read", executed: true, description: "DELETE FROM sessions WHERE expired=1" },
  ])
  assert.equal(bad.permitted, false)
  assert.equal(bad.offenders.length, 1)
})

test("a planned database action is not an executed violation", () => {
  const planned = readOnlyDatabaseCheck([
    { kind: "db_read", executed: false, description: "DROP TABLE audit_log" },
  ])
  assert.equal(planned.permitted, true)
})