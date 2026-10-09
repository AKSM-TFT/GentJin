const TYPE_CHECKS = {
  object: (v) => v !== null && typeof v === "object" && !Array.isArray(v),
  array: Array.isArray,
  string: (v) => typeof v === "string",
  number: (v) => typeof v === "number" && Number.isFinite(v),
  integer: (v) => Number.isInteger(v),
  boolean: (v) => typeof v === "boolean",
  null: (v) => v === null,
}

function typeOf(value) {
  if (value === null) return "null"
  if (Array.isArray(value)) return "array"
  if (Number.isInteger(value)) return "integer"
  return typeof value
}

function deepEqual(a, b) {
  if (a === b) return true
  if (typeOf(a) !== typeOf(b)) return false
  if (Array.isArray(a)) return a.length === b.length && a.every((v, i) => deepEqual(v, b[i]))
  if (a && typeof a === "object") {
    const ka = Object.keys(a).sort()
    const kb = Object.keys(b).sort()
    return deepEqual(ka, kb) && ka.every((k) => deepEqual(a[k], b[k]))
  }
  return false
}

function resolveRef(ref, root) {
  if (!ref.startsWith("#/")) throw new Error(`unsupported $ref: ${ref}`)
  let node = root
  for (const rawSegment of ref.slice(2).split("/")) {
    const segment = rawSegment.replace(/~1/g, "/").replace(/~0/g, "~")
    node = node?.[segment]
    if (node === undefined) throw new Error(`unresolvable $ref: ${ref}`)
  }
  return node
}

function checkNode(value, schema, root, path, errors) {
  if (schema === true) return
  if (schema === false) {
    errors.push({ path, keyword: "false", message: "schema forbids any value here" })
    return
  }
  if (schema.$ref) {
    checkNode(value, resolveRef(schema.$ref, root), root, path, errors)
    return
  }

  if (schema.type !== undefined) {
    const allowed = Array.isArray(schema.type) ? schema.type : [schema.type]
    const actual = typeOf(value)
    const ok = allowed.some((t) => {
      if (t === "number") return actual === "number" || actual === "integer"
      return TYPE_CHECKS[t] ? TYPE_CHECKS[t](value) : false
    })
    if (!ok) {
      errors.push({ path, keyword: "type", message: `expected ${allowed.join("|")}, got ${actual}` })
      return
    }
  }

  if (schema.const !== undefined && !deepEqual(value, schema.const)) {
    errors.push({ path, keyword: "const", message: `expected ${JSON.stringify(schema.const)}` })
  }

  if (schema.enum !== undefined && !schema.enum.some((allowed) => deepEqual(value, allowed))) {
    errors.push({ path, keyword: "enum", message: `expected one of ${JSON.stringify(schema.enum)}` })
  }

  if (typeof value === "string") checkString(value, schema, path, errors)
  if (typeof value === "number") checkNumber(value, schema, path, errors)
  if (Array.isArray(value)) checkArray(value, schema, root, path, errors)
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    checkObject(value, schema, root, path, errors)
  }

  if (schema.if !== undefined) {
    const conditionHolds = validate(value, schema.if, { basePath: path }).valid
    const branch = conditionHolds ? schema.then : schema.else
    if (branch !== undefined) checkNode(value, branch, root, path, errors)
  }

  for (const keyword of ["allOf", "anyOf", "oneOf"]) {
    if (!schema[keyword]) continue
    const branchErrors = schema[keyword].map((branch) => {
      const collected = []
      checkNode(value, branch, root, path, collected)
      return collected
    })
    const passing = branchErrors.filter((e) => e.length === 0).length
    if (keyword === "allOf" && passing !== branchErrors.length) {
      errors.push(...branchErrors.flat())
    }
    if (keyword === "anyOf" && passing === 0) {
      errors.push({ path, keyword: "anyOf", message: "no branch matched" })
    }
    if (keyword === "oneOf" && passing !== 1) {
      errors.push({
        path,
        keyword: "oneOf",
        message: `expected exactly 1 matching branch, got ${passing}`,
      })
    }
  }

  if (schema.not !== undefined) {
    const collected = []
    checkNode(value, schema.not, root, path, collected)
    if (collected.length === 0) errors.push({ path, keyword: "not", message: "value matched a forbidden schema" })
  }
}

function checkString(value, schema, path, errors) {
  if (schema.minLength !== undefined && value.length < schema.minLength) {
    errors.push({ path, keyword: "minLength", message: `shorter than ${schema.minLength}` })
  }
  if (schema.maxLength !== undefined && value.length > schema.maxLength) {
    errors.push({ path, keyword: "maxLength", message: `longer than ${schema.maxLength}` })
  }
  if (schema.pattern !== undefined && !new RegExp(schema.pattern).test(value)) {
    errors.push({ path, keyword: "pattern", message: `does not match ${schema.pattern}` })
  }
}

function checkNumber(value, schema, path, errors) {
  if (schema.minimum !== undefined && value < schema.minimum) {
    errors.push({ path, keyword: "minimum", message: `expected >= ${schema.minimum}, got ${value}` })
  }
  if (schema.maximum !== undefined && value > schema.maximum) {
    errors.push({ path, keyword: "maximum", message: `expected <= ${schema.maximum}, got ${value}` })
  }
  if (schema.exclusiveMinimum !== undefined && value <= schema.exclusiveMinimum) {
    errors.push({ path, keyword: "exclusiveMinimum", message: `expected > ${schema.exclusiveMinimum}` })
  }
  if (schema.multipleOf !== undefined && value % schema.multipleOf !== 0) {
    errors.push({ path, keyword: "multipleOf", message: `expected a multiple of ${schema.multipleOf}` })
  }
}

function checkArray(value, schema, root, path, errors) {
  if (schema.minItems !== undefined && value.length < schema.minItems) {
    errors.push({ path, keyword: "minItems", message: `expected at least ${schema.minItems} items` })
  }
  if (schema.maxItems !== undefined && value.length > schema.maxItems) {
    errors.push({ path, keyword: "maxItems", message: `expected at most ${schema.maxItems} items` })
  }
  if (schema.items !== undefined) {
    value.forEach((item, index) => {
      checkNode(item, schema.items, root, `${path}/${index}`, errors)
    })
  }
}

function checkObject(value, schema, root, path, errors) {
  const known = new Set(Object.keys(schema.properties ?? {}))
  const requiredKeys = Array.isArray(schema.required) ? schema.required : []

  for (const key of requiredKeys) {
    const present = Object.prototype.hasOwnProperty.call(value, key)
    const definedInProperties = known.has(key)
    if (!present && definedInProperties) {
      errors.push({ path: `${path}/${key}`, keyword: "required", message: "missing required property" })
    } else if (!present) {
      errors.push({ path: `${path}/${key}`, keyword: "required", message: "missing required property" })
    }
  }

  const properties = schema.properties ?? {}

  if (schema.dependentRequired) {
    for (const [trigger, dependents] of Object.entries(schema.dependentRequired)) {
      if (!Object.prototype.hasOwnProperty.call(value, trigger)) continue
      for (const dependent of dependents) {
        if (!Object.prototype.hasOwnProperty.call(value, dependent)) {
          errors.push({
            path: `${path}/${dependent}`,
            keyword: "dependentRequired",
            message: `required because "${trigger}" is present`,
          })
        }
      }
    }
  }

  for (const [key, subschema] of Object.entries(properties)) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) continue
    checkNode(value[key], subschema, root, `${path}/${key}`, errors)
  }

  if (schema.additionalProperties === false) {
    const allowed = new Set(Object.keys(properties))
    for (const key of Object.keys(value)) {
      if (!allowed.has(key)) {
        errors.push({ path: `${path}/${key}`, keyword: "additionalProperties", message: "property not allowed" })
      }
    }
  } else if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
    const allowed = new Set(Object.keys(properties))
    for (const key of Object.keys(value)) {
      if (allowed.has(key)) continue
      checkNode(value[key], schema.additionalProperties, root, `${path}/${key}`, errors)
    }
  }

  if (schema.propertyNames !== undefined) {
    for (const key of Object.keys(value)) {
      checkNode(key, schema.propertyNames, root, `${path}/${key}`, errors)
    }
  }
}

export function validate(value, schema, options = {}) {
  const errors = []
  checkNode(value, schema, schema, options.basePath ?? "", errors)
  return { valid: errors.length === 0, errors }
}

export function assertValid(value, schema, label = "value") {
  const result = validate(value, schema)
  if (result.valid) return value
  const detail = result.errors
    .map((e) => `  ${e.path || "/"}: ${e.message} (${e.keyword})`)
    .join("\n")
  throw new Error(`${label} failed schema validation:\n${detail}`)
}

export const internals = { checkNode, deepEqual, typeOf }