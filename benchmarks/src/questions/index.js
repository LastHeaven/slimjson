import { ACCURACY_DATASETS } from '../datasets.js'
import { generateAnalyticsQuestions } from './analytics.js'
import { generateEventLogsQuestions } from './event-logs.js'
import { generateGithubQuestions } from './github.js'
import { generateNestedConfigQuestions } from './nested-config.js'
import { generateNestedQuestions } from './nested.js'
import { generateStructuralValidationQuestions } from './structural-validation.js'
import { generateStructureQuestions } from './structure.js'
import { generateTabularQuestions } from './tabular.js'
import { createIdGenerator } from './utils.js'

export function generateQuestions() {
  const questions = []
  const idGen = createIdGenerator()
  const getId = () => idGen.next().value

  const tabular = ACCURACY_DATASETS.find(d => d.name === 'tabular')?.data.employees ?? []
  const nested = ACCURACY_DATASETS.find(d => d.name === 'nested')?.data.orders ?? []
  const analytics = ACCURACY_DATASETS.find(d => d.name === 'analytics')?.data.metrics ?? []
  const github = ACCURACY_DATASETS.find(d => d.name === 'github')?.data.repositories ?? []
  const eventLogs = ACCURACY_DATASETS.find(d => d.name === 'event-logs')?.data.logs ?? []
  const nestedConfig = ACCURACY_DATASETS.find(d => d.name === 'nested-config')?.data

  questions.push(...generateTabularQuestions(tabular, getId))
  questions.push(...generateNestedQuestions(nested, getId))
  questions.push(...generateAnalyticsQuestions(analytics, getId))
  questions.push(...generateGithubQuestions(github, getId))
  questions.push(...generateEventLogsQuestions(eventLogs, getId))
  questions.push(...generateNestedConfigQuestions(nestedConfig, getId))

  questions.push(...generateStructureQuestions(tabular, nested, analytics, github, eventLogs, getId))

  questions.push(...generateStructuralValidationQuestions(getId))

  return questions
}
