# Lanefall — In-match HUD (v1.0)

Owner: ux · Status: draft for review · Rules: `docs/design/GDD.md` v1.0 · Flows: `FLOWS.md` · Copy rules: FLOWS.md 10.

**Principle:** the board answers "what happens if I do this?" *before* you do it. A player should never have to
remember a rule the HUD can show; section 12 lists every rule and the cue that replaces remembering it.

Layout rules
- The 3D board owns the middle of the screen. HUD elements sit on the edges and never cover the active hero.
- **Top = the match** (round, VP, turn order). **Bottom = your hero** (card, actions). **Right = info** (selected unit,
  log). **On the board = previews** (rings, lines, numbers, arrows).
- Everything that can be hovered can also be **tapped-and-held** (touch) or **focused** (gamepad: right stick cursor
  or bumper-cycle), so no info is mouse-only.
- Sizes are for 1920×1080 at UI scale 100% (desktop) and 844×390 dp landscape (phone). UI scale 80–150%
  (ACCESSIBILITY.md).

---

## 1. Wireframes

### 1.1 Desktop (1920×1080)
```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ROUND 5 of 12   Lv 3 · next level: round 7       │ AZURE ◆ 4 ████▒▒▒▒ │ 8 to win │ ▒▒▒▒▒██ 3 ▲ EMBER   │ ☰ │
│ TURN ORDER  [◆Bulwark✓][▲Shade✓][◆ YOU: Lumen ◔41][▲ ? ][◆ ? ][▲ Quake ⨯ Stunned] │ ◆ left: Pyra · ▲ left: Frostbow │
├──────────────┬──────────────────────────────────────────────────────────────────────┬──────────────────┤
│ LANES        │                                                                      │ SELECTED / HOVER │
│ Top ◆ 4–2 ▶  │                                                                      │ ┌──────────────┐ │
│  pushes 1    │                         3D BOARD                                     │ │▲ Shade · Lv3 │ │
│ Mid ◆ 3–3 =  │                                                                      │ │HP ████░ 9/14 │ │
│  no change   │      ⬡ in-range hexes lit · ⬡ blocked by walls hatched               │ │Hidden: can't │ │
│ Bot ▲ 2–5 ◀  │      sight line → target · preview number above target               │ │be targeted   │ │
│  pushes 1,   │      tower range ring (hatched when it would shoot you)              │ │Items: …      │ │
│  tower −1    │      Front markers with forecast arrows                              │ └──────────────┘ │
│              │                                                                      │ LOG              │
│ OBJECTIVES   │                                                                      │ R5 ▲Shade Shuriken│
│ Drake ◆ up   │                                                                      │  → wave: 1 last  │
│ Golem round 6│                                                                      │  hit (+1 gold),  │
│              │                                                                      │  reset: +1 action│
│              │                                                                      │ …       [Full ▾] │
├──────────────┴──────────────────────────────────────────────────────────────────────┴──────────────────┤
│ ┌─ YOUR HERO ─────────────────────────────────────────────────────────────────────────────────────────┐│
│ │[portrait] LUMEN · Support · Lv 3   HP ████████░░ 11/15 (+Shield 3)   Gold 6   ATK 1 RNG 2 ARM 0 SPD 3 POW 0││
│ │ Conditions: [Slow ▾ "SPD −2 this turn"]   [Steadfast ◌ "Can't be Stunned until your turn ends"]     ││
│ │ ACTIONS  ● ● ○   "1 action left · each action once, Move up to twice"                              ││
│ │ [Move 2/2 ✓][Move —][Attack][Q Mend ✓ used][W Binding Light][E Barrier ◔ ready next round][R Wish] ││
│ │ Items: [Spell Tome][Heart Gem][ empty ]     Free: [Recall ⟲] [Shop 🛒 base only]     [End turn ▸]  ││
│ └──────────────────────────────────────────────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Phone, landscape (844×390 dp) — primary phone layout
```
┌──────────────────────────────────────────────────────────────────────────┐
│R5/12 ◆4 ███▒▒ 8 ▒▒██ 3▲ │[◆✓][▲✓][◆YOU◔41][▲][◆][▲⨯]│ ☰ │
├──────────────────────────────────────────────────────────────┬───────────┤
│                                                              │ LUMEN Lv3 │
│                                                              │ HP 11/15+3│
│                   3D BOARD (pinch zoom, 2-finger rotate)     │ ●●○ 1 left│
│   lane chips float on each Front: "◆4–2 ▶"                   │ [Slow][◌] │
│                                                              │───────────│
│   preview card pops above the target (tap to aim,            │ [Move ✓]  │
│   tap again or [Confirm] to commit)                          │ [Attack]  │
│                                                              │ [Q ✓][W]  │
│                                                              │ [E ◔1][R] │
│ [Lanes ▾] [Log ▾]                                            │ [⟲][🛒][▸]│
└──────────────────────────────────────────────────────────────┴───────────┘
```
- Right rail is 180 dp wide, thumb-reachable; buttons ≥ 44×44 dp. Lanes and Log are drawers from the bottom-left.
- Selected/hover info = a bottom sheet (tap-and-hold on any unit), dismiss by swipe down.
- **Phone portrait** (supported, not primary): top bar stacks (VP line, then turn strip), board takes the middle 60%,
  the hero rail becomes a 2-row bottom bar (actions row + free/end row). Same components, no new ones.

### 1.3 Commander HUD (two heroes, GDD 4.1)
The hero card area shows **both** heroes side by side; the one acting is full size, the other is compact (portrait,
HP, cooldown pips, conditions, "acts next turn" or "✓ done this round").
```
│ ┌─ ACTING: BULWARK ───────────────────────────────┐ ┌─ FROSTBOW (waiting) ───────┐ │
│ │ … full card as 1.1 …                            │ │ HP 10/14 · Q◔1 W● E● R●    │ │
│ └─────────────────────────────────────────────────┘ │ "Acts after Ember's next"  │ │
```
At the start of the Commander's team turn with both heroes unactivated: board dims except both heroes, which glow;
prompt "Choose who acts now. The other acts after the enemy's next turn." (first match: GDD 14 line "You command two
heroes. Pick one to act; then the enemy acts; then your other."). Tab / tap a hero / LB-RB to switch before the first
action; after the first action the choice is locked (copy: "Lumen is acting").

---

## 2. Top bar: round, VP, level clock

```
ROUND 5 of 12   Lv 3 · next level: round 7    AZURE ◆ 4 ████▒▒▒▒ │ 8 to win │ ▒▒▒▒▒██ 3 ▲ EMBER
```
- **Round counter** "Round 5 of 12" (GDD 9). Last 2 rounds: "Last round!" / "1 round left" with warning style.
- **Level clock** "Lv 3 · next level: round 7"; on round 4: "Ultimates next round". From round 8 a small chip
  **"Late game: a KO costs 2 turns"** stays on the bar (GDD 6.5, Q6).
- **VP bar**: two bars growing toward the centre target line, number at each end, "8 to win" in the middle. Hover/tap:
  "VP: Hero KO 1 · Tower 3 · Drake 2 · Golem/Spider Queen 3. First to 8 wins. After round 12, most VP wins (ties: towers,
  then Front advance, then KOs)."
- **VP preview**: when an action preview would score (KO, tower, objective), the VP bar shows a ghost segment "+1".

## 3. Turn-order strip (single alternation, GDD 4)

```
TURN ORDER  [◆Bulwark✓][▲Shade✓][◆ YOU: Lumen ◔41][▲ ? ][◆ ? ][▲ Quake ⨯ Stunned]   ◆ left: Pyra · ▲ left: Frostbow
```
- One chip per slot this round, **A B A B …** in order. Each chip: team pattern + color, and
  - **done:** portrait + ✓;
  - **now:** large, outlined, portrait + seat name + timer ring;
  - **future, team picks freely:** "?" (the team chooses any unactivated hero, GDD 4);
  - **future, claimed:** portrait of the hero whose player pressed **Go next** (online);
  - **will skip:** if a team's only unactivated heroes all skip, the slot shows the skip marker in advance;
    a skipping hero's chip shows ⨯ + reason ("Stunned", "Respawning 1 of 2").
- **"left" lists** each team's heroes that have not acted yet this round, with skip markers. This is the answer to
  "who can still hit me before the Lane phase?" (the most important single-alternation question).
- After the last slot: a "Lane phase" chip, then "End step".
- Hover/tap a chip: "Shade (Ember) acted 2nd this round: Shadow Step, Attack, Death Mark."
- Who starts: a small label before the first chip: "Ember chose to start" / "Azure starts (behind on VP)".

**Go next** (online, GDD 4): during the enemy's turn, each of your teammates who hasn't acted sees a button under the
strip: **[Go next]**. Press → the next team chip shows your portrait for everyone on your team ("Mia goes next").
Locks when your team's turn starts. Default if nobody presses: "Next for Azure: Mia (lowest seat)" is shown.

## 4. Hero card

### 4.1 Contents
| Part | Shows | Notes |
|---|---|---|
| Header | Portrait, name, role, level, team pattern | Level-up flash at round start |
| HP bar | "11/15", Shield as a separate segment "+3" with "until your next turn" on hover | Poison shows as a hatched segment at the HP bar's end: the damage due at the start of the next turn |
| Stats | ATK RNG ARM SPD POW, **effective values** (items, Slow, Haste, Drake included) | Hover a stat: "SPD 1 = 3 − 2 (Slow)". Changed stats are underlined, not just colored |
| Gold | "Gold 6" + "Can buy: Iron Sword" hint when in base and affordable | |
| Conditions | Icon + word chips (4.3) | Tap/hover for plain-language tooltip |
| **Action pips** | ● ● ○ = actions used/left; text "1 action left · each action once, Move up to twice" | Shade: 4th pip appears **dashed** ("Reset ready: a Q, W or E kill gives +1 action"), fills solid when it fires: "+1 action (Shadow Reset)" |
| Action buttons | Move ×2, Attack, Q, W, E, R (+ Capture on Twin Hollow when standing on an altar) | States in 4.2 |
| Items | 3 slots; active items (Blink Charm, Cleansing Veil) are buttons with cooldowns | |
| Free row | Recall, Shop, End turn | Section 6 |

### 4.2 Action button states (each says why)
| State | Look (not color alone) | Label / tooltip |
|---|---|---|
| Ready | Solid, key letter | "Q Mend — heal an ally 3 (range 3)" |
| Used this turn | Check mark, dimmed | "Used this turn (each action once)" |
| Move | "Move 1/2", "Move 2/2 ✓" | "Move up to 3 hexes. You can Move twice." |
| On cooldown | Clock ring with number | **"Ready next round"** / "Ready in 2 rounds" (never "CD 2") |
| Ultimate locked | Lock icon | "Unlocks at level 3 (round 5)" |
| No actions left | Dimmed, pip row pulses | "No actions left — End turn" |
| Blocked by a condition | Condition icon over the button | "Rooted: can't move" · "Silenced: no abilities" |
| No legal target | Dimmed, button still opens aiming to show why | "No enemy in range" / "No line of sight to any enemy" |
| **Free** ability (Slither, Rocket Jump, War Bellow) | "FREE" tag, no pip cost | "Free: doesn't use an action. Once per turn." |

### 4.3 Conditions and states — icon, word and tooltip (plain language)
Tokens are shown on the hero card, on the mini's base ring on the board, and in the turn strip.

| Token | Icon (ASSETS) | Tooltip copy |
|---|---|---|
| **Stun** | spiral + "STUN" | "Skips its next turn completely. After that, it can't be Stunned again until it has had a real turn (Steadfast)." + timing line: "Skips: this round" or "Skips: round 6" |
| **Steadfast** | grey ring | "Can't be Stunned until the end of its next turn. Other effects still work." |
| **Root** | vines | "Can't Move, dash, jump or teleport on its next turn. Can still attack and use abilities." |
| **Slow** | down-chevron boot | "Moves 2 fewer hexes per Move on its next turn (min 1)." **Slow (2)**: "…on its next 2 turns." |
| **Silence** | crossed rune | "Can't use Q, W, E or R on its next turn. Can still Move and Attack." |
| **Shield n** | shield with number | "Absorbs the next n damage. Gone at the start of its next turn." |
| **Poison n** (Viper) | drop + number + 3 pips | "Loses 3 HP at the start of each of its next 3 turns (2 left). Recall to base, Riptide or Cleansing Veil removes it." (number = n + Viper's POW, already added) |
| **Haste** (buff) | wing boot | "+2 hexes per Move until the end of its next turn. Cancels Slow." |
| **Hidden** (Shade) | smoke | "Enemy heroes and towers can't target it until its next turn. Ends if it deals damage." |
| **Recalling** | blue swirl over the mini | "Appears in base at the start of its next turn, full HP. Any damage or Stun before then cancels it." |
| **KO / respawning** | empty base ring + number | "Back in base after 1 skipped turn" / "after 2 skipped turns (KO'd in round 8+)" |
| **Aegis** (Golem) / **Second Wind** | wing / heart | "Revives once at half HP instead of being KO'd." |
| **Drake** (team) | drake head ×1/×2 | "Your team: +1 ATK per Drake (max 2)." |

---

## 5. Action previews (aim → preview → confirm)

**Flow.** 1) Choose an action (button or key). 2) The board lights legal targets; illegal ones are shaded with a reason
on hover. 3) Hover (mouse) / tap (touch) / cursor (gamepad) a target → **preview card** + board overlay.
4) Commit: click the same target (mouse), tap it again or press **[Confirm]** (touch), A (gamepad). Esc / tap empty
board / B cancels. Previews come from `LegalActions` previews (GDD 12), so HUD, bots and rules never disagree.

**Preview card** (floats above the target, or pinned bottom-centre on phone):
```
┌ Scorch → Shade ───────────────────────────┐
│ 3 damage (ability: ignores armor)          │
│ Shade 9 → 6 HP                             │
│ ⚠ Tower shoots you: −3 (you're in its ring)│
│ Lane: no change                            │
│ [Confirm]  (or click Shade again)          │
└────────────────────────────────────────────┘
```
Lines appear only when relevant, in this order: result on target(s) → KO/VP/gold → risk to you → lane/Front → notes.

### 5.1 What each preview shows
| Preview | On the board | On the card |
|---|---|---|
| **Damage** | Number above every unit hit; HP bar ghost shows the loss; KO = skull + "KO" | "3 damage → 9 to 6 HP". Attack: "4 − 1 armor = 3". Ability: "ignores armor". Shield: "2 absorbed by Shield, 1 to HP" |
| **KO** | Skull on target, VP bar ghost +1 | "KO: +1 VP, +3 gold (assist +1 to Pyra)"; from round 8: "skips 2 turns" |
| **Last hit / Wave N** | Minion minis that will die flash; "+1 gold" floats | "Kills 2 minions: +2 gold" + Lane forecast change |
| **Line of sight** | Aiming: in-range hexes **with** LoS lit; in-range hexes **without** LoS **hatched** (diagonal lines) + a small wall-eye icon; sight line drawn from your hex to the hovered target, **solid** if clear, **broken at the wall** if blocked | Blocked target: "No line of sight (wall)" instead of a damage number |
| **Lines** (Meat Hook, Shuriken, Gust…) | The line drawn hex by hex to the first unit hit or the wall that stops it | "Hits the first enemy hero: Pyra" |
| **Areas** | Radius 1/2 hexes outlined; every unit inside gets its own number | "Hits 2 heroes + 3 minions" |
| **Tower range / dive** | Rings (5.2) | "⚠ Tower shoots you: −3" on the first damaging action this turn; later actions: "Tower already shot you this turn" |
| **No minion cover** | Ring hatched on the tower whose lane has none of your minions, when your preview hex ends inside it | "⚠ In the Lane phase this tower shoots you for 3 (none of your minions here)" |
| **Structure attack** | Tower/Core HP ghost | "2 damage to the tower" or disabled: "Needs your wave at this tower" / "Core is closed: break every tower in one lane first" |
| **Forced movement** | Ghost mini on the final hex + arrow path; if stopped early, a stop mark on the blocking hex | "Knocked back 1 (a wall stops it)"; "Pulled next to you — into your tower's range" |
| **Pull to centre** (Earthshaker) | Ghost per enemy hero, numbered in resolution order; tie hexes blink → caster chooses | "3 heroes pulled. Choose where Pyra lands (tie)" |
| **Stun** | Stun icon on target | "Stun: Pyra **skips her turn this round**" / "…skips her next turn (round 6)"; Steadfast target: "Steadfast: the Stun won't work (damage still does)" |
| **Poison** | Drop icon with ticks | "Poison 2: 2 HP at the start of each of Pyra's next 3 turns (6 total)" |
| **Chain** | Jump arrows to candidate targets; you pick each jump | "Jump 1: Frostbow (2 dmg) — click the next target or [Done]" |
| **Guillotine** | Number includes the bonus | "3 + 4 (missing 10 HP) = 7" |
| **Death Mark** | Execute line drawn on the target's HP bar | "4 damage, then KO if at 2 HP or less → KO" |
| **Shadow Reset** | Dashed 4th pip glows | "Kills a minion → +1 action (once per turn)" |
| **Move** | Reachable hexes lit; path drawn; cost "Move 1 of 2"; hex labels for danger (Threat, section 8) | Hovering a destination updates the Lane forecast ("+1 Power in Mid") and tower warnings |
| **Twin Shot** | First hit chosen, then second target highlighted (default: same target; [Same again] button) | "Hit 1: 2 − 0 = 2 · Hit 2: choose" |
| **Bite** (neutrals) | Number on you | "Wolf bites back: −1 to you" |
| **Recall** | Base glows | "Ends your turn. Next turn you start in base at full HP (cancelled if you're hit first)." |

### 5.2 Tower range rings and the dive warning
- **When shown:** for every enemy structure within 4 hexes of your hero **or of the hex you are previewing**; always
  shown while aiming or moving. Toggle "Show all ranges" (Alt / L3).
- **Ring style:** outline of all hexes within 2 of the structure. Normal = thin dashed outline.
  **"Would shoot you"** = thick outline + **hatched fill** + tower icon with "3" on the ring; the cue does not rely on
  color.
- **Triggers for "would shoot you"** (GDD 5.3): (a) your preview damages an enemy hero while you stand in the ring
  (dive); (b) you are or will end in the ring and that lane has none of your minions (Lane-phase shot).
- **Your own towers** show a calm ring with a shield icon when an enemy is inside: "Your tower shoots Shade if she
  hurts a hero here."

### 5.3 Lane forecast arrows (GDD 12 `LaneForecast`, GDD 14)
On each Front marker, always on:
```
   ◆ 4  vs  2 ▲      ▶▶  (arrow toward Ember's tower)
   "Azure wins the clash: Ember loses 2 minions, Front moves 1"
```
- Numbers = Power (minions + heroes in the clash zone; + altar). Arrow toward the side that will lose; "=" when tied
  ("No change"). Double arrow = Front moves; single = clash won but loser has minions left ("Ember loses 2 of 4 minions").
- **Live while you plan:** moving into the clash zone, killing minions or a Wave ability updates the forecast in the
  preview ("Mid: 3–3 → 4–3, you win the clash").
- Siege line when the Front is on a tower: "Tower kills 2, takes 1".
- The clash zone (hexes within 2 of the Front) is drawn as a faint ring whenever your hero is in or previewing it.
- Left panel "LANES" (desktop) / drawer (phone) lists the same forecasts as text.

---

## 6. Free actions, items and End turn

- **Free row** sits to the right of the actions on desktop and at the bottom of the phone rail, separated by a gap so
  free buttons never look like they cost an action:
  - **Recall ⟲** — enabled any time in your turn unless Frost Bridge ("No recall on Frost Bridge"), Stunned (skip) or
    already in base. Confirm on first use per match: "Recall ends your turn now. Next turn you start in base, full HP."
  - **Shop 🛒** — enabled when legal (start of your turn in base, or respawn), shows "Open until your first action".
    Otherwise disabled with "Only in base at the start of your turn". In base at turn start the shop **opens itself**
    once per match for the first 3 matches ("You're in base: buy before you act").
  - **Free abilities and active items** keep their own spot (Q/W/E/items) with the FREE tag, so the player finds them
    where the ability is.
  - **Cleansing Veil on a stunned turn:** at the start of a turn you'd skip, a modal-light prompt: "Pyra is Stunned.
    Use Cleansing Veil to act normally? [Use Veil] [Skip turn]" (10 s; default skip).
- **End turn ▸** — always visible. Hold Space 0.5 s / press button / hold Y. If actions are left: "End turn with 2
  actions left?" confirm (first 5 matches, then off in Settings). When all actions are used and no free action or item
  is usable, the turn ends automatically after 1 s with a "Turn ends" fade (cancel by any input during that second).
- **Undo Move:** a Move that revealed nothing new and triggered nothing (no relic, no damage) can be undone until the
  next action ("Undo move", Ctrl+Z / two-finger tap / B while not aiming). Needs CODE/NET support (CHANGELOG).

## 7. Log

- Right panel (desktop), drawer (phone). Newest at the bottom, grouped by round and turn:
  `R5 · ▲ Shade: Shuriken → wave (last hit, +1 gold) · Shadow Reset +1 action · Shadow Step → Lumen −2 · Death Mark → Lumen KO (+1 VP Ember)`
- Each entry: team pattern + hero, action name, result in plain words. Lane phase entries: "Mid: Azure 4 vs Ember 2 →
  Ember loses 2, Front moves to node +1".
- Tap an entry → camera shows where it happened; hover a hero name → highlights the mini.
- Filter: All / Mine / Fights / Lanes. "Full log" opens a scrollable modal.
- Reconnect: unread entries since the disconnect are marked with a line "While you were away".

## 8. Planning mode, Threat overlay and waiting (GDD 1 goal 3)

Between your turns (up to ~5 min at 4v4) you can plan without acting:
- Select **your** hero any time → its card shows "Not your turn — planning". You can aim actions and see full previews
  against the **current** board; nothing is sent.
- **Queue a plan:** after previewing, [Pin plan] keeps the path/target ghosted on your screen (only yours, never sent).
  When your turn starts, pinned plans re-check: still legal = "Your plan is ready [Do it]"; changed = "Plan changed:
  Pyra moved" with the new preview.
- **Threat overlay** (hold Alt / tap the eye button / hold LT): hexes tinted **and numbered** with the max damage enemies
  that haven't acted yet can deal there before your next turn (GDD 12 `Threat`, incl. tower dive, LoS, stunned enemies
  = 0). Hover a hex: "Up to 7: Shade 5 (Shadow Step + Attack), tower 3 if you hit a hero here".
- Inspect enemy heroes: tap an enemy → its card with cooldowns ("Shadow Step ready next round"), and "Can reach you"
  if it can hit your hero next turn (Threat).
- **Hotseat:** planning overlays and pinned plans clear when the turn passes; no privacy screen is needed (all
  information is open, GDD 12). A 1 s "Ember's turn" banner prevents a stray click from the last player.

## 9. Lane phase presentation (GDD 13)

Camera pulls back to show the lanes; lanes resolve in fixed order (Top, Mid, Bot). Per lane (≈ 5–8 s, Reduce motion =
1 s each): spawn (+2 / +3 badges) → Power numbers pop on each side → clash (minions collide, losers fade, "−2") →
Front slides (arrow) → siege/tower shots with the hit hero named. Then a summary card:
"Top: Front moved toward Ember (node +1) · Mid: no change · Bot: Ember tower −1 (6/8)". [Skip ▸▸] at any time.
Base heal ("Lumen healed to full in base") and End step ("Cooldowns −1", shields gone) are a one-line banner each.

## 10. 3D camera

| Behavior | Spec |
|---|---|
| **Default angle** | Pitch 55° (looking down), yaw so **your base is at the bottom-left** (online/vs bots: your team; hotseat: Azure, board does **not** flip between players — players learn one orientation) |
| **Framing** | Default zoom fits the whole board width with 5% margin on desktop; on phone, the default fits the active lane area (≈ 9 hexes across) |
| **Focus on the active hero** | At the start of each turn the camera pans (0.4 s ease, no zoom change) so the acting hero is in the middle third. Enemy turns: pans to each action's target area, then returns. Off: "Camera follows: All / Mine only / Off". Reduce motion: cut instead of pan |
| **Zoom** | Mouse wheel / pinch / LT+RT. Min: ~7 hexes across (mini detail). Max: whole board + 10%. Zoom snaps to "Tactical" (whole board) and "Close" presets with Z / double-tap |
| **Rotate** | Right-drag / two-finger twist / right stick. **Yaw limited to ±45°** from the default, **pitch 35°–80°**; release snaps to 15° steps. **Top-down** toggle (T / button / click R3) = 90° pitch, orthographic-like, best for reading LoS and hex distances. Reset view: Home / double-tap with two fingers / press R3 twice |
| **Pan** | Middle-drag or WASD/arrows / one-finger drag on empty board / left stick. Edge-scroll off by default. Bounded to the board |
| **Readability rules** | Minis never fully hide a hex: units within 1 hex of the cursor fade to 40% when aiming; walls are low (≤ 0.5 hex tall) or fade when they hide a unit; every hex under the cursor shows an outline; numbers and tokens are screen-space billboards, fixed size, never occluded |
| **Lane phase** | Auto pull-back to Tactical, then restores your previous view |

## 11. Controls

| Action | Mouse + keys | Touch | Gamepad (later) |
|---|---|---|---|
| Select hero | Click | Tap | LB/RB cycle |
| Move | M or click Move, then click hex (click a lit hex with nothing selected = Move) | Tap Move, tap hex, tap again / Confirm | X, cursor, A |
| Attack | A, hover target, click | Tap Attack, tap target, Confirm | Y… (remappable) |
| Q W E R | Q W E R | Buttons | D-pad / face buttons with modifier |
| Confirm / cancel | Click again / Esc, right-click | Tap again or Confirm / tap empty board | A / B |
| Recall / Shop | B / S | Buttons | View + A / View + Y |
| End turn | Hold Space 0.5 s / button | Button (confirm if actions left) | Hold Y |
| Info on anything | Hover | Tap-and-hold | Cursor + hold RB |
| Threat overlay | Hold Alt | Eye toggle | Hold LT |
| Top-down | T | Button on camera widget | R3 |
| Quick reference | F1 / ? | ☰ → Quick reference | Start → Quick reference |
All bindings remappable (ACCESSIBILITY.md).

---

## 12. Rule → on-screen cue (nothing to remember)

Every rule a player needs during a match, and the cue that removes the need to remember it. "Where" = HUD section.

| # | Rule (GDD) | Cue | Where |
|---|---|---|---|
| 1 | 3 actions, each once, Move twice (6.2) | Action pips + "1 action left · each action once, Move up to twice"; used buttons show ✓; Move shows "1/2" | 4.1, 4.2 |
| 2 | Free abilities don't cost an action (6.2) | FREE tag on the button; pips unchanged in preview | 4.2 |
| 3 | Shade: Q/W/E kill → +1 action, once (10.3) | Dashed 4th pip; preview line "→ +1 action"; pip fills when it fires | 4.1, 5.1 |
| 4 | Twin Shot: Attack hits twice (10.1) | Attack button "Attack ×2"; preview asks for the 2nd target | 5.1 |
| 5 | Cooldown = ready n rounds later; ticks in End step (6.3) | "Ready next round / in 2 rounds" on the button; End step banner "Cooldowns −1" | 4.2, 9 |
| 6 | Ultimate at level 3 (round 5) (6.4) | Lock icon "Unlocks at level 3 (round 5)"; top bar "Ultimates next round" | 2, 4.2 |
| 7 | Levels by round (6.4) | Level clock "next level: round 7"; round-start banner lists gains | 2, FLOWS 7 |
| 8 | Attack = ATK − ARM (min 1); abilities ignore armor; + POW (6.5) | Preview shows the math "4 − 1 armor = 3" / "ignores armor" | 5.1 |
| 9 | Shield soaks first, expires at owner's next turn (6.5) | Shield segment on HP bar; tooltip "Gone at the start of its next turn"; preview splits absorbed/HP | 4.1, 5.1 |
| 10 | Line of sight for enemy targets 2+ away; walls block, units don't; exemptions (3) | Lit vs hatched hexes while aiming; solid/broken sight line; "No line of sight (wall)" | 5.1 |
| 11 | Lines stop at walls / first unit (3, 10.3) | Line drawn to where it stops | 5.1 |
| 12 | Last hit = Attack the enemy wave, +1 gold; Wave N (5.2) | Minions that will die flash + "+1 gold"; wave is targetable only when the Front hex is in range (lit) | 5.1 |
| 13 | No denies (5.2) | Own wave is never lit as a target; tooltip on it "Your minions — you can't attack them" | 5.1 |
| 14 | Lane phase: spawn, Power, clash, push (5.1) | Forecast arrow + numbers on every Front, updated live by previews; animated Lane phase with summary | 5.3, 9 |
| 15 | Power counts heroes within 2 of the Front (5.1) | Clash-zone ring; move preview "+1 Power in Mid" | 5.3 |
| 16 | Spawn 3 from round 7; cap 6 (5.1) | Forecast already includes it; round-7 banner "Waves are bigger: 3 minions each" | 5.3, FLOWS 7 |
| 17 | Front can't pass a standing tower; siege math (5.1) | Forecast "Tower kills 2, takes 1" | 5.3 |
| 18 | Tower dive: hurt a hero within 2 of their tower → 3 to you, once per turn (5.3) | Hatched ring + "⚠ Tower shoots you: −3"; later actions "already shot you this turn" | 5.2 |
| 19 | No minion cover → tower shoots you in Lane phase (5.3) | Hatched ring + "⚠ In the Lane phase this tower shoots you for 3" on move previews and at End turn | 5.2 |
| 20 | Only Attacks hurt structures, only with your wave there (5.3) | Attack on a structure lit only when legal; else "Needs your wave at this tower"; abilities never list structures | 5.1 |
| 21 | Tower order; Core opens when one lane's towers fall (5.3) | Lock icon on inner towers/Core with "Opens when …"; lane panel shows towers left per lane "Bot: 1 tower to open their Core" | 5.1, 5.3 |
| 22 | Who acts: alternate one hero at a time; any unactivated hero (4) | Turn strip + "left" lists; "Choose a hero to act" prompt | 3 |
| 23 | Skipped turns keep their slot (4) | Skip marker chips in the strip with reason | 3 |
| 24 | Trailing team chooses who starts; tie = who went second; round 1 = team without first pick (4) | S43 prompt to the chooser; label before the first chip "Ember starts (behind on VP)" | 3, FLOWS 7 |
| 25 | Go next / lowest seat goes next (4) | Go next button; "Next for Azure: Mia (lowest seat)" | 3 |
| 26 | Turn timer, bank, timeout skips actions (4) | Timer ring with seconds, 10 s warning, "Using your 30 s bank", "Time's up" | FLOWS 8 |
| 27 | Stun = skip the next turn (this round if not acted yet, else next round) (6.6) | Preview "skips her turn this round / round 6"; Stun token tooltip with timing; strip skip marker | 4.3, 5.1, 3 |
| 28 | Steadfast after a stun-skip (6.6) | Grey ring token; stun preview on that hero: "Steadfast: the Stun won't work" | 4.3, 5.1 |
| 29 | Root / Slow / Silence (6.6) | Token + word on base ring and card; affected buttons show the condition and reason | 4.2, 4.3 |
| 30 | Conditions don't stack (6.6) | Preview "Already Slowed — no extra effect" | 5.1 |
| 31 | Cleansing Veil can save a stunned turn; Riptide before (6.6) | Start-of-turn prompt "Use Cleansing Veil to act normally?"; Riptide preview "removes Stun: Bulwark acts normally" | 6, 5.1 |
| 32 | Haste +2 SPD, cancels Slow (6.9) | Effective SPD on the card with breakdown tooltip; Move reach already computed | 4.1 |
| 33 | Poison ticks at turn start, cleared by base/cleanse/KO (6.9) | Drop token with pips; hatched "due" segment on HP bar; tooltip says how to remove it | 4.1, 4.3 |
| 34 | Forced movement rules (6.8) | Ghost mini on final hex, stop mark, arrows; pull-to-centre order numbers | 5.1 |
| 35 | Forced movement into tower range doesn't trigger dive by itself (6.8) | Preview shows tower shot only when damage to a hero happens inside a ring | 5.2 |
| 36 | Recall: free, ends turn, home next turn, cancelled by damage/Stun (6.7) | Recall confirm copy; Recalling swirl token with tooltip; log "Recall cancelled (hit by Pyra)" | 6, 4.3 |
| 37 | Base heals to full at turn start and after Lane phase (6.7) | Base hexes show a "+ full heal" glyph; banner "healed in base" | 9 |
| 38 | Shop only in base at start of turn / on respawn (7.2) | Shop button state + "Open until your first action"; auto-open in base (first matches) | 6 |
| 39 | Prices 3 / 7 / 4 with the basic; 3 slots; no selling (7.2) | Shop shows *your* price and "replaces Iron Sword"; slot meter; discard confirm | FLOWS 7 |
| 40 | KO: +1 VP, +3 gold, assists +1 (6.5) | KO preview lists VP and gold; log credits assists | 5.1, 7 |
| 41 | Respawn skips 1 turn, 2 from round 8 (6.5) | Strip skip marker "Respawning 1 of 2"; top bar chip from round 8; KO preview "skips 2 turns" | 2, 3, 5.1 |
| 42 | Neutrals bite back; damage stays; heal if untouched for a round; last hit claims (8) | Preview "Bites back: −1"; neutral HP bar keeps damage with "Heals at round end unless hit this round"; claim preview "+2 VP for Azure" | 5.1 |
| 43 | Objective timers and rewards (8) | Objectives panel "Golem: round 6"; tooltip with reward; on-board timer token | 1.1 |
| 44 | Drake stacks max 2; Aegis; Brood (8) | Team buff chips with counts; Aegis token; Brood shown in next forecast "+2 minions (Brood)" | 4.3, 5.3 |
| 45 | Altar capture, lock 1 round, +1 Power (8) | Capture button when standing on it; altar lock token "Locked: round 6"; forecast includes "+1 altar" | 4.2, 5.3 |
| 46 | Health relics heal 4, back in 2 rounds (8) | Relic glyph with timer; move preview "+4 HP (relic)" | 5.1 |
| 47 | Frost Bridge: no recall, start level 3 (6.7, 11.3) | Recall button hidden with map note "No recall on Frost Bridge"; loading tip | 6 |
| 48 | Victory: Core, VP target, round limit, tie-breaks (9) | VP bar "8 to win", "Round 9 of 12", tooltip with tie-breaks; results "how it ended" | 2, FLOWS 9 |
| 49 | Execute ≤ 20% max HP (10.3) | Execute line on target HP bar while aiming Death Mark | 5.1 |
| 50 | Hidden: can't be targeted (10.3) | Smoke token; enemies' targeting skips it with "Hidden" | 4.3 |
| 51 | Chain jumps within 2 of last hit (6.9) | Candidate jump arrows | 5.1 |
| 52 | Missing-HP damage (6.9) | Preview shows the sum | 5.1 |
| 53 | Draft: snake order, unique heroes, hover private, timeout pick (10.2) | Pick strip, taken heroes greyed + team, hover note, timer copy | FLOWS 5 |
| 54 | Commander: your two heroes never act back to back (4.1) | Commander prompt; compact card "Acts after Ember's next turn" | 1.3 |
| 55 | Enemies act between your turns (single alternation) | Threat overlay + "left" lists + "Can reach you" on enemy cards | 8, 3 |

**55 rules, 55 cues.** Rules where the cue works but the rule itself fights the player, with a simplification proposed
to DESIGN (CHANGELOG Needs):
- **#38 Shop only at the start of a turn in base.** A player who walks into base mid-turn expects to shop. The cue
  ("Only in base at the start of your turn") explains, but it will still read as a bug. Proposal: "Shop any time
  during your turn while you stand in your base (free)."
- **#27 Stun timing** ("this round" vs "next round" depending on whether the target acted) is cued in the preview, but
  players plan around it from memory between turns. Acceptable with the cue; no change proposed unless playtests show
  confusion.
- **#26 Time bank** — proposal (NET/DESIGN): spend the bank automatically at 0 s, so there is no button to remember.
- **Ambiguities found** (need a DESIGN ruling before CODE can preview them): Echo Slam "+1 per other enemy unit in
  range (heroes and minions)" — a wave is one number on the Front: does each minion count, or the wave as 1 unit?
  Hidden (Smoke Veil): does the enemy still see her mini? (UX assumes yes, translucent: GDD 12 says no hidden info.)

---

## 13. What the view needs from `core/` (for CODE)

All read-only queries on the public state; the UI never re-implements a rule.
- `LegalActions(state, hero)` with a **preview** per action and target: damage per unit (with ARM/Shield split),
  KOs, VP delta, gold delta (incl. assists), minions killed, Lane forecast delta, tower-dive shot (and "already shot
  this turn"), no-minion-cover warning for the final hex, forced-move final hexes and stop reason, pull-to-centre
  order and tie hexes, Stun timing ("this round" / round n) and Steadfast no-op, condition no-stack no-op, Poison
  total, Chain candidates per jump, Guillotine sum, execute threshold, Shadow Reset `grantsAction`, Bite damage,
  relic heal, Recall outcome.
- **Illegal targets with a reason code** (`NoLineOfSight`, `OutOfRange`, `OnCooldown(roundsLeft)`, `Rooted`,
  `Silenced`, `NeedsOwnWaveAtStructure`, `CoreClosed`, `Hidden`, `UltimateLocked(round)`, `NoActionsLeft`,
  `AlreadyUsedThisTurn`, `NotInBase`, `NoRecallOnMap`) so every disabled control can say why.
- `HasLineOfSight(from, to)` and a per-hex LoS mask for the aimed action (lit / hatched).
- `LaneForecast(lane)` incl. altar, Brood and spawn size; `Threat(hex, team)` with a per-source breakdown.
- `ActivationOrder`: slots this round with team, done/now/future, claimed hero, skip reason and skip count.
- `Undo` of the last Move when it triggered nothing (flag on the Move result: `undoable`).
- Event stream for the log and animations (who did what, results, Lane-phase steps).
