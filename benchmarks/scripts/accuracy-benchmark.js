import * as fsp from 'node:fs/promises'
import * as path from 'node:path'
import process from 'node:process'
import * as prompts from '@clack/prompts'
import PQueue from 'p-queue'
import { BENCHMARKS_DIR, DEFAULT_CONCURRENCY, DRY_RUN, DRY_RUN_LIMITS, MODEL_RPM_LIMITS, ROOT_DIR } from '../src/constants.js'
import { ACCURACY_DATASETS } from '../src/datasets.js'
import { evaluateQuestion, models } from '../src/evaluate.js'
import { formatters, supportsCSV } from '../src/formatters.js'
import { generateQuestions } from '../src/questions/index.js'
import { calculateFormatResults, calculateTokenCounts, generateAccuracyReport } from '../src/report.js'
import { getAllModelResults, hasModelResults, saveModelResults } from '../src/storage.js'
import { ensureDir } from '../src/utils.js'

// Constants
const PROGRESS_UPDATE_INTERVAL = 10
const RATE_LIMIT_INTERVAL_MS = 60_000

prompts.intro('Retrieval Accuracy Benchmark')

function generateEvaluationTasks(questions) {
  const tasks = []

  for (const question of questions) {
    for (const [formatName] of Object.entries(formatters)) {
      const dataset = ACCURACY_DATASETS.find(d => d.name === question.dataset)
      if (formatName === 'csv' && dataset && !supportsCSV(dataset))
        continue

      tasks.push({ question, formatName })
    }
  }

  return tasks
}

async function checkExistingResults(activeModels) {
  const existingModelResults = {}

  for (const model of activeModels) {
    const existingResult = await hasModelResults(model.modelId)
    if (existingResult)
      existingModelResults[model.modelId] = existingResult
  }

  return existingModelResults
}

function createProgressUpdater(spinner, total) {
  let completed = 0

  return () => {
    completed++
    if (completed % PROGRESS_UPDATE_INTERVAL === 0 || completed === total) {
      const percent = ((completed / total) * 100).toFixed(1)
      spinner.message(`Progress: ${completed}/${total} (${percent}%)`)
    }
  }
}

function createEvaluationQueue(modelId) {
  const rpmLimit = MODEL_RPM_LIMITS[modelId]

  return new PQueue({
    concurrency: DEFAULT_CONCURRENCY,
    intervalCap: rpmLimit ?? Infinity,
    interval: rpmLimit ? RATE_LIMIT_INTERVAL_MS : 0,
  })
}

// Prompt user to select which models to benchmark
const modelChoices = models.map(({ modelId }) => ({
  value: modelId,
  label: modelId,
}))

const selectedModels = await prompts.multiselect({
  message: 'Select models to benchmark (Space to select, Enter to confirm)',
  options: modelChoices,
  required: true,
})

if (prompts.isCancel(selectedModels)) {
  prompts.cancel('Benchmark cancelled')
  process.exit(0)
}

const activeModels = models.filter(m => selectedModels.includes(m.modelId))

prompts.log.info(`Selected ${activeModels.length} model(s): ${activeModels.map(m => m.modelId).join(', ')}`)

// Check which models already have results
const existingModelResults = await checkExistingResults(activeModels)

if (Object.keys(existingModelResults).length > 0) {
  prompts.log.info(`Found existing results for ${Object.keys(existingModelResults).length} model(s)`)
}

if (DRY_RUN) {
  prompts.log.info('Limiting questions and models for dry run')
}

let questions = generateQuestions()

// Apply dry run limits if enabled
if (DRY_RUN && DRY_RUN_LIMITS.maxQuestions) {
  questions = questions.slice(0, DRY_RUN_LIMITS.maxQuestions)
}

prompts.log.info(`Evaluating ${questions.length} questions`)
prompts.log.info(`Testing ${Object.keys(formatters).length} formats`)

// Evaluate each model separately and save results incrementally
for (const model of activeModels) {
  const modelId = model.modelId

  // Skip if results already exist
  if (existingModelResults[modelId]) {
    prompts.log.info(`Skipping ${modelId} (results already exist)`)
    continue
  }

  prompts.log.step(`Running benchmark for ${modelId}`)

  // Generate evaluation tasks for this model
  const tasks = generateEvaluationTasks(questions)

  const total = tasks.length
  const rpmLimit = MODEL_RPM_LIMITS[modelId]
  const queue = createEvaluationQueue(modelId)

  const evalSpinner = prompts.spinner()
  evalSpinner.start(`Running ${total} evaluations (concurrency: ${DEFAULT_CONCURRENCY}, RPM limit: ${rpmLimit ?? 'unlimited'})`)

  const updateProgress = createProgressUpdater(evalSpinner, total)

  // Queue all tasks
  const modelResultPromises = tasks.map(task =>
    queue.add(async () => {
      // Format data on-demand
      const dataset = ACCURACY_DATASETS.find(d => d.name === task.question.dataset)
      const formatter = formatters[task.formatName]
      const formattedData = formatter(dataset.data)

      const result = await evaluateQuestion({
        question: task.question,
        formatName: task.formatName,
        formattedData,
        model,
      })

      // Progress update after task completes
      updateProgress()

      return result
    }),
  )

  // Wait for all tasks to complete
  const modelResults = await Promise.all(modelResultPromises)

  evalSpinner.stop(`Evaluation complete for ${modelId}`)

  // Save results immediately for this model
  await saveModelResults(modelId, modelResults)
  prompts.log.success(`Saved results for ${modelId}`)
}

// Generate/regenerate markdown report from all available model results
const reportSpinner = prompts.spinner()
reportSpinner.start('Generating report from all model results')

// Load all available model results (including any that were skipped)
const allModelResults = await getAllModelResults()
const allResults = Object.values(allModelResults).flat()

if (allResults.length === 0) {
  prompts.log.warn('No results available to generate report')
  process.exit(0)
}

const tokenCounts = calculateTokenCounts(formatters)
const formatResults = calculateFormatResults(allResults, tokenCounts)
const accuracyReport = generateAccuracyReport(allResults, formatResults, tokenCounts)

const resultsDir = path.join(BENCHMARKS_DIR, 'results')
await ensureDir(resultsDir)

const outputFilePath = path.join(resultsDir, 'retrieval-accuracy.md')
await fsp.writeFile(outputFilePath, accuracyReport)

reportSpinner.stop('Report generation complete!')
prompts.log.info(`Report saved to: \`${path.relative(ROOT_DIR, outputFilePath)}\``)
