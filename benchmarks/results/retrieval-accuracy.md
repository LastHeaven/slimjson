Benchmarks test LLM comprehension across different input formats using 209 data retrieval questions on 2 models.

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
slimjson       ████████████████████   44.3 acc%/1K tok  │  94.5% acc  │  2,133 tokens
TOON           ███████████████░░░░░   33.8 acc%/1K tok  │  92.3% acc  │  2,734 tokens
JSON compact   ██████████████░░░░░░   31.0 acc%/1K tok  │  95.2% acc  │  3,072 tokens
YAML           ███████████░░░░░░░░░   24.9 acc%/1K tok  │  92.3% acc  │  3,716 tokens
JSON           █████████░░░░░░░░░░░   20.3 acc%/1K tok  │  92.3% acc  │  4,538 tokens
XML            ████████░░░░░░░░░░░░   18.1 acc%/1K tok  │  93.3% acc  │  5,162 tokens
```

*Efficiency score = (Accuracy % ÷ Tokens) × 1,000. Higher is better.*

> [!TIP]
> slimjson achieves **94.5%** accuracy (vs JSON's 92.3%) while using **53.0% fewer tokens**.

**Note on CSV:** Excluded from ranking as it only supports 109 of 209 questions (flat tabular data only). While CSV is highly token-efficient for simple tabular data, it cannot represent nested structures that other formats handle.

#### Per-Model Accuracy

Accuracy across 2 LLMs on 209 data retrieval questions:

```
deepseek-v4-flash
  XML            ███████████████████░    95.7% (200/209)
  JSON           ███████████████████░    95.7% (200/209)
  JSON compact   ███████████████████░    95.2% (199/209)
  YAML           ███████████████████░    94.3% (197/209)
→ slimjson       ███████████████████░    93.3% (195/209)
  TOON           ███████████████████░    92.8% (194/209)
  CSV            ██████████████████░░    91.7% (100/109)

mimo-v2.5-pro
→ slimjson       ███████████████████░    95.7% (200/209)
  JSON compact   ███████████████████░    95.2% (199/209)
  TOON           ██████████████████░░    91.9% (192/209)
  XML            ██████████████████░░    90.9% (190/209)
  YAML           ██████████████████░░    90.4% (189/209)
  JSON           ██████████████████░░    89.0% (186/209)
  CSV            ██████████████████░░    88.1% (96/109)
```

> [!TIP]
> slimjson achieves **94.5% accuracy** (vs JSON's 92.3%) while using **53.0% fewer tokens** on these datasets.

<details>
<summary><strong>Performance by dataset, model, and question type</strong></summary>

#### Performance by Question Type

| Question Type | JSON compact | slimjson | XML | JSON | TOON | YAML | CSV |
| ------------- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| Field Retrieval | 99.3% | 98.5% | 98.5% | 99.3% | 95.6% | 98.5% | 98.4% |
| Aggregation | 94.4% | 96.0% | 88.9% | 89.7% | 92.9% | 90.5% | 84.5% |
| Filtering | 97.9% | 96.9% | 94.8% | 91.7% | 93.8% | 92.7% | 88.9% |
| Structure Awareness | 88.0% | 88.0% | 90.0% | 90.0% | 90.0% | 88.0% | 87.5% |
| Structural Validation | 60.0% | 30.0% | 80.0% | 50.0% | 40.0% | 50.0% | 80.0% |

#### Performance by Dataset

##### Uniform employee records

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `slimjson` | 100.0% | 2,352 | 82/82 |
| `toon` | 97.6% | 2,492 | 80/82 |
| `csv` | 93.9% | 2,336 | 77/82 |
| `json-compact` | 98.8% | 3,919 | 81/82 |
| `yaml` | 98.8% | 4,982 | 81/82 |
| `json-pretty` | 95.1% | 6,326 | 78/82 |
| `xml` | 98.8% | 7,286 | 81/82 |

##### E-commerce orders with nested structures

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `slimjson` | 100.0% | 4,616 | 82/82 |
| `json-compact` | 98.8% | 6,875 | 81/82 |
| `toon` | 97.6% | 7,299 | 80/82 |
| `yaml` | 93.9% | 8,456 | 77/82 |
| `json-pretty` | 93.9% | 10,842 | 77/82 |
| `xml` | 95.1% | 12,180 | 78/82 |

##### Time-series analytics data

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `slimjson` | 98.3% | 1,485 | 59/60 |
| `csv` | 93.3% | 1,408 | 56/60 |
| `toon` | 96.7% | 1,550 | 58/60 |
| `json-compact` | 100.0% | 2,351 | 60/60 |
| `yaml` | 96.7% | 2,951 | 58/60 |
| `json-pretty` | 98.3% | 3,678 | 59/60 |
| `xml` | 95.0% | 4,386 | 57/60 |

##### Top 100 GitHub repositories

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `slimjson` | 86.4% | 8,572 | 57/66 |
| `toon` | 86.4% | 8,779 | 57/66 |
| `csv` | 83.3% | 8,527 | 55/66 |
| `json-compact` | 90.9% | 11,464 | 60/66 |
| `yaml` | 89.4% | 13,141 | 59/66 |
| `json-pretty` | 87.9% | 15,157 | 58/66 |
| `xml` | 84.8% | 17,105 | 56/66 |

##### Semi-uniform event logs

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `slimjson` | 90.0% | 3,464 | 54/60 |
| `json-compact` | 86.7% | 4,793 | 52/60 |
| `toon` | 81.7% | 5,769 | 49/60 |
| `yaml` | 81.7% | 5,798 | 49/60 |
| `json-pretty` | 85.0% | 6,759 | 51/60 |
| `xml` | 86.7% | 7,668 | 52/60 |

##### Deeply nested configuration

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `json-compact` | 100.0% | 562 | 58/58 |
| `slimjson` | 100.0% | 571 | 58/58 |
| `toon` | 100.0% | 653 | 58/58 |
| `yaml` | 98.3% | 675 | 57/58 |
| `json-pretty` | 100.0% | 918 | 58/58 |
| `xml` | 100.0% | 1,007 | 58/58 |

##### Valid complete dataset (control)

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `slimjson` | 100.0% | 485 | 2/2 |
| `toon` | 100.0% | 521 | 2/2 |
| `json-compact` | 100.0% | 772 | 2/2 |
| `yaml` | 100.0% | 984 | 2/2 |
| `json-pretty` | 100.0% | 1,259 | 2/2 |
| `xml` | 50.0% | 1,441 | 1/2 |
| `csv` | 0.0% | 473 | 0/2 |

##### Array truncated: 3 rows removed from end

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `csv` | 100.0% | 408 | 2/2 |
| `xml` | 50.0% | 1,229 | 1/2 |
| `json-compact` | 0.0% | 660 | 0/2 |
| `slimjson` | 0.0% | 421 | 0/2 |
| `json-pretty` | 0.0% | 1,075 | 0/2 |
| `toon` | 0.0% | 453 | 0/2 |
| `yaml` | 0.0% | 841 | 0/2 |

##### Extra rows added beyond declared length

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `csv` | 100.0% | 547 | 2/2 |
| `json-compact` | 100.0% | 892 | 2/2 |
| `xml` | 100.0% | 1,663 | 2/2 |
| `yaml` | 50.0% | 1,135 | 1/2 |
| `json-pretty` | 50.0% | 1,451 | 1/2 |
| `slimjson` | 0.0% | 557 | 0/2 |
| `toon` | 0.0% | 598 | 0/2 |

##### Inconsistent field count (missing salary in row 10)

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `csv` | 100.0% | 470 | 2/2 |
| `json-compact` | 100.0% | 767 | 2/2 |
| `yaml` | 100.0% | 977 | 2/2 |
| `toon` | 100.0% | 1,000 | 2/2 |
| `json-pretty` | 100.0% | 1,251 | 2/2 |
| `xml` | 100.0% | 1,432 | 2/2 |
| `slimjson` | 50.0% | 482 | 1/2 |

##### Missing required fields (no email in multiple rows)

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `csv` | 100.0% | 337 | 2/2 |
| `xml` | 100.0% | 1,386 | 2/2 |
| `json-compact` | 0.0% | 732 | 0/2 |
| `slimjson` | 0.0% | 454 | 0/2 |
| `json-pretty` | 0.0% | 1,207 | 0/2 |
| `toon` | 0.0% | 964 | 0/2 |
| `yaml` | 0.0% | 941 | 0/2 |

#### Performance by Model

##### deepseek-v4-flash

| Format | Accuracy | Correct/Total |
| ------ | -------- | ------------- |
| `xml` | 95.7% | 200/209 |
| `json-pretty` | 95.7% | 200/209 |
| `json-compact` | 95.2% | 199/209 |
| `yaml` | 94.3% | 197/209 |
| `slimjson` | 93.3% | 195/209 |
| `toon` | 92.8% | 194/209 |
| `csv` | 91.7% | 100/109 |

##### mimo-v2.5-pro

| Format | Accuracy | Correct/Total |
| ------ | -------- | ------------- |
| `slimjson` | 95.7% | 200/209 |
| `json-compact` | 95.2% | 199/209 |
| `toon` | 91.9% | 192/209 |
| `xml` | 90.9% | 190/209 |
| `yaml` | 90.4% | 189/209 |
| `json-pretty` | 89.0% | 186/209 |
| `csv` | 88.1% | 96/109 |

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

1. **Format conversion**: Each dataset is converted to all 7 formats (JSON compact, slimjson, XML, JSON, TOON, YAML, CSV).
2. **Query LLM**: Each model receives formatted data + question in a prompt and extracts the answer.
3. **Validate deterministically**: Answers are validated using type-aware comparison (e.g., `50000` = `$50,000`, `Engineering` = `engineering`, `2025-01-01` = `January 1, 2025`) without requiring an LLM judge.

#### Models & Configuration

- **Models tested**: `deepseek-v4-flash`, `mimo-v2.5-pro`
- **Token counting**: Using `gpt-tokenizer` with `o200k_base` encoding (GPT-5 tokenizer)
- **Temperature**: Not set (models use their defaults)
- **Total evaluations**: 209 questions × 7 formats × 2 models = 2,926 LLM calls
