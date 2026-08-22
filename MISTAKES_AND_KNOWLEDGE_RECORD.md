# Cinebid & IPL Mega Auction Hub: Mistakes, Fixes & Knowledge Record

This document records the mistakes made during development, root causes, exact architectural fixes, and strict rules to follow so they are never repeated.

---

## 1. Cricketer Portrait Mapping & Image Duplications

### The Mistake
- Ruturaj Gaikwad and Abhishek Sharma were sharing the same portrait (Ruturaj's picture).
- Yashasvi Jaiswal and Rinku Singh were sharing the same portrait.
- Several modern IPL stars had fallback or duplicate image URLs.

### Root Cause
- International players have extensive Wikimedia Commons galleries, but newer domestic IPL stars often lack standard infobox Commons images. Without direct validation, generic fallbacks mapped multiple players to the same seed.

### Permanent Fix & Rule
- Every cricketer (all 58 in the dataset) **must have an individual, unique, verified photo URL** in `src/lib/cricket-portraits.ts`.
- **Senior / International Players**: Verified Wikimedia Commons CC-BY-SA / CC0 high-res portraits with `referrerPolicy="no-referrer"`.
- **Young / IPL Stars**: Verified direct player headshots from the public Cricbuzz media CDN (`https://static.cricbuzz.com/a/img/v1/152x152/i1/...`).
- Verified distinct IDs:
  - `Abhishek Sharma`: `https://static.cricbuzz.com/a/img/v1/152x152/i1/c352467/abhishek-sharma.jpg`
  - `Ruturaj Gaikwad`: `https://upload.wikimedia.org/wikipedia/commons/2/27/Ruturaj_Gaikwad.jpeg`
  - `Rinku Singh`: `https://static.cricbuzz.com/a/img/v1/152x152/i1/c352495/rinku-singh.jpg`
  - `Yashasvi Jaiswal`: `https://upload.wikimedia.org/wikipedia/commons/7/71/Yashasvi_Jaiswal_in_PMO_New_Delhi.jpg`
  - `Heinrich Klaasen`: `https://static.cricbuzz.com/a/img/v1/152x152/i1/c244978/heinrich-klaasen.jpg`
  - `Nicholas Pooran`: `https://static.cricbuzz.com/a/img/v1/152x152/i1/c244833/nicholas-pooran.jpg`
  - `Dhruv Jurel`: `https://static.cricbuzz.com/a/img/v1/152x152/i1/c352482/dhruv-jurel.jpg`
  - `Matheesha Pathirana`: `https://static.cricbuzz.com/a/img/v1/152x152/i1/c352511/matheesha-pathirana.jpg`
  - `Harshit Rana`: `https://static.cricbuzz.com/a/img/v1/152x152/i1/c352497/harshit-rana.jpg`
  - `Mayank Yadav`: `https://static.cricbuzz.com/a/img/v1/152x152/i1/c382903/mayank-yadav.jpg`
  - `Varun Chakravarthy`: `https://static.cricbuzz.com/a/img/v1/152x152/i1/c352499/varun-chakravarthy.jpg`
  - `Ravi Bishnoi`: `https://static.cricbuzz.com/a/img/v1/152x152/i1/c352486/ravi-bishnoi.jpg`
  - `Noor Ahmad`: `https://static.cricbuzz.com/a/img/v1/152x152/i1/c244855/noor-ahmad.jpg`

---

## 2. Overseas / Foreign Player Quota Rules

### The Mistake
- Enforced a max limit of 4 overseas players during the live auction bidding, preventing franchises from buying 5, 6, or 7 overseas players into their squad.

### The Rule & Fix
- **Auction Squad Quota**: Franchises can buy **up to 7 overseas players** into their 12–18 squad (`MAX_OVERSEAS_PER_SQUAD = 7`).
- **Match Lineup Quota**: Franchises can only select and field **at most 4 overseas players** in their starting **Playing 11** (`MAX_OVERSEAS_IN_PLAYING_11 = 4`).
- **Enforcement Points**:
  - `src/lib/cricket-data.ts`: Exported constants `MAX_OVERSEAS_PER_SQUAD = 7` and `MAX_OVERSEAS_IN_PLAYING_11 = 4`.
  - `src/lib/game-manager.ts`: `placeBid` checks `myOverseasCount >= 7` during auction.
  - `src/lib/ai-evaluation.ts`: Playing 11 validation verifies `selectedOverseasCount <= 4`.
  - `src/components/game-screens.tsx` & `src/components/game-ui.tsx`: UI pills show `✈️ X/7 OS` in squad and `✈️ X/4 in 11` in Playing 11 selector.

---

## 3. Create Page Card Centering vs. CSS Grid Conflict

### The Mistake
- In `/create` and `/join`, the configuration card was pushed to the left corner on desktop viewports.

### Root Cause
- In `src/styles.css`, `.form-layout` had `@apply ... lg:grid-cols-2;`. Since only 1 form card existed in the container, CSS grid placed it exclusively in Column 1 (left side) rather than centering it in the viewport.

### Permanent Fix & Rule
- In `src/styles.css`:
  ```css
  .form-layout {
    @apply mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl flex-col items-center justify-center gap-8 px-4 py-8 sm:py-14;
  }
  ```
- In `src/components/game-screens.tsx`:
  - Main container uses `flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-65px)] w-full my-auto`.
  - Card wrapper uses `w-full max-w-2xl mx-auto flex flex-col items-center justify-center my-auto`.

---

## 4. Live War-Room Chat Desktop Spacing

### The Mistake
- Live war-room chat in `AuctionScreen` was constrained to a small height on desktop screens due to hardcoded max heights (`max-h-[500px]`, `min-h-[380px]`), leaving empty dead space on large screens.

### Permanent Fix & Rule
- In `src/components/room-chat.tsx`:
  - Root container: `flex flex-col flex-1 h-full min-h-[460px] lg:min-h-[520px] bg-panel/95 border border-border/80 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-md`.
  - Message scroll container: `flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1.5 min-h-[260px] h-full` (no artificial max-height cap).
  - Clean header, quick reaction emoji row, and compose input with keyboard submission and Supabase realtime broadcast.
- In `AuctionScreen`:
  - Right column takes `lg:col-span-12 xl:col-span-4 flex flex-col gap-4 h-full flex-1`.
  - Chat element uses `className="flex-1 min-h-[480px] xl:min-h-[540px]"`.

---

## 5. AI Franchise Bots Policy

### The Mistake
- Unwanted AI bot bidding automated rounds when the user expected a purely human multiplayer auction experience.

### Permanent Fix & Rule
- AI franchise bot buttons ("Add AI Franchise Bot") and bot simulation intervals (`simulateBotBid` interval loops) are completely removed from `LobbyScreen` and `AuctionScreen`.
- Rooms are created solely for human franchise participants who join with the room invitation code.

---

## 6. Live Auction Screen Compactness & Spacing

### The Mistake
- Excessive gaps and stretched vertical spacing appeared on the live bidding screen due to `justify-between`, large `min-h-[580px]`, and inflated container widths (`max-w-[1640px]`).

### Permanent Fix & Rule
- Maintain a compact, cohesive layout without artificial stretching:
  - Container: `max-w-[1440px] mx-auto px-4 sm:px-6 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-12 gap-4 xl:gap-5 items-start`.
  - Center Bidding Card: `bg-panel/90 border border-border/80 rounded-2xl p-4 sm:p-6 flex flex-col items-center text-center gap-3 shadow-xl` (avoid `justify-between` and excessive fixed `min-h`).
  - Left & Right Columns: proportioned `rounded-2xl p-4 gap-3` keeping player info, timer, bid buttons, and chat visually aligned and snug.

---

## Summary Checklist for Future Work
- [x] All 58 cricketers have distinct, verified photo URLs.
- [x] Overseas limits: up to 7 in squad, max 4 in Playing 11.
- [x] Create/Join page card is centered horizontally and vertically.
- [x] Live auction page layout is tight and compact with natural spacing.
- [x] Live chat fits neatly in the right column with responsive height.
- [x] AI franchise bots removed from lobbies and live bidding.
