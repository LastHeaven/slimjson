import { stringify as stringifyCSV } from 'csv-stringify/sync'
import { XMLBuilder } from 'fast-xml-parser'
import { stringify as stringifyYAML } from 'yaml'
import { encode as encodeToon } from '@toon-format/toon'
import * as slimjson from 'slimjson'

export const formatters = {
  'json-pretty': data => JSON.stringify(data, undefined, 2),
  'json-compact': data => JSON.stringify(data),
  'slimjson': data => slimjson.stringify(slimjson.compress(data)),
  'toon': data => encodeToon(data),
  'csv': data => toCSV(data),
  'xml': data => toXML(data),
  'yaml': data => stringifyYAML(data),
}

function toCSV(data) {
  const sections = []

  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value) && value.length > 0) {
        sections.push(`# ${key}`)
        sections.push(stringifyCSV(value, { header: true }))
      }
    }
    return sections.join('\n').trim()
  }

  if (Array.isArray(data) && data.length > 0) {
    return stringifyCSV(data, { header: true }).trim()
  }

  return ''
}

function toXML(data) {
  const builder = new XMLBuilder({
    format: true,
    indentBy: '  ',
    suppressEmptyNode: true,
  })

  return builder.build(data)
}

export function supportsCSV(dataset) {
  return dataset.metadata.supportsCSV
}
