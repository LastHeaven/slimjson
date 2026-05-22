import * as fsp from 'node:fs/promises'
import { encode } from 'gpt-tokenizer'

export function createProgressBar(
  value,
  max,
  width = 25,
  chars = { filled: '█', empty: '░' },
) {
  const filled = Math.round((value / max) * width)
  const empty = width - filled
  return chars.filled.repeat(filled) + chars.empty.repeat(empty)
}

export function tokenize(text) {
  return encode(text).length
}

export async function ensureDir(dirPath) {
  await fsp.mkdir(dirPath, { recursive: true })
}
