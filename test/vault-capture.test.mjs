import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")
const vault = readFileSync(join(repoRoot, "skills", "knowledge-vault", "SKILL.md"), "utf8")

test("capture is routed by evidence type, not by folder habit", () => {
  for (const [destination, content] of [
    ["`issues/bugs/`", "Symptom, cause, correction, verification"],
    ["`knowledge/glossary.md`", "Meaning"],
    ["`knowledge/patterns/`", "Context, approach"],
    ["`issues/enhancements/`", "Problem, intended outcome"],
  ]) {
    assert.ok(vault.includes(destination), `missing route: ${destination}`)
    assert.ok(vault.includes(content), `missing minimum content for ${destination}`)
  }
})

test("capture happens when knowledge forms, not batched at session end", () => {
  assert.match(vault, /Capture as it happens/)
  assert.match(vault, /Do not batch capture until the end/)
})

test("the ADR test requires all three conditions, not any one", () => {
  assert.match(vault, /all three are true/)
  assert.match(vault, /Hard to reverse/)
  assert.match(vault, /Surprising without context/)
  assert.match(vault, /genuine tradeoff/)
  assert.match(vault, /If any one is missing/)
})

test("the glossary is scoped to definitions and linked, not duplicated", () => {
  assert.match(vault, /holds definitions only/)
  assert.match(vault, /Do not infer a business rule from a variable or field name alone/)
  assert.match(vault, /over creating a second competing context file/)
})

test("superseded conclusions are corrected in place rather than duplicated", () => {
  assert.match(vault, /Mark superseded conclusions/)
  assert.match(vault, /update the note in place/)
  assert.match(vault, /Never leave two canonical notes making contradictory claims/)
})

test("empty directories are acceptable, so notes are never manufactured", () => {
  assert.match(vault, /Empty directories are correct/)
  assert.match(vault, /Do not manufacture notes/)
})