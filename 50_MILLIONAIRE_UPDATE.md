# 50 Millionaire — Implementation Update

## Purpose

This package updates the existing ₹50 Challenge / Gauntlet implementation to the user-facing name **50 Millionaire** and adds a new 180-question easy-tier seed bank.

## Non-negotiable difficulty mapping

| Level | Allowed difficulty |
|---|---|
| 1 | `VERY_VERY_EASY` only |
| 2 | `VERY_EASY` only |
| 3 | `EASY` only |
| 4–15 | `MEDIUM` or `HARD` only |

Do not use the old rule that allowed generic `EASY` through Level 5.

## 180-question seed

`02_seed_50_millionaire_180_easy.sql` contains exactly 180 new rows:

- Level 1: 60 `VERY_VERY_EASY`
- Level 2: 60 `VERY_EASY`
- Level 3: 60 `EASY`
- 10 questions per color per level
- Six colors: RED, BLUE, GREEN, YELLOW, PINK, VIOLET
- Categories include Mathematics, Logical Reasoning, Aptitude, General Knowledge, Puzzles and Pattern Recognition.

The questions are designed to be straightforward but not deliberately childish. They still require reading, calculation, comparison or a small reasoning step.

## Import status

All 180 seed rows are intentionally:

- `active = false`
- `verification_status = NEEDS_HUMAN_REVIEW`

Do not make money-event questions live without review.

## Existing bank

Do not delete the existing medium/hard bank.

Do not assume `Q1001–Q1180` are the new 180 rows. The new package uses a distinct prefix:

`MME180_001` through `MME180_180`

## Backend enforcement

The server must enforce the level-to-difficulty mapping.

For a requested level and wheel color:

1. Validate the game session.
2. Determine the server-authoritative level.
3. Validate the selected wheel color.
4. Apply the exact difficulty filter for that level.
5. Filter `active = true` and verified questions.
6. Exclude questions already used in the session.
7. Randomly select one eligible question server-side.
8. Return only the active question and safe option data.
9. Keep `correct_option` server-side.
10. Validate the final answer server-side.

The frontend must never be trusted to choose the difficulty.

## Question quality

Before activation, check:

- exactly one correct option
- plausible distractors
- no answer clue in wording
- hint does not reveal the answer
- 50:50 can remove two clearly wrong options
- no ambiguous interpretation
- no external lookup required
- no duplicate or near-duplicate question
- level difficulty feels appropriate
