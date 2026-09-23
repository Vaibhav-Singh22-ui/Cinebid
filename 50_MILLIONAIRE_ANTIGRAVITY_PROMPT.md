# Antigravity Implementation Prompt — 50 Millionaire

You are modifying an existing production-oriented physical-event game. Do NOT rebuild it from scratch.

## Read these files first

Read all of these before changing code:

1. `README_50_MILLIONAIRE_PACKAGE.md`
2. `50_MILLIONAIRE_UPDATE.md`
3. `GAME_RULES_50_MILLIONAIRE.md`
4. `DESIGN_50_MILLIONAIRE.md`
5. `PRD.md`
6. `QUESTION_BANK_GUIDE.md`
7. `QUESTION_BANK_README.md`
8. `supabase_questions_schema.sql`
9. `ANTIGRAVITY_MASTER_PROMPT.md`

## Primary task

Update the existing game everywhere user-facing from **Gauntlet / ₹50 Challenge** to **50 Millionaire**.

Preserve the existing framework, architecture, visual system, wheel, 15 levels, rewards, timer, lifelines, operator workflow and existing medium/hard questions.

## Question difficulty rules

Implement these exact server-side rules:

- Level 1: `VERY_VERY_EASY` only.
- Level 2: `VERY_EASY` only.
- Level 3: `EASY` only.
- Levels 4–15: `MEDIUM` or `HARD` only.

Do not rely on the frontend for this.

## Database

1. Run/implement `01_migrate_difficulty.sql`.
2. The difficulty constraint must allow:
   - `VERY_VERY_EASY`
   - `VERY_EASY`
   - `EASY`
   - `MEDIUM`
   - `HARD`
3. Preserve all existing medium/hard questions.
4. Do not delete the existing 1,000-question bank.
5. Import `02_seed_50_millionaire_180_easy.sql`.
6. The new IDs are `MME180_001` through `MME180_180`.
7. Verify exactly 180 new rows.
8. Keep new rows inactive and NEEDS_HUMAN_REVIEW until content review.

## Selection logic

When the wheel returns a color:

`server-authoritative level + selected color + allowed difficulty + active/verified + unused session questions`

Then randomly select one question on the server.

Do not send the entire color pool to the browser.

Do not allow the client to choose an arbitrary question ID as authority.

## Security

The client must never be trusted for:

- current level
- current reward
- correct answer
- difficulty eligibility
- lifeline availability
- timeout state
- game completion
- active question identity

Keep correct answers server-side until answer validation.

## Session uniqueness

Exclude every question already used in the current game session.

If a color pool is exhausted, handle it safely instead of repeating a question.

## Existing gameplay to preserve

- 15 levels.
- Rewards ₹10 through ₹150.
- 60-second question timer.
- Wheel animation before the question.
- Wheel time does not consume question time.
- One Hint per game.
- One 50:50 per game.
- Wrong/timeout = ₹0 and Game Over.
- Answer becomes final immediately.
- Level 15 correct completes the game for ₹150.
- Operator can reset/start the next player without refreshing.

## UI

Keep the existing design. Do not turn the player experience into a generic quiz or dashboard.

Use the new name **50 Millionaire** everywhere user-facing.

Keep the game-show/cinematic feel and existing wheel interaction.

## Required implementation workflow

PLAN → IMPLEMENT → MIGRATE → SEED → TEST → INSPECT UI → FIX → TEST AGAIN.

Before declaring complete, report:

1. Files changed.
2. Migration applied.
3. Number of new questions inserted.
4. Counts by level/difficulty/color.
5. Exact backend selection query/filter.
6. Confirmation that existing medium/hard questions remain.
7. Confirmation that correct answers are server-side.
8. Tests executed and results.
9. Any questions that remain NEEDS_HUMAN_REVIEW.
10. Any remaining old "Gauntlet" or "₹50 Challenge" user-facing references.

Do not mark the task complete merely because the project compiles.
