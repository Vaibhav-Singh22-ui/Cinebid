# Antigravity Master Development Instruction — ₹50 Challenge

You are building a real production-oriented physical-event game called ₹50 Challenge.

## Non-negotiable product facts

Read these files first:
- PRD.md
- GAME_RULES.md
- TRD.md
- DESIGN.md
- QUESTION_BANK_GUIDE.md

They are the source of truth.

Do not start by generating a superficial landing page or static quiz demo.

## Stack

Use:
- Next.js
- React
- TypeScript
- Supabase PostgreSQL
- Supabase Auth
- Supabase MCP during development
- Vercel deployment

## Core experience

The player:
1. Pays ₹50 manually to an operator.
2. Starts a game.
3. Enters Level 1.
4. Watches a physical-feeling color wheel spin.
5. Wheel stops on a color.
6. Server selects one random eligible question from that level + color pool.
7. Player gets 60 seconds.
8. Player can use one Hint or one 50:50 for the entire game.
9. Answer is final immediately.
10. Correct answer allows the player to risk the current reward and continue.
11. Wrong answer or timeout gives ₹0 and Game Over.
12. Level 15 correct answer completes the game at ₹150.

## Security

Never ship the full question bank to the client.

Never expose future questions.

Never trust the client for:
- correct answers
- current reward
- current level
- lifeline availability
- question validity
- answer timing
- game completion

Validate important transitions server-side.

## Development loop

For every major feature:

PLAN
→ IMPLEMENT
→ RUN
→ TEST
→ INSPECT ACTUAL UI
→ FIND PROBLEMS
→ FIX
→ RUN AGAIN
→ TEST AGAIN

Do not stop because the code compiles.

## Visual quality

The game must feel:
- cinematic
- premium
- tense
- fast
- fun
- game-show-like
- arcade-like

Avoid:
- generic SaaS
- purple/blue AI gradients
- dashboard-style player UI
- excessive text
- childish design
- casino aesthetics

## Wheel

The wheel is a major interaction.

It must:
- contain repeated color segments
- have a fixed pointer
- accelerate
- spin rapidly
- decelerate
- tick as segments pass
- stop convincingly
- clearly reveal the selected color

The selected color is used by the server to select a random question from the matching pool.

## Question bank

The system must support 1,000+ questions and scale further.

Questions must be:
- verified
- original/adapted legally
- categorized
- difficulty classified
- level assigned
- color assigned
- hint-enabled
- 50:50 compatible

Do not generate a huge unverified bank just to fill the database.

## Operator

Build secure operator access.

Operator functionality:
- start new player
- reset/finish game
- manage questions
- add question
- edit question
- disable question
- search/filter
- inspect usage

Do not expose operator controls to normal players.

## Player UX

Gameplay should require little reading.

Prefer:
- large visual elements
- short copy
- obvious buttons
- strong animation
- clear timer
- clear reward
- clear risk

No unnecessary scrolling.

## Audio

Use legally usable sound effects.

Include:
- wheel
- click
- correct
- wrong/fail
- timer urgency
- timeout
- reward
- victory

Audio must have a visible toggle and never block gameplay.

## Quality bar

The final result must be a real working event game, not a mockup.

Test complete flows:
- normal Level 1 → Level 15
- wrong answer
- timeout
- Hint
- 50:50
- both lifelines
- repeated clicking
- refresh/reconnect
- question pool exhaustion
- disabled questions
- unauthorized routes
- multiple game sessions
- large question bank
- operator question editing
- reward correctness

Do not mark the project complete until the complete flow works reliably.
