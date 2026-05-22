import { QuestionBuilder } from './utils.js'

export function generateStructuralValidationQuestions(
  getId,
) {
  const questions = []

  const validationFixtures = [
    { dataset: 'structural-validation-control', isValid: true, description: 'Valid complete dataset (control)' },
    { dataset: 'structural-validation-truncated', isValid: false, description: 'Array truncated: 3 rows removed from end' },
    { dataset: 'structural-validation-extra-rows', isValid: false, description: 'Extra rows added beyond declared length' },
    { dataset: 'structural-validation-width-mismatch', isValid: false, description: 'Inconsistent field count (missing salary in row 10)' },
    { dataset: 'structural-validation-missing-fields', isValid: false, description: 'Missing required fields (no email in multiple rows)' },
  ]

  for (const fixture of validationFixtures) {
    questions.push(
      new QuestionBuilder()
        .id(getId())
        .prompt('Is this data complete and valid? Answer only YES or NO.')
        .groundTruth(fixture.isValid ? 'YES' : 'NO')
        .type('structural-validation')
        .dataset(fixture.dataset)
        .answerType('boolean')
        .build(),
    )
  }

  return questions
}
