import * as path from 'node:path'
import { createStorage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'
import { BENCHMARKS_DIR } from './constants.js'

export const resultsStorage = createStorage({
  driver: fsDriver({
    base: path.join(BENCHMARKS_DIR, 'results', 'accuracy', 'models'),
  }),
})

export async function loadModelResults(modelId) {
  const data = await resultsStorage.getItem(modelId)
  return data ?? undefined
}

export async function saveModelResults(modelId, results) {
  await resultsStorage.setItem(modelId, results)
}

export async function getAllModelResults() {
  const keys = await resultsStorage.getKeys()
  const results = {}

  await Promise.all(
    keys.map(async (modelId) => {
      const data = await resultsStorage.getItem(modelId)
      if (data)
        results[modelId] = data
    }),
  )

  return results
}

export async function hasModelResults(modelId) {
  return await resultsStorage.hasItem(modelId)
}
