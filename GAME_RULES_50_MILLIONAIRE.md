# 50 Millionaire — Locked Game Rules Override

This file overrides only the conflicting naming and difficulty rules in older documents.

## Product name

User-facing product/game name: **50 Millionaire**.

Do not show "Gauntlet" or "₹50 Challenge" in player-facing UI after this update unless an operator/admin migration note explicitly requires the old name.

## Game

- 15 levels.
- Rewards remain ₹10, ₹20, ... ₹150.
- One question per level.
- Wheel selects a color.
- Server selects a random question from the matching level + color pool.
- 60 seconds begins when the question becomes active.
- Wheel animation time does not consume question time.
- One Hint and one 50:50 per game.
- Wrong answer or timeout = ₹0 and Game Over.
- Answer is final after selection.
- Level 15 correct = ₹150.

## Difficulty

- Level 1 → `VERY_VERY_EASY`
- Level 2 → `VERY_EASY`
- Level 3 → `EASY`
- Levels 4–15 → `MEDIUM` or `HARD` only.

These filters must be enforced server-side.

## Question security

- Never send the complete question bank to the browser.
- Never send future questions.
- Never send the correct answer for future questions.
- Do not accept an arbitrary question ID from the client as authority.
- The server owns session level, active question, answer validation, lifeline state and reward state.

## Session uniqueness

A question already used in a game session cannot be selected again in that same session.

## Lifelines

Hint gives a small directional clue only.

50:50 removes exactly two incorrect options.

Neither lifeline is replenished during the same game.
