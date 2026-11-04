# Lanefall — Game Design Document v1.0 (decided)

Owner: design · Status: **v1.0, decided** — Eddie answered Q1–Q17 on 2026-11-04 (raw answers and how each was applied:
`docs/design/decisions-2026-11-04.md`; summary in the Decision log, section 17). One new question is open (**Q18**, level 6).
History: r3 (14 heroes, draft, 18.2), r2 (Pyra LoS, Shade, 18.1), v1.0 decisions (18.3). Replaces the v0.3 rules (frozen in `prototype-web/`).
Inputs: `docs/design/research/tabletop-moba.md`, v0.3 `prototype-web/src/engine.js`, simulations in `docs/design/sim/`.
Why the redesign: `docs/design/v1.0-redesign-rationale.md`.

Tags used below: **from Skytear**, **from Rum & Bones**, **kept from v0.3**, **new**.
Anything marked **OPEN** is a decision for Eddie (section 17; only Q18 is open). Everything else in this document is decided.

---

## 0. The game in one paragraph

Two teams (1v1 to 4v4, bots fill empty seats; with 2 players the headline mode is **Commander**, 2v2 with two heroes each)
fight across a hex board. Each lane has a **Front**: a marker
showing where the two minion waves meet. Every round, the teams alternate single hero turns (3 actions each), then the **Lane phase** resolves
every lane with one comparison: whichever side has more **Power** (minions + heroes) there wins the clash and pushes
the Front toward the enemy tower. Last-hit minions for gold, buy items in base, kill heroes, take towers and
neutral objectives to score **Victory Points (VP)**. Destroy the enemy Core to win at once; otherwise the first team
to the VP target wins, or the leader when the round limit ends the match (12 rounds; 10 for 4v4 on Twin Hollow; 8 on Frost Bridge).

## 1. Design goals (priority order) and how this draft meets them

| # | Goal | How | Evidence |
|---|---|---|---|
| 1 | Learn in one match; a veteran recognizes every concept by name | One action budget (3 actions), one lane rule (Power), one tower rule, one damage rule, 5 conditions, 14 items in 3 slots. Every MOBA word kept: lane, wave, push, last hit, tower dive, jungle, Drake, recall, items, ultimate. | Rule count: section 15 fits on one card. |
| 2 | Short matches with a natural end | VP race + round limit (12; Twin Hollow 4v4 10; Frost Bridge 8). No overtime. | Sim: 1v1 20–29 min, Commander 32–50 min, 4v4 49–69 min; 100% of games end by the limit (section 16). |
| 3 | Low downtime at 4v4 online | Single activations alternating at every size (Eddie, Q2); 45 s activation timer at 3v3/4v4; plan during others' turns (previews, section 19 UX). | Wait between your own turns ≈ 5 min at 4v4 (duo turns would be 3¼; v0.3: whole enemy team + world phase). Known cost of Q2, 16.3. |
| 4 | 3D board in Unity, deterministic | Hex board, every unit on a hex, integer math, no dice, seeded RNG only for setup/bot tie-breaks. Lane state = 3 small numbers per lane. | Section 13. |

---

## 2. Components (what is on the 3D board)

| Piece | Count per match | Notes |
|---|---|---|
| Hero miniature | 2–8 (pool of 14, chosen in the draft, 10.2) | On a hex. Base ring shows team color + condition tokens. |
| Hero card (HUD) | 1 per hero | Stats, 4 abilities with cooldown pips, 3 item slots. |
| Front marker | 1 per lane | Sits on a lane node; the "where the waves meet" flag. |
| Minion miniatures | up to 6 per side per lane | Cosmetic stack around the Front marker; the **number** is the rule. Melee/caster looks are cosmetic. |
| Tower | 2 per lane-side (Twin Hollow, Frost Bridge) or 1 (Rift) | HP 8. Range 2. |
| Core | 1 per team | HP 12. Range 2. In the base. |
| Fountain | 1 per team | Base hexes. Full heal + shop. |
| Neutrals | per map | Wolf camps, Drake, Golem, Spider Queen. |
| Map features | per map | River, altars (Twin Hollow), health relics (Frost Bridge). |

## 3. The board

**Decision: hex grid.** Why: one distance rule in 6 directions (v0.3 used 8-direction squares where a diagonal step
counted as 1, which surprised players: Meat Hook's tip literally says "Diagonals count too"). Hexes read well on a 3D
table and are the Skytear standard (**from Skytear**). Pointy-top hexes, axial coordinates (CODE detail).

- **Lane nodes.** Each lane is a chain of numbered nodes, 2 hexes apart. Node 0 is the river/center. Negative numbers
  are Azure's side, positive are Ember's. The last node on each side is that team's Core.
- **Front.** Each lane's Front marker sits on one node. It starts on node 0.
- **Clash zone.** All hexes within 2 of the Front marker. Heroes standing there add Power to their side.
- **The wave lives on the Front hex.** You can Attack the enemy wave if the Front hex is within your range.
- Walls block movement and lines; allies can be passed through; you can't end on an occupied hex.
- **Line of sight (LoS)** (**new**, Eddie's playtest; same idea as Skytear, where heroes see through units). Draw a straight
  line from the center of your hex to the center of the target hex. It is **blocked if it passes through a wall hex**
  (blocking terrain). **Units never block LoS**: heroes, minions, neutrals and structures are all see-through. Your own
  hex and the target hex never block. A line that runs exactly along the edge between a wall and an open hex is **not**
  blocked (only a line that has walls on both sides of that edge is). Where LoS applies, a target out of LoS cannot be
  chosen; the board shows it (section 19, UX).
- **Who needs LoS — a board rule for everyone (v1.0, Eddie Q11):** every **enemy-targeted** Attack or ability whose
  target is **2 or more hexes away** needs LoS to its target (the enemy unit, the Front hex for the wave, or the
  **target hex** of an area; the other hexes of the area are then hit without further checks). Exempt:
  - **adjacent targets** (range 1 is never blocked) and **areas around yourself** ("every enemy within 2 of you":
    Blade Spin, Rot, Cleave, Tremor, Echo Slam, Tidal Wave, Leap's landing hit);
  - **ally and self effects and globals** (Mend, Barrier, Riptide, Current, War Bellow, Wish);
  - **Line abilities** travel the line instead: a wall stops the line there (Meat Hook, Shuriken, Piercing Shot, Gust,
    Crystal Arrow, Binding Light, Fissure, Charge); Chain jumps after the first target;
  - **Shadow Step** (Shade) still ignores walls; jumps and Blink use the 6.8 rules; **structures** shoot without LoS.
  No hero has LoS as a trait any more (the r3 Mage trait and Deadeye's hero trait are removed: it is now the rule).
  CODE detail: hex line by cube-coordinate lerp traced twice with a +ε and a −ε nudge; blocked only if *both* traces hit
  a wall. Use exact integer/fixed-point math so it is deterministic.

| Map | Board (hexes) | Lanes | Nodes per lane | Towers per side per lane (node) | Core node | Best for |
|---|---|---|---|---|---|---|
| The Rift | 17 × 17 | 3 | −4 … +4 | 1 (±3) | ±4 | 2v2–4v4 |
| Twin Hollow | 21 × 11 | 2 | −5 … +5 | 2 (±3 outer, ±4 inner) | ±5 | 1v1–3v3 |
| Frost Bridge | 19 × 7 | 1 | −4 … +4 | 2 (±2 outer, ±3 inner) | ±4 | any, fast |

Kept from v0.3: same three maps, same names, same identities (classic 3-lane / tight 2-lane with altars and a pit boss /
one long lane brawl). Map sketches: section 11.

---

## 4. Round structure

Before round 1 the lobby picks heroes (**hero draft**, 10.2). A match is a series of **rounds** (12 on The Rift and Twin Hollow, 10 for 4v4 on Twin Hollow, 8 on Frost Bridge; section 9). Each round:

1. **Start step** (automatic). Every hero +1 gold. Level-ups (section 6). Objectives that are due appear.
2. **Hero phase.** Teams alternate activations until every hero has activated once.
3. **Lane phase** (automatic, animated, ~15–30 s). Each lane resolves (section 5). Towers shoot.
4. **End step** (automatic). Cooldowns tick down by 1. Shields expire. Check victory (section 10).

**Who starts:** the team with **fewer VP chooses** which team activates first this round (catch-up lever).
Tied VP: the team that went second last round goes first. **Round 1:** the team that did **not** have first pick in the
draft chooses (10.2; Eddie Q16).

**Activation order inside the Hero phase — single activations alternating, at every size** (**from Skytear**; Eddie Q2):
the teams take turns activating **one hero at a time**, A, B, A, B, … until every hero has activated once. On its turn a
team chooses **any of its heroes that has not activated yet** this round.

| Size | Order each round | Turns between two of your own (yours excluded) |
|---|---|---|
| 1v1 | A B | 1 |
| 2v2 / Commander | A B A B | 3 |
| 3v3 | A B A B A B | 5 |
| 4v4 | A B A B A B A B | 7 |

- **Skipped activations** (KO respawn, Stun) still take their slot: when the team chooses that hero (or it is the team's
  last one), the skip resolves at once and the turn passes. Poison still ticks in a skipped activation (6.9).
- **Who on a team goes next (online, one hero per player):** the team's next slot goes to the **lowest seat that has not
  activated**, unless a teammate presses **"Go next"** during the enemy's turn (first press wins; the slot locks the
  moment the team's turn starts, so there is no race during your own turn). Hotseat and **Commander**: the player simply
  picks which hero goes.
- Duo turns (two allies at once) are **not** used (Eddie Q2). The cost is wall-clock time at 3v3/4v4; the two levers
  below bring 4v4 back under the 75-min target (sim, 16.3).

**Online timer:** 1v1 and 2v2 (incl. Commander): **60 s** per activation (90 s in tutorial / "learning" lobbies).
3v3 and 4v4: **45 s** (60 s in learning lobbies). Every player also has a **+30 s bank** once per match. Timeout =
remaining actions are skipped (the hero does not recall or move on its own).

### 4.1 Game modes and Commander (the 2-player mode, Eddie Q7)
| Mode | Players | Heroes | Notes |
|---|---|---|---|
| **Commander** (headline 2-player mode) | 2 (1 per team) | **2v2**, each player controls **both** heroes of their team | Online, hotseat, or vs a bot commander. Sim: 32–50 min on The Rift (target 30–45). |
| 1v1 duel | 2 | 1v1 | Quick match (20–29 min) and the tutorial (section 14). Still a team size, no longer the 2-player headline. |
| Team 2v2 / 3v3 / 4v4 | 4–8 | 1 per player, bots fill | Section 4 order and timers. |

**How a Commander plays two heroes with single alternation:** exactly the 2v2 order, **A B A B**. On each of your turns
you choose **one** of your heroes that has not activated yet and take its full activation (3 actions); then the enemy
takes one; then you activate your other hero; then the enemy's other hero. **Your two heroes never act back to back,
and you never move both at once** — they alternate with the enemy's one by one. Each of your heroes keeps its own HP,
items, gold, cooldowns and conditions (gold is not pooled). Timer: 60 s per activation (90 s learning), one +30 s bank
per player. Recall, shop, lanes: as for any hero. Recommended lanes on The Rift: one hero Mid, one Bot (11.1).

**Commander draft:** snake **A BB A** (10.2): you pick 1, the opponent picks 2, you pick your second.

**Starter pairs** (shown as a "Starter pairs" row in the Commander draft; pairs share no hero, so both players can take one):
| Pair | Heroes | Why it works |
|---|---|---|
| Shield & Bow | Bulwark (★) + Frostbow (★) | Shield Bash stuns, Frostbow's Twin Shot finishes; the classic bot-lane duo. |
| Blade & Light | Blademaster (★) + Lumen (★) | Lumen keeps the fighter in long fights; Binding Light roots divers. |
| Axe & Tide | Ravager (★) + Tidesinger (★★) | Current hastes Ravager onto a target; Riptide cleanses the Slow or Stun he walks into. |
| Quake & Flame | Quake (★★) + Pyra (★★) | Fissure stuns a line, Fireball and Echo Slam punish the clump. |

Advanced pairs (★★★ inside): Bramblehorn + Stormcaller (Earthshaker root, then Thunderstorm), Shade + Butcher (hook, then execute).

---

## 5. Lanes, minions, towers (the Lane phase)

**Decision: hybrid lane.** The rule is Skytear's (**from Skytear**: one comparison per lane, the winner pushes);
the table still shows minion miniatures and you still last-hit them (**kept from v0.3**: last hits = gold).
Minions never move or act on their own during the Hero phase; that removes the v0.3 world phase where every minion
was pathed and targeted individually.

### 5.1 Lane phase, per lane, in this order
1. **Spawn.** Each side adds **2 minions** to its wave in that lane (3 from round 7). Cap: 6 per side per lane.
2. **Power.** Each side's Power = its minions in the lane + its heroes standing in that lane's clash zone
   (+1 for an altar on Twin Hollow).
3. **Clash.** The side with more Power **wins**. The loser loses minions equal to the difference. Tie: nothing happens.
4. **Push.** If the loser has **no minions left**, the Front moves 1 node toward the loser. It cannot move past a standing tower.
5. **Siege.** If the Front is on an enemy tower (or on an open enemy Core), that structure **kills 2 of the winner's
   minions, then takes 1 damage per remaining winner minion**.

Minions killed in the Lane phase give no gold to anyone. Only heroes earn gold (last hits).

### 5.2 Heroes and minions
- **Last hit:** an Attack on the enemy wave kills 1 minion: **+1 gold** to you. (Frostbow's Twin Shot kills 2.)
- **Wave clear:** abilities marked **Wave N** also kill up to N minions in a clash zone they touch, +1 gold each.
- Minions never damage heroes. The danger in lane is enemy heroes and towers.
- **No denies** (Eddie Q8): you cannot Attack your own wave.
- Why it plays like a MOBA: farming the enemy wave makes your wave win the next clash and push (veterans know this as
  "farming pushes"); standing in lane adds Power (holding the lane); leaving a lane lets it be pushed in (rotating has a price).

### 5.3 Towers and Core — one rule (simplified tower aggro)
**Kept from v0.3 in spirit, cut to one rule:**

> **A tower shoots heroes who hurt heroes under it, or heroes who stand under it without their minions.**

- *Tower dive:* when you damage an enemy hero while you stand within 2 hexes of an enemy tower or Core, that structure
  hits you for **3 damage immediately** (once per activation; flat at every level, Eddie Q10).
- *No minion cover:* in the Lane phase, a structure whose lane has no attacking minions shoots the lowest-HP enemy hero
  within 2 hexes for **3**.
- Otherwise structures only shoot minions (step 5 above).
- **Heroes damage structures only with Attacks, and only while their own wave is at that structure** (backdoor
  protection): an Attack deals **2** to the structure (Frostbow 2 × 2; Quake's Totem doubles). Abilities never hurt structures (**from Skytear**: structures mostly fall to lane pressure).
- Order: outer tower, then inner tower, then the Core opens. The Core is **open** when every tower of **any one lane** is down
  (**kept from v0.3**).
- Destroying a tower: **+3 VP**, +2 gold to each hero of the team.

Dropped from v0.3: hero-aggro memory per round, per-target tower damage formulas (7 + round/6 vs heroes, 4 vs minions),
minion "+2 vs towers, +round/8" bonuses, tier invulnerability as a separate rule.

---

## 6. Heroes: stats, levels, the action economy

### 6.1 Stats (6, all small integers)
| Stat | Meaning |
|---|---|
| HP | Hit points. 0 = KO. |
| ATK | Damage of your Attack. |
| RNG | Attack range in hexes (1 = adjacent). |
| ARM | Armor: reduces each Attack you take by ARM (min 1 damage). **Does not reduce ability damage.** |
| SPD | Hexes per Move action. |
| POW | Added to every number on your ability cards (damage, heal, shield). Starts at 0. |

v0.3 had ARM *and* RES and physical/magic damage. v1.0 has one rule: **armor blocks Attacks, not abilities.**

### 6.2 The activation: 3 actions (**from Skytear** + **from Rum & Bones**)
On your activation you take **up to 3 actions**. **Each action at most once, except Move (up to twice).**

| Action | What it does |
|---|---|
| **Move** | Move up to SPD hexes. May be taken twice. |
| **Attack** | Hit one enemy (hero, minion wave, neutral or structure) within RNG for ATK. |
| **Q / W / E / R** | Use that ability if it's off cooldown (each ability is its own action). |
| **Capture** | Twin Hollow only: take the altar you stand on. |
| **Recall** (free) | Any time during your activation, even as the first thing. Ends your activation. |
| **Shop** (free) | At the start of your activation if you're in your base, or as you respawn. |

Typical turns: *Move, Attack, Q* · *Q, E, Attack* · *Move, Move, Attack* · *Move, Move, Recall*.

**Marksman extra attack (Eddie's request, kept):** **Twin Shot** is the **Marksman role trait** (r3: Frostbow and
Deadeye) — the Attack action hits twice (same or different targets, each hit reduced by armor separately, each needs
range and LoS, section 3; two last hits on a wave). This is how v1 answers Eddie's "Attack should be a free action for
marksmen, at least once a turn": a marksman gets two Attacks' worth of damage for one action, so Attack + 2 abilities
is a normal turn. It fits the no-repeat budget instead of being an exception to it (v0.3 needed a separate `freeAttack`
flag and a `freeUsed` tracker; the web prototype still uses the free-Attack form for both marksmen).

**Free abilities (r3, new on hero cards; items already had them):** an ability marked **Free** does not use one of your
3 actions. Still once per activation and still on cooldown. Not usable in an activation skipped to **Stun** (nothing
is, except Cleansing Veil, 6.6) or while **Silenced** (it is an ability); a Free dash or jump is not usable while **Rooted**.
Free abilities: Viper's Slither, Deadeye's Rocket Jump, Bramblehorn's War Bellow.

**Assassin reset (Eddie's request):** Shade's trait **Shadow Reset** gives her +1 action, at most once per activation,
when her Q, W or E **kills anything** — an enemy hero, a single minion (a last hit), or a neutral it claims (Eddie Q12,
option b). Full rule with Shade in section 10.

### 6.3 Cooldowns
Each ability shows **CD n**: after use, it is ready again **n rounds later** (CD 1 = every round). Shown as pips
on the card / a ring on the 3D ability icon. **Kept from v0.3** (cooldowns) but values are 1–4 instead of 1–7.

### 6.4 Levels — by round, not XP (**from Skytear**: power grows each turn)
All heroes level together at the start of fixed rounds. No XP bar, no XP sources to learn.

| Level | Reached (Rift / Twin Hollow) | Frost Bridge | Gains (cumulative) |
|---|---|---|---|
| 1 | Round 1 | — | — |
| 2 | Round 3 | — | +2 HP |
| 3 | Round 5 | Start | +4 HP, **ultimate (R) unlocked** |
| 4 | Round 7 | Round 3 | +6 HP, +1 ATK, +1 POW |
| 5 | Round 9 | Round 5 | +8 HP, +1 ATK, +1 POW |

Why: v0.3 used an XP table (0/3/7/12/18/25) fed by 6 different sources; nobody could predict when the ultimate came.
Now "ult at level 3, round 5" is on the card. Gold (from last hits, kills, towers) is the snowball and the skill expression.
**Decided (Q1):** levels by round + cooldowns + gold for items; no mana, no coin spending on abilities. **Level 5 is the
max level** in v1.0 (Viper's Poison is tuned to peak there, 10.3). Whether to add a level 6 is **OPEN Q18**.

### 6.5 Damage, healing, KO
- **Attack** damage = ATK − target ARM (min 1). **Ability** damage = number on the card + POW, ignores ARM.
- **Shield** absorbs damage first; expires at the start of the owner's next activation.
- **Heals** never exceed max HP.
- **KO:** the hero's mini is removed. The enemy team gains **+1 VP**. Killer **+3 gold**; every other enemy hero that
  damaged the victim this round **+1 gold** (assist).
- **Respawn (Eddie Q6):** a KO'd hero **skips its next activation**; if the KO happens in **round 8 or later**, it
  skips its **next 2 activations**. Then it starts the following activation on its Fountain at full HP (and may shop).
  (**from Skytear**: death costs about one turn; late deaths cost two, so late fights decide matches.) The KO removes all
  conditions and Poison. On Frost Bridge (8 rounds) the 2-skip only applies to KOs in the last round.
- Determinism: no dice, no crits, no random targets.

### 6.6 Conditions (fixed list of 5, **from Rum & Bones**: token until the end of the target's next activation)
| Token | Effect on the target's **next** activation |
|---|---|
| **Stun** | **Skip that activation entirely** (no actions, no Recall, no Free abilities or shop). |
| **Root** | Cannot Move (or dash/teleport). |
| **Slow** | SPD −2 (min 1). |
| **Silence** | Cannot use abilities (Q/W/E/R). |
| **Shield n** (good) | Absorbs n damage until the start of the owner's next activation. |

Same condition twice does not stack (keep one token; for Shield keep the higher number, for durations the longer).
**Duration (r3):** a condition lasts the target's next activation; a number in brackets is how many of its activations it
lasts, e.g. **Slow (2)** (Ravager's Hamstring). Structures and neutrals ignore conditions; Hidden (Shade) is a hero
state, not a condition. Removed from v0.3: Burn as a condition (damage over time with its own ticking order); r3's
**Poison** is Viper's hero trait with one fixed tick moment (6.9), not a sixth condition (Eddie Q17). **Haste** is a buff,
not a condition (6.9).

**Stun = skip the next activation (Eddie Q3)** and its safeguards:
- **Which activation:** a hero that has not activated yet this round skips this round's activation; one that already
  activated skips its activation next round. Stun always lasts **exactly one** activation (no "Stun (2)" exists).
- **Steadfast** (new, safeguard): after a hero's activation is skipped to a Stun, it **cannot be Stunned again until
  the end of its next activation** (a Stun on it does nothing; the rest of the ability — damage, knockback — still
  applies). Token: a grey ring. So every Stun is followed by at least one real turn: no stun-lock chains
  (Bubble → Horn Toss → Solar Flare). KO and respawn skips are not Stuns and give no Steadfast.
- **Cleanse saves the turn:** **Cleansing Veil** (item, free) can be used at the start of the activation you would
  skip: it removes the Stun and you take the activation normally with 3 actions (no Steadfast then). An ally's
  **Riptide** before your activation does the same.
- A Stun cancels a pending Recall; Poison still ticks in the skipped activation; being in base still heals.
- **Fewer, slower stuns (v1.0 review, 10.3):** Flame Ring (Pyra) and Earthshaker (Bramblehorn) now **Root** instead of
  Stun; Bubble (Tidesinger) CD 2 → 3. Stuns left: Shield Bash, Solar Flare, Dismember, Crystal Arrow,
  Bubble, Fissure, Horn Toss — 7 abilities on 6 heroes; only Bubble is a targeted ranged stun (Crystal Arrow and Fissure are lines that walls stop). `ttk.py --stun`:
  no stunner can KO a full-HP squishy in the 1v1 "stun + next activation" window except level-5 Frostbow, who one-shots
  anyway (16.4 #2); r3 Pyra (Flame Ring stun) could at level 3 (14 of 14 HP).

### 6.7 Recall and base (**kept from v0.3**, Eddie's requests)
- **Recall** is free at **any point** in your activation (before, between or after actions). It ends your activation.
- At the **start of your next activation** you appear on your Fountain, fully healed, and may shop; then you take your 3 actions.
- If you take damage before then, the recall is cancelled (you stay where you are). Stun also cancels it.
- **Being in your base heals you to full** at the start of each of your activations and at the end of each Lane phase. No potions exist.
- Frost Bridge has **no recall** (single-lane brawl tradition; Eddie Q9); health relics instead.
- Travel: leaving the base to your nearest tower is 1 Move; reaching the river node is 2–3 Moves.

### 6.8 Movement effects (r3: one definition for every hero)
Areas on the hex board: **radius 1** = the target hex and its 6 neighbors (the prototype's "3×3"); **radius 2** = also the
next ring, 19 hexes (the prototype's "5×5").

| Effect | Who moves | Rule |
|---|---|---|
| **Dash N** (Charge, Tumble, Slither) | you | Move up to N hexes along a path, like Move (through allies; Tumble also through enemies). Slow does not shorten it. |
| **Jump N** (Leap, Rocket Jump) | you | Place yourself on any free hex within N, **no wall hex on the straight line** (LoS rule, section 3); units do not block. |
| **Teleport** (Shadow Step, Omnislash, Blink Charm) | you | As written on the card; ignores walls. |
| **Knockback N** (Gust, Horn Toss) | target | Moves N hexes **straight away** from you (for a Line ability: along the line's direction). It stops early, with no extra damage, before a hex it could not stand on: wall, any unit (hero, neutral, structure), board edge. |
| **Pull** (Meat Hook) | target | Moves to the free hex next to you on the line (kept from r1). |
| **Pull to centre** (Earthshaker) | every enemy hero in the area | Each moves to the **free hex closest to the centre** that it can reach in **up to 2 steps** without crossing walls or units. Resolve closest-to-centre first; ties: the caster chooses (bots: fixed hex order). The centre hex counts. |

- **What can't be moved by others:** structures, neutrals and minion waves (the wave is a number on the Front, section 5),
  Hidden heroes (not targetable). Forced movement ignores Root and Shield (Root stops only your own Move/dash/jump/teleport).
- Forced movement can push or drag a hero **into tower range or a clash zone** (that is the point: veterans push divers into
  their tower). Being moved is not damage: it does not trigger the tower-dive shot by itself and does not cancel Recall
  (the damage that usually comes with it does).
- Previews show the final hex of every forced move (BOTS/UX use the same preview).

### 6.9 Other effects added in r3 (defined once here)
- **Cleanse** (Riptide; same as the Cleansing Veil item): remove all conditions (Stun, Root, Slow, Silence) and Poison
  from the target. It does not remove Shield, Haste, Hidden or item effects.
- **Haste** (Current) — a **buff, not a condition**: +2 SPD on each Move until the end of the target's **next**
  activation; cast on yourself it also covers the rest of this activation. Slow and Haste together = SPD +0. Not
  removed by Cleanse; a second Haste does not stack.
- **Missing-HP damage** (Guillotine): **+2 per full 5 HP the target is missing** (= 40%, rounded down). Missing HP =
  max HP − current HP **when the ability resolves** (after earlier hits this activation, before this hit). The preview
  shows the total. Example: a 20-HP hero at 10 HP takes 3 + 4 = 7.
- **Chain N** (Chain Lightning): after the first target, the bolt **jumps** to another enemy unit within **2 hexes of the
  last unit hit**, not hit yet, up to N times; the caster picks each jump (bots: preview score). Only the first target
  needs range and LoS. A minion wave counts as one unit when its Front hex is within 2 (the jump kills 1 minion, +1
  gold); neutrals count; structures never.
- **Poison n** (Viper's trait): at the **start of each of the target's next 3 activations** (skipped ones too), before
  anything else, it loses **n + Viper's POW** HP (ignores armor; Shield absorbs it like any damage). **v1.0 (Eddie Q17):
  POW is added to every tick**, like every other number on an ability card; the card numbers are lowered so her damage
  peaks at the max level (10.3). POW is read when the Poison is applied. A new Poison does not stack: keep the higher
  total and restart at 3. Heroes only.
  Removed by **Cleanse**, by **KO**, and by **being in your base** (recall arrival resolves first, so recalling clears
  it before it ticks). A Poison KO credits Viper (VP, gold); Poison damage is ability damage for the assist rule. Token:
  the n value with 3 pips.

---

## 7. Gold and items

### 7.1 Gold sources (one currency, all integers)
| Source | Gold |
|---|---|
| Start of match | 3 (Frost Bridge 6) |
| Every round (start step) | +1 |
| Last hit (each minion your Attack/ability kills) | +1 |
| Hero KO / assist | +3 / +1 |
| Tower destroyed | +2 each hero of the team |
| Drake / Golem / Spider Queen | +2 each hero of the team |
| Wolf camp | +2 to the hero who takes it |
| Altar held (Twin Hollow) | +1 each hero per round |

Sim: a hero earns **~24–37 gold per match** → about **4 purchases** (e.g. basic, upgrade, basic, upgrade).

### 7.2 Shop rules
- **3 item slots.** Shop only in your base (start of activation) or on respawn.
- **Basics cost 3. Upgrades cost 7**, or **4** if you own the basic they build from (it is replaced).
- Buying with full slots discards an item of your choice (no refunds, no selling).
- v0.3 had 17 items, 6 slots, selling at half, potions and unique/group rules; v1.0 has 14 items, 3 slots, 2 prices.
- Item names are original (v0.3 borrowed names from other games).

### 7.3 Item list (14)
| Basic (3) | Effect | Upgrades into (7, or 4 from the basic) | Effect |
|---|---|---|---|
| Iron Sword | +1 ATK | **Bloodthirst Blade** | +2 ATK; each Attack that damages a hero heals you 1 |
| | | **Piercing Edge** | +2 ATK; your Attacks ignore 1 ARM |
| Spell Tome | +1 POW | **Archstaff** | +2 POW, +2 HP |
| | | **Blink Charm** | +1 POW; once per activation, free: teleport 3 hexes (not while Rooted/Stunned), CD 2 |
| Heart Gem | +3 HP | **Titan Plate** | +7 HP |
| | | **Cleansing Veil** | +3 HP; free, once per activation, **even at the start of an activation you would skip to Stun** (then you act normally): remove all conditions and Poison, CD 3 |
| Padded Vest | +1 ARM | **Thorn Mail** | +2 ARM; a hero who Attacks you takes 1 damage |
| | | **Second Wind** | +1 ARM; the first time you'd be KO'd, revive at half HP instead; then it becomes a Padded Vest |
| Trail Boots | +1 SPD | **Swift Treads** | +2 SPD |

The shop screen shows 3 **recommended** items per hero (the bot build). Needs: UX.

---

## 8. Jungle and neutral objectives

**From Rum & Bones:** objectives are worth VP plus a lasting effect. **Kept from v0.3:** the Drake/Golem/Spider Queen
identities and the "last hit claims it" steal moment.

Rules shared by all neutrals:
- Neutrals have HP and ARM; heroes damage them with Attacks (minus ARM) and abilities.
- **Bite:** when a hero damages a neutral and it survives, it immediately deals its Bite damage to that hero.
- Damage stays on a neutral between activations (so the other team can **steal** it). The hero who deals the final
  point claims it for their team.
- Neutrals heal to full at the end of a round in which nobody damaged them.

| Neutral | Map | Appears | HP / ARM / Bite | Reward | Respawn |
|---|---|---|---|---|---|
| Wolf camp (2 per side, in each jungle) | Rift, Twin Hollow | Round 1 | 4 / 0 / 1 | +2 gold to the taker | 3 rounds |
| **Drake** (bot river) | Rift | Round 3 | 10 / 1 / 2 | **+2 VP**, team +1 ATK for the rest of the match (max 2 stacks), +2 gold each | 4 rounds |
| **Stone Golem** (top river) | Rift | Round 6 | 16 / 2 / 3 | **+3 VP**, **Aegis** to the taker (revive once at half HP), +2 gold each | 5 rounds |
| **Spider Queen** (center pit) | Twin Hollow | Round 5 | 16 / 1 / 3 | **+3 VP**, **Brood:** +2 minions in each of your lanes in the next Lane phase, +2 gold each | 4 rounds |
| Altar (×2) | Twin Hollow | Round 1 | — | **Capture** action while standing on it: +1 Power in its lane every Lane phase, +1 gold/round each | Can be recaptured; locked 1 round after a capture |
| Health relic (×2 per side) | Frost Bridge | Round 1 | — | Step on it: heal 4 | 2 rounds |

---

## 9. Victory

1. **Destroy the enemy Core → win immediately.**
2. **VP race:** first team to the VP target wins at once.
3. **Round limit:** after the last round's End step, most VP wins. Tie-breaks in order: towers destroyed, total Front advance
   (sum of lane nodes in your favor), hero KOs. Still tied → draw (sim: 1–3% of games; 9% at 4v4 Frost Bridge).

| VP sources | VP |
|---|---|
| Enemy hero KO | 1 |
| Tower | 3 |
| Drake | 2 |
| Stone Golem / Spider Queen | 3 |

| VP target | 1v1 | 2v2 | 3v3 | 4v4 | Round limit |
|---|---|---|---|---|---|
| The Rift | 6 | 8 | 10 | 12 | 12 |
| Twin Hollow | 6 | 8 | 10 | **10** | 12 (**4v4: 10**) |
| Frost Bridge | 5 | 6 | 7 | 8 | 8 |

Twin Hollow 4v4: VP target and round limit 10 (v1.0, pacing for single activations, 16.3; also 16.4 #3).

Replaces v0.3 **overtime** (cores crumbling 4 HP/round from round 25; 26 of 30 v0.3 bot games I ran reached it). The VP race
is visible from round 1 (**from Rum & Bones**: first to N VP; **from Skytear**: 3–5 turn games with several ways to win).
The HUD shows "Round 9 of 12" and both VP totals at all times. **Decided (Q5):** VP target + round limit.

---

## 10. Heroes (14: 2 per role)

All heroes: POW 0 at start. Numbers are for level 1 (see 6.4 for growth). "Wave N" = also kills up to N minions in a
clash zone the ability touches. Lines are in 6 hex directions. "Adjacent" = range 1. "Radius 1/2" areas, dashes, jumps,
knockback and pulls: 6.8. Cleanse, Haste, missing-HP damage, Chain, Poison: 6.9. **Free** abilities: 6.2.

### 10.1 Roles (7) and role traits
| Role | Heroes | Job | Role trait (shared by both heroes) |
|---|---|---|---|
| Tank | Bulwark, Butcher | Start fights, soak, peel | — |
| Fighter | Blademaster, Ravager | Win long melee fights, side-lane | — |
| Assassin | Shade, Viper | Kill the backline | — (each has its own: Shadow Reset / Poison) |
| Mage | Pyra, Stormcaller | Area damage and control from range | — (v1.0: LoS is now a board rule for everyone, section 3) |
| Marksman | Frostbow, Deadeye | Ranged Attack damage, weak early, strong late | **Twin Shot**: Attack hits twice (6.2) |
| Support | Lumen, Tidesinger | Heal, shield, save allies | — |
| Initiator | Quake, Bramblehorn | Open teamfights with area stuns | — |

**Why the Mage trait is gone, not replaced (v1.0, Q11):** LoS became the board rule, so a Mage "LoS trait" would say
nothing. A new Mage trait would be a buff, and Eddie asked for Pyra to be weaker; one fewer trait also keeps the card
short (goal 1). Pyra stays nerfed by her numbers instead (10.3: Pyroblast range 3, Flame Ring roots). Deadeye's LoS hero
trait is removed for the same reason (she needs LoS exactly as before). Difficulty (for the draft UI, 10.2,
and onboarding, section 14): **★ Easy**: Bulwark, Blademaster, Ravager, Frostbow, Lumen · **★★**: Butcher, Viper, Pyra,
Deadeye, Tidesinger, Quake, Bramblehorn · **★★★**: Shade (reset timing), Stormcaller (chains, knockback).

### 10.2 Hero draft (r3, Eddie's request: pick order by priority)
Before round 1 the lobby picks heroes. **Heroes are unique across both teams** (no mirror picks). The draft is public:
every lock-in is shown to both teams at once; a player's *hover* (not yet locked) is shown to their teammates only.

**Pick modes** (lobby setting):
| Mode | How | Default on |
|---|---|---|
| **Draft** | Snake order below, one pick at a time | The Rift, Twin Hollow |
| **Free pick** | Everyone picks at the same time; first to lock a hero gets it; same timer | (custom lobbies) |
| **All random** | Seeded draw from the pool, unique heroes, no role balancing (the "all random" tradition) | **Frost Bridge** (11.3) |

**Snake pick order:** the team with **first pick** (`A`, decided by a seeded coin flip, below) picks 1, then the teams
alternate **2 picks each**, and the last pick is a single. Order = `A`, then `BB`, `AA`, `BB`, … until both teams are full
(the prototype's `draftOrder(n)` gives exactly this; there `A` is always Azure).

| Size | Order | Picks | Heroes left to choose from at the last pick | Never picked |
|---|---|---|---|---|
| 1v1 | A B | 2 | 13 | 12 |
| 2v2 / Commander | A BB A | 4 | 11 | 10 |
| 3v3 | A BB AA B | 6 | 9 | 8 |
| 4v4 | A BB AA BB A | 8 | 7 | 6 |

Why snake: the first pick takes the strongest/most-wanted hero, and the other team answers with two (veterans know it
from ranked drafts). The last pick sees the most and can counter-pick.

- **Which seat picks (Eddie Q14):** the next seat of that team **that has not picked yet, in seat order** (seat 1 →
  seat 4; set in the lobby, where players may swap seats before the draft starts). In **Commander** the team's one player
  takes every pick of the team (below).
- **Pool check (14 heroes, 2 per role):** at 4v4 the 8th pick still chooses from 7 heroes. Because every role has 2
  heroes, both teams can always get one hero of any role they still want: `docs/design/sim/draft.py`, 4,000 bot-rule
  drafts per size: **0% of drafts** deny a team a wanted role (Tank, Mage, Marksman, Support), also when the other team
  takes the last hero of a role on purpose (denying costs it a duplicate role).
- **Bots draft** to fill missing roles, in this priority: **Tank, Mage, Marksman, Support, Fighter, Initiator,
  Assassin** (first role the team lacks that still has a free hero; random hero within the role, bot RNG stream; if every
  role is covered, any free hero). Same rule as the prototype's `botDraftHero`. A bot picks at once (UX may add a 1–2 s
  reveal delay).
- **Pick timer (online):** **30 s per pick** (45 s in learning lobbies; none in hotseat or vs bots only). On timeout the
  seat locks its **hovered** hero if it is still free, otherwise it gets the **bot rule** pick. A disconnected player is
  auto-picked the same way.
- **After the last pick:** 10 s team view (both line-ups, roles, recommended items), then round 1. No hero swaps in v1.
- **First pick (Eddie Q16, option d + c):** a **seeded coin flip** gives one team first pick; the **other team
  chooses which team activates first in round 1** (section 4; this replaces the round-1 coin flip). **Rematch** in the
  same lobby: first pick goes to the team that did not have it last match (no flip); the other team again chooses who
  starts round 1. Both edges are shown on the draft screen ("Ember: first pick · Azure: chooses round-1 start").
- **No bans in v1 (Eddie Q15)** — not until the pool has 3 heroes per role (21): with 14 heroes, 1 ban per team leaves
  a team without a wanted role in 84% of 4v4 drafts (`draft.py`); with 21 heroes, 6%.
- **Commander draft (2 players, 2v2, Eddie Q7):** same snake order **A BB A**: player A picks 1 hero, player B picks 2,
  player A picks 1, so **each player picks 2 heroes**. Heroes unique; same modes and 30 s pick timer. The team-needs hint
  and **starter pairs** (section 4.1) help new players pick two heroes that work together.
- **Determinism:** the draft is part of the match record: seed + pick list replays it (section 13).

### 10.3 Hero cards
In role order; the r3 hero follows its role partner.

### Bulwark — Tank · HP 16 · ATK 2 · RNG 1 · ARM 2 · SPD 3
MOBA reference: *sun-shield vanguard — walks in first, point-blank stun, area-stun ultimate.*
| Key | Ability | Effect | CD |
|---|---|---|---|
| Q | Shield Bash | Adjacent enemy: 2 dmg, **Stun**. | 2 |
| W | Iron Stance | **Shield 4** on yourself. | 2 |
| E | Charge | Dash up to 3 hexes in a line to an enemy: 1 dmg, **Slow**. Wave 1. | 2 |
| R | Solar Flare | Target hex within 2 and its 6 neighbors: 3 dmg + **Stun** to each enemy. Wave 3. | 4 |

### Butcher — Tank · HP 16 · ATK 2 · RNG 1 · ARM 1 · SPD 3
MOBA reference: *hook-and-devour tank — drags a target out of position and eats it.*
| Key | Ability | Effect | CD |
|---|---|---|---|
| Q | Meat Hook | Line 4: first enemy hero hit takes 3 dmg and is pulled adjacent to you. | 2 |
| W | Rot | 1 dmg to every adjacent enemy; you lose 1 HP. Wave 2. | 1 |
| E | Devour | Eat 2 minions of an adjacent wave (or a wolf camp at ≤4 HP): heal 3. Counts as last hits. | 2 |
| R | Dismember | Adjacent enemy: 5 dmg, **Stun**, heal half the damage dealt. | 4 |

### Blademaster — Fighter · HP 14 · ATK 3 · RNG 1 · ARM 1 · SPD 3
MOBA reference: *spinning juggernaut duelist — wins long fights, flurry finisher.*
| Key | Ability | Effect | CD |
|---|---|---|---|
| Q | Blade Spin | 2 dmg to every adjacent enemy. Wave 3. | 1 |
| W | Battle Cry | +1 ATK this activation and move 1 hex now. | 2 |
| E | Decisive Strike | Adjacent enemy: 3 dmg, **Silence**. | 2 |
| R | Omnislash | Teleport adjacent to an enemy within 3: 6 dmg (deterministic; v0.3's random targets removed). | 4 |

### Ravager — Fighter · HP 15 · ATK 2 · RNG 1 · ARM 1 · SPD 3
MOBA reference: *axe-swinging juggernaut — sticks to you, heals by cleaving, executes the wounded.* (vs Blademaster:
sustain and slows instead of teleport burst.)
| Key | Ability | Effect | CD |
|---|---|---|---|
| Q | Cleave | 2 dmg to every adjacent enemy; **heal 2 per enemy hero hit**. Wave 2. | 1 |
| W | Hamstring | Adjacent enemy: 2 dmg, **Slow (2)** (2 activations). | 2 |
| E | Leap | **Jump 3** (6.8) to a free hex: 1 dmg + **Slow** to each adjacent enemy where you land. Wave 1. | 2 |
| R | Guillotine | Adjacent enemy: 3 dmg **+ 2 per 5 missing HP** (40%, 6.9). | 4 |

### Shade — Assassin · HP 10 · ATK 3 · RNG 1 · ARM 0 · SPD 4
**Trait — Shadow Reset:** once per activation, when your **Q, W or E kills anything** (a hero, a minion, a neutral),
you get **+1 action** this activation. MOBA reference: *stealth assassin with an execute and kill resets.*
| Key | Ability | Effect | CD |
|---|---|---|---|
| Q | Shuriken | Line 3: first enemy hit takes 2 dmg. Wave 1. | 1 |
| W | Shadow Step | Teleport adjacent to an enemy within 4 (ignores walls): 2 dmg. | 2 |
| E | Smoke Veil | **Hidden** until your next activation (heroes and towers can't target you; ends if you deal damage) and move 1 hex. | 3 |
| R | Death Mark | Adjacent enemy: 4 dmg; then a hero left **at or below 1/5 of its max HP (rounded down)** is KO'd. | 4 |

**Death Mark execute = 20% of max HP, rounded down** (Eddie's playtest and Q13: v0.3 used 35%; the prototype uses 20%;
15% stays the fallback if level-5 one-shots on carries feel unfair, 16.4 #7). It is checked after the 4 damage, against max HP so it grows with the
target: tanks are executed earlier in HP terms than squishies, as a veteran expects from a % execute.

| Target max HP | 10–14 (squishy L1–L3) | 15–19 | 20–24 (squishy L5 + items) | 25–29 | 30–34 (tank L5 + items) |
|---|---|---|---|---|---|
| Executed at ≤ (20%, v1.0) | **2** | 3 | 4 | 5 | 6 |
| Executed at ≤ (15%, alt) | 1 (10–13) / 2 (14) | 2 | 3 | 3 (25–26) / 4 | 4 (≤33) / 5 |

Example: Death Mark unlocks at level 3, when a Shade-class hero has 14 HP: Death Mark KOs it from **6 HP** (4 dmg + execute
at ≤ 2). The v1.0-draft flat "≤ 4 HP" rule was 8 HP; v0.3's 35% would be 8 HP too.

**Shadow Reset — exact rule (v1.0, Eddie Q12 option b):**
> **Once per activation: if your Q, W or E kills something, take 1 more action.**
- "Kills something" = the ability **KOs an enemy hero**, **kills at least 1 minion** (any last hit, e.g. Shuriken
  hitting the wave), or **claims a neutral** (deals its final point). R, Attacks and items never trigger it.
- **Effect:** **+1 action this activation** (4 in total). "Each action at most once" still holds and the ability stays
  on cooldown, so the extra action **cannot re-use the ability that killed**; it can be any action she has not taken
  yet (or a second Move if she has used only one). The HUD shows a 4th pip.
- **Cap: once per activation.** A second kill in the same activation gives nothing. No chains.
- **Stunned:** she skips the activation (6.6), so there is nothing to refund. The extra action is lost if not used
  before the activation ends; Recall still ends the activation at once.
- **Why option b, not the r2 "wave wipe" rule (Eddie's condition):** a wipe means killing **every** minion left in the
  enemy wave in that lane. Pacing sim (`lanefall_sim.py`, 21,400 Shade lane activations): the enemy wave is empty
  36% of the time; when it is not, it holds **3.4 minions on average (median 3)** and 3+ minions 61% of the time; a
  single kill wipes it in only **6%** of her lane turns. Shade kills at most 2 minions per activation (Attack +
  Shuriken), so a wipe was possible in 24% of lane turns and usually needed about 3 kills. Eddie's rule for that case:
  switch to (b).
- **What (b) costs in balance (`ttk.py --shade`):** her best damage on one hero in one activation does **not** go up —
  Shuriken on the wave + Shadow Step + Attack + Death Mark is the same W + Attack + R she could already deal (9 + execute
  at level 3, 16 + execute at level 5). What she gains in lane is +1 gold and a 4th action for a Move or Smoke Veil
  (hit, then hide). Watch item 16.4 #8.
- Double KO (unchanged): a Shuriken KO on a hero at ≤ 2 HP lets her still Shadow Step + Attack + Death Mark a second
  squishy from **11 HP** (of 14) at level 3; from 20 HP (full) at level 5 with 3 items (≤ 9 / ≤ 16 without the reset).

### Viper — Assassin · HP 10 · ATK 2 · RNG 1 · ARM 0 · SPD 4
**Hero trait — Poison** (6.9): her abilities put **Poison n** on enemy heroes: **n + POW** damage at the start of each
of the target's next 3 activations. MOBA reference: *venomous stalker — bites, slips away, lets the poison finish the job.*
(vs Shade: damage over time instead of burst and execute; no Shadow Reset; scales late instead of spiking at level 3.)
| Key | Ability | Effect | CD |
|---|---|---|---|
| Q | Venom Fang | Adjacent enemy: 2 dmg, **Poison 1**. | 1 |
| W | Toxic Cloud | Target hex within 3, radius 1: **Poison 1** + **Slow** to each enemy hero. Wave 2. | 2 |
| E | Slither | **Free.** **Dash 3** (6.8). | 3 |
| R | Kiss of Death | Enemy within 2: 3 dmg, **Silence**, **Poison 2**. | 4 |

**v1.0 tuning (Eddie Q17: "combine trait and scaling with POW; level 6 the peak damage point").** POW (0 until level 4,
+1 at levels 4 and 5, +1–2 from items) now adds to every Poison tick, and Kiss of Death's Poison drops 3 → 2 so the
peak moves from level 3 to the **max level (5 in v1.0)**. Kiss of Death on a squishy: level 3: 3 + 2×3 = **9** of 14 HP
(r3: 12, a near-certain KO); level 5 with Spell Tome/Blink Charm (POW 2): 5 + 4×3 = **17**. `ttk.py --viper`
(average activations to KO all 14 heroes; rank among the 13 non-support attackers, 1 = strongest):

| Viper version | L1 | L3 | L5 + items (max) | L6* |
|---|---|---|---|---|
| r3: Poison 1/1/3, no POW | 3.0 (#6) | **2.4 (#1)** | 2.2 (#3) | 1.9 |
| Eddie's literal (c): 1/1/3 + POW | 3.0 (#6) | **2.4 (#1)** | 1.9 (#3) | 1.6 (#1) |
| **v1.0: 1/1/2 + POW** | 3.0 (#6) | 2.8 (#4) | **1.9 (#3)** | 1.6 (#1, tied with Deadeye) |

Her rank is best at the max level and she is not the strongest attacker there (Frostbow and Deadeye 1.8). *L6 is
hypothetical (+10 HP / +2 ATK / +2 POW cumulative) for **OPEN Q18**: with a level 6, she would tie for the strongest.
Counterplay is built in: Poison is public (token + pips), Riptide / Cleansing Veil cleanse it, and recalling clears it.

### Pyra — Mage · HP 10 · ATK 1 · RNG 2 · ARM 0 · SPD 3
No trait (v1.0: LoS is the board rule, 10.1). MOBA reference: *burst fire mage — area poke, point-and-click nuke.*
| Key | Ability | Effect | CD |
|---|---|---|---|
| Q | Fireball | Target hex within 3 and neighbors: 2 dmg to each enemy. Wave 3. | 1 |
| W | Flame Ring | Enemy within 3: 1 dmg, **Root**. | 2 |
| E | Scorch | Enemy within 3: 3 dmg. | 2 |
| R | Pyroblast | Enemy within **3**: 6 dmg. | 4 |

**v1.0: Pyra stays nerfed (Eddie's playtest).** With LoS now on every ranged hero, LoS alone is no longer a nerf *relative*
to the others, so two r2/r3 fallbacks are applied: **Pyroblast range 4 → 3** (nothing she has out-ranges Frostbow's
Attack) and **Flame Ring Stun → Root** (Q3 safeguard: with stun-skip, Flame Ring + her next activation KO'd a full-HP
level-3 squishy in a 1v1, `ttk.py --stun`). Her damage is unchanged (time-to-kill 2.6 / 2.6 / 2.4, mid-pack); the
nerf is reach and control. Frost Bridge has 2 wall hexes in the lane, so LoS barely matters there.

### Stormcaller — Mage · HP 10 · ATK 1 · RNG 2 · ARM 0 · SPD 3
No trait (v1.0, 10.1). LoS as for everyone: only the first target of Chain Lightning and the target hex of an area need it.
MOBA reference: *storm controller — bouncing lightning, area silence, blows divers away.* (vs Pyra: control over burst.)
| Key | Ability | Effect | CD |
|---|---|---|---|
| Q | Chain Lightning | Enemy within 3: 3 dmg, **Chain 2** (6.9): each jump 2 dmg (≈ 70%). Wave 1 (if a jump or the first hit is the wave). | 1 |
| W | Static Field | Target hex within 3, radius 1: 1 dmg + **Silence** to each enemy. Wave 2. | 3 |
| E | Gust | Line 3: first enemy hero hit takes 1 dmg and is **knocked back 2** (6.8). | 2 |
| R | Thunderstorm | Target hex within 4, **radius 2**: 3 dmg to each enemy. Wave 3. | 4 |

### Frostbow — Marksman · HP 10 · ATK 2 · RNG 3 · ARM 0 · SPD 3
**Role trait (Marksman) — Twin Shot:** your Attack action hits twice. MOBA reference: *frost-arrow marksman — kites with slows, long stun arrow.*
v1.0 LoS check: her Attack (RNG 3) and Volley's target hex now need LoS; Crystal Arrow (a line) and Tumble are unchanged.
No number change: she loses only shots through walls, and is already the slowest early damage dealer (16.4 #6).
| Key | Ability | Effect | CD |
|---|---|---|---|
| Q | Volley | Target hex within 3 and neighbors: 1 dmg + **Slow** to each enemy. Wave 3. | 2 |
| W | Frost Arrows | This activation: your Attacks deal +1 and **Slow**. | 2 |
| E | Tumble | Move 2 hexes (may pass through enemies). | 2 |
| R | Crystal Arrow | Line 6: first enemy hero hit takes 3 dmg, **Stun**. | 4 |

### Deadeye — Marksman · HP 9 · ATK 2 · RNG 4 · ARM 0 · SPD 3
**Role trait (Marksman) — Twin Shot:** your Attack action hits twice. (Her r3 Line of Sight hero trait is removed: LoS
is now the board rule, so she plays exactly as before while Frostbow and Lumen now share the constraint.) MOBA reference: *long-range sniper — out-ranges everyone, snares divers, cross-map finishing shot.*
(vs Frostbow: longest basic range in the game but fragile and needs clear lines; Frostbow kites with slows.)
| Key | Ability | Effect | CD |
|---|---|---|---|
| Q | Piercing Shot | Line 5: **every** enemy on it takes 1 dmg. Wave 2. | 2 |
| W | Snare Trap | Enemy within 4: 1 dmg, **Root**. | 2 |
| E | Rocket Jump | **Free.** **Jump 3** (6.8). | 3 |
| R | Headshot | Enemy hero within 7: 5 dmg **reduced by ARM** (min 1) like an Attack — it is a shot (the "physical" nuke; Piercing Edge applies). | 4 |

### Lumen — Support · HP 11 · ATK 1 · RNG 2 · ARM 0 · SPD 3
MOBA reference: *enchanter healer — keeps the carry alive, roots divers, global heal.* v1.0 LoS check: only her Attack
(RNG 2) gains a LoS need; Binding Light is a line and her heals, shield and Wish are exempt. No change.
| Key | Ability | Effect | CD |
|---|---|---|---|
| Q | Mend | Ally (or you) within 3: heal 3. | 1 |
| W | Binding Light | Line 4: first enemy hit takes 1 dmg, **Root**. Wave 1. | 2 |
| E | Barrier | Ally (or you) within 3: **Shield 3**. | 1 |
| R | Wish | Every allied hero, anywhere: heal 4. | 4 |

### Tidesinger — Support · HP 12 · ATK 1 · RNG 2 · ARM 0 · SPD 3
MOBA reference: *tide-priestess protector — bubbles divers, cleanses and speeds allies, wave ultimate.* (vs Lumen: peel
and mobility instead of raw healing.) v1.0: Bubble CD 2 → 3 (the only targeted ranged Stun left, 6.6); Bubble
needs LoS (section 3); Riptide, Current and Tidal Wave do not (ally / self-centred).
| Key | Ability | Effect | CD |
|---|---|---|---|
| Q | Bubble | Enemy within 3: 1 dmg, **Stun**. | **3** |
| W | Riptide | Ally (or you) within 3: heal 2, **Cleanse** (6.9). | 2 |
| E | Current | Ally (or you) within 4: **Shield 1** and **Haste** (+2 SPD, 6.9). | 2 |
| R | Tidal Wave | Every enemy within 2 of you: 2 dmg + **Slow**; every allied hero within 2 (you included): heal 3. Wave 2. | 4 |

### Quake — Initiator · HP 13 · ATK 2 · RNG 1 · ARM 1 · SPD 3
MOBA reference: *fissure-and-echo initiator — line stun, then one huge slam in the crowd.*
| Key | Ability | Effect | CD |
|---|---|---|---|
| Q | Fissure | Line 4: every enemy on it takes 1 dmg, **Stun**. Wave 2. | 3 |
| W | Enchant Totem | Your next Attack this activation deals double ATK (also vs structures). | 2 |
| E | Tremor | 1 dmg + **Slow** to every adjacent enemy. Wave 2. | 1 |
| R | Echo Slam | Every enemy within 2: 2 dmg, +1 per other enemy unit in range (heroes and minions, max +3). Wave 3. | 4 |

### Bramblehorn — Initiator · HP 15 · ATK 2 · RNG 1 · ARM 2 · SPD 3
MOBA reference: *armored horn-charger — tosses one target, shields the team, drags the whole fight together.* (vs Quake:
durable front-liner whose ultimate groups enemies for an ally's area spell.)
| Key | Ability | Effect | CD |
|---|---|---|---|
| Q | Horn Toss | Adjacent enemy: 2 dmg, **knocked back 1** (6.8), **Stun**. | 2 |
| W | Thick Hide | **Shield 3** on yourself. | 2 |
| E | War Bellow | **Free.** Every allied hero within 2 (you included): **Shield 2** (does not stack with another Shield: keep the higher). | 3 |
| R | Earthshaker | Target hex within 3, **radius 2**: **pull every enemy hero to the centre** (6.8), then 2 dmg + **Root** to each enemy in the area. Wave 3. | 4 |

v1.0 (Q3 safeguard): Earthshaker **roots** instead of stunning. With stun-skip, a radius-2 stun would delete a whole
team's next turns before an ally's area spell (16.4 #10); Root keeps the combo (they cannot walk out of Thunderstorm or
Echo Slam) but they still act. Horn Toss keeps its Stun.

### Time-to-kill (sim, `docs/design/sim/ttk.py`)
Activations a hero needs to KO a target from full HP, using its best damage each activation (2 abilities + Attack),
no shields/heals/teammates. Level 5 assumes the 3-item bot build.

| Attacker → target | Squishy L1 (Shade/Pyra/Frostbow) | Tank L1 (Bulwark) | Squishy L5 | Tank L5 | Avg vs all 14 (L1 / L3 / L5) |
|---|---|---|---|---|---|
| Blademaster | 2 | 4 | 2 | 4 | 2.5 / 2.5 / 2.6 |
| **Ravager** | 2 | 4 | 2 | 5 | 2.8 / 3.0 / 2.8 |
| Shade | 2 | 4 | 2 | 3 | 2.6 / 2.7 / 2.2 |
| **Viper** (incl. Poison ticks; v1.0 Poison + POW) | 2 | 4 | **1** | 3 | 3.0 / 2.8 / 1.9 |
| Pyra | 2 | 3 | 2 | 3 | 2.6 / 2.6 / 2.4 |
| **Stormcaller** | 2 | 4 | 2 | 3 | 2.9 / 3.4 / 2.4 |
| Frostbow | 3 | 7 | **1** | 3 | 4.3 / 4.0 / 1.8 |
| **Deadeye** | 2 | 5 | **1** | 3 | 3.4 / 3.4 / 1.8 |
| Butcher | 3 | 5 | 2 | 5 | 3.6 / 3.6 / 3.5 |
| Quake | 3 | 7 | 3 | 5 | 4.7 / 5.3 / 4.1 |
| **Bramblehorn** | 3 | 9+ | 3 | 9+ | 5.1 / 5.7 / 5.7 |
| Bulwark | 3 | 7 | 3 | 7 | 4.3 / 4.1 / 4.6 |
| Lumen | 7 | 9+ | 5 | 9+ | 7.9 / 9.0 / 7.2 |
| **Tidesinger** (v1.0 Bubble CD 3) | 7 | 9+ | 4 | 9+ | 8.1 / 8.1 / 6.1 |

**As targets** (average activations the 12 non-support heroes need to KO them, L1 / L5): Ravager 4.8 / 3.5 (Blademaster
4.3 / 3.5) · Viper 2.4 / 2.0 (Shade 2.4 / 2.0) · Stormcaller 2.4 / 2.5 (Pyra 2.4 / 2.5) · **Deadeye 2.2 / 1.8, the
easiest kill in the game** (Frostbow 2.4 / 2.0) · Tidesinger 3.0 / 2.7 (Lumen 2.9 / 2.7) · Bramblehorn 4.8 / 4.4 (Quake
4.2 / 3.4, Bulwark 5.2 / 4.4).

Reading: early fights take 2–3 activations (with single alternation about one round, so there is time to react or recall); tanks take
twice as long; marksmen are weak early and delete squishies late — the curve veterans expect. **Watch:**
Frostbow and Deadeye one-shot a full-HP squishy at level 5 with 3 damage items, and v1.0 Viper does too through her
Poison tick at the start of the target's activation (see 16.4). Ravager, Viper and
Stormcaller land within 0.4 activations of their role partner at levels 1 and 5 (Stormcaller is 0.8 slower at level 3:
control over burst; Viper is now behind Shade at level 3 and ahead at level 5: she scales). Deadeye shows 0.9 faster than Frostbow at level 1, but the table leaves out Frost Arrows, so they
are about even early and equal late. Bramblehorn has the lowest non-support damage (he trades it for ARM 2, two shields
and the biggest crowd-control area); Tidesinger deals more than Lumen and heals much less. The table
ignores geometry (LoS only removes targets, never damage), heals and shields (Ravager's Cleave heal, Bramblehorn's
shields), slows, forced movement and Frost Arrows' +1 (so Frostbow is ~1 activation faster early than shown).
Viper's Poison is counted when it ticks, in the target's activation. Numbers tuned with `ttk.py`: Chain Lightning 2 → 3,
Horn Toss 1 → 2, Piercing Shot 2 → 1; v1.0: Poison + POW with Kiss of Death Poison 3 → 2 (Viper, above), Bubble CD 3.
Death Mark in `ttk.py` now uses the 20% execute (it used the flat ≤ 4); no average changed.
Stun is not in this table (it removes turns, not HP); `ttk.py --stun` checks the 1v1 stun window (6.6).

**Shade, r2 rules** (`python3 docs/design/sim/ttk.py`, `shade_report`): largest *current* HP Shade KOs in one activation
(Shadow Step + best of Shuriken/Attack + Death Mark + execute), by execute rule:

| Target (max HP) | v1.0-draft ≤ 4 | v0.3 35% | **20% (v1.0)** | 15% (alt) |
|---|---|---|---|---|
| L3 squishy (14) | 13 | 13 | **11** | 11 |
| L3 Bulwark (20, ARM 2) | 12 | 15 | **12** | 11 |
| L5 + items Pyra (20) | 20 | 23 | **20** | 19 |
| L5 + items Frostbow (18) | 20 | 22 | **19** | 18 |
| L5 + items Blademaster (29) | 20 | 26 | **21** | 20 |
| L5 + items Bulwark (31, ARM 4) | 18 | 24 | **20** | 18 |

Reading: 20% is a small nerf at level 3 (cannot one-activation a fresh squishy: 11 of 14) and keeps the level-5 "assassin
deletes a full-HP carry" moment that Frostbow also has (16.4 #2). 15% removes that moment against Pyra (19 of 20).

---

## 11. Maps

Notation: `A`/`E` = Azure/Ember base (Fountain + Core), `▲` = tower, numbers = lane nodes (Azure-negative),
`~` = river, `w` = wolf camp, `D` Drake, `G` Golem, `Q` Spider Queen, `a` altar, `+` health relic, `#` wall.
Sketches are schematic: one character cell ≈ 2 hexes. Point-symmetric (**kept from v0.3**). Needs: CODE level data.

### 11.1 The Rift — 17×17 hexes, 3 lanes, 1 tower per lane-side
```
      x0     x1     x2     x3     x4     x5     x6     x7     x8
y0    T0 ─────── T+1 ─────── T+2 ─────── T+3▲ ────────── [ E ]
y1    │     ~                     w                   M+3▲  │
y2    T-1           G ~                        M+2         B+3▲
y3    │      #           ~               M+1      w         │
y4    T-2       w            ~  M0  ~                     B+2
y5    │           #       M-1           ~     #             │
y6    T-3▲     M-2     w                     ~ D          B+1
y7    │   M-3▲                    w                   ~     │
y8  [ A ] ─────── B-3▲ ─────── B-2 ─────── B-1 ─────────── B0
```
- Lanes: Top (T), Mid (M), Bot (B); 9 nodes each (−4 = Azure Core … +4 = Ember Core).
- Towers on nodes ±3; Cores on ±4. Drake in the bot river (round 3), Golem in the top river (round 6).
- 4 wolf camps (2 per jungle). Base → own tower: 1 Move; base → river node: 3 Moves.
- Recommended lanes at 4v4: Top 1, Mid 1, Bot 2 (carry + support). At 2v2 and in Commander: Mid + Bot.

### 11.2 Twin Hollow — 21×11 hexes, 2 lanes, 2 towers per lane-side
```
     x0   x2   x4   x6   x8  x10  x12  x14  x16  x18  x20
y0   ####################################################
y1        T-4▲ T-3▲ T-2  T-1  T0   T+1  T+2  T+3▲ T+4▲
y3   #         w    a(Top)             w         #
y5  [A]  T-5/B-5    #    w   [ Q ]   w    #    T+5/B+5 [E]
y7   #         w             a(Bot)    w         #
y9        B-4▲ B-3▲ B-2  B-1  B0   B+1  B+2  B+3▲ B+4▲
y10  ####################################################
```
- 11 nodes per lane (−5 = Azure Core … +5 = Ember Core). Towers on ±3 (outer) and ±4 (inner).
- **Spider Queen** in the central pit (round 5). **Altars:** the Top altar sits on Azure's half and powers the Top
  lane; the Bot altar mirrors it on Ember's half. Capture = 1 action while standing on it.
- 4 wolf camps. Recommended at 2v2 and in Commander: one hero per lane, roam to the pit at round 5.
- 4v4 on Twin Hollow: VP target 10, round limit 10 (section 9).

### 11.3 Frost Bridge — 19×7 hexes, 1 lane, 2 towers per side
```
     x0  x2  x4  x6  x8  x10 x12 x14 x16 x18
y0   ########################################
y1        +       #           ·       +
y3  [A]  -4  -3▲  -2▲  -1   0   +1  +2▲  +3▲  +4 [E]
y5        +       ·           #       +
y6   ########################################
```
- Nodes −4 … +4. Towers on ±2 (outer) and ±3 (inner). Core on ±4. No jungle, no objectives.
- **No recall**, 2 health relics per side. Heroes are drawn at random by default (seeded; **All random** pick mode, 10.2; the lobby can switch to Draft). Start at level 3 with 6 gold;
  level 4 at round 3, level 5 at round 5. 8 rounds.

---

## 12. Bots (what the rules expose so bots stay simple)

The rules are designed so a bot can be a short list of scored plans instead of a search over a big action space.

| Rules must expose | Why it keeps bots simple |
|---|---|
| `LegalActions(state, hero)` with a **preview** (damage, KOs, Front change, gold) for each | No bot-side re-implementation of rules; bots score previews. |
| `LaneForecast(state, lane)`: Power each side, who wins the next clash, Front change, tower damage | One function answers "is my lane safe / should I push". |
| `Threat(state, hex, team)`: max damage enemies can deal to that hex next activation, incl. tower dive rule, LoS and Stun (a stunned enemy deals 0 next turn) | Retreat/recall decisions = one lookup. |
| `HasLineOfSight(state, fromHex, toHex)` (section 3; every ranged enemy-targeted Attack/ability) | Bots hide behind walls from every ranged hero with one call; same function the UI uses. |
| `ActivationOrder`: whose turn, which heroes of that team are still unactivated, which will skip (KO, Stun) | Bots pick which hero to activate (Commander and bot teams) from one list. |
| Previews include **final hexes of forced movement** (knockback, pull, pull to centre), **Poison** total over 3 turns, **Chain** jump targets, Guillotine's missing-HP total | Bots score Gust-into-tower, Earthshaker + area spell, Poison kills without re-implementing 6.8/6.9. |
| `DraftState`: order, current seat, free heroes, each team's roles; `BotDraftPick(state, seat)` (10.2 rule) | Bot draft, timeout auto-pick and the UI's "suggested pick" are the same function. |
| Previews flag Shadow Reset (`grantsAction: true`; v1.0: any Q/W/E kill incl. a last hit) and Steadfast (Stun will have no effect) | The bot plans Shade's 4th action and skips useless stuns without simulating the rules. |
| Public state only: VP, round, levels, cooldowns, items, conditions, neutral HP and timers | No hidden info; bots and humans see the same. |
| Seeded RNG stream for bot tie-breaks (separate from game RNG) | Same seed → same bot moves → replayable tests. |

Suggested bot plan per activation (Needs: BOTS to own): **Recall** if HP ≤ 35% or can afford an upgrade while not in a
fight · **Kill** if a preview KOs a hero · **Objective** if up and enemies are dead/far · **Farm** (last hits, Wave abilities) ·
**Push** (Attack structure when own wave is there) · **Hold** (stand in clash zone). This is what the pacing sim uses
(`docs/design/sim/lanefall_sim.py`, ~40 lines of decision code). Difficulty = noise on scores + how often they use the forecast.

## 13. Unity board, determinism and online

- **Readable state:** per lane only (Front node, Azure wave, Ember wave); per hero (hex, HP, conditions, cooldowns, items);
  per structure HP; per neutral HP and timer; VP, round. Everything is an integer.
- **Deterministic:** no dice, no crits, no random targets. RNG (seeded, one stream) only for: the first-pick coin flip
  (10.2; the round-1 starting team is then a player choice), All random hero draw (10.2), bot tie-breaks and bot draft
  picks (separate stream). Match = seed + ordered pick list +
  ordered action list → exact replay.
- **Resolution order is fixed:** Lane phase resolves lanes in a fixed order (Top/Mid/Bot or Top/Bot); within a lane steps 1–5.
- **Single activations online (v1.0, Q2):** exactly one hero acts at a time, so the host validates one action stream;
  no simultaneous-action conflicts. The host also owns the "Go next" slot claims (section 4) and per-size timers
  (60 s / 45 s, +30 s bank). Needs: NET.
- **Presentation:** Lane phase animates minions marching to the Front, the clash, and the Front marker sliding (15–30 s total,
  skippable). Needs: ASSETS/UX.

---

## 14. Onboarding: the first match teaches in this order

Tutorial = a real 1v1 on The Rift vs an Easy bot with Mid lane only active for rounds 1–3 (other lanes unlock at round 4).
One new idea per round; the match continues normally after the script. Needs: UX (screens, prompts), BOTS (scripted Easy bot).

**Draft for new players (r3).** The tutorial has no draft: the player chooses from the 5 **★ Easy** heroes (10.1: Bulwark,
Blademaster, Ravager, Frostbow, Lumen) on one screen; the Easy bot gets Pyra. From the first real match on, the draft
screen helps without adding rules:
- A **"Recommended"** filter (on by default for a player's first 5 matches) shows the ★ Easy heroes first, with a
  "Good first pick" badge; every hero card shows its difficulty stars, role and a one-line job (10.1 table).
- A **"Your team needs"** hint names the roles your team lacks, in the bot priority order (Tank, Mage, Marksman,
  Support, …) and highlights the free heroes that fill them; "Suggested" = what the bot rule would pick.
- Learning lobbies use a 45 s pick timer; a timeout locks your hover or the suggested pick, never a random hero.
- One-line draft prompt in the first draft: "Pick order: one, then two each. Heroes are unique; fill what your team lacks."
- **First Commander match** (offered after the tutorial as the 2-player mode): the draft shows the **starter pairs**
  (4.1) first; one prompt on the first turn: "You command two heroes. Pick one to act; then the enemy acts; then your other."

| Round | Teaches | Prompt (≤ 1 line) |
|---|---|---|
| 1 | Move, Attack, **last hit** = gold | "Walk to the Front. Attack the enemy wave: each minion is 1 gold." |
| 1 end | **Lane phase**, Power, the Front | "More Power wins the clash and pushes the Front." |
| 2 | **Abilities, cooldowns**, the 3-action rule, **line of sight** | "3 actions, each once (Move twice). Abilities come back after their CD. Walls block shots." |
| 3 | **Level up**, enemy hero trades, conditions | "Everyone is level 2. A Stunned hero skips its next turn, then can't be stunned again right away." |
| 4 | **Tower rule** (dive), **Recall**, base heal, **Shop** | "Hurting a hero under their tower = 3 damage to you. Recall any time; base heals fully." |
| 5 | **Ultimate** (level 3), KO and respawn | "Your R is ready. A KO skips your next turn (2 turns from round 8)." |
| 6–7 | **Jungle** (wolf camp), **Drake**, stealing | "Last hit claims it. Drake = 2 VP and +1 ATK for your team." |
| 8+ | **VP race**, round limit, the Core | "First to 6 VP, or most VP after round 12, or break their Core." |

Always-on HUD helpers: the lane forecast arrow on each Front ("Azure wins next clash, pushes 1"), damage preview on hover,
tower range rings when you are within 4 hexes.

## 15. Quick reference (one screen / one card)

```
LANEFALL — QUICK REFERENCE
WIN   Break the enemy Core · or reach the VP target first · or lead on VP after the last round (12; Twin Hollow 4v4 10; Frost Bridge 8).
VP    Hero KO 1 · Tower 3 · Drake 2 · Golem / Spider Queen 3.
ROUND 1 Start: +1 gold, level-ups.  2 Teams alternate, ONE hero at a time, any unactivated hero
      (trailing team picks who starts; round 1: the team without first pick).  3 Lane phase.  4 Cooldowns −1.
COMMANDER (2 players)  2v2, you run both heroes: yours and the enemy's alternate one by one.
YOUR TURN  3 actions, each once (Move may be twice):
      Move (SPD hexes) · Attack (ATK − armor) · Q / W / E / R (off cooldown) · [Capture altar]
      Free: Recall (ends turn; home next turn, full heal, cancelled by damage) · Shop (in base).
      Free abilities don't use an action (once per turn, not while Stunned/Silenced).
      Marksmen (Frostbow, Deadeye): Attack hits twice.   Shade: once per turn, if Q/W/E kills anything (hero, minion, neutral) → +1 action.
LINE OF SIGHT  Everyone: hitting an enemy 2+ hexes away needs a clear line to it (or to the area's target hex).
      Walls block, units never do. Not needed: adjacent, around you, allies, lines (walls stop them), Shadow Step.
DAMAGE  Attacks: ATK − ARM (min 1). Abilities: card number + POW, ignore armor. Shields soak first.
CONDITIONS (your next turn; "(2)" = next 2 turns)  Stun: skip the turn, then Steadfast (can't be stunned until your next turn ends)
      · Root: no Move · Slow: SPD −2 · Silence: no abilities.
      Haste (buff): SPD +2.  Cleanse (Cleansing Veil even on a stunned turn): removes conditions and Poison.
      Poison n (Viper): lose n + her POW at the start of your next 3 turns; base clears it.
MOVED  Knockback / pull: walls and units stop it; structures, neutrals and waves never move.
LANE PHASE  Spawn 2 (3 from round 7) · Power = minions + your heroes within 2 of the Front ·
      more Power wins, loser loses the difference · loser wiped → Front moves 1 · at a tower: tower kills 2, rest hit it for 1 each.
LAST HIT  Attack the enemy wave = kill 1 minion = 1 gold. "Wave N" abilities kill N.
TOWERS  Hurt a hero under an enemy tower → it shoots you for 3. Under it with no minions → it shoots you in the Lane phase.
      Only Attacks hurt structures (2 dmg), and only with your wave there. Core opens when one lane's towers are down.
LEVELS  L2 round 3 · L3 round 5 (ultimate) · L4 round 7 · L5 round 9 (max).
KO     Skip your next turn (next 2 turns if KO'd in round 8+), then respawn in base. Enemy +1 VP, killer +3 gold.
SHOP   3 slots · Basic 3 gold · Upgrade 7 (4 if you own its basic).
DRAFT  Coin flip for first pick; the other team picks who starts round 1. Snake: 1, then 2 each, last pick single
      (4v4 A BB AA BB A; Commander A BB A = 2 heroes each). Heroes unique, no bans. 30 s per pick online. Frost Bridge: all random.
TIMER  60 s per turn (1v1, 2v2, Commander) · 45 s at 3v3/4v4 · +30 s bank once per match.
```

---

## 16. Simulation results (pacing and balance)

### 16.1 Method
- `docs/design/sim/lanefall_sim.py` implements sections 4–10 on an **abstract board** (each hero is in base / travelling /
  a lane's clash zone / at an objective; lanes are exactly the Front/wave/tower rules above). Heroes, items, levels,
  cooldowns, VP, round limits use the numbers in this document. Bots: the plan list in section 12, seeded.
- **v1.0 rules in the sim:** single activations alternating at every size (Q2), Stun = skip the activation with
  Steadfast (Q3), respawn skip 2 from round 8 (Q6), Twin Hollow 4v4 limit/VP 10, Flame Ring roots. `CFG` at the top of
  the file switches each lever; `--variants` prints the 4v4 lever comparison below.
- 500 games per map and size, random heroes. Run: `python3 docs/design/sim/lanefall_sim.py` (results in `results.jsonl`).
- **Minutes** = real activations × seconds per activation + skipped activations (KO, Stun) × 5 s + Lane phases
  (15 s + 5 s per lane). Seconds per activation (estimates, not playtest data): **1v1/2v2/Commander (60 s timer): 45 s
  expert / 70 s learning; 3v3/4v4 (45 s timer, 60 s learning): 40 s / 55 s** (assumes players use most of the shorter
  timer). Commander uses the 2v2 row (one player, same activations).
- Not modelled: hex geometry (range, lines, body-blocking, **line of sight**), the "no minion cover" tower shot, Hidden,
  Blink, Shadow Reset, Cleanse. The pacing sim still draws from the original 8 heroes; the six r3 heroes are in `ttk.py`
  and `draft.py` (their damage is within the original 8's range). Re-run once CODE has all 14 in `core/`.
- Baseline: v0.3's own bot sim (`prototype-web/src/sim.js` engine, 30 games across maps/sizes): rounds 13–39,
  **26/30 reached overtime**.

### 16.2 Results (v1.0 rules)
| Map | Size | Rounds mean (p10–p90) | Ends: Core / VP / round limit | Minutes all-human (expert / learning) | Minutes 1 human + bots | Wait between your turns (s) | KOs | Skipped activations (Stun) | Towers | First tower (round) | Last hits | Win A–B |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Rift | 1v1 | 10.8 (9–12) | 40% / 21% / 39% | 20 / 29 | 14 | 75 | 1.0 | 1.8 (0.7) | 0.8 | 7.7 | 13 | 47–52% |
| Rift | 2v2 / Commander | 10.0 (8–12) | 51% / 31% / 18% | 32 / 48 | 15 | 165 | 1.9 | 3.7 (1.5) | 1.4 | 7.2 | 25 | 48–52% |
| Rift | 3v3 | 9.6 (8–12) | 57% / 35% / 8% | 39 / 52 | 15 | 230 | 3.1 | 5.5 (2.1) | 2.1 | 6.9 | 36 | 47–53% |
| Rift | 4v4 | 10.0 (8–12) | 54% / 35% / 11% | **52 / 69** | 17 | 310 | 6.1 | 9.5 (2.8) | 1.9 | 7.0 | 44 | 46–54% |
| Twin Hollow | 1v1 | 11.0 (9–12) | 0% / 48% / 52% | 20 / 28 | 14 | 70 | 0.9 | 1.7 (0.6) | 1.1 | 7.8 | 15 | 47–51% |
| Twin Hollow | 2v2 / Commander | 10.7 (8–12) | 6% / 54% / 40% | 34 / 50 | 15 | 160 | 2.0 | 3.6 (1.3) | 2.0 | 7.2 | 29 | 48–51% |
| Twin Hollow | 3v3 | 11.3 (9–12) | 3% / 40% / 58% | 45 / 60 | 17 | 225 | 5.0 | 7.9 (1.9) | 1.6 | 7.6 | 39 | 52–48% |
| Twin Hollow | 4v4 (limit 10) | 9.6 (8–10) | 0% / 38% / 62% | **49 / 66** | 16 | 305 | 6.8 | 9.5 (2.1) | 1.1 | 7.3 | 39 | 44–56% |
| Frost Bridge | 1v1 | 7.7 (7–8) | 0% / 35% / 66% | 13 / 18 | 9 | 65 | 1.5 | 2.3 (0.8) | 0.8 | 6.0 | 14 | 39–58% |
| Frost Bridge | 2v2 / Commander | 8.0 (8–8) | 0% / 7% / 92% | 23 / 34 | 10 | 155 | 4.6 | 5.5 (1.3) | 0.2 | 6.4 | 22 | 47–48% |
| Frost Bridge | 3v3 | 8.0 (8–8) | 0% / 5% / 95% | 29 / 39 | 11 | 220 | 8.2 | 9.2 (1.5) | 0.0 | 6.4 | 23 | 46–49% |
| Frost Bridge | 4v4 | 8.0 (8–8) | 0% / 21% / 79% | 37 / 50 | 12 | 300 | 11.9 | 12.7 (1.7) | 0.0 | 6.8 | 23 | 48–42% |

(Win A–B do not sum to 100%: the rest are draws after all tie-breaks. "Round limit" includes tie-break endings.)

### 16.3 What the numbers say
- **Single alternation at 4v4 (Eddie Q2) — the cost and the fix.** With no other change, single activations make 4v4
  **57 / 86 min on The Rift and 65 / 97 min on Twin Hollow** (expert / learning; duo turns were 37 / 52 and 42 / 58 with
  the same accounting). Expert pace is under the 75-min target; learning pace is not. Levers tested
  (`lanefall_sim.py --variants`, 300 games each, 4v4):

| Lever (on top of single alternation) | Rift 4v4 min | Twin Hollow 4v4 min | Side effects |
|---|---|---|---|
| none (60 s timer, 12 rounds) | 57 / 86 | 65 / 97 | — |
| A: round limit 10 + VP 10 on both maps | 53 / 79 | 55 / 82 | Rift Core wins 56% → 31% (Cores fall late) |
| B: A + spawn 3 minions from round 5 | 53 / 80 | 55 / 83 | no gain: faster pushes are cancelled by the tower |
| E: 45 s timer at 3v3/4v4 only | 52 / 69 | 58 / 78 | Twin Hollow still over for learners |
| **v1.0: 45 s timer + Twin Hollow 4v4 limit/VP 10** | **52 / 69** | **49 / 66** | Rift unchanged (Core wins 54%); Hollow already ended on the limit 59% of the time |
| D: 45 s timer + limit/VP 9 on both maps | 44 / 59 | 45 / 60 | Rift Core wins 13%: Cores rarely matter; too much for one target |

  **Decision applied (smallest change that reaches the target): 45 s activation timer at 3v3/4v4 (60 s in learning
  lobbies) + Twin Hollow 4v4 round limit 10 and VP target 10.** Both are settings, not new rules; the 4v4 Rift rules
  are untouched. **Honest caveats:** the timer's effect is an assumption (players averaging 40 of 45 s, learners 55 of
  60 s) until playtests measure it; without it the rules-only change (A) leaves learning-pace 4v4 at ~80 min. And the
  **wait between your own turns at 4v4 is ~5 min (310 s)**, vs 3¼ min with duo turns — the downtime goal (section 1, goal 3) is
  only partly met; UX mitigates it (plan your turn with previews while others act, section 19).
- **3v3** needs nothing extra beyond the timer (39–45 expert, 52–60 learning).
- **2 players: Commander** (2v2, Eddie Q7) is **32–34 min expert / 48–50 learning** on The Rift / Twin Hollow — the
  30–45 target at expert pace; 1v1 stays the 20–29 min quick duel. Frost Bridge Commander: 23 / 34.
- **Stun-skip and late respawn (Q3, Q6) shorten matches slightly:** skipped activations take ~5 s, so they save ~3 min at
  4v4 vs the r3 rules (60 / 90 with 1-action stun and skip-1 respawn). The bots do not exploit stuns, so KOs did not
  rise in the sim; the stun-lock risk is checked with `ttk.py --stun` (6.6) instead.
- **Lane push speed** (one hero holding an empty lane, nobody defending, deterministic): Front reaches the Rift tower at
  **round 5**, tower falls **round 7**, Core falls **round 11**; with the hero also attacking the tower: round 6 / round 10.
  First towers in real sims fall around **round 7–8**.
- **Level 6 reach (for Q18):** matches that reach round 11: Rift 1v1 63%, 2v2 39%, 3v3 22%, 4v4 36%; Twin Hollow 1v1 69%,
  2v2 62%, 3v3 77%, 4v4 0% (limit 10).
- **Fights:** level-1 squishies die to 2 activations from a damage hero; tanks take 4–7 (time-to-kill table in section 10).

### 16.4 Known balance issues (to watch in playtests)
1. **Frost Bridge seat bias:** in 1v1 the team that does *not* start round 1 wins 58% vs 39%. Reacting last
   is worth more on a single lane. Mitigation: trailing team chooses who starts, and from v1.0 the team without first
   pick chooses who starts round 1 (Q16), so the side that gets this edge gives up first pick. If playtests confirm, give
   the round-1 starting team +1 gold or +1 VP (sim: +1–2 gold did not fix it). Rift 4v4 also shows 46–54 with single
   alternation (sim bots, small); track it with first-pick win rate (#15).
2. **Frostbow at level 5 with 3 Attack items** KOs a full-HP squishy in one activation. Candidate fix: Twin Shot's second
   hit −1 damage, or Piercing Edge only on the first hit.
3. **Twin Hollow 4v4** — applied in v1.0: VP target 10 and round limit 10 (pacing, 16.3). It still ends on the limit 62%
   of the time and Cores never fall there; fine if VP races feel close.
4. **Bot passivity:** sim bots trade little in 1v1 (0.9 KOs/match). Real players will fight more, which ends matches by
   VP sooner, not later.
5. **Dive shots** are rare in the sim (0.1–0.8 per match) because bots avoid them; the tower rule is untested under
   aggressive play.
6. **Pyra range (playtest, Eddie):** felt overpowered in v0.3. v1.0: LoS is a board rule (Q11), so it no longer singles
   her out; to keep her nerfed, **Pyroblast range 4 → 3** and **Flame Ring Stun → Root** are applied (10.3). Re-checked:
   Frostbow (Attack, Volley) and Tidesinger (Bubble) lose shots through walls, Lumen loses only Attack shots, Deadeye is
   unchanged. Watch Frostbow early (slowest early damage, now also needs LoS); if she feels weak, Volley range 3 → 4.
7. **Shade execute (playtest, Q13 decided 20%):** 35% → 20% of max HP (≤ 2 HP on a 14-HP squishy, ≤ 6 on a 31-HP tank).
   Level 5 + items Shade still KOs a full-HP Frostbow/Pyra in one activation (table in section 10), same as Frostbow #2.
   If that feels bad, test 15% before touching her damage.
8. **Shadow Reset (v1.0: any Q/W/E kill, Q12 b):** it now fires in most lane turns (Shuriken last hit). Burst on one
   hero does not rise (10.3), but she farms for free and gets a 4th action to Move or Smoke Veil away. Watch: Shade
   hit-and-hide in lane every round (fallback: the extra action cannot be Smoke Veil), and double KOs in 3v3/4v4.
9. **r3 — expected strong: Deadeye.** RNG 4 Twin Shot out-ranges every Attack (Frostbow 3, Pyra 2) and Headshot reaches 7;
   level 5 + items one-shots squishies like Frostbow (#2). She is the easiest kill in the game (9 HP, 1.8 activations at
   L5). v1.0: LoS no longer sets her apart (everyone needs it), so she is relatively a bit stronger. If she dominates
   lanes: Headshot range 7 → 5, then RNG 4 → 3.
10. **Earthshaker + an area spell.** Bramblehorn's radius-2 pull-to-centre sets up Thunderstorm, Fireball, Solar Flare
   or Echo Slam on a whole team. v1.0: it **roots** instead of stunning (with stun-skip, a whole team losing its turns
   was a wipe with no answer). With single alternation the area spell comes one enemy turn later, so enemies can react.
   Watch 4v4 teamfights; if it is now too weak: Root (2).
11. **Viper (v1.0, Q17): scales to the max level.** Kiss of Death Poison 3 → 2 and Poison + POW: level 3 average 2.8
   (was 2.4, the strongest), level 5 1.9 (#3 behind both marksmen). At level 5 with items her tick KOs a full-HP squishy
   at the start of its activation, like the marksmen's one-shots (#2); the answer is a cleanse **before** that activation
   (Riptide) or not being hit. Fallback: Venom Fang Poison 1 → 0 (+POW). Watch Toxic Cloud + Static Field (cannot walk out).
12. **r3 — expected weak: Bramblehorn's damage** (5.1–5.7 average activations to KO, worst non-support). Fine if he feels like
   a tank-initiator; if he feels useless in lane, Earthshaker 2 → 3 or Horn Toss CD 2 → 1.
13. **r3 — watch: Ravager's sustain.** Cleave (CD 1) heals 2 per hero hit (+POW): in a 2-hero brawl that is 4–6 HP per
   round, which `ttk.py` ignores. If fighters never die in 2v2 side lanes: heal 1 per hero.
14. **Stun = skip a turn (v1.0, Q3).** Safeguards: Steadfast (no second Stun until the target's next turn ends), Cleansing
   Veil/Riptide save the turn, Flame Ring and Earthshaker root, Bubble CD 3. `ttk.py --stun` (1v1, stun activation + the
   next one, vs a full-HP squishy): L1 best 7 of 10, L3 13 of 14 (Butcher), L5 + items 16 of 20 except Frostbow (34: she
   one-shots anyway, #2). In 2v2+ a stunned, focused squishy still dies (it would without the stun too: two enemy turns
   pass between yours). Watch whether Bulwark/Bramblehorn melee stuns (CD 2) feel oppressive in lane; fallback CD 3.
15. **Draft:** first-pick advantage is unmeasured (bots draft by role, not by strength). v1.0: coin flip + the other team
   chooses round-1 start (Q16). Track first-pick win rate and round-1-starter win rate in the first playtests.
16. **Late respawn (Q6):** skip 2 from round 8 makes late KOs worth two turns; with single alternation at 4v4 a hero KO'd
   in round 8 is out for ~14 enemy turns. Watch for snowball after the first late teamfight (fallback: skip 2 from round 10).

---

## 17. Decision log and open questions

### 17.1 Decision log (Eddie, 2026-11-04)
Eddie answered Q1–Q17 through the decisions form. His raw answers, notes, and how each was applied are in
**`docs/design/decisions-2026-11-04.md`**. Summary (★ = differs from the design agent's recommendation; the GDD follows Eddie):

| # | Topic | Decision | Where |
|---|---|---|---|
| Q1 | Power resource | Levels by round + cooldowns + gold for items | 6.4, 7 |
| Q2 ★ | Who activates at 3v3/4v4 | Single heroes alternating at every size; no duo turns. Made to fit 75 min with a 45 s timer at 3v3/4v4 and Twin Hollow 4v4 limit/VP 10 | 4, 9, 16.3 |
| Q3 ★ | Stun | Skip the next activation; safeguards: Steadfast, cleanse saves the turn, Flame Ring + Earthshaker root, Bubble CD 3 | 6.6, 10.3 |
| Q4 | Lanes | Front + Power, minion minis, last hits | 5 |
| Q5 | Ending | VP target + round limit | 9 |
| Q6 ★ | Respawn | Skip 1 activation; skip 2 if KO'd in round 8+ | 6.5 |
| Q7 ★ | 2-player mode | **Commander**: 2v2, each player controls 2 heroes (headline); 1v1 stays as a quick duel | 4.1, 10.2 |
| Q8 | Denies | None | 5.2 |
| Q9 | Frost Bridge recall | No recall, health relics | 6.7, 11.3 |
| Q10 | Tower dive damage | 3 flat | 5.3 |
| Q11 | Line of sight | Board rule: every enemy-targeted ranged Attack and ability; allies/globals exempt; Shadow Step ignores walls. Mage LoS trait removed (no replacement); Pyra nerfed by numbers | 3, 10.1, 10.3 |
| Q12 | Shadow Reset | Eddie: (a) unless a wave wipe needs ~3 kills, then (b). Measured: a non-empty wave holds 3.4 minions (median 3), so **(b): any Q/W/E kill incl. a single last hit, once per activation** | 6.2, 10.3 |
| Q13 | Execute | 20% of max HP, rounded down | 10.3 |
| Q14 | Who takes each pick | Next seat in seat order; seat swap in the lobby | 10.2 |
| Q15 | Bans | None until 3 heroes per role | 10.2 |
| Q16 | First pick | Coin flip for first pick; the other team chooses who starts round 1; rematches alternate first pick | 4, 10.2 |
| Q17 ★ | Viper | Poison stays her trait **and** adds POW; Kiss of Death Poison 3 → 2 so she peaks at the max level | 6.9, 10.3 |

### 17.2 Open question for Eddie (recommendation marked)

| # | Question | Options | Recommendation |
|---|---|---|---|
| Q18 | **Should v1 have a level 6?** Your Q17 note says "level 6 being the peak dmg point"; v1.0 tops out at **level 5 (round 9)**, the prototype at 6. Viper is tuned to peak at level 5 for now. | (a) Keep 5 levels; level 5 = max = Viper's peak *(v1.0 as written)*; (b) add **level 6 at round 11** (Frost Bridge: round 7): +10 HP, +2 ATK, +2 POW cumulative (i.e. +2 HP, +1 ATK, +1 POW over level 5), quick-reference LEVELS line gets one more step | **(a)**. Pacing: round 11 is reached in only 22–39% of Rift team matches (3v3 22%, 4v4 36%), **0%** of Twin Hollow 4v4 (limit 10), but 63–77% of 1v1 and Hollow 2v2/3v3 — so level 6 would be a 1–2 round bonus that many matches never see. Balance: at a level 6 Viper ties Deadeye as the strongest attacker (1.6 activations, `ttk.py --l6`); (b) would need Kiss of Death Poison 2 → 1 or no POW at level 6. If you want (b) for the feel of a late power spike, I would pair it with that Viper change. |

## 18. Changes from v0.3

| Area | v0.3 | v1.0-draft | Source |
|---|---|---|---|
| Grid | 15×15 squares (Rift), 8 directions, diagonal = 1 | Hex grid, 6 directions; Rift 17×17, Hollow 21×11, Bridge 19×7 | from Skytear |
| Turn order | Whole team acts, then the other team, then a world phase | Single activations alternating at every size, then Lane phase (v1.0: no duo turns) | from Skytear (Eddie Q2) |
| Action budget | MOV tiles + 1 action + "free/quick" abilities + free item uses + marksman free attack | 3 actions, each once, Move twice; Recall/Shop free | from Skytear / Rum & Bones |
| Marksman | First basic attack free each turn | Twin Shot: Attack action hits twice | kept (Eddie), reshaped |
| Minions | Individual units: pathing, 3-way target priority, stats scale with round | Wave count per lane; Power clash; Front marker; minis cosmetic | from Skytear (hybrid) |
| Last hits | Gold 20/28 per minion | +1 gold per minion | kept |
| Towers | HP 40/46, range 2, aggro on heroes that hit heroes this round, scaling damage, minion bonus vs towers | HP 8, one rule: dive = 3 dmg; no minion cover = shot; only Attacks with own wave hurt them | simplified |
| Core | HP 60; overtime −4/round from round 25 | HP 12; VP race + round limit | from Rum & Bones / Skytear |
| Win | Core only (+ overtime tiebreak on kills) | Core, or VP target, or VP lead at round limit | from Rum & Bones |
| Levels | XP table 0/3/7/12/18/25, 6 levels, 6 XP sources | Levels by round, 5 levels, ultimate at level 3 = round 5 | from Skytear |
| Stats | HP, ATK, RNG, MOV, ARM, RES, PWR + per-level growth per hero | HP, ATK, RNG, ARM, SPD, POW; same level gains for all | simplified |
| Damage | Physical vs magic (ARM/RES), true damage, crits (30%) | Attacks − ARM; abilities ignore ARM; no crits | new |
| Randomness | Crits, Omnislash random targets, unseeded `Math.random` | None in rules; seeded RNG for setup/bots only | new (determinism) |
| Conditions | Stun, root, slow, silence, burn; ticks at end of team phase / world phase | Stun (skip the turn, then Steadfast), Root, Slow, Silence, Shield; all "your next turn" | from Rum & Bones (stun: Eddie Q3) |
| Cooldowns | 1–7 turns | 1–4 rounds | kept, smaller |
| Items | 17 items, 6 slots, prices 50–1800, sell, potions, unique/group rules | 14 items, 3 slots, 3 / 7 gold, no selling, no potions | simplified |
| Gold | 15/round, 20–28 last hit, 100+20×lvl kill, 50 assist, 80 tower, 45 camp | 1/round, 1 last hit, 3 KO, 1 assist, 2 tower, 2 camp | rescaled |
| Recall | Any time; home at the start of next turn unless damaged | Same, now explicitly free at any point in the activation | kept (Eddie) |
| Base | Full heal in base, no potions needed | Same; potions removed entirely | kept (Eddie) |
| Respawn | 1 + ceil(lvl/2) + floor(round/15) turns | Skip 1 activation; 2 if KO'd in round 8+ | from Skytear (Eddie Q6) |
| Neutrals | HP grows +1/round; retaliate to aggro holder; heal 4/round | Fixed HP; Bite on the hitter; full heal if untouched; last hit claims | simplified |
| Objectives | Drake +1 ATK/PWR team; Golem Aegis; Queen +2 for 8 rounds; altars +1 ATK/PWR & gold | Same identities + VP (2/3/3); altars give lane Power + gold | from Rum & Bones (VP) |
| Frost Bridge | No recall, start lvl 3, 1100 gold, random heroes, overtime 16 | No recall, start lvl 3, 6 gold, random (seeded), 8 rounds | kept |
| Heroes | 8 heroes, 4 abilities each, numbers in v0.3 scale | Same 8, same roles and ability identities, v1.0 numbers; r3: 14 heroes, 2 per role | kept, rescaled; r3 new |
| Hero select | No draft (the prototype's later lead patch adds one) | Snake draft (A BB AA BB A), coin flip for first pick, unique heroes, no bans, 30 s timer, bot role-fill; Free pick; All random (Frost Bridge default) | new (Eddie, r3, Q14–Q16) |
| 2-player mode | 1v1 or hotseat teams | **Commander**: 2v2, each player runs 2 heroes; 1v1 kept as a duel | new (Eddie Q7) |
| Role traits | Frostbow's free first Attack; Pyra LoS (patch) | Marksman: Twin Shot (Mage LoS trait removed in v1.0: LoS is a board rule) | reshaped (r3, v1.0) |
| Effects | Knockback, pull, burn, cleanse, haste in prototype code, each with its own rule | One definition each: 6.8 (dash, jump, knockback, pull, pull to centre), 6.9 (cleanse, haste buff, missing-HP, chain, Poison); still 5 conditions | new (r3) |
| Line of sight | None (prototype patch after v0.3: Pyra needs LoS, walls only) | Board rule for every enemy-targeted ranged Attack and ability (allies, globals, Shadow Step exempt) | new (Eddie playtest, Q11) |
| Shade execute | Hero left under 35% HP (prototype patch: 20%) | 20% of max HP, rounded down (≤ 2 HP on a 14-HP squishy); 15% to test | Eddie playtest |
| Shade reset | None (prototype patch: Q/W kill of any unit clears her "acted" flag, no cap) | Any Q/W/E kill (hero, minion, neutral) → +1 action, once per activation | Eddie playtest + Q12 (b), capped |
| Viper's Poison | Burn condition (v0.3); prototype Poison | Hero trait, Poison n + POW for 3 activations, peaks at the max level | Eddie Q17 |

### 18.1 Revision r2 (Eddie's v0.3 playtest feedback)
- Pyra: line of sight on every Attack and ability (section 3 rule, section 10). Numbers unchanged; fallback Pyroblast 3.
- Shade: Death Mark execute 20% of max HP (15% alternative); Shadow Reset trait with a once-per-activation cap.
- New open questions Q11–Q13. Quick reference, bots API (section 12) and hand-offs updated.

### 18.2 Revision r3 (Eddie: 2 heroes per role, hero draft)
- Six heroes, one more per role, translated from the prototype into v1 numbers: Ravager, Viper, Stormcaller, Deadeye,
  Tidesinger, Bramblehorn (section 10). Roles table with role traits and difficulty stars (10.1).
- Twin Shot becomes the Marksman role trait (Frostbow + Deadeye); Line of Sight the Mage role trait (Pyra + Stormcaller),
  plus Deadeye. Free abilities defined on hero cards (6.2).
- New effects defined once: dash/jump/knockback/pull/pull-to-centre (6.8); cleanse, haste, missing-HP damage, chain, Poison
  (6.9); condition durations "(2)" (6.6). Condition list stays at 5.
- Hero draft: snake order, modes, seats, bot rule, timer (10.2); onboarding draft help (14); quick reference DRAFT line (15).
- Balance: `ttk.py` extended to 14 heroes (table in section 10); `draft.py` new (pool and bans). Six new notes in 16.4,
  new open questions Q14–Q17.

### 18.3 v1.0 (decided): Eddie's answers to Q1–Q17 (2026-11-04)
- Raw answers and how each was applied: `docs/design/decisions-2026-11-04.md`; summary table in 17.1; Q18 (level 6) open.
- Turns: single activations alternating at every size; "Go next" slot claims; 45 s timer at 3v3/4v4 (60 s learning);
  Twin Hollow 4v4 VP target and round limit 10 (section 4, 9; pacing in 16.3).
- Conditions: Stun skips the activation + Steadfast; Cleansing Veil can save a stunned turn; Flame Ring and Earthshaker
  root, Bubble CD 3 (6.6, 10.3). Respawn skip 2 from round 8 (6.5).
- Modes and draft: Commander (4.1) with starter pairs; coin flip for first pick, the other team picks the round-1
  starter, rematches alternate; seat order; no bans (10.2).
- LoS is a board rule (section 3); Mage and Deadeye LoS traits removed; Pyroblast range 3 (10.1, 10.3).
- Shade: Shadow Reset on any Q/W/E kill (wave data in 10.3). Viper: Poison + POW, Kiss of Death Poison 2 (10.3).
- Sims: `lanefall_sim.py` has the v1.0 rules, a `CFG` lever table and `--variants`; `ttk.py` has `--viper`, `--stun`,
  `--l6`, `--shade` reports and the 20% execute. Sections 0, 1, 12–16 and 19 updated.

---

## 19. Hand-offs
**v1.0 is the build target.** Where an older bullet below (r2/r3) conflicts with the v1.0 block at the end, v1.0 wins
(e.g. duo turns, Pyra-only LoS, Stun = 1 action, wave-wipe reset).
- **CODE:** implement sections 3–11 in `core/` (pure C#), with the bot API in section 12 and replays in section 13. The Python sim is the reference for expected outcomes.
- **BOTS:** plan-scoring bot over `LegalActions` previews (section 12); scripted Easy bot for the tutorial.
- **ASSETS:** see the CHANGELOG "Needs" list (miniatures, board tiles, markers, tokens).
- **UX:** HUD (hero card, VP/round bar, lane forecast arrows, tower range rings, damage previews), shop screen, tutorial (section 14), quick-reference card (section 15).
- **UX (r2, v1.0: for every ranged hero):** when a hero is selected or an ability is aimed, the board shows **what it can see**: in-range hexes in LoS
  highlighted, in-range hexes blocked by walls shaded/hatched, the sight line drawn to the hovered target, and "No line of
  sight" in the preview instead of a damage number. Enemy view: hovering a hex shows whether Pyra can hit it (via Threat).
  Shade: the action pips show a 4th "reset" pip when Shadow Reset fires; the Death Mark preview shows the execute
  threshold ("executes at ≤ 2 HP") on the target's HP bar.
- **CODE (r2):** `HasLineOfSight` with unit tests (edge-grazing lines, units not blocking), Pyra targeting filtered by it,
  execute = maxHP / 5 integer division, Shadow Reset as an action-budget refund with a per-activation flag.
- **NET:** single-activation turn stream (v1.0; duo turns dropped), action log + seed replay, turn timers.
- **CODE (r3):** draft phase before round 1 in `core/` (state: order, current seat, picks; `draftOrder(n)` as in 10.2;
  uniqueness; modes Draft / Free pick / All random; timeout = hover or `BotDraftPick`); six heroes; Free abilities;
  forced movement (6.8, with blocked-hex stops and the pull-to-centre resolution order); Cleanse, Haste buff, condition
  durations, missing-HP damage, Chain, Poison tick at the start of the poisoned hero's activation after recall arrival
  (6.9); Twin Shot and LoS as role traits; previews for all of these (section 12). Unit tests: knockback into wall/unit/edge,
  pull-to-centre with 3 heroes and a blocked centre, Poison cleared by recall, Chain over a wave, Guillotine rounding.
- **BOTS (r3):** draft by role priority (10.2); play the six heroes from previews (Gust/Horn Toss toward own tower,
  Earthshaker when ≥ 2 heroes in radius 2, Riptide on a stunned ally, Kiss of Death on a healer/mage, keep Rocket Jump
  for escape); respect Poison when deciding to recall. Suggestion: in 1v1 bots skip Tank/Support in the draft
  (a tank-vs-tank duel is slow) — BOTS' call, Eddie to confirm.
- **UX (r3):** draft screen — pick-order strip (A BB AA BB A with seat avatars, current pick highlighted), role filter
  + "Recommended" filter, hero card (stats, 4 abilities, role trait, difficulty stars, MOBA one-liner), hover vs lock-in
  button, 30 s timer ring, "Your team needs" hint (section 14), 10 s team view. Board: forced-move arrows in previews,
  Poison token with 3 pips, Haste icon, chain jump lines.
- **ASSETS (r3):** six hero miniatures in the existing style + their ability VFX (see CHANGELOG Needs).
- **NET (r3):** draft sync (host-authoritative pick order and uniqueness, hover shown to teammates only), pick timer,
  timeout/disconnect auto-pick, picks in the replay log.
- **CODE (v1.0):** `ActivationOrder` with single alternation at every size (team chooses any unactivated hero; skipped
  activations take their slot and resolve at once; "Go next" claim state for online); Stun = skip with **Steadfast**
  (immune until the end of the hero's next real activation; Stun on a Steadfast hero is ignored, the rest of the ability
  applies); Cleansing Veil usable at the start of a skipped activation (removes Stun, normal activation, no Steadfast);
  respawn skip count = 2 if KO round ≥ 8; `HasLineOfSight` applied to every enemy-targeted Attack/ability with target
  distance ≥ 2 (exemptions in section 3; Shadow Step ignores walls; towers no LoS); Mage/Deadeye LoS traits removed;
  Pyroblast range 3, Flame Ring Root, Bubble CD 3, Earthshaker Root; Shadow Reset trigger = any Q/W/E kill (hero,
  ≥ 1 minion, neutral claim), once per activation; Poison tick = n + POW read at application; Kiss of Death Poison 2;
  first-pick coin flip + round-1 starter chosen by the other team + rematch alternation; Commander lobby (one player
  owns two seats/heroes of a team; snake A BB A); Twin Hollow 4v4 VP 10 / limit 10; per-size activation timers.
  Unit tests: stun on an unactivated vs already-activated hero, Steadfast blocks a 2nd stun (Bubble → Horn Toss),
  Veil on a stunned turn, KO in round 7 vs 8 (1 vs 2 skips), LoS exemptions (adjacent, self-centred area, ally heal,
  Shadow Step through a wall, line stopped by a wall), Shuriken last hit grants the reset once, Poison with POW 2,
  Commander activation order A1 B1 A2 B2, coin-flip replay from seed.
- **BOTS (v1.0):** choose which hero to activate each team turn (Commander and bot teams: the hero with the best preview
  first, keep a reactive hero for last); skip stuns on Steadfast targets; value stuns as "removes a turn" in Threat;
  play Shade's reset on last hits (Shuriken the wave first, then 3 actions); Viper's Poison value grows with POW;
  respect LoS for every ranged hero; Commander bot opponent drafts a starter pair.
- **UX (v1.0):** turn-order strip showing the alternation (A B A B…, skipped slots greyed, Stunned/KO icons); "Go next"
  button for teammates; Steadfast grey ring; "Skips next turn" label on stun previews; LoS overlay for every ranged
  hero; Commander HUD (two hero cards, choose-who-acts prompt, both heroes' cooldowns at a glance); Commander draft with
  starter pairs row; first-pick coin flip + "choose who starts round 1" screen; per-size timer ring (60/45 s + bank);
  planning mode during others' turns (hover previews, queue a plan) to soften the ~5 min 4v4 wait; quick reference
  (section 15) and tutorial prompts (section 14) updated.
- **NET (v1.0):** one active hero at a time (host-authoritative), "Go next" slot claims (lock when the team's turn
  starts), per-size timers and the per-player +30 s bank, Commander (one client controls two heroes), coin flip and
  round-1 choice in the replay log.
- **ASSETS (v1.0):** Steadfast token (grey ring), "skip" marker for stunned/KO'd turn slots, coin-flip draft
  animation; no new heroes.
- **QA (v1.0):** acceptance = the unit tests in the CODE (v1.0) bullet plus a 4v4 Rift/Twin Hollow bot match per seed
  replaying identically; compare `core/` outcomes against `lanefall_sim.py` ranges (16.2) once all heroes are in.
