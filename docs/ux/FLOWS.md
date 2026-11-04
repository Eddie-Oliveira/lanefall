# Lanefall — Screens and flows (v1.0)

Owner: ux · Status: draft for review · Rules source: `docs/design/GDD.md` v1.0 (decided) · Companion specs:
`HUD.md` (in-match), `TUTORIAL.md`, `QUICKREF.md`, `ACCESSIBILITY.md`. Unity implementation: UI Toolkit in
`unity/Assets/UI/` (later).

**Top goal (Eddie):** a MOBA veteran needed 3 matches to understand the prototype; v1 must be understood in **one match**.
Every screen below is checked against that: the player should never need to remember a rule the screen could show.

## 0. Conventions

- **Inputs.** Every control is listed as Mouse / Touch / Gamepad. Gamepad ships later; its column is here so the layout
  never depends on hover alone (hover info is always also reachable by a tap-and-hold or a focus).
- **Copy.** Plain words from the player's side ("your turn", "you", "allies", "enemies"). MOBA words are used where they
  help veterans and are always followed by what they mean here, e.g. "Last hit (Attack the enemy wave = +1 gold)".
  Full copy rules: section 9.
- **Team names.** Azure and Ember, always written next to the team color and the team pattern (ACCESSIBILITY.md).
  Inside a match the HUD says **You / Ally / Enemy** first and the team name second.
- **Screen IDs** (S01…) are used by CODE/NET for state names.
- **Back / cancel** is always top-left (Esc / system back / B button). Nothing destructive happens on back without a
  confirm.

### What we keep and fix from the web prototype (`prototype-web/src/ui.js`)
| Prototype | Problem seen | v1 fix |
|---|---|---|
| HUD chips: round, kills, "Overtime at 25" | Kills are not the score; no VP, no round limit, overtime is gone in v1.0 | VP bar with target and "Round 4 of 12" (HUD.md 2) |
| Click an enemy = attack at once | No damage preview before committing; misclicks cost the turn | Aim → preview → confirm (HUD.md 5) |
| Disabled ability buttons, reason only in a toast after a click | Player can't see *why* | Every disabled control states the reason inline ("Ready next round", "No line of sight") |
| Status chips "Stunned 1", "Rooted 1" | "1" what? rounds? turns? | Plain sentences: "Stunned: skips its next turn" (HUD.md 4) |
| Rules modal = 10 text sections, v0.3 rules | Wall of text, nobody reads it mid-match | One-screen quick reference with this match's numbers (QUICKREF.md) |
| Tooltips hidden on touch (`pointerType === 'touch'`) | Phone players get no info at all | Tap-and-hold = tooltip on every element; info panel for the selected unit |
| Space = end turn | Easy to end a turn by accident | End turn = button, or hold Space 0.5 s; confirm if actions are left (first 5 matches) |
| Emoji hero icons, team shown by text color only | Not readable for colorblind players | Portraits + team pattern + label (ACCESSIBILITY.md) |
| "easy" tag list differed from the GDD (Pyra marked easy) | Wrong advice to new players | ★ difficulty from GDD 10.1 only (Easy: Bulwark, Blademaster, Ravager, Frostbow, Lumen) |
| Shop: 4 tiers, selling, 6 slots | v0.3 rules | 3 slots, Basic 3 / Upgrade 7 (4), 3 recommended items first (section 7) |
| Results: K/D/A table | Doesn't explain *why* a team won | VP timeline by source + "how it ended" line (section 9) |
| Lobby and draft share one screen id | Back-button confusion | Separate screens with explicit back targets |

---

## 1. Flow map

```
                         ┌───────────────────────────────┐
  first launch ───────▶  │ S01 Title                     │ ◀──────────────────────────────┐
  (offers tutorial)      └──┬──────┬──────┬──────┬───────┘                                │
                            │      │      │      │                                        │
             Tutorial ◀─────┘      │      │      └────▶ S05 How to play (quick ref,       │
             (S02 hero choice)     │      │              glossary, controls) / S06 Settings│
                 │                 │      │                                               │
                 │        Play (local)  Online                                            │
                 │                 │      │                                               │
                 │                 ▼      ▼                                               │
                 │      S03 Local setup   S04 Online: Host / Join code / (Quick match later)
                 │      (vs bots/hotseat)     │                                           │
                 │                 │      S04b Connecting ──fail──▶ error + retry          │
                 │                 ▼      ▼                                               │
                 │            S10 Lobby  (mode, size, map, pick mode, seats, bots, learning)
                 │                 │  host presses Start (all seats ready)                │
                 │                 ▼                                                      │
                 │            S20 Coin flip (first pick) ── 2 s, skippable               │
                 │                 ▼                                                      │
                 │            S21 Draft  (or S21r All random reveal / S21f Free pick)     │
                 │                 ▼                                                      │
                 │            S22 Team view (10 s) + round-1 start choice                 │
                 ▼                 ▼                                                      │
            S30 Loading ──────────▶ S40 Match ◀──▶ S41 Shop (in base)                      │
                                    │   ▲  ◀──▶ S42 Pause / quick ref / settings          │
                                    │   │  ◀──▶ S43 Round-start choice (trailing team)    │
                                    │   └── online overlays S50–S56 (reconnect, host left…)│
                                    ▼                                                      │
                               S60 Results ──Rematch──▶ S20 (first pick swaps, no flip)    │
                                    │  └──Change setup──▶ S10 Lobby (same room)            │
                                    └──Leave────────────────────────────────────────────────┘
```

---

## 2. S01 Title

```
┌──────────────────────────────────────────────────────────────┐
│  LANEFALL                                   [⚙ Settings]     │
│                                                              │
│   ▶ Continue tutorial        (only if a tutorial is saved)   │
│   ▶ Play                     vs bots or on this device       │
│   ▶ Online                   host or join with a code        │
│   ▶ Learn                    tutorial · quick reference ·    │
│                              "I know MOBAs" glossary         │
│                                                              │
│   (3D board idles behind, slow orbit — off with Reduce motion)│
└──────────────────────────────────────────────────────────────┘
```
- **First launch:** a card over the title: "New to Lanefall? The tutorial is one real match (about 20 min)."
  Buttons: **[Play the tutorial]** (primary) · **[I know MOBAs — show me the differences]** (opens the veteran fast
  track, TUTORIAL.md part B, then offers the tutorial with prompts only) · **[Skip]**.
- After the tutorial is done, **Play** suggests **Commander vs bot** as the next match (GDD 14).
- Gamepad: D-pad focus, A select, B back. Touch: big buttons ≥ 48 dp tall.

## 3. S03 Local setup and S04 Online

**S03 Local** goes straight to the lobby (S10) with **you** in seat 1 and bots in the rest. "Hotseat" is not a separate
mode: any seat set to **Player** is played on this device.

**S04 Online:**
```
┌──────────────────────────────────────────────┐
│ ← Online                                     │
│  Your name  [ Eddie________ ]                │
│  [ Host a room ]                             │
│  Join with code  [ _ _ _ _ _ ]  [ Join ]     │
│  (Quick match — later)                       │
└──────────────────────────────────────────────┘
```
- Codes: 5 characters, no look-alikes (prototype alphabet `ABCDEFGHJKMNPQRSTUVWXYZ23456789`), auto-uppercase, paste OK.
- **S04b Connecting:** spinner + "Connecting to room K7MPQ…" + [Cancel]. Errors in plain words:
  "No room with that code." · "That room is full." · "That match has already started." · "Can't reach the
  server. Check your connection." Each with [Try again] [Back].

## 4. S10 Lobby

Same screen for local and online; online adds the room code, the player list and ready checks.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ← Leave      MATCH SETUP                          Room  K7MPQ [Copy]    (online only)  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ MODE   (•) Team match   ( ) Commander — 2 players, 2 heroes each   ( ) 1v1 duel        │
│ SIZE   [1v1] [2v2] [3v3] [4v4]        (hidden for Commander = 2v2, Duel = 1v1)          │
│ MAP    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                                  │
│        │ The Rift    │ │ Twin Hollow │ │ Frost Bridge│   card: mini-map, lanes,         │
│        │ 3 lanes     │ │ 2 lanes     │ │ 1 lane, fast│   "Best for 2v2–4v4",            │
│        │ VP 10 · 12 r│ │ VP 10 · 12 r│ │ VP 7 · 8 r  │   VP target + rounds FOR THIS    │
│        └─────────────┘ └─────────────┘ └─────────────┘   SIZE, est. time "45–60 min"    │
│ HEROES [Draft] [Free pick] [All random]     ⓘ "Draft: one pick, then two each."        │
│ TIMERS [Learning (longer)] [Standard]       ⓘ "Learning: 90 s turns, 45 s picks."      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  AZURE ◆ (pattern)                          │  EMBER ▲ (pattern)                        │
│  Seat 1  Eddie (host)        ✓ Ready         │  Seat 1  Open seat     [Take seat]        │
│  Seat 2  Bot · Normal ▾                      │  Seat 2  Bot · Easy ▾                     │
│  Seat 3  Mia                 … not ready     │  Seat 3  Bot · Normal ▾                   │
│          [Swap seats ⇅]                      │                                           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ In room: Eddie (host) · Mia · Sam (watching)       [ I'm ready ]   [ Start match ] (host)│
│ "Empty seats become bots when the match starts."                                       │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
States and rules:
- **Mode** sets size: Commander = 2v2 with one player per team owning both seats ("Seat 1+2: Eddie"); Duel = 1v1.
  Commander with one human and a bot = "vs bot commander". Commander hotseat = both teams "Player" on this device.
- **Map card** shows the numbers for the chosen size (GDD 9): VP target, round limit, estimated time (sim, GDD 16:
  1v1 20–29, Commander 32–50, 4v4 49–69 min). Twin Hollow 4v4 shows "VP 10 · 10 rounds". Frost Bridge selects
  **All random** by default and says "No recall · start at level 3".
- **Seat control** (host): Player (local) / Open (online) / named player / Bot + difficulty (Easy, Normal, Hard).
  Non-hosts: [Take seat] on open seats, [Leave seat] on their own, [Swap seats ⇅] request (the other player accepts).
  Seat order = draft pick order inside a team (GDD 10.2, Q14), so the lobby says it: "Seat 1 picks first for Azure."
- **Ready:** online, Start is enabled when every human seat is ready. Host sees "Waiting for Mia to ready up".
  Changing mode, size or map clears ready marks (a small "Settings changed" toast tells everyone).
- **Learning timers** (GDD 4, 10.2): on by default when any human in the room has played fewer than 5 matches; the
  badge "Learning lobby" shows on the room.
- **Back** from the lobby: local = to Title (no confirm); online host = "Close the room? Everyone will be sent back." ;
  online guest = leave at once.

## 5. S20 Coin flip, S21 Draft, S22 Team view

### S20 Coin flip (GDD 10.2, Q16)
2 s animation (ASSETS: coin-flip animation), then one line that stays on the draft header:
**"Ember picks first. Azure chooses who starts round 1."** Skipped (no flip) on a rematch: "Rematch: Azure picks first
this time." Reduce motion: no animation, the line appears at once.

### S21 Draft (pick mode Draft)
```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ ← Back to setup (host, local)    HERO DRAFT · 3v3 · The Rift          ◔ 0:24  (+ pick timer) │
│ Pick order:  [1 E] [2 A][3 A] [4 E][5 E] [6 A]          Ember: first pick · Azure: chooses round-1 start
│              done   NOW  next  …                                                         │
├───────────────┬──────────────────────────────────────────────────────────┬───────────────┤
│ AZURE ◆        │  YOUR PICK (Seat 1, Eddie) — pick 2 of 6                │ EMBER ▲        │
│ 1 Eddie  ⟳ Lumen│  Your team needs: Tank · Mage  → highlighted below     │ 1 Sam  Bulwark │
│   (hover: your  │  [★ Recommended ✓] [All] [Tank][Fighter][Assassin]…    │   Tank         │
│    team only)   │                                                         │ 2 Bot  …       │
│ 2 Mia  …        │  TANK       [Bulwark ✗ taken·Ember] [Butcher ★★]        │ 3 Bot  …       │
│ 3 Bot  …        │  FIGHTER    [Blademaster ★ Good first pick] [Ravager ★] │                │
│                 │  MAGE       [Pyra ★★ Suggested] [Stormcaller ★★★]      │                │
│                 │  …                                                      │                │
│                 ├─────────────────────────────────────────────────────────┤                │
│                 │ HERO CARD: Lumen · Support · ★ Easy                     │                │
│                 │ "Keeps the carry alive, roots divers, global heal."     │                │
│                 │ HP 11 ATK 1 RNG 2 ARM 0 SPD 3                           │                │
│                 │ Q Mend — heal an ally 3 · CD 1 ("every round")          │                │
│                 │ W Binding Light — line 4, first enemy: 1 dmg, Root …   │                │
│                 │ E Barrier … R Wish (from level 3, round 5) …           │                │
│                 │ Recommended items: Spell Tome → Archstaff · Heart Gem   │                │
│                 │                       [ LOCK IN LUMEN ]                 │                │
└───────────────┴──────────────────────────────────────────────────────────┴───────────────┘
```
- **Pick-order strip** (GDD 10.2): one chip per pick, team pattern + letter + seat avatar; done = portrait; now =
  pulsing outline + "NOW"; next = "next". Snake is visible: chips are grouped in their pairs ([2 A][3 A]).
- **Whose pick:** header says "YOUR PICK" in your color, or "Mia is picking (Azure seat 2)", or "Ember is picking".
  A bot pick reveals after a 1–2 s delay (GDD 10.2) with "Bot picks Pyra (team needed a Mage)".
- **Hover vs lock-in:** tapping a hero shows its card and **hovers** it (teammates see "⟳ Lumen" on your seat; enemies
  don't, GDD 10.2). Copy under the button: "Your team sees your hover. Nothing is final until you lock in."
  Lock-in = button (mouse/touch) or hold A (gamepad). Locked picks are shown to everyone at once.
- **Taken heroes:** greyed with the team pattern and "taken · Ember" (not color alone).
- **Your team needs** (GDD 14): roles your team lacks in bot priority order (Tank, Mage, Marksman, Support, …);
  matching free heroes get a ring; one hero is tagged **Suggested** (= `BotDraftPick`).
- **Recommended filter**: on by default for a player's first 5 matches; shows ★ Easy heroes first with
  "Good first pick". Every card shows stars, role, one-line job, and abilities in plain words (cooldown as
  "every round" / "every 2 rounds", ultimate as "from level 3 (round 5)").
- **Timer** (online): 30 s ring (45 s learning). At 10 s the ring turns to the warning style + tick sound; text
  "Time runs out → your hover is locked (or the Suggested hero)." (GDD 10.2). No timer in hotseat / vs bots only.
- **First draft prompt** (once per profile): "Pick order: one, then two each. Heroes are unique; fill what your team
  lacks." (GDD 14)
- **Commander draft** (A BB A): the strip shows each player's 2 picks; above the role grid a **Starter pairs** row
  (GDD 4.1): `Shield & Bow (Bulwark ★ + Frostbow ★)`, `Blade & Light`, `Axe & Tide`, `Quake & Flame`, plus a collapsed
  "Advanced pairs ★★★". Tapping a pair hovers its first free hero and pins the partner as "planned 2nd pick" (just a
  reminder; it can be taken). If the opponent takes your planned partner, a line says "Ravager was taken. Pairs that
  still fit Tidesinger: …". First Commander match: starter pairs row is expanded and on top.
- **Hotseat draft:** no hidden hovers between teams are needed (draft is public, only hovers are team-private); in
  hotseat, hovers are simply visible to all. No "pass the device" screen.
- **Disconnect during draft:** that seat is auto-picked when its timer ends (GDD 10.2); the seat shows "Disconnected —
  auto-pick when the timer ends".

**S21r All random:** heroes flip in on each seat one by one (1 s each; instant with Reduce motion), then S22.
**S21f Free pick:** same grid, everyone picks at once, first lock wins; a hero locked by someone else while you hover it
shakes out of your card with "Sam locked Pyra first".

### S22 Team view and round-1 choice (10 s)
```
┌──────────────────────────────────────────────────────────────┐
│ AZURE ◆  Lumen (Support) · Bulwark (Tank) · Pyra (Mage)       │
│ EMBER ▲  Shade · Frostbow · Quake                             │
│ Each hero: role, ★, 3 recommended items, suggested lane       │
│                                                              │
│ Azure chooses who starts round 1:                            │
│   [ We start ]   [ Ember starts ]          ◔ 0:10             │
│ "After that, each round the team with fewer VP chooses."     │
└──────────────────────────────────────────────────────────────┘
```
- The choosing team (no first pick) gets the two buttons; the other team sees "Azure is choosing who starts round 1".
  Online: the choice is made by the choosing team's seat 1 (or any teammate, first press wins); timeout = the team that
  had first pick starts (stated: "If no choice: Ember starts"). Commander/hotseat: the player chooses.
- Suggested lanes come from GDD 11 ("Commander on the Rift: one hero Mid, one Bot").

## 6. S30 Loading
Board builds in 3D with lane names flying in. Shows one rotating tip from the quick reference matched to the drafted
heroes ("Shade gets +1 action when her Q, W or E kills anything."). Online: per-player load bars; "Waiting for Mia
(loading 70%)". Load timeout 60 s → that seat is played by a bot until they arrive (S54).

## 7. S40 Match, S41 Shop, S42 Pause, S43 Round-start choice
The in-match HUD is `HUD.md`. Flow-relevant states:

| State | Who sees what | Exit |
|---|---|---|
| **Round start** | Banner 1.5 s: "Round 5 of 12 · Everyone is level 3: ultimates (R) unlocked" (+1 gold shown on each hero) | auto |
| **S43 Round-start choice** (VP not tied) | Trailing team: "You're behind on VP, so you choose: [We start] [They start]" 10 s; leader sees "Ember (behind on VP) chooses who starts" | choice / timeout = tie rule (team that went second last round starts), stated on the prompt |
| **Your team's turn — choose a hero** | Unactivated heroes glow; "Choose a hero to act" (Commander/hotseat/bot-team leader) or the hero of the seat the slot belongs to (online, GDD 4) | select hero |
| **Your hero's turn** | Full HUD, timer ring | End turn / all actions used / Recall / timeout |
| **Ally's turn (online)** | Their actions animate; you are in **planning mode** (HUD.md 8); "Go next" button if you haven't acted | — |
| **Enemy's turn** | Same, enemy color; planning mode; "Go next" claim for your team's next slot | — |
| **Skipped turn** | Turn strip slot flips to a skip marker; banner "Pyra is Stunned — skips this turn" / "Bulwark is respawning — skips this turn (1 of 2)" | auto 1 s |
| **Lane phase** | Camera pulls back; each lane in fixed order (Top, Mid, Bot): spawn, Power numbers, clash, Front slide, tower shots; summary card per lane | auto 15–30 s; [Skip ▸▸] shows the summary at once |
| **End step** | "Cooldowns −1" pips tick; shields fade; VP check | auto |
| **Victory** | VP or Core → S60 | — |

**S41 Shop** (GDD 7.2): opens from the Shop button only when legal (start of your activation in base, or on respawn);
otherwise the button is visible but shows the reason ("Shop: only in your base at the start of your turn").
```
┌──────────────────────────────────────────────────────────────┐
│ SHOP — Frostbow            Gold 9        Slots ■ ■ □ (2 of 3) │
│ Recommended for Frostbow:                                    │
│  [Iron Sword 3] → [Piercing Edge 4 (you own Iron Sword)] …    │
│ ─ Basics (3 gold) ─  Iron Sword +1 ATK · Spell Tome +1 POW …  │
│ ─ Upgrades (7, or 4 if you own the basic) ─                   │
│   Piercing Edge  +2 ATK, ignore 1 armor    [Buy 4] (replaces  │
│                  Iron Sword)                                  │
│   Cleansing Veil +3 HP; free cleanse, even on a stunned turn  │
│ "Slots full: buying discards an item you choose. No selling." │
│                                   [Done — back to my turn]    │
└──────────────────────────────────────────────────────────────┘
```
- Price shown is **your** price (4 when you own the basic, with "replaces Iron Sword"). Can't afford = button shows
  "Need 2 more gold". Full slots = choose what to discard, with confirm.
- Shopping never uses an action; the HUD shows "Shop is open until your first action" while it is legal.

**S42 Pause** (Esc / ☰ / Start): Resume · Quick reference (QUICKREF.md) · Settings · Rules glossary (veteran fast
track) · Concede (team vote online, 2 of 3 / 3 of 4; instant vs bots) · Leave match. **Online, pause does not stop the
game**: the overlay says "The match keeps running while this menu is open" and your timer ring stays visible on the
overlay. Offline (vs bots / hotseat): the game pauses.

## 8. Online states (S50–S56)

All overlays are non-blocking banners unless marked **modal**. The board stays readable underneath. NET owns the
logic; this is what the player sees.

| ID | State | What the player sees (copy) | Actions |
|---|---|---|---|
| S50 | **Waiting for players** (lobby) | "Waiting for 2 more players · empty seats become bots at start" | Copy code, Start anyway (host) |
| S51 | **Waiting for a player's turn** | Turn strip highlights their slot; "Mia is playing Lumen · ◔ 0:31" | Planning mode |
| S52 | **You lost connection** (modal over the board, greyed) | "Reconnecting… 0:12" + "Your turn timer keeps running. If you don't come back by your turn's end, a bot plays your hero." | [Leave match] |
| S52b | **Reconnected** | Toast: "Back in the match. You missed: Pyra moved, Lane phase (Mid pushed to node +1)." Log scrolls to the first missed entry | — |
| S53 | **Another player disconnected** | Their seat chip shows ⚠ "Mia — reconnecting (0:45)"; at their turn: "Mia is reconnecting. A bot takes this turn if she's not back when the timer ends." | — |
| S54 | **Player replaced by bot** | Seat chip "Bot (for Mia)"; log line "Mia left. A Normal bot plays Lumen." If Mia returns: "Mia is back — she takes over at the start of Lumen's next turn." | Host: [Kick] / [Keep bot] |
| S55 | **Host left** (modal) | "The host left. Reconnecting the match to a new host…" (NET: host migration from the replay log, seed + actions). Success: "Sam is the new host. Nothing was lost." Failure: "The match can't continue online. [Save replay] [Back to title]" | — |
| S56 | **Turn timer expiry** | 10 s left: ring turns warning style + tick sound + "10 s". 0 s with bank: "Using your 30 s bank" (once per match). Bank empty: "Time's up — your remaining actions are skipped." Pending aim is cancelled, nothing is auto-played (GDD 4: the hero does not recall or move on its own) | — |
| S56b | **Go next claim** | During the enemy turn, unactivated teammates see [Go next]; first press: "You go next for Azure" / others: "Mia goes next". Locks when your team's turn starts | Cancel claim before lock |
| S57 | **Version mismatch / desync** | "Your game version (1.0.2) differs from the host's (1.0.3)." / desync: "Syncing with the host…" (silent re-sync from host state; shown only if > 2 s) | — |

Timer rules shown on screen (GDD 4): 60 s per turn at 1v1/2v2/Commander, 45 s at 3v3/4v4, learning lobbies 90/60;
+30 s bank once per match. **UX proposal:** the bank is used automatically when the timer hits 0 (no button to
forget); NET to confirm.

## 9. S60 Results and rematch

```
┌──────────────────────────────────────────────────────────────────────────┐
│  AZURE WINS ◆                    "Azure reached 8 VP first (target 8)."   │
│                                  or "Azure broke Ember's Core."           │
│                                  or "Round 12 ended: Azure led 7–5 VP."   │
│                                  or "Tied on VP: Azure destroyed more towers."│
├──────────────────────────────────────────────────────────────────────────┤
│ VP over rounds  ▁▂▂▃▅▆█  Azure  ·  ▁▁▂▃▃▄▅ Ember   (markers: KO ●,       │
│                                    Tower ▲, Drake ◆, Golem ■)            │
│ VP by source:  Azure  KOs 3 · Towers 3 · Drake 2   |   Ember  KOs 2 · Towers 3 │
├──────────────────────────────────────────────────────────────────────────┤
│ Hero        Player  Lv  KOs/Assists/KO'd  Last hits  Gold  Damage  Items  │
│ …                                                                         │
├──────────────────────────────────────────────────────────────────────────┤
│ You learned: ✓ last hits ✓ Lane phase ✓ tower rule ✓ recall ✗ Drake       │
│   (first 5 matches only; ✗ items link to the quick-reference line)        │
├──────────────────────────────────────────────────────────────────────────┤
│ [ Rematch ] (2 of 4 ready)   [ Change setup ]   [ Watch replay ]  [ Leave ]│
│ "Rematch: Azure picks first this time; Ember chooses who starts round 1." │
└──────────────────────────────────────────────────────────────────────────┘
```
- **How it ended** line is the first thing read, using the GDD 9 order and tie-breaks (towers, Front advance, KOs,
  draw). The VP chart makes "VP race" concrete for new players.
- **Rematch**: every human presses it (online: count shown; bots are always ready). Goes to S20 with first pick
  swapped and no coin flip (GDD 10.2). **Change setup** returns everyone to S10 in the same room. A player who leaves
  frees the seat (bot fills unless the host opens it).
- Tutorial results add "Next: try Commander vs a bot (2 heroes each)" as the primary button.

---

## 10. Copy rules (all screens)

1. **Player's side, second person, present tense.** "You skip your next turn", not "The unit's activation is skipped".
2. **Turn, not activation.** The GDD says "activation"; the UI says **turn** ("your hero's turn", "skips its next
   turn"). The team's slot is "Azure's turn". Round = all turns + Lane phase.
3. **Numbers next to words.** "Ready in 2 rounds", not "CD 2". "Shield 3 (until your next turn)", not "S3".
4. **MOBA words with their meaning here,** first time per screen: "Last hit — Attack the enemy wave: +1 gold",
   "Push — win the clash so the Front moves toward their tower", "Tower aggro — hurt a hero under their tower and it
   shoots you for 3", "Dive", "Recall (back to base, full heal next turn)", "Wave clear (Wave 2 = kills 2 minions)".
   Never: jargon without meaning (no "CC", "DoT", "proc", "kite" alone).
5. **Say why, never just "can't".** Every disabled control states its reason in ≤ 6 words: "No line of sight",
   "Ready next round", "Rooted: can't move", "Silenced: no abilities", "Needs your wave at the tower".
6. **Short.** Prompts ≤ 1 line (≤ 90 characters). Tooltips ≤ 3 lines. One idea per prompt.
7. **Sentence case**, no ALL CAPS except the 1–2 word labels on the turn banner ("YOUR TURN").
8. **No color words for meaning** ("the red hexes"). Use the cue's name: "the shaded hexes", "the ring".
9. **Names:** heroes, items and abilities as in GDD 7.3 and 10.3, capitalized. Conditions capitalized (Stun, Root,
   Slow, Silence, Shield, Poison, Haste, Steadfast, Hidden).
10. **Localization-ready:** no text baked into images; allow +40% length; numbers as separate tokens.
