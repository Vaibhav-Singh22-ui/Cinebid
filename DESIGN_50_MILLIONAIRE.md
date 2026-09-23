# 50 Millionaire — Design Guardrails

Keep the existing implementation's visual language unless a change is required by this update.

## Desired feeling

- premium
- cinematic
- tense
- fast
- game-show-like
- arcade-like
- intelligent, not childish

## Avoid

- generic SaaS dashboard styling
- generic AI purple/blue gradients
- casino styling
- childish quiz visuals
- excessive cards
- unnecessary scrolling
- large explanatory paragraphs during gameplay

## Gameplay hierarchy

1. Level / current reward
2. Wheel or question state
3. Timer
4. Question
5. Options
6. Lifelines
7. Primary action

## Wheel

The wheel remains a major interaction:

- repeated six-color segments
- fixed pointer
- acceleration
- rapid spin
- deceleration
- convincing stop
- clear selected-color reveal

Wheel animation chooses the color visually. It must not reveal or select a question client-side.

## Desktop target

Primary targets:

- 1366×768
- 1440×900
- 1920×1080

Gameplay should fit without unnecessary page scrolling.

## Copy

Keep player copy short:

`READY?`
`LEVEL 1`
`SPIN`
`60 SEC`
`HINT`
`50:50`
`CORRECT!`
`WRONG!`
`TIME'S UP!`
`₹10`
`AT RISK`
`GAME OVER`
`CHALLENGE COMPLETE`
