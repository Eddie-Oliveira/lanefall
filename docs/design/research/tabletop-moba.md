# Research: how tabletop games translate MOBA mechanics

Owner: design · Written by: lead, 2026-11-02 · Inputs for the GDD v1 redesign.

Why this exists: Eddie (veteran MOBA player) needed about 3 matches to understand the v0.3 web prototype.
Two published tabletop MOBAs solved the same translation problem in different ways. This note records
what they do, so the redesign can borrow deliberately.

## Skytear (PvP Galaxy, 2019)

| MOBA idea | Skytear's translation |
|---|---|
| Lanes, minions, pushing | Each lane is abstracted into a **control token**. In the Minions Phase, each side scores **Control** = friendly heroes and minions that can see the token, plus a face-down "Lead" card's mana. The winner deals damage equal to the difference (minions first, then a Tower or Nexus within 3 hexes) and **moves the token toward the enemy tower** by the difference. Winner spawns 2 minions, then loser spawns 2. |
| Minions | 1 HP, 0 armor, no individual movement. They exist to add Control and soak damage. |
| Towers / Nexus | Heroes **cannot attack towers**. Structures only take damage from winning a lane. Towers have 5 HP; when the first falls, the Nexus gets 5 HP. |
| Turn structure | Short game: **3–5 turns**. Heroes Phase (players **alternate activating one hero each**), then Minions Phase. |
| Action economy | **3 AP** per activation: Move (3 hexes), Lead, Attack, Skirmish, Worship. The **same action can't be taken twice** in one activation. Playing power cards costs no AP. |
| Abilities, mana, ultimates | Abilities are **power cards** paid with mana. Each hero's mana pool starts at 1 and **grows every turn** (the "level up" curve). Ultimates are hero-specific cards. No cooldown tracking. |
| Death | Defeated hero returns after 1–2 turns (depending on whether it had already acted). The killer draws 2 power cards. |
| Neutral monsters | **Outsiders** in Domes, controlled by whoever wins that Dome's contest. Cannot be damaged. |
| Win | Destroy the enemy Nexus, or complete a **victory card** (3 revealed at setup in 2-player). |

Sources: [Skytear rulebook (Rulespal)](https://rulespal.com/skytear/rulebook), [Tabletopia quick rules](https://c.tabletopia.com/games/skytear/rules/quickrulebook/en), [Zatu: an introduction to Skytear](https://zatu.com/blogs/features/an-introduction-to-skytear).

## Rum & Bones (CMON, 2015)

| MOBA idea | Rum & Bones' translation |
|---|---|
| Map | Two ships side by side joined by **3 gangplanks** (= 3 lanes). Movement is zone-based, orthogonal. |
| Minions | Deckhands and bosuns **spawn and act automatically** every turn: they must attack if able, then advance one zone toward the enemy deployment point. 1 HP. Players never steer them. |
| Turn structure | Alternating turns, 8 fixed phases (prepare heroes, deck gun, deploy crew, activate crew, deploy heroes, activate heroes, kraken, draw Tide cards). |
| Action economy | **3 actions** per hero (move 2 zones, attack, ability; repeats allowed). Only **3 heroes deployed** at once out of a team of 5; the rest wait in reserve. |
| Gold / power | Heroes earn **coin** (1 per minion KO, all of a hero's coin on a hero KO, +1 per turn in reserve, max 8). Coin **pays for stronger attacks and abilities** directly, so the "farm, then spend" loop is visible on the table. |
| Combat | Dice pools: roll N dice, hit on a target number. Hits are assigned automatically: minions first, then heroes, then objectives (built-in "minions tank for you"). |
| Conditions | Blind, Stun, Slow, Silence, Bleed: tokens that last until the end of the hero's next activation. |
| Objectives / win | Ship features (masts, wheel) and sea creatures are objectives with HP. Each gives **VP**, coin and a lasting effect. **First to 6 VP wins.** |
| Neutral boss | The **Kraken** arrives by dice test, fed by Tide cards both players play; it attacks everyone. |
| Death | KO'd hero loses its coin and sits out ~2 turns (Dead Man's token flips), then returns to reserve. |
| Learning curve | A reviewer reports the rules click after 2–3 turns; the first game ran over 3 hours, later games 60–90 minutes. |

Sources: [Order of Gamers rules summary](https://www.orderofgamers.com/downloads/RumandBones_v1.pdf), [Rulespal rulebook](https://rulespal.com/rum-and-bones/rulebook), [Miniature Market review](https://miniaturemarket.com/reviewcorner/rum-and-bones-review), [Dice Tower entry](https://dicetower.com/board-game/168788).

## What Lanefall v0.3 does today (for contrast)

- 15×15 square grid, 8-direction movement, every minion and tower simulated individually.
- Whole-team phases: all of one team acts, then all of the other, then a "world" phase.
- Each hero: MOV + one action; abilities on cooldowns; 6 levels from XP; 17 items; gold from last hits.
- Win by destroying the Core; overtime crumbles both Cores from round 25.
- Playtest (Eddie, veteran MOBA player): about **3 matches to understand** it. Bot games run 30–40 rounds.

## Patterns worth borrowing

1. **Abstract the lane, keep the heroes concrete.** Skytear's control token removes dozens of individual minion moves
   and makes "who is winning the lane" a single readable number. In a 3D Unity game, minions can still be animated,
   but the rule underneath should be one number per lane.
2. **Alternate single-hero activations.** Both games avoid long team phases; Skytear alternates one hero at a time.
   Less downtime, more reaction, and better for 4v4 online.
3. **3 actions, no repeats (or limited repeats).** A clear, countable budget is easier to learn than "MOV tiles plus one
   action plus free actions". It also absorbs special cases like Eddie's marksman request (an extra Attack action).
4. **Visible, spendable power.** Rum & Bones' coin pays for big abilities on the spot; Skytear's mana grows each turn.
   Either is more legible than hidden XP thresholds plus cooldowns plus a 17-item shop.
5. **Short games with several ways to win.** Skytear: 3–5 turns plus victory cards. Rum & Bones: 6 VP from objectives.
   A VP race gives teams something to chase besides the Core and ends stalled games naturally (replaces Overtime).
6. **Automatic hit allocation (minions soak first).** Removes targeting fiddliness and encodes "don't fight in their wave".
7. **Towers hit only through lane wins (Skytear) or as objectives (R&B).** Either removes "tower aggro" as a rule
   a new player must memorize, or keeps it as the only special case.
8. **Neutral boss with a shared trigger.** The Kraken arrives from both players' card play; a fair, dramatic swing.

## Risks to watch

- Over-abstraction can lose the MOBA feel for veterans (last-hitting, tower diving). Keep at least one "MOBA moment" per system.
- Card-driven power (Skytear) adds a deck to learn; coin (R&B) adds a currency. Pick one resource, not both.
- Dice combat adds variance; v0.3 is deterministic except crits. Decide deliberately.
