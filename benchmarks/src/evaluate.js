import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { compareAnswers } from './normalize.js'

const deepseek = createOpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY,
})

const mimo = createOpenAI({
    baseURL: 'https://token-plan-cn.xiaomimimo.com/v1',
    apiKey: process.env.MIMO_TOKEN_PLAN_API_KEY,
})

export const models = [
  deepseek.chat('deepseek-v4-flash'),
  mimo.chat('mimo-v2.5-pro')
]

export const PRIMERS = {
  'toon': 'TOON: Indentation-based. Arrays declare length and fields (e.g., items[N]{f1,f2}:). Rows use single delimiter. Values may be quoted.',
  'slimjson': 'slimjson: Compact JSON-like format with structural compression. Uses abbreviated keys and minimized syntax while preserving full data fidelity.',
  'json-pretty': 'JSON: Strict JSON objects/arrays with repeated keys per row.',
  'json-compact': 'JSON (compact): Strict JSON without extra whitespace.',
  'yaml': 'YAML: Indentation-based key/value and lists (- items).',
  'xml': 'XML: Tag-based tree structure with nested elements.',
  'csv': 'CSV: Header row, comma-separated values. First row contains field names.',
}

export const FENCE = {
  'toon': 'toon',
  'slimjson': 'json',
  'json-pretty': 'json',
  'json-compact': 'json',
  'yaml': 'yaml',
  'xml': 'xml',
  'csv': 'csv',
}

export async function evaluateQuestion(
  { question, formatName, formattedData, model },
) {
  const primer = PRIMERS[formatName] ?? ''
  const fence = FENCE[formatName] ?? ''

  const prompt = `
${primer}

Given the following data in ${formatName} format:

\`\`\`${fence}
${formattedData}
\`\`\`

Question: ${question.prompt}

Answer format requirements:
- Provide only the value itself, no explanation
- For numbers: output digits only (no commas, currency symbols, or units)
- For dates/field names: use the exact string from the data
- For lists: output comma-separated values with no spaces

Answer:
`.trim()

  const startTime = performance.now()
  const { text, usage } = await generateText({ model, prompt })

  const actual = text.trim()
  const latencyMs = performance.now() - startTime

  const comparisonResult = compareAnswers(
    actual,
    question.groundTruth,
    question.answerType ?? 'string',
    question.normalizationOptions,
  )
  const isCorrect = comparisonResult.match

  return {
    questionId: question.id,
    format: formatName,
    model: model.modelId,
    expected: question.groundTruth,
    actual,
    isCorrect,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    latencyMs,
  }
}
