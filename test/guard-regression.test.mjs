import test from "node:test"
import assert from "node:assert/strict"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { isGuardedAction, executableSegments } from "../src/capabilities/adherence.mjs"
import { buildCapabilityRegistry } from "../src/capabilities/registry.mjs"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")
const registry = buildCapabilityRegistry(repoRoot)

const GIT = ["git"]
const COMMIT = `${GIT.join(" ")} commit -m wip`
const PUSH = `${GIT.join(" ")} push origin main`

test("regression: a guarded phrase inside a heredoc body is not a command", () => {
  const command = ["cat >> test/x.mjs << 'EOF'", `test("${COMMIT} moves")`, "EOF"].join("\n")
  assert.equal(isGuardedAction(command, registry).guarded, false)
})

test("regression: a guarded phrase inside a quoted argument is not a command", () => {
  assert.equal(isGuardedAction(`echo "${PUSH}" > note.txt`, registry).guarded, false)
  assert.equal(isGuardedAction(`grep -rn "${COMMIT}" ~/.config/opencode`, registry).guarded, false)
})

test("regression: a guarded phrase in a trailing comment is not a command", () => {
  assert.equal(isGuardedAction(`ls -la # ${PUSH}`, registry).guarded, false)
})

test("regression: real guarded commands are still refused", () => {
  for (const command of [COMMIT, PUSH, "rm -rf ~/.config/opencode/skills", "node sync.mjs ~/.config/opencode"]) {
    assert.equal(isGuardedAction(command, registry).guarded, true, command)
  }
})

test("regression: a real command is still caught when its message quotes a guarded phrase", () => {
  const command = `${GIT.join(" ")} commit -m "please ${PUSH} later"`
  assert.equal(isGuardedAction(command, registry).guarded, true)
})

test("regression: a heredoc writing a guarded path does not by itself trigger a mutation", () => {
  const command = ["cat << 'EOF' > /tmp/notes.md", "the install lives in ~/.config/opencode", "EOF"].join("\n")
  assert.equal(isGuardedAction(command, registry).guarded, false)
})

test("executableSegments drops heredoc bodies but keeps the command that feeds them", () => {
  const segments = executableSegments(["cat << 'EOF' > out.txt", "rm -rf ~/.config/opencode/skills", "EOF"].join("\n"))
  assert.equal(segments.length, 1)
  assert.match(segments[0], /^cat/)
  assert.equal(segments[0].includes("rm -rf"), false)
})

test("executableSegments splits on statement separators and trims", () => {
  assert.deepEqual(executableSegments("  ls -la ; git status  ;  npm test "), ["ls -la", "git status", "npm test"])
})
