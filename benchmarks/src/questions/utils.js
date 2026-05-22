// Constants for sampling strides
export const SAMPLE_STRIDES = {
  EMPLOYEE_FIELD: 2,
  ORDER_FIELD: 2,
  CUSTOMER_FIELD: 2,
  ANALYTICS_FIELD: 3,
  METRIC_FIELD: 3,
  REPO_FIELD: 7,
  EVENT_LOG_FIELD: 5,
}

export function* createIdGenerator() {
  let id = 1
  while (true) {
    yield `q${id++}`
  }
}

export class QuestionBuilder {
  question = {}

  id(id) {
    this.question.id = id
    return this
  }

  prompt(prompt) {
    this.question.prompt = prompt
    return this
  }

  groundTruth(groundTruth) {
    this.question.groundTruth = groundTruth
    return this
  }

  type(type) {
    this.question.type = type
    return this
  }

  dataset(dataset) {
    this.question.dataset = dataset
    return this
  }

  answerType(kind) {
    this.question.answerType = kind
    return this
  }

  normalize(options) {
    this.question.normalizationOptions = options
    return this
  }

  build() {
    if (!this.question.id || !this.question.prompt || !this.question.groundTruth || !this.question.type || !this.question.dataset) {
      throw new Error('Incomplete question')
    }

    return this.question
  }
}

export function rotateQuestions(
  items,
  generators,
  limit,
  stride,
  getId,
) {
  const questions = []

  for (let i = 0; i < Math.min(limit, items.length); i++) {
    const item = items[i * stride] || items[i]
    if (!item)
      continue

    const generatorIndex = i % generators.length
    const generator = generators[generatorIndex]
    if (generator) {
      questions.push(generator(item, getId))
    }
  }

  return questions
}
