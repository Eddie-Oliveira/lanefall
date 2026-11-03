# Lanefall — Game Design Document v1.0-draft

Owner: design · Status: **draft for Eddie's review** · Replaces the v0.3 rules (frozen in `prototype-web/`).
Inputs: `docs/design/research/tabletop-moba.md`, v0.3 `prototype-web/src/engine.js`, simulations in `docs/design/sim/`.
Why the redesign: `docs/design/v1.0-redesign-rationale.md`.

Tags used below: **from Skytear**, **from Rum & Bones**, **kept from v0.3**, **new**.
Anything marked **OPEN** is a decision for Eddie (section 17). Nothing there is decided silently.

---

## 0. The game in one paragraph

Two teams (1v1 to 4v4, bots fill empty seats) fight across a hex board. Each lane has a **Front**: a marker
showing where the two minion waves meet. Every round, heroes take turns (3 actions each), then the **Lane phase** resolves
every lane with one comparison: whichever side has more **Power** (minions + heroes) there wins the clash and pushes
the Front toward the enemy tower. Last-hit minions for gold, buy items in base, kill heroes, take towers and
neutral objectives to score **Victory Points (VP)**. Destroy the enemy Core to win at once; otherwise the first team
to the VP target wins, or the leader when the round limit ends the match (12 rounds; 8 on Frost Bridge).

## 1. Design goals (priority order) and how this draft meets them

| # | Goal | How | Evidence |
|---|---|---|---|
| 1 | Learn in one match; a veteran recognizes every concept by name | One action budget (3 actions), one lane rule (Power), one tower rule, one damage rule, 5 conditions, 14 items in 3 slots. Every MOBA word kept: lane, wave, push, last hit, tower dive, jungle, Drake, recall, items, ultimate. | Rule count: section 15 fits on one card. |
| 2 | Short matches with a natural end | VP race + round limit (12 / 8). No overtime. | Sim: 1v1 21–30 min, 4v4 42–58 min; 100% of games end by round 12 (section 16). |
| 3 | Low downtime at 4v4 online | Alternating activations; at 3v3+ two allies act at once (**duo turns**). | Wait between your own turns ≈ 3¼ min at 4v4 (v0.3: whole enemy team + world phase). |
| 4 | 3D board in Unity, deterministic | Hex board, every unit on a hex, integer math, no dice, seeded RNG only for setup/bot tie-breaks. Lane state = 3 small numbers per lane. | Section 13. |

---

## 2. Components (what is on the 3D board)

| Piece | Count per match | Notes |
|---|---|---|
| Hero miniature | 2–8 | On a hex. Base ring shows team color + condition tokens. |
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

| Map | Board (hexes) | Lanes | Nodes per lane | Towers per side per lane (node) | Core node | Best for |
|---|---|---|---|---|---|---|
| The Rift | 17 × 17 | 3 | −4 … +4 | 1 (±3) | ±4 | 2v2–4v4 |
| Twin Hollow | 21 × 11 | 2 | −5 … +5 | 2 (±3 outer, ±4 inner) | ±5 | 1v1–3v3 |
| Frost Bridge | 19 × 7 | 1 | −4 … +4 | 2 (±2 outer, ±3 inner) | ±4 | any, fast |

Kept from v0.3: same three maps, same names, same identities (classic 3-lane / tight 2-lane with altars and a pit boss /
one long lane brawl). Map sketches: section 11.

---

## 4. Round structure

A match is a series of **rounds** (12 on The Rift and Twin Hollow, 8 on Frost Bridge). Each round:

1. **Start step** (automatic). Every hero +1 gold. Level-ups (section 6). Objectives that are due appear.
2. **Hero phase.** Teams alternate activations until every hero has activated once.
3. **Lane phase** (automatic, animated, ~15–30 s). Each lane resolves (section 5). Towers shoot.
4. **End step** (automatic). Cooldowns tick down by 1. Shields expire. Check victory (section 10).

**Who starts:** the team with **fewer VP chooses** which team activates first this round (catch-up lever).
Tied VP: the team that went second last round goes first. Round 1: seeded coin flip.

**Activation order inside the Hero phase** (**from Skytear**: alternate single activations, any unactivated hero):

| Size | Order each round | Why |
|---|---|---|
| 1v1 | A, B | Pure alternation. |
| 2v2 | A, B, A, B (one hero at a time; the team picks which hero) | Each player waits ~3 enemy/ally turns. |
| 3v3 | A-duo, B-duo, A-single, B-single | **Duo turn (new):** two allies activate at the same time. |
| 4v4 | A-duo, B-duo, A-duo, B-duo | Halves wall-clock time vs single activations (sim: 4v4 single 72–109 min vs duo 42–58 min). |

Duo turn rules: the two heroes act in any interleaving; each action resolves the moment it is confirmed (server order).
Hotseat: the two allies just take turns at the screen. **OPEN Q2** (single vs duo vs whole-team).

Online timer: 60 s per activation (90 s in the tutorial / "learning" lobbies), +30 s once per match bank. Timeout =
remaining actions are skipped (the hero does not recall or move on its own).

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
- Why it plays like a MOBA: farming the enemy wave makes your wave win the next clash and push (veterans know this as
  "farming pushes"); standing in lane adds Power (holding the lane); leaving a lane lets it be pushed in (rotating has a price).

### 5.3 Towers and Core — one rule (simplified tower aggro)
**Kept from v0.3 in spirit, cut to one rule:**

> **A tower shoots heroes who hurt heroes under it, or heroes who stand under it without their minions.**

- *Tower dive:* when you damage an enemy hero while you stand within 2 hexes of an enemy tower or Core, that structure
  hits you for **3 damage immediately** (once per activation).
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

**Marksman extra attack (Eddie's request, kept):** Frostbow's trait **Twin Shot** — her Attack action hits twice
(same or different targets, each hit reduced by armor separately; two last hits on a wave). It fits the no-repeat
budget instead of being an exception to it (v0.3 needed a separate `freeAttack` flag and a `freeUsed` tracker).

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
**OPEN Q1** covers whether the resource system should be different.

### 6.5 Damage, healing, KO
- **Attack** damage = ATK − target ARM (min 1). **Ability** damage = number on the card + POW, ignores ARM.
- **Shield** absorbs damage first; expires at the start of the owner's next activation.
- **Heals** never exceed max HP.
- **KO:** the hero's mini is removed. The enemy team gains **+1 VP**. Killer **+3 gold**; every other enemy hero that
  damaged the victim this round **+1 gold** (assist).
- **Respawn:** a KO'd hero **skips its next activation**, then starts the following one on its Fountain at full HP
  (and may shop). (**from Skytear**: death costs about one turn.) **OPEN Q6** on late-game respawn.
- Determinism: no dice, no crits, no random targets.

### 6.6 Conditions (fixed list of 5, **from Rum & Bones**: token until the end of the target's next activation)
| Token | Effect on the target's **next** activation |
|---|---|
| **Stun** | Only **1 action** instead of 3. Cannot Recall. |
| **Root** | Cannot Move (or dash/teleport). |
| **Slow** | SPD −2 (min 1). |
| **Silence** | Cannot use abilities (Q/W/E/R). |
| **Shield n** (good) | Absorbs n damage until the start of the owner's next activation. |

Same condition twice does not stack (keep one token). Structures and neutrals ignore conditions; Hidden (Shade) is a hero
state, not a condition. Removed from v0.3: Burn (damage over time with its own ticking order).
**OPEN Q3:** stun = 1 action (recommended) vs skip the activation.

### 6.7 Recall and base (**kept from v0.3**, Eddie's requests)
- **Recall** is free at **any point** in your activation (before, between or after actions). It ends your activation.
- At the **start of your next activation** you appear on your Fountain, fully healed, and may shop; then you take your 3 actions.
- If you take damage before then, the recall is cancelled (you stay where you are). Stun also cancels it.
- **Being in your base heals you to full** at the start of each of your activations and at the end of each Lane phase. No potions exist.
- Frost Bridge has **no recall** (single-lane brawl tradition); health relics instead.
- Travel: leaving the base to your nearest tower is 1 Move; reaching the river node is 2–3 Moves.

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
| | | **Cleansing Veil** | +3 HP; free, once per activation, even while Stunned: remove all conditions, CD 3 |
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
| Twin Hollow | 6 | 8 | 10 | 12 | 12 |
| Frost Bridge | 5 | 6 | 7 | 8 | 8 |

Replaces v0.3 **overtime** (cores crumbling 4 HP/round from round 25; 26 of 30 v0.3 bot games I ran reached it). The VP race
is visible from round 1 (**from Rum & Bones**: first to N VP; **from Skytear**: 3–5 turn games with several ways to win).
The HUD shows "Round 9 of 12" and both VP totals at all times. **OPEN Q5** on the round limit vs VP-only.

---

## 10. Heroes (8)

All heroes: POW 0 at start. Numbers are for level 1 (see 6.4 for growth). "Wave N" = also kills up to N minions in a
clash zone the ability touches. Lines are in 6 hex directions. "Adjacent" = range 1.

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

### Shade — Assassin · HP 10 · ATK 3 · RNG 1 · ARM 0 · SPD 4
MOBA reference: *stealth assassin with an execute.*
| Key | Ability | Effect | CD |
|---|---|---|---|
| Q | Shuriken | Line 3: first enemy hit takes 2 dmg. Wave 1. | 1 |
| W | Shadow Step | Teleport adjacent to an enemy within 4 (ignores walls): 2 dmg. | 2 |
| E | Smoke Veil | **Hidden** until your next activation (heroes and towers can't target you; ends if you deal damage) and move 1 hex. | 3 |
| R | Death Mark | Adjacent enemy: 4 dmg; a hero left at 4 HP or less is KO'd. | 4 |

### Pyra — Mage · HP 10 · ATK 1 · RNG 2 · ARM 0 · SPD 3
MOBA reference: *burst fire mage — area poke, point-and-click nuke.*
| Key | Ability | Effect | CD |
|---|---|---|---|
| Q | Fireball | Target hex within 3 and neighbors: 2 dmg to each enemy. Wave 3. | 1 |
| W | Flame Ring | Enemy within 3: 1 dmg, **Stun**. | 2 |
| E | Scorch | Enemy within 3: 3 dmg. | 2 |
| R | Pyroblast | Enemy within 4: 6 dmg. | 4 |

### Frostbow — Marksman · HP 10 · ATK 2 · RNG 3 · ARM 0 · SPD 3
**Trait — Twin Shot:** your Attack action hits twice. MOBA reference: *frost-arrow marksman — kites with slows, long stun arrow.*
| Key | Ability | Effect | CD |
|---|---|---|---|
| Q | Volley | Target hex within 3 and neighbors: 1 dmg + **Slow** to each enemy. Wave 3. | 2 |
| W | Frost Arrows | This activation: your Attacks deal +1 and **Slow**. | 2 |
| E | Tumble | Move 2 hexes (may pass through enemies). | 2 |
| R | Crystal Arrow | Line 6: first enemy hero hit takes 3 dmg, **Stun**. | 4 |

### Lumen — Support · HP 11 · ATK 1 · RNG 2 · ARM 0 · SPD 3
MOBA reference: *enchanter healer — keeps the carry alive, roots divers, global heal.*
| Key | Ability | Effect | CD |
|---|---|---|---|
| Q | Mend | Ally (or you) within 3: heal 3. | 1 |
| W | Binding Light | Line 4: first enemy hit takes 1 dmg, **Root**. Wave 1. | 2 |
| E | Barrier | Ally (or you) within 3: **Shield 3**. | 1 |
| R | Wish | Every allied hero, anywhere: heal 4. | 4 |

### Quake — Initiator · HP 13 · ATK 2 · RNG 1 · ARM 1 · SPD 3
MOBA reference: *fissure-and-echo initiator — line stun, then one huge slam in the crowd.*
| Key | Ability | Effect | CD |
|---|---|---|---|
| Q | Fissure | Line 4: every enemy on it takes 1 dmg, **Stun**. Wave 2. | 3 |
| W | Enchant Totem | Your next Attack this activation deals double ATK (also vs structures). | 2 |
| E | Tremor | 1 dmg + **Slow** to every adjacent enemy. Wave 2. | 1 |
| R | Echo Slam | Every enemy within 2: 2 dmg, +1 per other enemy unit in range (heroes and minions, max +3). Wave 3. | 4 |

### Time-to-kill (sim, `docs/design/sim/ttk.py`)
Activations a hero needs to KO a target from full HP, using its best damage each activation (2 abilities + Attack),
no shields/heals/teammates. Level 5 assumes the 3-item bot build.

| Attacker → target | Squishy L1 (Shade/Pyra/Frostbow) | Tank L1 (Bulwark) | Squishy L5 | Tank L5 |
|---|---|---|---|---|
| Blademaster | 2 | 4 | 2 | 4 |
| Shade | 2 | 4 | 2 | 3 |
| Pyra | 2 | 3 | 2 | 3 |
| Frostbow | 3 | 7 | **1** | 3 |
| Butcher | 3 | 5 | 2 | 5 |
| Quake | 3 | 7 | 3 | 5 |
| Bulwark | 3 | 7 | 3 | 7 |
| Lumen | 7 | 9+ | 5 | 9+ |

Reading: early fights take 2–3 activations (one round for a duo, so there is time to react or recall); tanks take
twice as long; Frostbow is weak early and deletes squishies late — the marksman curve veterans expect. **Watch:**
Frostbow one-shots a full-HP squishy at level 5 with 3 damage items (see 16.4).

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
- Recommended lanes at 4v4: Top 1, Mid 1, Bot 2 (carry + support). At 2v2: Mid + Bot.

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
- 4 wolf camps. Recommended at 2v2: one hero per lane, roam to the pit at round 5.

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
- **No recall**, 2 health relics per side. Heroes are drawn at random by default (seeded). Start at level 3 with 6 gold;
  level 4 at round 3, level 5 at round 5. 8 rounds.

---

## 12. Bots (what the rules expose so bots stay simple)

The rules are designed so a bot can be a short list of scored plans instead of a search over a big action space.

| Rules must expose | Why it keeps bots simple |
|---|---|
| `LegalActions(state, hero)` with a **preview** (damage, KOs, Front change, gold) for each | No bot-side re-implementation of rules; bots score previews. |
| `LaneForecast(state, lane)`: Power each side, who wins the next clash, Front change, tower damage | One function answers "is my lane safe / should I push". |
| `Threat(state, hex, team)`: max damage enemies can deal to that hex next activation, incl. tower dive rule | Retreat/recall decisions = one lookup. |
| Public state only: VP, round, levels, cooldowns, items, conditions, neutral HP and timers | No hidden info; bots and humans see the same. |
| Seeded RNG stream for bot tie-breaks (separate from game RNG) | Same seed → same bot moves → replayable tests. |

Suggested bot plan per activation (Needs: BOTS to own): **Recall** if HP ≤ 35% or can afford an upgrade while not in a
fight · **Kill** if a preview KOs a hero · **Objective** if up and enemies are dead/far · **Farm** (last hits, Wave abilities) ·
**Push** (Attack structure when own wave is there) · **Hold** (stand in clash zone). This is what the pacing sim uses
(`docs/design/sim/lanefall_sim.py`, ~40 lines of decision code). Difficulty = noise on scores + how often they use the forecast.

## 13. Unity board, determinism and online

- **Readable state:** per lane only (Front node, Azure wave, Ember wave); per hero (hex, HP, conditions, cooldowns, items);
  per structure HP; per neutral HP and timer; VP, round. Everything is an integer.
- **Deterministic:** no dice, no crits, no random targets. RNG (seeded, one stream) only for: round-1 starting team,
  Frost Bridge hero draw, bot tie-breaks (separate stream). Match = seed + ordered action list → exact replay.
- **Resolution order is fixed:** Lane phase resolves lanes in a fixed order (Top/Mid/Bot or Top/Bot); within a lane steps 1–5.
- **Duo turns online:** both allies' actions go to the host; each is validated and applied in arrival order and broadcast.
  An action invalidated by the partner's earlier action is rejected with a reason (e.g. "hex now occupied"). Needs: NET.
- **Presentation:** Lane phase animates minions marching to the Front, the clash, and the Front marker sliding (15–30 s total,
  skippable). Needs: ASSETS/UX.

---

## 14. Onboarding: the first match teaches in this order

Tutorial = a real 1v1 on The Rift vs an Easy bot with Mid lane only active for rounds 1–3 (other lanes unlock at round 4).
One new idea per round; the match continues normally after the script. Needs: UX (screens, prompts), BOTS (scripted Easy bot).

| Round | Teaches | Prompt (≤ 1 line) |
|---|---|---|
| 1 | Move, Attack, **last hit** = gold | "Walk to the Front. Attack the enemy wave: each minion is 1 gold." |
| 1 end | **Lane phase**, Power, the Front | "More Power wins the clash and pushes the Front." |
| 2 | **Abilities, cooldowns**, the 3-action rule | "3 actions, each once (Move twice). Abilities come back after their CD." |
| 3 | **Level up**, enemy hero trades, conditions | "Everyone is level 2. Stunned heroes get 1 action." |
| 4 | **Tower rule** (dive), **Recall**, base heal, **Shop** | "Hurting a hero under their tower = 3 damage to you. Recall any time; base heals fully." |
| 5 | **Ultimate** (level 3), KO and respawn | "Your R is ready." |
| 6–7 | **Jungle** (wolf camp), **Drake**, stealing | "Last hit claims it. Drake = 2 VP and +1 ATK for your team." |
| 8+ | **VP race**, round limit, the Core | "First to 6 VP, or most VP after round 12, or break their Core." |

Always-on HUD helpers: the lane forecast arrow on each Front ("Azure wins next clash, pushes 1"), damage preview on hover,
tower range rings when you are within 4 hexes.

## 15. Quick reference (one screen / one card)

```
LANEFALL — QUICK REFERENCE
WIN   Break the enemy Core · or reach the VP target first · or lead on VP after the last round (12; Frost Bridge 8).
VP    Hero KO 1 · Tower 3 · Drake 2 · Golem / Spider Queen 3.
ROUND 1 Start: +1 gold, level-ups.  2 Heroes alternate (trailing team picks who starts).  3 Lane phase.  4 Cooldowns −1.
YOUR TURN  3 actions, each once (Move may be twice):
      Move (SPD hexes) · Attack (ATK − armor) · Q / W / E / R (off cooldown) · [Capture altar]
      Free: Recall (ends turn; home next turn, full heal, cancelled by damage) · Shop (in base).
      Frostbow: Attack hits twice.
DAMAGE  Attacks: ATK − ARM (min 1). Abilities: card number + POW, ignore armor. Shields soak first.
CONDITIONS (your next turn)  Stun: 1 action · Root: no Move · Slow: SPD −2 · Silence: no abilities.
LANE PHASE  Spawn 2 (3 from round 7) · Power = minions + your heroes within 2 of the Front ·
      more Power wins, loser loses the difference · loser wiped → Front moves 1 · at a tower: tower kills 2, rest hit it for 1 each.
LAST HIT  Attack the enemy wave = kill 1 minion = 1 gold. "Wave N" abilities kill N.
TOWERS  Hurt a hero under an enemy tower → it shoots you for 3. Under it with no minions → it shoots you in the Lane phase.
      Only Attacks hurt structures (2 dmg), and only with your wave there. Core opens when one lane's towers are down.
LEVELS  L2 round 3 · L3 round 5 (ultimate) · L4 round 7 · L5 round 9.
KO     Skip your next turn, then respawn in base. Enemy +1 VP, killer +3 gold.
SHOP   3 slots · Basic 3 gold · Upgrade 7 (4 if you own its basic).
```

---

## 16. Simulation results (pacing and balance)

### 16.1 Method
- `docs/design/sim/lanefall_sim.py` implements sections 4–10 on an **abstract board** (each hero is in base / travelling /
  a lane's clash zone / at an objective; lanes are exactly the Front/wave/tower rules above). Heroes, items, levels,
  cooldowns, VP, round limits use the numbers in this document. Bots: the plan list in section 12, seeded.
- 500 games per map and size, random heroes. Run: `python3 docs/design/sim/lanefall_sim.py` (results in `results.jsonl`).
- **Minutes** = rounds × (activation slots × seconds per slot + Lane phase). Seconds per activation: 45 s (expert) / 70 s
  (learning) for single activations; 55 s / 80 s per duo slot; Lane phase 15 s + 5 s per lane. These are estimates, not
  playtest data.
- Not modelled: hex geometry (range, lines, body-blocking), the "no minion cover" tower shot, Hidden, Blink.
- Baseline: v0.3's own bot sim (`prototype-web/src/sim.js` engine, 30 games across maps/sizes): rounds 13–39,
  **26/30 reached overtime**.

### 16.2 Results
| Map | Size | Rounds mean (p10–p90) | Ends: Core / VP / round limit | Minutes all-human (expert / learning) | Minutes 1 human + bots | Wait between your turns (s) | KOs | Towers | First tower (round) | Last hits | Win A–B |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Rift | 1v1 | 10.7 (9–12) | 43% / 19% / 39% | 21 / 30 | 14 | 75 | 0.9 | 0.8 | 7.6 | 14 | 45–53% |
| Rift | 2v2 | 10.1 (8–12) | 56% / 26% / 19% | 35 / 52 | 15 | 165 | 1.8 | 1.5 | 7.2 | 26 | 48–52% |
| Rift | 3v3 | 9.7 (8–12) | 60% / 30% / 11% | 40 / 57 | 15 | 195 | 2.9 | 2.1 | 6.9 | 38 | 52–48% |
| Rift | 4v4 | 10.0 (8–12) | 60% / 28% / 12% | 42 / 58 | 17 | 195 | 5.8 | 1.9 | 7.1 | 47 | 48–52% |
| Twin Hollow | 1v1 | 11.0 (9–12) | 0% / 47% / 53% | 21 / 30 | 14 | 70 | 0.9 | 1.1 | 7.9 | 15 | 48–48% |
| Twin Hollow | 2v2 | 10.8 (8–12) | 6% / 52% / 42% | 37 / 55 | 15 | 160 | 1.8 | 2.0 | 7.2 | 30 | 47–52% |
| Twin Hollow | 3v3 | 11.2 (9–12) | 6% / 43% / 51% | 46 / 64 | 17 | 190 | 4.7 | 1.9 | 7.5 | 39 | 51–49% |
| Twin Hollow | 4v4 | 11.5 (10–12) | 6% / 27% / 67% | 47 / 66 | 19 | 190 | 7.7 | 1.5 | 7.9 | 50 | 49–51% |
| Frost Bridge | 1v1 | 7.8 (7–8) | 0% / 34% / 66% | 14 / 21 | 9 | 65 | 1.6 | 0.8 | 6.2 | 14 | 41–57% |
| Frost Bridge | 2v2 | 7.9 (8–8) | 0% / 10% / 89% | 26 / 40 | 10 | 155 | 4.3 | 0.3 | 6.3 | 21 | 44–53% |
| Frost Bridge | 3v3 | 8.0 (8–8) | 0% / 6% / 94% | 32 / 45 | 11 | 185 | 7.7 | 0.1 | 6.6 | 22 | 45–47% |
| Frost Bridge | 4v4 | 8.0 (8–8) | 0% / 11% / 89% | 32 / 45 | 12 | 185 | 11.1 | 0.0 | 6.4 | 22 | 45–46% |

(Win A–B do not sum to 100%: the rest are draws after all tie-breaks.)

### 16.3 What the numbers say
- **Length targets mostly met.** 2 players at 1v1: 21–30 min (target 30–45 → slightly short; see OPEN Q7: a 2-hero
  "Commander" 2v2 is 35–52 min). 8 players: **42–58 min on The Rift, 47–66 on Twin Hollow** (target < 75). Every match ends by
  round 12 (8 on Frost Bridge) — no overtime.
- **Lane push speed** (one hero holding an empty lane, nobody defending, deterministic): Front reaches the Rift tower at
  **round 5**, tower falls **round 7**, Core falls **round 11**; with the hero also attacking the tower: round 6 / round 10.
  First towers in real sims fall around **round 7–8**: towers matter mid-game, Cores fall late, as in a MOBA.
- **Activation count drives time, rounds barely change with size** (10–11.5 rounds at every size), so team size is the
  only real time lever → duo turns. Wall-clock 4v4 Rift: single activations 72 / 109 min, **duo 42 / 58 min**,
  whole-team-simultaneous 33 / 43 min.
- **Fights:** level-1 squishies die to 2 activations from a damage hero; tanks take 4–7 (time-to-kill table in section 10).
- Changing 2v2 to duo turns made no difference to rounds or win rate (10.9 vs 10.9 rounds).

### 16.4 Known balance issues (to watch in playtests)
1. **Frost Bridge seat bias:** in 1v1 the team that does *not* start round 1 wins 57% vs 41% (2v2: 53/44). Reacting last
   is worth more on a single lane. Mitigation in this draft: trailing team chooses who starts. If playtests confirm, give
   the round-1 starting team +1 gold or +1 VP (sim: +1–2 gold did not fix it).
2. **Frostbow at level 5 with 3 Attack items** KOs a full-HP squishy in one activation. Candidate fix: Twin Shot's second
   hit −1 damage, or Piercing Edge only on the first hit.
3. **Twin Hollow 4v4** ends at the round limit 67% of the time (towers are harder to reach with 2 per lane). Fine if VP
   races feel close; otherwise 4v4 VP target 10.
4. **Bot passivity:** sim bots trade little in 1v1 (0.9 KOs/match). Real players will fight more, which ends matches by
   VP sooner, not later.
5. **Dive shots** are rare in the sim (0.1–0.8 per match) because bots avoid them; the tower rule is untested under
   aggressive play.

---

## 17. Open questions for Eddie (not decided; recommendation marked)

| # | Question | Options | Recommendation |
|---|---|---|---|
| Q1 | **Power resource** | (a) Levels by round + cooldowns + gold for items *(this draft)*; (b) Rum & Bones coin: gold also pays to empower abilities (spend 2 for +2 dmg); (c) Skytear mana: a mana pool +1 per round pays ability costs, no cooldowns | **(a)**: one currency (gold) that every veteran knows; cooldowns are familiar; (b)/(c) add a second spend decision on every turn. |
| Q2 | **Who activates at 3v3/4v4** | (a) single heroes alternating; (b) **duo turns** *(draft)*; (c) whole team simultaneous | **(b)**: 42–58 min at 4v4 vs 72–109 for (a); keeps back-and-forth that (c) loses; (c) is 33–43 min but brings back v0.3's "watch the whole enemy team" wait and alpha-player risk. |
| Q3 | **Stun strength** | (a) 1 action next turn *(draft)*; (b) skip the next turn; (c) no Move/Attack, abilities ok | **(a)**: with 2-activation kills, (b) is a guaranteed death. |
| Q4 | **Lane abstraction** | (a) **Front + Power** with minion minis and last hits *(draft)*; (b) individual minions that move (v0.3); (c) pure Skytear token, no minion minis, no last hits | **(a)**: one number per lane but last hits stay; (b) was a major source of confusion; (c) loses "last hit", a must-recognize MOBA concept. |
| Q5 | **Ending** | (a) VP target + round limit *(draft)*; (b) VP target only; (c) round limit only | **(a)**: VP target ends stomps early, limit guarantees the session length for online. |
| Q6 | **Respawn** | (a) always skip 1 activation *(draft)*; (b) skip 2 from round 8; (c) skip 1 + lose 2 gold | **(a)** for learning; revisit if late games feel consequence-free. |
| Q7 | **2-player mode** | (a) 1v1, 1 hero each *(draft default, 21–30 min)*; (b) "Commander": 2 heroes each in a 2v2 (Skytear style, 35–52 min); (c) 1 hero each + 1 bot ally each | Offer **(a) and (b)**; (b) hits the 30–45 min target and shows the full lane game; (a) stays the quick duel. |
| Q8 | **Denies** | (a) none *(draft)*; (b) Attack your own wave: kill 1 own minion, no gold, enemy can't last-hit it | **(a)** for v1.0; (b) is a veteran nicety that adds a rule. |
| Q9 | **Frost Bridge recall** | (a) no recall, relics *(draft, genre-true)*; (b) recall like other maps | **(a)**; base still heals fully if you walk home, so Eddie's "base heals fully" holds everywhere. |
| Q10 | **Tower dive damage** | (a) 3 flat *(draft)*; (b) 3, +1 at levels 3 and 5 | **(a)** until playtests show late dives are free. |

---

## 18. Changes from v0.3

| Area | v0.3 | v1.0-draft | Source |
|---|---|---|---|
| Grid | 15×15 squares (Rift), 8 directions, diagonal = 1 | Hex grid, 6 directions; Rift 17×17, Hollow 21×11, Bridge 19×7 | from Skytear |
| Turn order | Whole team acts, then the other team, then a world phase | Alternating activations (duo turns at 3v3+), then Lane phase | from Skytear (+ new duo turns) |
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
| Conditions | Stun, root, slow, silence, burn; ticks at end of team phase / world phase | Stun (1 action), Root, Slow, Silence, Shield; all "your next turn" | from Rum & Bones |
| Cooldowns | 1–7 turns | 1–4 rounds | kept, smaller |
| Items | 17 items, 6 slots, prices 50–1800, sell, potions, unique/group rules | 14 items, 3 slots, 3 / 7 gold, no selling, no potions | simplified |
| Gold | 15/round, 20–28 last hit, 100+20×lvl kill, 50 assist, 80 tower, 45 camp | 1/round, 1 last hit, 3 KO, 1 assist, 2 tower, 2 camp | rescaled |
| Recall | Any time; home at the start of next turn unless damaged | Same, now explicitly free at any point in the activation | kept (Eddie) |
| Base | Full heal in base, no potions needed | Same; potions removed entirely | kept (Eddie) |
| Respawn | 1 + ceil(lvl/2) + floor(round/15) turns | Skip 1 activation | from Skytear |
| Neutrals | HP grows +1/round; retaliate to aggro holder; heal 4/round | Fixed HP; Bite on the hitter; full heal if untouched; last hit claims | simplified |
| Objectives | Drake +1 ATK/PWR team; Golem Aegis; Queen +2 for 8 rounds; altars +1 ATK/PWR & gold | Same identities + VP (2/3/3); altars give lane Power + gold | from Rum & Bones (VP) |
| Frost Bridge | No recall, start lvl 3, 1100 gold, random heroes, overtime 16 | No recall, start lvl 3, 6 gold, random (seeded), 8 rounds | kept |
| Heroes | 8 heroes, 4 abilities each, numbers in v0.3 scale | Same 8, same roles and ability identities, v1.0 numbers | kept, rescaled |

---

## 19. Hand-offs
- **CODE:** implement sections 3–11 in `core/` (pure C#), with the bot API in section 12 and replays in section 13. The Python sim is the reference for expected outcomes.
- **BOTS:** plan-scoring bot over `LegalActions` previews (section 12); scripted Easy bot for the tutorial.
- **ASSETS:** see the CHANGELOG "Needs" list (miniatures, board tiles, markers, tokens).
- **UX:** HUD (hero card, VP/round bar, lane forecast arrows, tower range rings, damage previews), shop screen, tutorial (section 14), quick-reference card (section 15).
- **NET:** duo turns (two clients acting at once), action log + seed replay, turn timers.
