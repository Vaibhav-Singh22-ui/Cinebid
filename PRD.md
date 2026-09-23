# ₹50 Challenge — Product Requirements Document

## 1. Product Vision

₹50 Challenge is a physical-event game experience where a participant pays a fixed ₹50 entry fee to an operator and plays a high-pressure, game-show-style challenge on a laptop.

The product is designed to feel like a real game rather than a conventional quiz website. The experience combines:

- Luck through a spinning color wheel
- Skill through difficult questions
- Time pressure through a 60-second timer
- Risk through an all-or-nothing reward decision
- Lifelines
- Cinematic animations
- Game-show audio
- Short, high-impact UI copy
- Operator-controlled event gameplay

The current maximum reward is ₹150 at Level 15.

## 2. Core Business Model

- Entry fee: fixed ₹50 per player.
- The ₹50 is an entry fee, not the reward pool.
- Rewards are paid separately from the business/event budget.
- The operator manually verifies and collects payment.
- No online payment system is required for the initial product.
- The game must support many players over time.
- Question content must be managed after deployment without code changes.

## 3. Target Environment

Primary use:
- College events
- Stalls
- Fests
- Competitions
- Physical entertainment events

Primary hardware:
- Laptop/desktop
- 1366x768, 1440x900 and 1920x1080 should be supported well.
- Gameplay should avoid page scrolling.

## 4. Players and Roles

### Player
Can:
- Play an active game session.
- Spin the wheel.
- Answer one question per level.
- Use one Hint and one 50:50 during the whole game.
- Make the final answer immediately.
- Choose to risk the secured reward and continue.

Cannot:
- Access the question bank.
- Access operator controls.
- Modify game settings.
- Download the full question bank.
- See future questions.

### Operator
Authorized operators can:
- Start a new player session.
- Manage questions.
- Add/edit/disable questions.
- Review game sessions and results.
- Manage event gameplay.
- Reset/start the next player without refreshing the browser.

### Admin
The system should support a future admin role with broader control than an operator.

## 5. Game Rules

### Levels

There are exactly 15 levels for the current version.

| Level | Reward |
|---:|---:|
| 1 | ₹10 |
| 2 | ₹20 |
| 3 | ₹30 |
| 4 | ₹40 |
| 5 | ₹50 |
| 6 | ₹60 |
| 7 | ₹70 |
| 8 | ₹80 |
| 9 | ₹90 |
| 10 | ₹100 |
| 11 | ₹110 |
| 12 | ₹120 |
| 13 | ₹130 |
| 14 | ₹140 |
| 15 | ₹150 |

### Progression

- One correct answer is required to clear a level.
- A player does not answer three questions per level.
- The player gets exactly one gameplay question per level.
- After a correct answer, the player may continue to the next level.
- The previous reward is fully at risk when continuing.
- If the player fails the next level, the reward becomes ₹0.
- There is no partial protection of the previous reward.
- Reaching Level 15 and answering correctly completes the challenge and awards ₹150.

### Wrong Answer

- Final answer is submitted immediately.
- Wrong answer = ₹0.
- Game Over.
- Show a short dramatic/funny failure sequence.

### Timeout

- Timer expires at 60 seconds.
- Timeout has the same result as a wrong answer.
- Reward becomes ₹0.
- Game Over.

### Answer Changes

- Once an option is selected, it is final.
- No changing the answer after selection.

## 6. Question Selection

The wheel selects a color, not a question number.

There are six recurring colors:

- Red
- Blue
- Green
- Yellow
- Pink
- Violet

Wheel segments are mapped cyclically to colors. Example:

1 Red
2 Blue
3 Green
4 Yellow
5 Pink
6 Violet
7 Red
8 Blue
9 Green
10 Yellow
11 Pink
12 Violet
13 Red
14 Blue
15 Green

The exact segment arrangement may be configurable per level.

### Two-stage selection

1. The physical-looking wheel animation stops on a color.
2. The server selects one eligible random question from that level + color question pool.

Example:

Level 8 + Red may have 70 active questions.

Wheel stops on Red → server randomly selects one of those 70.

The browser must not receive the entire pool.

## 7. Question Categories

Question banks may contain:

- Mathematics
- Logical reasoning
- Puzzles
- Aptitude
- General knowledge
- Visual/picture puzzles
- Pattern recognition

The wheel is not a category selector. All categories can exist inside every color pool where appropriate.

## 8. Difficulty Philosophy

The intended bank is heavily difficult.

Target distribution should be configurable and documented as approximately:

- ~95% hard/extreme
- ~4.9% medium
- ~0.1% easy

The percentages are targets, not a requirement to force mathematically impossible fractions.

Easy questions:
- Only permitted through Level 5.
- Must still require meaningful thought.
- Must not become trivial "giveaway" questions.

Levels 6–15 must not contain easy questions.

Hard questions should generally be difficult to solve within 60 seconds, while still allowing a strong player to occasionally solve them through insight, reasoning or efficient calculation.

The game must not deliberately use unsolvable or ambiguous questions.

## 9. Lifelines

Each player gets:

### Hint
- One use for the entire game.
- Available only after the timer has started.
- Must provide a very small clue.
- Must not reveal the answer.
- Must not eliminate the answer directly.
- Must not turn the question into a giveaway.

### 50:50
- One use for the entire game.
- Available only after the timer has started.
- Removes two incorrect options.
- Leaves two options.

A used lifeline cannot be restored during the same game.

## 10. Timer

- 60 seconds per question.
- Timer starts when the actual question becomes active.
- Wheel animation time does not count toward the 60 seconds.
- The UI should make the remaining time highly visible.
- Last 10 seconds should have stronger urgency cues.
- Audio can intensify near the end.
- Timer expiry automatically triggers timeout/game over.

## 11. Player Flow

HOME
→ Operator starts a new player
→ Level 1 intro
→ Wheel
→ Color selected
→ Server selects question
→ Question reveal
→ 60-second timer
→ Answer/lifeline
→ Correct or wrong/timeout
→ If correct: reward state
→ Risk next level
→ Level intro
→ Repeat
→ Level 15 victory
→ Reward ₹150
→ New Player / Reset

## 12. Intended Emotional Experience

The game should produce:

- Pressure
- Adrenaline
- Intelligence/skill
- Humor/meme energy
- Money excitement
- Competition
- Risk
- Arcade/game feel

The experience should feel premium, cinematic and energetic.

It should NOT feel:
- Like a school quiz
- Like a SaaS dashboard
- Like a generic AI-generated website
- Like a casino
- Childish
- Corporate
- Blog-like

## 13. UI Principles

Gameplay UI should contain only information that helps the player play:

- Level
- Current reward
- Wheel
- Question
- Timer
- Answer choices
- Lifeline controls
- Risk/continue control
- Short feedback
- Sound toggle

Avoid long paragraphs, explanations, marketing copy, testimonials, footers and unnecessary navigation during gameplay.

## 14. Audio

Sound should be optional and controlled by a visible sound toggle.

Required sound types:
- Button click
- Wheel spin
- Wheel tick
- Wheel stop
- Question reveal
- Correct
- Wrong/fail
- Timer urgency
- Timeout
- Reward/coin
- Level transition
- Final victory

Wrong-answer audio should be comedic/meme-style, but use original, licensed, royalty-free, CC0/public-domain or otherwise legally usable sounds. Do not rely on copyrighted meme recordings without permission.

## 15. Operator Experience

The operator should be able to:
- Authenticate securely.
- Start a new game.
- End/reset a game.
- Move immediately to the next player.
- Manage questions after deployment.
- Disable bad/ambiguous questions.
- Add new verified questions.
- Review game history.

No browser refresh should be required between players.

## 16. Question Security

Never ship the entire question bank to the browser.

The production flow should be:

Wheel color
→ server-side selection
→ one eligible question returned
→ player answers
→ server validates answer

The correct answer should preferably remain server-side until answer validation.

No public route should expose bulk question data.

This cannot make a currently displayed question impossible to inspect, but it prevents straightforward bulk downloading of the future question bank.

## 17. Success Criteria

A successful product should:
- Feel like a real game-show/arcade experience.
- Complete an entire 15-level game reliably.
- Handle wrong answer and timeout correctly.
- Correctly enforce all-or-nothing risk.
- Correctly enforce lifeline limits.
- Select questions from the correct level/color pool.
- Avoid repeating questions within one game session.
- Keep future questions inaccessible to the browser.
- Allow operators to manage questions after deployment.
- Work without refresh between players.
- Support 1,000+ questions and scale beyond that.
- Work reliably on target laptop resolutions.

## 18. Future Features

Potential later additions:
- Multiple events
- Multiple operators
- Event-specific question pools
- Advanced analytics
- Question performance statistics
- Difficulty calibration using real player data
- Multiple game modes
- Leaderboards, only if later desired
- Player statistics
- Event-specific branding
