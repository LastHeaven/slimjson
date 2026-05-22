#### Mixed-Structure Track

Datasets with nested or semi-uniform structures. CSV excluded as it cannot properly represent these structures.

```
🛒 E-commerce orders with nested structures  ┊  Tabular: 33%
   │
   slimjson            ████████░░░░░░░░░░░░    46,233 tokens
   ├─ vs JSON          (−57.8%)               109,574 tokens
   ├─ vs JSON compact  (−33.5%)                69,528 tokens
   ├─ vs TOON          (−36.9%)                73,246 tokens
   ├─ vs YAML          (−45.9%)                85,451 tokens
   └─ vs XML           (−62.5%)               123,272 tokens

📃 Semi-uniform event logs  ┊  Tabular: 50%
   │
   slimjson            ██████████░░░░░░░░░░    91,630 tokens
   ├─ vs JSON          (−49.4%)               181,141 tokens
   ├─ vs JSON compact  (−28.7%)               128,480 tokens
   ├─ vs TOON          (−40.5%)               154,032 tokens
   ├─ vs YAML          (−41.0%)               155,346 tokens
   └─ vs XML           (−55.5%)               205,796 tokens

🧩 Deeply nested configuration  ┊  Tabular: 0%
   │
   slimjson            ████████████░░░░░░░░       547 tokens
   ├─ vs JSON          (−39.6%)                   905 tokens
   ├─ vs JSON compact  (−0.9%)                    552 tokens
   ├─ vs TOON          (−11.5%)                   618 tokens
   ├─ vs YAML          (−17.4%)                   662 tokens
   └─ vs XML           (−45.1%)                   997 tokens

──────────────────────────────────── Total ────────────────────────────────────
   slimjson            █████████░░░░░░░░░░░   138,410 tokens
   ├─ vs JSON          (−52.5%)               291,620 tokens
   ├─ vs JSON compact  (−30.3%)               198,560 tokens
   ├─ vs TOON          (−39.3%)               227,896 tokens
   ├─ vs YAML          (−42.7%)               241,459 tokens
   └─ vs XML           (−58.1%)               330,065 tokens
```

#### Flat-Only Track

Datasets with flat tabular structures where CSV is applicable.

```
👥 Uniform employee records  ┊  Tabular: 100%
   │
   CSV                 ████████████████████    47,137 tokens
   slimjson            ████████████████████    47,067 tokens   (-0.1% vs CSV)
   ├─ vs JSON          (−63.0%)               127,050 tokens
   ├─ vs JSON compact  (−40.5%)                79,046 tokens
   ├─ vs TOON          (−5.8%)                 49,966 tokens
   ├─ vs YAML          (−52.9%)               100,033 tokens
   └─ vs XML           (−67.9%)               146,596 tokens

📈 Time-series analytics data  ┊  Tabular: 100%
   │
   CSV                 ███████████████████░     8,392 tokens
   slimjson            ████████████████████     8,767 tokens   (+4.5% vs CSV)
   ├─ vs JSON          (−60.6%)                22,254 tokens
   ├─ vs JSON compact  (−38.3%)                14,220 tokens
   ├─ vs TOON          (−3.9%)                  9,124 tokens
   ├─ vs YAML          (−50.9%)                17,867 tokens
   └─ vs XML           (−67.1%)                26,625 tokens

⭐ Top 100 GitHub repositories  ┊  Tabular: 100%
   │
   CSV                 ████████████████████     8,512 tokens
   slimjson            ████████████████████     8,550 tokens   (+0.4% vs CSV)
   ├─ vs JSON          (−43.5%)                15,144 tokens
   ├─ vs JSON compact  (−25.4%)                11,454 tokens
   ├─ vs TOON          (−2.2%)                  8,744 tokens
   ├─ vs YAML          (−34.9%)                13,128 tokens
   └─ vs XML           (−50.0%)                17,095 tokens

──────────────────────────────────── Total ────────────────────────────────────
   CSV                 ████████████████████    64,041 tokens
   slimjson            ████████████████████    64,384 tokens   (+0.5% vs CSV)
   ├─ vs JSON          (−60.8%)               164,448 tokens
   ├─ vs JSON compact  (−38.5%)               104,720 tokens
   ├─ vs TOON          (−5.1%)                 67,834 tokens
   ├─ vs YAML          (−50.9%)               131,028 tokens
   └─ vs XML           (−66.2%)               190,316 tokens
```

<details>
<summary><strong>Show detailed examples</strong></summary>

#### 📈 Time-series analytics data

**Savings:** 13,487 tokens (60.6% reduction vs JSON)

**slimjson** (8,767 tokens):

```
{keys:[{metrics:[date,views,clicks,conversions,revenue,bounceRate]}],rows:[[[["2025-01-01",4369,278,22,2108.75,0.48],["2025-01-02",5958,193,27,7353.88,0.61],["2025-01-03",6958,349,43,5512.87,0.41],["2025-01-04",5020,299,36,7186.2,0.42],["2025-01-05",4158,110,15,3849.04,0.35]]]]}
```

**JSON** (22,254 tokens):

```json
{
  "metrics": [
    {
      "date": "2025-01-01",
      "views": 4369,
      "clicks": 278,
      "conversions": 22,
      "revenue": 2108.75,
      "bounceRate": 0.48
    },
    {
      "date": "2025-01-02",
      "views": 5958,
      "clicks": 193,
      "conversions": 27,
      "revenue": 7353.88,
      "bounceRate": 0.61
    },
    {
      "date": "2025-01-03",
      "views": 6958,
      "clicks": 349,
      "conversions": 43,
      "revenue": 5512.87,
      "bounceRate": 0.41
    },
    {
      "date": "2025-01-04",
      "views": 5020,
      "clicks": 299,
      "conversions": 36,
      "revenue": 7186.2,
      "bounceRate": 0.42
    },
    {
      "date": "2025-01-05",
      "views": 4158,
      "clicks": 110,
      "conversions": 15,
      "revenue": 3849.04,
      "bounceRate": 0.35
    }
  ]
}
```

---

#### ⭐ Top 100 GitHub repositories

**Savings:** 6,594 tokens (43.5% reduction vs JSON)

**slimjson** (8,550 tokens):

```
{keys:[{repositories:[id,name,repo,description,createdAt,updatedAt,pushedAt,stars,watchers,forks,defaultBranch]}],rows:[[[[28457823,freeCodeCamp,freeCodeCamp/freeCodeCamp,"freeCodeCamp.org's open-source codebase and curriculum. Learn math, programming,…","2014-12-24T17:49:19Z","2025-10-28T11:58:08Z","2025-10-28T10:17:16Z",430886,8583,42146,main],[132750724,build-your-own-x,codecrafters-io/build-your-own-x,"Master programming by recreating your favorite technologies from scratch.","2018-05-09T12:03:18Z","2025-10-28T12:37:11Z","2025-10-10T18:45:01Z",430877,6332,40453,master],[21737465,awesome,sindresorhus/awesome,"😎 Awesome lists about all kinds of interesting topics","2014-07-11T13:42:37Z","2025-10-28T12:40:21Z","2025-10-27T17:57:31Z",410052,8017,32029,main]]]]}
```

**JSON** (15,144 tokens):

```json
{
  "repositories": [
    {
      "id": 28457823,
      "name": "freeCodeCamp",
      "repo": "freeCodeCamp/freeCodeCamp",
      "description": "freeCodeCamp.org's open-source codebase and curriculum. Learn math, programming,…",
      "createdAt": "2014-12-24T17:49:19Z",
      "updatedAt": "2025-10-28T11:58:08Z",
      "pushedAt": "2025-10-28T10:17:16Z",
      "stars": 430886,
      "watchers": 8583,
      "forks": 42146,
      "defaultBranch": "main"
    },
    {
      "id": 132750724,
      "name": "build-your-own-x",
      "repo": "codecrafters-io/build-your-own-x",
      "description": "Master programming by recreating your favorite technologies from scratch.",
      "createdAt": "2018-05-09T12:03:18Z",
      "updatedAt": "2025-10-28T12:37:11Z",
      "pushedAt": "2025-10-10T18:45:01Z",
      "stars": 430877,
      "watchers": 6332,
      "forks": 40453,
      "defaultBranch": "master"
    },
    {
      "id": 21737465,
      "name": "awesome",
      "repo": "sindresorhus/awesome",
      "description": "😎 Awesome lists about all kinds of interesting topics",
      "createdAt": "2014-07-11T13:42:37Z",
      "updatedAt": "2025-10-28T12:40:21Z",
      "pushedAt": "2025-10-27T17:57:31Z",
      "stars": 410052,
      "watchers": 8017,
      "forks": 32029,
      "defaultBranch": "main"
    }
  ]
}
```

</details>
