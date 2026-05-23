# TOON Benchmarks

Benchmarks measuring slimjson's **token efficiency** and **retrieval accuracy** compared to JSON, XML, YAML, TOON, and CSV.

## Quick Start

```bash
# Run token efficiency benchmark
pnpm benchmark:tokens

# Run retrieval accuracy benchmark (requires API keys)
pnpm benchmark:accuracy
```

## Token Efficiency Benchmark

Measures token count reduction across JSON, XML, YAML, CSV, TOON and slimjson:

1. Generate datasets (GitHub repos, analytics, orders)
2. Convert to all formats (slimjson, TOON, JSON, XML, YAML, CSV)
3. Tokenize using `gpt-tokenizer` (`o200k_base` encoding)
4. Calculate savings and generate report

```bash
pnpm benchmark:tokens
```

Results are saved to `results/token-efficiency.md`.

## Retrieval Accuracy Benchmark

Tests how well LLMs can answer questions about data in different formats (slimjson, TOON, JSON, JSON compact, XML, YAML, CSV):

1. Generate 209 questions across 11 datasets (6 primary + 5 structural validation; CSV only included for datasets with flat/tabular structure)
2. Convert each dataset to all supported formats
3. Query each LLM with formatted data + question
4. Validate answers deterministically using type-aware comparison (no LLM judge needed)
5. Aggregate metrics and generate report

### Setup

1. Edit [`src/evaluate.js`](./src/evaluate.js) and add models to the exported `models` array:
   ```js
   export const models = [
      deepseek.chat('deepseek-v4-flash'),
      mimo.chat('mimo-v2.5-pro')
   ]
   ```
2. Duplicate `.env.example` to `.env` and add your API keys:
   ```bash
   cp .env.example .env
   ```

### Usage

```bash
# Full benchmark
pnpm benchmark:accuracy

# Dry run (10 questions only, for testing setup)
DRY_RUN=true pnpm benchmark:accuracy
```

Running the script will:

1. Prompt you to select which models to test.
2. Skip models with existing results (rerun to overwrite).
3. Show progress with rate limiting.
4. Save results to `results/accuracy/models/{model-id}.json`.
5. Generate report at `results/retrieval-accuracy.md`.

### Configuration

Edit [`src/constants.js`](./src/constants.js) to adjust:

- `MODEL_RPM_LIMITS` – Rate limits per model
- `DEFAULT_CONCURRENCY` – Parallel tasks (default: 10)
- `DRY_RUN_LIMITS` – Questions per dry run (default: 10)

## Project Structure

```
scripts/
├── accuracy-benchmark.js         # Retrieval accuracy benchmark
├── token-efficiency-benchmark.js # Token counting benchmark
└── fetch-github-repos.js         # Update GitHub dataset
src/
├── constants.js                  # Configuration
├── datasets.js                   # Test data generators
├── evaluate.js                   # LLM evaluation
├── formatters.js                 # Format converters
├── normalize.js                  # Answer normalization
├── report.js                     # Markdown reports
├── storage.js                    # Result caching
├── types.js                      # Type definitions
├── utils.js                      # Helpers
└── questions/                    # Question generators
    ├── analytics.js
    ├── event-logs.js
    ├── github.js
    ├── index.js
    ├── nested-config.js
    ├── nested.js
    ├── structural-validation.js
    ├── structure.js
    ├── tabular.js
    └── utils.js
data/
└── github-repos.json             # Top 100 GitHub repos
results/
├── token-efficiency.md           # Token savings report
├── retrieval-accuracy.md         # Accuracy report
└── accuracy/models/              # Per-model results (JSON)
```
