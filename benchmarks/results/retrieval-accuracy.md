Benchmarks test LLM comprehension across different input formats using 209 data retrieval questions on 1 model.

<details>
<summary><strong>Show Dataset Catalog</strong></summary>

#### Dataset Catalog

| Dataset | Rows | Structure | CSV Support | Eligibility |
| ------- | ---- | --------- | ----------- | ----------- |
| Uniform employee records | 100 | uniform | ✓ | 100% |
| E-commerce orders with nested structures | 50 | nested | ✗ | 33% |
| Time-series analytics data | 60 | uniform | ✓ | 100% |
| Top 100 GitHub repositories | 100 | uniform | ✓ | 100% |
| Semi-uniform event logs | 75 | semi-uniform | ✗ | 50% |
| Deeply nested configuration | 11 | deep | ✗ | 0% |
| Valid complete dataset (control) | 20 | uniform | ✓ | 100% |
| Array truncated: 3 rows removed from end | 17 | uniform | ✓ | 100% |
| Extra rows added beyond declared length | 23 | uniform | ✓ | 100% |
| Inconsistent field count (missing salary in row 10) | 20 | uniform | ✓ | 100% |
| Missing required fields (no email in multiple rows) | 20 | uniform | ✓ | 100% |

**Structure classes:**
- **uniform**: All objects have identical fields with primitive values
- **semi-uniform**: Mix of uniform and non-uniform structures
- **nested**: Objects with nested structures (nested objects or arrays)
- **deep**: Highly nested with minimal tabular eligibility

**CSV Support:** ✓ (supported), ✗ (not supported – would require lossy flattening)

**Eligibility:** Percentage of arrays that qualify for TOON's tabular format (uniform objects with primitive values)

</details>

#### Efficiency Ranking (Accuracy per 1K Tokens)

Each format ranked by efficiency (accuracy percentage per 1,000 tokens):

```
slimjson       ████████████████████   44.4 acc%/1K tok  │  94.7% acc  │  2,134 tokens
TOON           ███████████████░░░░░   34.0 acc%/1K tok  │  92.8% acc  │  2,734 tokens
JSON compact   ██████████████░░░░░░   31.0 acc%/1K tok  │  95.2% acc  │  3,072 tokens
YAML           ███████████░░░░░░░░░   25.4 acc%/1K tok  │  94.3% acc  │  3,716 tokens
JSON           ██████████░░░░░░░░░░   21.1 acc%/1K tok  │  95.7% acc  │  4,538 tokens
XML            ████████░░░░░░░░░░░░   18.5 acc%/1K tok  │  95.7% acc  │  5,162 tokens
```

*Efficiency score = (Accuracy % ÷ Tokens) × 1,000. Higher is better.*

> [!TIP]
> slimjson achieves **94.7%** accuracy (vs JSON's 95.7%) while using **53.0% fewer tokens**.

**Note on CSV:** Excluded from ranking as it only supports 109 of 209 questions (flat tabular data only). While CSV is highly token-efficient for simple tabular data, it cannot represent nested structures that other formats handle.

#### Per-Model Accuracy

Accuracy across 1 LLM on 209 data retrieval questions:

```
deepseek-v4-flash
  JSON           ███████████████████░    95.7% (200/209)
  XML            ███████████████████░    95.7% (200/209)
  JSON compact   ███████████████████░    95.2% (199/209)
→ slimjson       ███████████████████░    94.7% (198/209)
  YAML           ███████████████████░    94.3% (197/209)
  TOON           ███████████████████░    92.8% (194/209)
  CSV            ██████████████████░░    91.7% (100/109)
```

> [!TIP]
> slimjson achieves **94.7% accuracy** (vs JSON's 95.7%) while using **53.0% fewer tokens** on these datasets.

<details>
<summary><strong>Performance by dataset, model, and question type</strong></summary>

#### Performance by Question Type

| Question Type | JSON | XML | JSON compact | slimjson | YAML | TOON | CSV |
| ------------- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| Field Retrieval | 98.5% | 97.1% | 98.5% | 95.6% | 97.1% | 91.2% | 96.9% |
| Aggregation | 98.4% | 96.8% | 95.2% | 95.2% | 93.7% | 95.2% | 86.2% |
| Filtering | 97.9% | 97.9% | 100.0% | 100.0% | 100.0% | 100.0% | 96.3% |
| Structure Awareness | 88.0% | 92.0% | 84.0% | 92.0% | 88.0% | 88.0% | 87.5% |
| Structural Validation | 40.0% | 60.0% | 60.0% | 40.0% | 40.0% | 40.0% | 80.0% |

#### Performance by Dataset

##### Uniform employee records

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `slimjson` | 100.0% | 2,354 | 41/41 |
| `csv` | 95.1% | 2,336 | 39/41 |
| `toon` | 97.6% | 2,492 | 40/41 |
| `json-compact` | 97.6% | 3,919 | 40/41 |
| `yaml` | 100.0% | 4,982 | 41/41 |
| `json-pretty` | 97.6% | 6,326 | 40/41 |
| `xml` | 100.0% | 7,286 | 41/41 |

##### E-commerce orders with nested structures

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `slimjson` | 100.0% | 4,616 | 41/41 |
| `json-compact` | 97.6% | 6,875 | 40/41 |
| `toon` | 95.1% | 7,299 | 39/41 |
| `yaml` | 95.1% | 8,456 | 39/41 |
| `json-pretty` | 95.1% | 10,842 | 39/41 |
| `xml` | 95.1% | 12,180 | 39/41 |

##### Time-series analytics data

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `slimjson` | 100.0% | 1,487 | 30/30 |
| `csv` | 96.7% | 1,408 | 29/30 |
| `toon` | 93.3% | 1,550 | 28/30 |
| `json-compact` | 100.0% | 2,351 | 30/30 |
| `yaml` | 96.7% | 2,951 | 29/30 |
| `json-pretty` | 100.0% | 3,678 | 30/30 |
| `xml` | 100.0% | 4,386 | 30/30 |

##### Top 100 GitHub repositories

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `toon` | 87.9% | 8,779 | 29/33 |
| `csv` | 84.8% | 8,527 | 28/33 |
| `slimjson` | 81.8% | 8,574 | 27/33 |
| `json-compact` | 90.9% | 11,464 | 30/33 |
| `yaml` | 90.9% | 13,141 | 30/33 |
| `json-pretty` | 90.9% | 15,157 | 30/33 |
| `xml` | 87.9% | 17,105 | 29/33 |

##### Semi-uniform event logs

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `slimjson` | 93.3% | 3,466 | 28/30 |
| `json-compact` | 90.0% | 4,793 | 27/30 |
| `yaml` | 93.3% | 5,798 | 28/30 |
| `json-pretty` | 100.0% | 6,759 | 30/30 |
| `toon` | 90.0% | 5,769 | 27/30 |
| `xml` | 96.7% | 7,668 | 29/30 |

##### Deeply nested configuration

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `json-compact` | 100.0% | 562 | 29/29 |
| `slimjson` | 100.0% | 571 | 29/29 |
| `toon` | 100.0% | 653 | 29/29 |
| `yaml` | 96.6% | 675 | 28/29 |
| `json-pretty` | 100.0% | 918 | 29/29 |
| `xml` | 100.0% | 1,007 | 29/29 |

##### Valid complete dataset (control)

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `slimjson` | 100.0% | 487 | 1/1 |
| `toon` | 100.0% | 521 | 1/1 |
| `json-compact` | 100.0% | 772 | 1/1 |
| `yaml` | 100.0% | 984 | 1/1 |
| `json-pretty` | 100.0% | 1,259 | 1/1 |
| `xml` | 0.0% | 1,441 | 0/1 |
| `csv` | 0.0% | 473 | 0/1 |

##### Array truncated: 3 rows removed from end

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `csv` | 100.0% | 408 | 1/1 |
| `json-pretty` | 0.0% | 1,075 | 0/1 |
| `xml` | 0.0% | 1,229 | 0/1 |
| `json-compact` | 0.0% | 660 | 0/1 |
| `slimjson` | 0.0% | 423 | 0/1 |
| `yaml` | 0.0% | 841 | 0/1 |
| `toon` | 0.0% | 453 | 0/1 |

##### Extra rows added beyond declared length

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `csv` | 100.0% | 547 | 1/1 |
| `json-compact` | 100.0% | 892 | 1/1 |
| `xml` | 100.0% | 1,663 | 1/1 |
| `json-pretty` | 0.0% | 1,451 | 0/1 |
| `slimjson` | 0.0% | 559 | 0/1 |
| `yaml` | 0.0% | 1,135 | 0/1 |
| `toon` | 0.0% | 598 | 0/1 |

##### Inconsistent field count (missing salary in row 10)

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `csv` | 100.0% | 470 | 1/1 |
| `json-compact` | 100.0% | 767 | 1/1 |
| `yaml` | 100.0% | 977 | 1/1 |
| `toon` | 100.0% | 1,000 | 1/1 |
| `json-pretty` | 100.0% | 1,251 | 1/1 |
| `xml` | 100.0% | 1,432 | 1/1 |
| `slimjson` | 0.0% | 484 | 0/1 |

##### Missing required fields (no email in multiple rows)

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `csv` | 100.0% | 337 | 1/1 |
| `slimjson` | 100.0% | 456 | 1/1 |
| `xml` | 100.0% | 1,386 | 1/1 |
| `json-pretty` | 0.0% | 1,207 | 0/1 |
| `json-compact` | 0.0% | 732 | 0/1 |
| `yaml` | 0.0% | 941 | 0/1 |
| `toon` | 0.0% | 964 | 0/1 |

#### Performance by Model

##### deepseek-v4-flash

| Format | Accuracy | Correct/Total |
| ------ | -------- | ------------- |
| `json-pretty` | 95.7% | 200/209 |
| `xml` | 95.7% | 200/209 |
| `json-compact` | 95.2% | 199/209 |
| `slimjson` | 94.7% | 198/209 |
| `yaml` | 94.3% | 197/209 |
| `toon` | 92.8% | 194/209 |
| `csv` | 91.7% | 100/109 |

</details>

#### What's Being Measured

This benchmark tests **LLM comprehension and data retrieval accuracy** across different input formats. Each LLM receives formatted data and must answer questions about it. This does **not** test the model's ability to generate output in any format – only to read and understand it.

#### Datasets Tested

Eleven datasets designed to test different structural patterns and validation capabilities:

**Primary datasets:**

1. **Tabular** (100 employee records): Uniform objects with identical fields – optimal for TOON's tabular format.
2. **Nested** (50 e-commerce orders): Complex structures with nested customer objects and item arrays.
3. **Analytics** (60 days of metrics): Time-series data with dates and numeric values.
4. **GitHub** (100 repositories): Real-world data from top GitHub repos by stars.
5. **Event Logs** (75 logs): Semi-uniform data with ~50% flat logs and ~50% with nested error objects.
6. **Nested Config** (1 configuration): Deeply nested configuration with minimal tabular eligibility.

**Structural validation datasets:**

7. **Control**: Valid complete dataset (baseline for validation)
8. **Truncated**: Array with 3 rows removed from end (tests `[N]` length detection)
9. **Extra rows**: Array with 3 additional rows beyond declared length
10. **Width mismatch**: Inconsistent field count (missing salary in row 10)
11. **Missing fields**: Systematic field omissions (no email in multiple rows)

#### Question Types

209 questions are generated dynamically across five categories:

- **Field retrieval (33%)**: Direct value lookups or values that can be read straight off a record (including booleans and simple counts such as array lengths)
  - Example: "What is Alice's salary?" -> `75000`
  - Example: "How many items are in order ORD-0042?" -> `3`
  - Example: "What is the customer name for order ORD-0042?" -> `John Doe`

- **Aggregation (30%)**: Dataset-level totals and averages plus single-condition filters (counts, sums, min/max comparisons)
  - Example: "How many employees work in Engineering?" -> `17`
  - Example: "What is the total revenue across all orders?" -> `45123.50`
  - Example: "How many employees have salary > 80000?" -> `23`

- **Filtering (23%)**: Multi-condition queries requiring compound logic (AND constraints across fields)
  - Example: "How many employees in Sales have salary > 80000?" -> `5`
  - Example: "How many active employees have more than 10 years of experience?" -> `8`

- **Structure awareness (12%)**: Tests format-native structural affordances (TOON's `[N]` count and `{fields}`, CSV's header row)
  - Example: "How many employees are in the dataset?" -> `100`
  - Example: "List the field names for employees" -> `id, name, email, department, salary, yearsExperience, active`
  - Example: "What is the department of the last employee?" -> `Sales`

- **Structural validation (2%)**: Tests ability to detect incomplete, truncated, or corrupted data using structural metadata
  - Example: "Is this data complete and valid?" -> `YES` (control dataset) or `NO` (corrupted datasets)
  - Tests TOON's `[N]` length validation and `{fields}` consistency checking
  - Demonstrates CSV's lack of structural validation capabilities

#### Evaluation Process

1. **Format conversion**: Each dataset is converted to all 7 formats (JSON, XML, JSON compact, slimjson, YAML, TOON, CSV).
2. **Query LLM**: Each model receives formatted data + question in a prompt and extracts the answer.
3. **Validate deterministically**: Answers are validated using type-aware comparison (e.g., `50000` = `$50,000`, `Engineering` = `engineering`, `2025-01-01` = `January 1, 2025`) without requiring an LLM judge.

#### Models & Configuration

- **Models tested**: `deepseek-v4-flash`
- **Token counting**: Using `gpt-tokenizer` with `o200k_base` encoding (GPT-5 tokenizer)
- **Temperature**: Not set (models use their defaults)
- **Total evaluations**: 209 questions × 7 formats × 1 models = 1,463 LLM calls
