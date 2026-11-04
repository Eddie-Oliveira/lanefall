# Lanefall — Quick reference card (final UI copy, v1.0)

Owner: ux · Source: GDD v1.0 section 15, rewritten as player-facing copy · Opens with F1 / ? / ☰ → Quick reference /
Start → Quick reference. Also the "Learn" screen and the printable card.

**Sizing:** one screen, no scrolling at 1920×1080 (2 columns) and at 844×390 phone landscape (2 columns, 13 dp text,
section headers as tabs if UI scale > 110%). ~24 short lines. Values in `{braces}` are filled in **for this match**
(map, size, mode), so the card never shows numbers that don't apply. Each line has a "Show me" link that highlights the
matching on-screen cue (HUD.md 12) when opened during a match.

```
┌──────────────────────────────────── LANEFALL · QUICK REFERENCE ─────────────────────────────────────┐
│ WIN  Break their Core · or reach {8} VP first · or lead on VP after round {12}.                      │
│ VP   Hero KO 1 · Tower 3 · Drake 2 · Golem / Spider Queen 3.                                         │
├──────────────────────────────────────────────────┬───────────────────────────────────────────────────┤
│ A ROUND                                          │ LANES                                             │
│ 1 Everyone +1 gold; level-ups.                   │ Last hit: Attack the enemy wave = 1 minion,       │
│ 2 Teams take turns, one hero at a time, any hero │   +1 gold. "Wave 2" abilities kill 2. No denies.  │
│   that hasn't acted. The team behind on VP picks │ Lane phase: each side adds {2} minions.           │
│   who starts.                                    │   Power = minions + your heroes within 2 of the   │
│ 3 Lane phase.  4 Cooldowns −1.                   │   Front. More Power wins; the loser loses the     │
│                                                  │   difference. Wiped out → the Front moves 1.      │
│ YOUR TURN — 3 actions, each once, Move twice     │                                                   │
│ Move (SPD hexes) · Attack · Q · W · E · R        │ TOWERS                                            │
│ Free: Recall (ends your turn; next turn in base, │ Hurt a hero within 2 of their tower → it shoots   │
│   full HP; a hit cancels it) · Shop (in base, at │   you for 3. Under it without your minions → it   │
│   the start of your turn). FREE abilities cost   │   shoots you in the Lane phase.                   │
│   no action.                                     │ Only Attacks hurt towers (2), and only with your  │
│ Marksmen: Attack hits twice.                     │   wave there. Core opens when one lane's towers   │
│ Shade: a Q/W/E kill → +1 action (once a turn).   │   are all down.                                   │
│                                                  │                                                   │
│ DAMAGE  Attack = ATK − armor (min 1).            │ CONDITIONS — on your next turn                    │
│ Abilities = card number + POW, ignore armor.     │ Stun: skip it; then can't be Stunned until your   │
│ Shields soak damage first.                       │   next real turn ends (Steadfast).                │
│                                                  │ Root: no Move · Slow: −2 SPD · Silence: no Q/W/E/R│
│ LINE OF SIGHT  Hitting an enemy 2+ hexes away    │ Poison: lose HP at the start of your next 3 turns;│
│ needs a clear line. Walls block; units never do. │   base, Riptide or Cleansing Veil clears it.      │
│ Not needed: next to you, around you, on allies.  │ Knockback / pull: stops at walls and units.       │
│ Lines stop at the first wall.                    │                                                   │
├──────────────────────────────────────────────────┴───────────────────────────────────────────────────┤
│ LEVELS  2 at round 3 · 3 at round 5 (ultimate R) · 4 at round 7 · 5 at round 9.   {Frost Bridge: start│
│ at level 3, level 4 at round 3, 5 at round 5.}                                                       │
│ KO  Skip your next turn ({2 turns from round 8}), then back in base. Enemy +1 VP, killer +3 gold.     │
│ SHOP  3 slots · Basic 3 gold · Upgrade 7 (4 if you own its basic) · no selling.                      │
│ TIMER  {60} s a turn · +30 s bank once a match · time out = remaining actions skipped.               │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Fill-in values
| Field | Value |
|---|---|
| VP target | GDD 9 table by map and size (Rift 6/8/10/12, Twin Hollow 6/8/10/10, Frost Bridge 5/6/7/8) |
| Round limit | Rift 12 · Twin Hollow 12 (4v4: 10) · Frost Bridge 8 |
| Spawn | "2" in rounds 1–6, "3" from round 7 (the card updates) |
| Late KO | "2 turns from round 8"; Frost Bridge: "2 turns in the last round" |
| Timer | 60 s (1v1, 2v2, Commander) · 45 s (3v3, 4v4) · learning lobbies 90 / 60 · hidden offline |
| Recall line | Frost Bridge: "No recall on this map. Health relics heal 4." |
| Map line (added under VP) | Rift: "Drake round 3 · Golem round 6" · Twin Hollow: "Altars: Capture (1 action) = +1 Power in that lane, +1 gold a round · Spider Queen round 5" · Frost Bridge: "Health relics heal 4, back in 2 rounds" |
| Commander (added under A ROUND) | "You run 2 heroes. Yours and the enemy's alternate one by one — never both of yours in a row." |
| Draft section | Not on the in-match card (it's on the draft screen). The Learn version adds: "Coin flip for first pick; the other team picks who starts round 1. Snake: 1, then 2 each, last pick single. Heroes unique, no bans." |

### Changes from GDD 15 (and why)
- "Activation" → "turn"; "Front" kept (it is a named board piece).
- Dropped from the in-match card: draft rules (shown on the draft screen), "Haste" and "Cleanse" definitions (each
  hero that has them shows it on its card and in previews), the detail list of LoS exemptions (the board shows LoS while
  aiming; the card keeps the three cases a player plans around).
- Siege math ("tower kills 2, rest hit it for 1 each") moved to the lane forecast, which shows it at the right moment.
- Numbers that depend on the match are filled in, so the card is shorter and never wrong for the current map.
