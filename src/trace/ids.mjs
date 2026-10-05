import { randomBytes } from "node:crypto"

export function nextEventId() {
  return `evt-${randomBytes(6).toString("hex")}`
}

export function nextTaskId() {
  return `task-${randomBytes(6).toString("hex")}`
}