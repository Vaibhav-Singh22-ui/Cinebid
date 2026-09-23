# ₹50 Challenge — Question Bank Specification

## 1. Purpose

Create and maintain a large, verified, original question bank for the game.

Target:
- Minimum initial target: 1,000 questions
- Architecture should support several thousand and beyond

Questions must be generated/adapted from researched concepts and independently verified. Do not bulk-copy copyrighted question banks.

## 2. Difficulty Distribution

Target distribution:
- Approximately 95% Hard/Extreme
- Approximately 4.9% Medium
- Approximately 0.1% Easy

These are targets and may be tuned after real-player testing.

### Easy

Only Levels 1–5.

Easy questions should still take meaningful thought and should not be trivial.

### Medium

Mostly Levels 1–10, with placement determined by testing.

A medium question may be solvable around the time limit by a strong participant but should require meaningful reasoning.

### Hard/Extreme

Dominant category.

Questions should often be difficult to complete correctly within 60 seconds unless the player finds the key insight or is unusually strong.

Never use impossible, ambiguous or intentionally broken questions.

## 3. Level Rules

- Level 1–5 may contain the tiny easy-question allowance.
- Level 6–15: no Easy classification.
- Higher levels should trend toward harder multi-step reasoning.
- Level does not have to equal category difficulty.
- Every question must be explicitly tested and classified.

## 4. Categories

Supported:
- Mathematics
- Logical reasoning
- Puzzles
- Aptitude
- General knowledge
- Visual/picture puzzles
- Pattern recognition

Avoid over-concentration in any one category.

## 5. Research Process

Use online sources to research:
- question archetypes
- competition styles
- reasoning techniques
- difficulty characteristics
- common traps
- expected solution methods

Useful inspiration areas include:
- CAT/DILR
- placement aptitude
- competitive reasoning
- mathematical puzzles
- non-verbal reasoning
- matrix reasoning
- pattern-recognition assessments
- logical deduction problems
- difficult GK reasoning

Do not copy source wording wholesale.

For every researched question:
1. Understand the underlying problem.
2. Rewrite/create an original version.
3. Independently solve it.
4. Verify all options.
5. Verify exactly one correct answer.
6. Check for ambiguity.
7. Estimate solving time.
8. Human-test where possible.
9. Assign difficulty.
10. Assign level and color.

## 6. Required Question Fields

Each question should have:

- id
- question_text
- option_a
- option_b
- option_c
- option_d
- correct_option
- hint_text
- level
- color
- category
- difficulty
- expected_solve_seconds
- verification_status
- active
- source_notes/internal_reference
- created_at
- updated_at

## 7. Hint Rules

Hint must:
- be extremely small
- provide direction, not solution
- not reveal the answer
- not remove options
- not contain the final numeric result
- not contain a near-complete solving method

Example style:
Bad: "Multiply 24 by 5 to get 120."
Good: "Look at how the two quantities change together."

## 8. 50:50 Rules

For every question, there must be at least two clearly incorrect options.

50:50 removes two incorrect choices.

Avoid questions where:
- one option is obviously longer
- one option is formatted differently
- one option is the only plausible one
- elimination is trivial

## 9. Question Quality Checks

Reject if:
- more than one answer is defensible
- answer key is uncertain
- wording is ambiguous
- calculation depends on unstated assumptions
- typo changes meaning
- image is unclear
- question is too trivial for assigned level
- question is impossible within reasonable human reasoning
- answer can be found through obvious option pattern
- external lookup is required during gameplay

## 10. Visual Questions

Visual/picture questions require:
- original or properly licensed visual assets
- clear rendering
- no copyright-dependent images
- alt/internal description
- verified single answer
- mobile/laptop readability

## 11. Randomization

Question selection:
- filter by level
- filter by selected color
- filter active/verified questions
- exclude questions already used in session
- randomize server-side

## 12. Color Mapping

Each level has six color pools:
- Red
- Blue
- Green
- Yellow
- Pink
- Violet

The wheel has repeated segments mapped cyclically to these colors.

A color pool can contain many questions.

Example:
Level 8 + Red = 75 active questions.

Wheel lands Red → select one random eligible question from those 75.

## 13. Duplicate Detection

Detect:
- exact duplicate text
- near-duplicate wording
- same underlying puzzle with superficial number changes
- same answer pattern
- repeated visual structure

The bank should contain genuinely varied challenges.

## 14. Testing

Before activation:
- automated answer verification where possible
- human review
- difficulty review
- hint review
- 50:50 review

After deployment:
Track:
- selection count
- failure rate
- average remaining time
- lifeline usage
- repeated complaints
- operator disable actions

A question can later be reclassified or disabled.

## 15. Content Ethics and Licensing

Research is for inspiration and validation.

Do not copy copyrighted question banks verbatim.

Use:
- original questions
- public-domain material where appropriate
- properly licensed content
- transformed concepts with independent wording/solution

Keep internal source notes for auditability.

## 16. Generation Workflow

Generate in batches.

Recommended first batch:
- 100–200 questions
- review
- test
- tune difficulty
- then scale to 1,000+

Do not generate 1,000 questions blindly in one pass.

## 17. Difficulty Calibration

Initial classification is provisional.

Real player data should eventually recalibrate difficulty.

A question repeatedly solved in under 20 seconds should be reviewed.

A question almost universally failed despite careful reasoning should also be reviewed.

The goal is a hard but fair game.

## 18. Security

Question bank is server-side.

Never expose:
- all question text
- future questions
- correct answers for future questions

The player receives only the active question.
