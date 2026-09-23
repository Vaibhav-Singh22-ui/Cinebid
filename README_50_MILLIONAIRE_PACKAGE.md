# 50 Millionaire — Antigravity Implementation Package

## Start here

Give Antigravity the files in this folder and use `50_MILLIONAIRE_ANTIGRAVITY_PROMPT.md` as the implementation instruction.

## Important files

1. `50_MILLIONAIRE_ANTIGRAVITY_PROMPT.md` — main implementation prompt.
2. `50_MILLIONAIRE_UPDATE.md` — exact requested update.
3. `GAME_RULES_50_MILLIONAIRE.md` — locked gameplay/difficulty rules.
4. `DESIGN_50_MILLIONAIRE.md` — UI guardrails.
5. `01_migrate_difficulty.sql` — adds the three new difficulty values.
6. `02_seed_50_millionaire_180_easy.sql` — inserts exactly 180 new questions.
7. `PRD.md` — existing product requirements.
8. `QUESTION_BANK_GUIDE.md` — existing question-bank rules.
9. `QUESTION_BANK_README.md` — existing bank/import notes.
10. `supabase_questions_schema.sql` — existing schema baseline.
11. `ANTIGRAVITY_MASTER_PROMPT.md` — existing master development prompt.

## Correct order

1. Back up the database.
2. Inspect the existing repository and question table.
3. Run `01_migrate_difficulty.sql`.
4. Run `02_seed_50_millionaire_180_easy.sql`.
5. Verify the 180 rows.
6. Keep them inactive until reviewed.
7. Implement server-side level/difficulty filtering.
8. Rename user-facing Gauntlet/₹50 Challenge references to 50 Millionaire.
9. Run the required tests.

## Expected new rows

`MME180_001` … `MME180_180`

The seed intentionally does not delete existing questions.
