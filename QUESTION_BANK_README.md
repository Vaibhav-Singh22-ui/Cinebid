# 1000 Question Bank

This package contains 1,000 structured questions for ₹50 Challenge.

## Important status
These are **ORIGINAL GENERATED SEED QUESTIONS**, not a claim that they have been externally researched or independently human-verified. All records are imported with:
- `verification_status = NEEDS_HUMAN_REVIEW`
- `active = false`

They must be independently checked before being used in a live money/reward event.

## Files
- `questions_master_1000.csv` — editable spreadsheet-friendly master.
- `questions_master_1000.json` — programmatic import format.
- `import_questions_1000.sql` — Supabase SQL import.
- `supabase_questions_schema.sql` — table/index/RLS baseline.
- `QUESTION_BANK_README.md` — this guide.

## Distribution
Difficulty counts:
{'EASY': 1, 'MEDIUM': 49, 'HARD': 950}

Levels:
{1: 72, 2: 70, 3: 70, 4: 70, 5: 70, 6: 69, 7: 69, 8: 69, 9: 63, 10: 63, 11: 63, 12: 63, 13: 63, 14: 63, 15: 63}

Colors:
{'RED': 169, 'BLUE': 167, 'GREEN': 166, 'YELLOW': 166, 'PINK': 166, 'VIOLET': 166}

## Recommended import behavior
Antigravity should:
1. Apply schema/migrations.
2. Validate the JSON/CSV.
3. Detect duplicates and malformed rows.
4. Import with `active=false`.
5. Keep `correct_option` server-side.
6. Never expose the full table to player clients.
7. Activate only after verification.

## Future banks
Future files should preserve the same column schema and unique `external_id` convention, e.g. `Q1001`, `Q1002`, ...
