import * as fsp from 'node:fs/promises'
import * as path from 'node:path'
import * as prompts from '@clack/prompts'
import * as slimjson from 'slimjson'
import { BENCHMARKS_DIR, FORMATTER_DISPLAY_NAMES, ROOT_DIR } from '../src/constants.js'
import { TOKEN_EFFICIENCY_DATASETS } from '../src/datasets.js'
import { formatters, supportsCSV } from '../src/formatters.js'
import { createProgressBar, ensureDir, tokenize } from '../src/utils.js'

// Constants
const DATASET_ICONS = {
  'tabular': '👥',
  'nested': '🛒',
  'analytics': '📈',
  'github': '⭐',
  'event-logs': '📃',
  'nested-config': '🧩',
}

const COMPARISON_FORMAT_ORDER = ['json-pretty', 'json-compact', 'toon', 'yaml', 'xml']

const PROGRESS_BAR_WIDTH = 20
const TOKEN_PADDING = 7

const DEFAULT_DATASET_ICON = '📊'

const DETAILED_EXAMPLE_DATASETS = ['github', 'analytics']
const GITHUB_REPO_LIMIT = 3
const GITHUB_DESC_LIMIT = 80
const ANALYTICS_METRICS_LIMIT = 5

prompts.intro('Token Efficiency Benchmark')

function formatComparisonLine(format, isLast = false) {
  const label = FORMATTER_DISPLAY_NAMES[format.name] || format.name.toUpperCase()
  const signedPercent = format.savingsPercent >= 0
    ? `−${format.savingsPercent.toFixed(1)}%`
    : `+${Math.abs(format.savingsPercent).toFixed(1)}%`
  const connector = isLast ? '└─' : '├─'
  const tokenStr = format.tokens.toLocaleString('en-US').padStart(TOKEN_PADDING)
  return `${connector} vs ${label.padEnd(13)} ${`(${signedPercent})`.padEnd(20)}   ${tokenStr} tokens`
}

function calculateTotalMetrics(datasets, formatNames) {
  const totalSlimjsonTokens = datasets.reduce((sum, r) => {
    const slimjson = r.formats.find(f => f.name === 'slimjson')
    return sum + slimjson.tokens
  }, 0)

  const totals = formatNames.map((formatName) => {
    const totalTokens = datasets.reduce((sum, r) => {
      const format = r.formats.find(f => f.name === formatName)
      return sum + (format?.tokens || 0)
    }, 0)
    const savings = totalTokens - totalSlimjsonTokens
    const savingsPercent = (savings / totalTokens) * 100
    return { name: formatName, tokens: totalTokens, savingsPercent }
  })

  return { totalSlimjsonTokens, totals }
}

function generateTotalLines(
  totalSlimjsonTokens,
  totals,
  baselineFormat,
) {
  const separatorHalf = '─'.repeat(36)
  const lines = [`${separatorHalf} Total ${separatorHalf}`]

  if (baselineFormat) {
    const csvPercentage = Math.min(100, (baselineFormat.tokens / totalSlimjsonTokens) * 100)
    const csvBar = createProgressBar(csvPercentage, 100, PROGRESS_BAR_WIDTH)
    const csvStr = baselineFormat.tokens.toLocaleString('en-US').padStart(TOKEN_PADDING)
    lines.push(`   CSV                 ${csvBar}   ${csvStr} tokens`)

    const overheadPercent = ((totalSlimjsonTokens - baselineFormat.tokens) / baselineFormat.tokens) * 100
    const slimjsonBar = createProgressBar(100, 100, PROGRESS_BAR_WIDTH)
    const slimjsonStr = totalSlimjsonTokens.toLocaleString('en-US').padStart(TOKEN_PADDING)
    lines.push(`   slimjson            ${slimjsonBar}   ${slimjsonStr} tokens   (+${overheadPercent.toFixed(1)}% vs CSV)`)
  }
  else {
    const totalPercentage = Math.min(100, (totalSlimjsonTokens / totals[0].tokens) * 100)
    const totalBar = createProgressBar(totalPercentage, 100, PROGRESS_BAR_WIDTH)
    const slimjsonStr = totalSlimjsonTokens.toLocaleString('en-US').padStart(TOKEN_PADDING)
    lines.push(`   slimjson            ${totalBar}   ${slimjsonStr} tokens`)
  }

  for (let i = 0; i < totals.length; i++) {
    const format = totals[i]
    const isLast = i === totals.length - 1
    lines.push(`   ${formatComparisonLine({
      name: format.name,
      tokens: format.tokens,
      savings: 0,
      savingsPercent: format.savingsPercent,
    }, isLast)}`)
  }

  return lines.join('\n')
}

function generateDatasetChart(result) {
  const { dataset, formats } = result
  const sj = formats.find(f => f.name === 'slimjson')
  const jsonPretty = formats.find(f => f.name === 'json-pretty')

  const emoji = DATASET_ICONS[dataset.name] || DEFAULT_DATASET_ICON
  const eligibility = dataset.metadata.tabularEligibility
  const name = dataset.description

  const percentage = Math.min(100, 100 - jsonPretty.savingsPercent)
  const bar = createProgressBar(percentage, 100, PROGRESS_BAR_WIDTH)
  const sjStr = sj.tokens.toLocaleString('en-US')

  const line1 = `${emoji} ${name}  ┊  Tabular: ${eligibility}%`
  const line2 = `   │`
  const line3 = `   slimjson            ${bar}   ${sjStr.padStart(TOKEN_PADDING)} tokens`

  const comparisonLines = COMPARISON_FORMAT_ORDER.map((formatName, index, array) => {
    const format = formats.find(f => f.name === formatName)
    if (!format)
      return undefined

    return `   ${formatComparisonLine(format, index === array.length - 1)}`
  }).filter(Boolean)

  return [line1, line2, line3, ...comparisonLines].join('\n')
}

const results = []

// Calculate token counts for all datasets
for (const dataset of TOKEN_EFFICIENCY_DATASETS) {
  const formatMetrics = []
  const tokensByFormat = {}

  // Calculate tokens for each format
  for (const [formatName, formatter] of Object.entries(formatters)) {
    // Skip CSV for datasets that don't support it
    if (formatName === 'csv' && !supportsCSV(dataset))
      continue

    const formattedData = formatter(dataset.data)
    const tokens = tokenize(formattedData)
    tokensByFormat[formatName] = tokens
  }

  // Calculate savings vs slimjson
  const slimjsonTokens = tokensByFormat.slimjson
  for (const [formatName, tokens] of Object.entries(tokensByFormat)) {
    const savings = tokens - slimjsonTokens
    formatMetrics.push({
      name: formatName,
      tokens,
      savings,
      savingsPercent: formatName === 'slimjson' ? 0 : (savings / tokens) * 100,
    })
  }

  results.push({
    dataset,
    formats: formatMetrics,
  })
}

// Separate datasets by CSV support
const mixedStructureDatasets = results.filter(r => !supportsCSV(r.dataset))
const flatOnlyDatasets = results.filter(r => supportsCSV(r.dataset))

// Mixed-Structure Track (no CSV)
const mixedCharts = mixedStructureDatasets
  .map(result => generateDatasetChart(result))
  .join('\n\n')

// Flat-Only Track (with CSV)
const flatCharts = flatOnlyDatasets
  .map((result) => {
    const csv = result.formats.find(f => f.name === 'csv')
    const sj = result.formats.find(f => f.name === 'slimjson')

    if (!csv)
      return generateDatasetChart(result)

    const { dataset } = result
    const emoji = DATASET_ICONS[dataset.name] || DEFAULT_DATASET_ICON
    const eligibility = dataset.metadata.tabularEligibility
    const name = dataset.description

    const csvPercentage = Math.min(100, (csv.tokens / sj.tokens) * 100)
    const csvBar = createProgressBar(csvPercentage, 100, PROGRESS_BAR_WIDTH)
    const csvStr = csv.tokens.toLocaleString('en-US')

    const line1 = `${emoji} ${name}  ┊  Tabular: ${eligibility}%`
    const line2 = `   │`
    const line3 = `   CSV                 ${csvBar}   ${csvStr.padStart(TOKEN_PADDING)} tokens`

    const sjOverhead = sj.tokens - csv.tokens
    const sjOverheadPercent = (sjOverhead / csv.tokens) * 100
    const sjBar = createProgressBar(100, 100, PROGRESS_BAR_WIDTH)
    const sjStr = sj.tokens.toLocaleString('en-US')
    const sjVsCSV = sjOverheadPercent >= 0
      ? `(+${sjOverheadPercent.toFixed(1)}% vs CSV)`
      : `(${sjOverheadPercent.toFixed(1)}% vs CSV)`
    const sjLine = `   slimjson            ${sjBar}   ${sjStr.padStart(TOKEN_PADDING)} tokens   ${sjVsCSV}`

    const comparisonLines = COMPARISON_FORMAT_ORDER.map((formatName, index, array) => {
      const format = result.formats.find(f => f.name === formatName)
      if (!format)
        return undefined

      return `   ${formatComparisonLine(format, index === array.length - 1)}`
    }).filter(Boolean)

    return [line1, line2, line3, sjLine, ...comparisonLines].join('\n')
  })
  .join('\n\n')

// Calculate totals for mixed structure
const { totalSlimjsonTokens: totalSlimjsonTokensMixed, totals: mixedTotals } = calculateTotalMetrics(mixedStructureDatasets, COMPARISON_FORMAT_ORDER)
const mixedTotalLines = generateTotalLines(totalSlimjsonTokensMixed, mixedTotals)

// Calculate totals for flat-only
const { totalSlimjsonTokens: totalSlimjsonTokensFlat, totals: flatTotals } = calculateTotalMetrics(flatOnlyDatasets, COMPARISON_FORMAT_ORDER)
const totalCSVTokensFlat = flatOnlyDatasets.reduce((sum, r) => {
  const csv = r.formats.find(f => f.name === 'csv')
  return sum + (csv?.tokens || 0)
}, 0)
const flatTotalLines = generateTotalLines(totalSlimjsonTokensFlat, flatTotals, { name: 'csv', tokens: totalCSVTokensFlat })

const barChartSection = `
#### Mixed-Structure Track

Datasets with nested or semi-uniform structures. CSV excluded as it cannot properly represent these structures.

\`\`\`
${mixedCharts}

${mixedTotalLines}
\`\`\`

#### Flat-Only Track

Datasets with flat tabular structures where CSV is applicable.

\`\`\`
${flatCharts}

${flatTotalLines}
\`\`\`
`.trim()

// Generate detailed examples
const detailedExamples = results
  .filter(r => DETAILED_EXAMPLE_DATASETS.includes(r.dataset.name))
  .map((result, i, filtered) => {
    let displayData = result.dataset.data

    if (result.dataset.name === 'github') {
      displayData = {
        repositories: displayData.repositories.slice(0, GITHUB_REPO_LIMIT).map((repo) => ({
          ...repo,
          description: repo.description?.slice(0, GITHUB_DESC_LIMIT) + (repo.description?.length > GITHUB_DESC_LIMIT ? '…' : ''),
        })),
      }
    }
    else if (result.dataset.name === 'analytics') {
      displayData = { metrics: displayData.metrics.slice(0, ANALYTICS_METRICS_LIMIT) }
    }

    const emoji = DATASET_ICONS[result.dataset.name] || DEFAULT_DATASET_ICON
    const sj = result.formats.find(f => f.name === 'slimjson')
    const json = result.formats.find(f => f.name === 'json-pretty')
    const separator = i < filtered.length - 1 ? '---' : ''

    return `
#### ${emoji} ${result.dataset.description}

**Savings:** ${json.savings.toLocaleString('en-US')} tokens (${json.savingsPercent.toFixed(1)}% reduction vs JSON)

**slimjson** (${sj.tokens.toLocaleString('en-US')} tokens):

\`\`\`
${slimjson.stringify(slimjson.compress(displayData))}
\`\`\`

**JSON** (${json.tokens.toLocaleString('en-US')} tokens):

\`\`\`json
${JSON.stringify(displayData, undefined, 2)}
\`\`\`

${separator}
`.trim()
  })
  .join('\n\n')

const markdown = `
${barChartSection}

<details>
<summary><strong>Show detailed examples</strong></summary>

${detailedExamples}

</details>
`.trimStart()

prompts.log.message(barChartSection)

const resultsDir = path.join(BENCHMARKS_DIR, 'results')
await ensureDir(resultsDir)

const outputFilePath = path.join(resultsDir, 'token-efficiency.md')
await fsp.writeFile(outputFilePath, markdown, 'utf-8')

prompts.log.success(`Report saved to \`${path.relative(ROOT_DIR, outputFilePath)}\``)
