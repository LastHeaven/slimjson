const DEFAULT_OPTIONS = {
  tolerance: 1e-6,
  caseSensitive: false,
  allowCurrency: true,
  allowPercent: true,
  decimalPlaces: undefined,
}

// Regex pattern constants
const INTEGER_PATTERN_WITH_CURRENCY = /[$€£¥]?\s*-?\d[\d,]*/
const INTEGER_PATTERN = /-?\d[\d,]*/
const NUMBER_PATTERN_WITH_CURRENCY = /[$€£¥]?\s*-?\d[\d,]*(?:\.\d+)?(?:e[+-]?\d+)?%?/i
const NUMBER_PATTERN = /-?\d[\d,]*(?:\.\d+)?(?:e[+-]?\d+)?%?/i
const WRAPPING_QUOTES_PATTERN = /^["']|["']$/g
const CODE_FENCE_PATTERN = /^```[\s\S]*?```$/g
const LANGUAGE_IDENTIFIER_PATTERN = /^\w+\n/
const CURRENCY_AND_FORMATTING_CHARS = /[$€£¥,\s]/g
const NUMBER_CLEANUP_CHARS = /[$€£¥,%\s]/g

// Boolean value constants
const TRUE_VALUES = new Set(['true', 'yes', 'y', '1'])
const FALSE_VALUES = new Set(['false', 'no', 'n', '0'])

// Numeric constants
const PERCENTAGE_DIVISOR = 100
const DECIMAL_BASE = 10
const MONTH_OFFSET = 1 // JavaScript months are 0-indexed
const DATE_COMPONENT_WIDTH = 2
const DATE_PAD_CHAR = '0'

// String constants
const CSV_DELIMITER = ','

function stripWrappingQuotes(text) {
  return text.trim().replace(WRAPPING_QUOTES_PATTERN, '')
}

function normalizeInteger(text, options) {
  const pattern = options.allowCurrency
    ? INTEGER_PATTERN_WITH_CURRENCY
    : INTEGER_PATTERN

  const match = text.match(pattern)
  if (!match)
    return { success: false, error: `No integer found in: "${text}"` }

  const normalizedValue = match[0].replace(CURRENCY_AND_FORMATTING_CHARS, '')
  const parsedNumber = Number.parseInt(normalizedValue, DECIMAL_BASE)

  if (Number.isNaN(parsedNumber))
    return { success: false, error: `Failed to parse integer: "${match[0]}"` }

  return { success: true, value: parsedNumber }
}

function normalizeNumber(text, options) {
  const pattern = options.allowCurrency
    ? NUMBER_PATTERN_WITH_CURRENCY
    : NUMBER_PATTERN

  const match = text.match(pattern)
  if (!match)
    return { success: false, error: `No number found in: "${text}"` }

  const token = match[0]
  const hasPercentSign = options.allowPercent && token.endsWith('%')

  const normalizedToken = token.replace(NUMBER_CLEANUP_CHARS, '')
  let parsedNumber = Number.parseFloat(normalizedToken)

  if (Number.isNaN(parsedNumber))
    return { success: false, error: `Failed to parse number: "${token}"` }

  if (hasPercentSign)
    parsedNumber = parsedNumber / PERCENTAGE_DIVISOR

  if (options.decimalPlaces !== undefined) {
    const factor = DECIMAL_BASE ** options.decimalPlaces
    parsedNumber = Math.round(parsedNumber * factor) / factor
  }

  return { success: true, value: parsedNumber }
}

function normalizeBoolean(text) {
  const normalizedValue = text.trim().toLowerCase()

  if (TRUE_VALUES.has(normalizedValue))
    return { success: true, value: true }

  if (FALSE_VALUES.has(normalizedValue))
    return { success: true, value: false }

  return { success: false, error: `Not a boolean: "${text}"` }
}

function normalizeDate(text) {
  const cleaned = stripWrappingQuotes(text)

  const parsedDate = new Date(cleaned)
  if (Number.isNaN(parsedDate.getTime()))
    return { success: false, error: `Invalid date: "${text}"` }

  const year = parsedDate.getUTCFullYear()
  const monthPadded = String(parsedDate.getUTCMonth() + MONTH_OFFSET).padStart(DATE_COMPONENT_WIDTH, DATE_PAD_CHAR)
  const dayPadded = String(parsedDate.getUTCDate()).padStart(DATE_COMPONENT_WIDTH, DATE_PAD_CHAR)
  const normalized = `${year}-${monthPadded}-${dayPadded}`

  return { success: true, value: normalized }
}

function normalizeString(text, options) {
  let trimmedText = text.trim()

  trimmedText = trimmedText.replace(WRAPPING_QUOTES_PATTERN, '')

  trimmedText = trimmedText.replace(CODE_FENCE_PATTERN, (match) => {
    const inner = match.slice(3, -3).trim()
    return inner.replace(LANGUAGE_IDENTIFIER_PATTERN, '')
  })

  trimmedText = trimmedText.trim()

  const value = options.caseSensitive ? trimmedText : trimmedText.toLowerCase()
  return { success: true, value }
}

function normalizeCsvListOrdered(text, options) {
  const strippedText = stripWrappingQuotes(text)
  const items = strippedText
    .split(CSV_DELIMITER)
    .map(item => item.trim())
    .filter(item => item.length > 0)

  const normalizedItems = items.map(item =>
    options.caseSensitive ? item : item.toLowerCase(),
  )

  return { success: true, value: normalizedItems }
}

function normalizeCsvListUnordered(text, options) {
  const result = normalizeCsvListOrdered(text, options)
  if (!result.success)
    return result

  if (!Array.isArray(result.value))
    return { success: false, error: 'Expected array result from normalizeCsvListOrdered' }

  const sorted = [...result.value].sort()
  return { success: true, value: sorted }
}

export function normalizeAnswer(text, kind, options = {}) {
  const resolvedOptions = { ...DEFAULT_OPTIONS, ...options }

  switch (kind) {
    case 'integer':
      return normalizeInteger(text, resolvedOptions)
    case 'number':
      return normalizeNumber(text, resolvedOptions)
    case 'boolean':
      return normalizeBoolean(text)
    case 'date':
      return normalizeDate(text)
    case 'string':
      return normalizeString(text, resolvedOptions)
    case 'csv-list-ordered':
      return normalizeCsvListOrdered(text, resolvedOptions)
    case 'csv-list-unordered':
      return normalizeCsvListUnordered(text, resolvedOptions)
    default:
      return { success: false, error: `Unknown answer kind: ${kind}` }
  }
}

function compareValues(actual, expected, kind, options) {
  switch (kind) {
    case 'integer':
    case 'boolean':
    case 'date':
    case 'string':
      return actual === expected

    case 'number':
      if (typeof actual !== 'number' || typeof expected !== 'number')
        return false

      if (options.decimalPlaces !== undefined) {
        return actual === expected
      }
      return Math.abs(actual - expected) <= options.tolerance

    case 'csv-list-ordered':
      if (!Array.isArray(actual) || !Array.isArray(expected))
        return false
      if (actual.length !== expected.length)
        return false
      return actual.every((item, i) => item === expected[i])

    case 'csv-list-unordered':
      if (!Array.isArray(actual) || !Array.isArray(expected))
        return false
      if (actual.length !== expected.length)
        return false
      return actual.every((item, i) => item === expected[i])

    default:
      return false
  }
}

export function compareAnswers(actual, expected, kind, options = {}) {
  const resolvedOptions = { ...DEFAULT_OPTIONS, ...options }

  const actualResult = normalizeAnswer(actual, kind, resolvedOptions)
  const expectedResult = normalizeAnswer(expected, kind, resolvedOptions)

  if (!actualResult.success) {
    return {
      match: false,
      details: `Failed to normalize actual answer: ${actualResult.error}`,
    }
  }

  if (!expectedResult.success) {
    return {
      match: false,
      details: `Failed to normalize expected answer: ${expectedResult.error}`,
    }
  }

  const match = compareValues(actualResult.value, expectedResult.value, kind, resolvedOptions)

  return {
    match,
    details: match
      ? undefined
      : `Mismatch: actual="${actualResult.value}" vs expected="${expectedResult.value}"`,
  }
}
