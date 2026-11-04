# Eddie's decisions on GDD §17 (Q1–Q17), 2026-11-04

Source: Eddie's answers through `docs/design/decisions-form.html`. The answer, his notes and "vs recommendation" columns
are copied as received. The design agent filled in "How it was applied" in GDD v1.0. Letters are the options in the
r3 GDD §17 (now the Decision log, GDD 17.1).

## Raw answers (verbatim)

| Q | Answer | vs your recommendation | How it was applied (GDD v1.0) |
|---|---|---|---|
| Q1 Power resource | a (levels by round + cooldowns + gold for items) | same | 6.4 marked decided. Level 5 is the max for now; level 6 is the new open Q18. |
| Q2 Who activates at 3v3/4v4 | **a — single heroes alternating** | differs (you recommended duo turns) | Section 4: A B A B… at every size, team picks any unactivated hero, skipped turns keep their slot, "Go next" claim online. Duo turns removed (4, 13, 18, 19). Pacing re-run (16.3): 4v4 with no other change = 57/86 min (Rift) and 65/97 (Twin Hollow), expert/learning. Smallest fix applied: **45 s activation timer at 3v3/4v4 (60 s learning)** + **Twin Hollow 4v4 round limit 10, VP target 10** → **52/69 (Rift), 49/66 (Twin Hollow)**. Caveat: the timer effect is an assumption until playtests; wait between your own turns at 4v4 is ~5 min (duo: 3¼). |
| Q3 Stun strength | **b — skip the next turn** | differs | 6.6: Stun = skip the next activation (exactly one, never "(2)"). Safeguards that keep the rule: **Steadfast** (no new Stun until the end of the hero's next real activation), **Cleansing Veil** usable at the start of the skipped activation (and Riptide before it) saves the turn, **Flame Ring and Earthshaker now Root**, **Bubble CD 2 → 3**. Stuns left: 7 abilities on 6 heroes, only one targeted ranged stun (Bubble; Crystal Arrow and Fissure are lines). `ttk.py --stun`: no stunner KOs a full-HP squishy in the 1v1 "stun + next activation" window except level-5 Frostbow (who one-shots anyway); r3 Pyra could at level 3. |
| Q4 Lanes | a (Front + Power, minion minis, last hits) | same | Section 5 unchanged; marked decided. |
| Q5 Ending | a (VP target + round limit) | same | Section 9 marked decided (+ Twin Hollow 4v4 = 10/10 from Q2). |
| Q6 Respawn | **b — skip 2 activations from round 8** | differs | 6.5: skip 1; skip 2 if KO'd in round 8 or later. Quick reference, tutorial prompt, sim updated. Watch item 16.4 #16. |
| Q7 2-player mode | **b — "Commander": 2v2, each player runs 2 heroes** | differs (you recommended offering a and b) | New 4.1: Commander is the headline 2-player mode (1v1 stays as a quick duel and the tutorial). The player's two heroes alternate with the enemy's one by one (A1 B1 A2 B2, never back to back). Draft = snake A BB A (each player 2 picks). 4 starter pairs + 2 advanced. Sim: 32–34 min expert / 48–50 learning. |
| Q8 Denies | a (none) | same | 5.2: one line "No denies". |
| Q9 Frost Bridge recall | a (no recall, relics) | same | 6.7 tagged decided. |
| Q10 Tower dive damage | a (3 flat) | same | 5.3 tagged "flat at every level". |
| Q11 Line of sight | **b — every enemy-targeted ranged Attack and ability; ally effects and globals exempt; Shadow Step still ignores walls** | same | Section 3: board rule for everyone (target 2+ hexes away), exemptions listed. Mage LoS role trait and Deadeye's LoS hero trait removed; **no replacement Mage trait** (any trait would buff Pyra; fewer rules). Pyra kept nerfed: **Pyroblast range 4 → 3** and Flame Ring Root. Re-checked: Frostbow (Attack, Volley need LoS; no change, watch), Lumen (only her Attack; no change), Tidesinger (Bubble needs LoS; CD 3 from Q3), Deadeye (unchanged; relatively stronger, watch). |
| Q12 Shadow Reset trigger | a (hero KO, neutral claim, or wave wipe; once per activation) — **with a condition, see his general note** | same, conditional | Measured (`lanefall_sim.py`, 21,400 Shade lane activations): enemy wave empty 36%; when not empty **3.4 minions on average, median 3**, 3+ in 61%; a single kill wipes it in only 6% of her lane turns; she kills at most 2 per activation. A wipe usually needs ~3 kills → per Eddie's condition **switched to (b)**: "Once per activation: if your Q, W or E kills something (hero, minion, neutral), take 1 more action." `ttk.py --shade`: no rise in single-target burst (9 / 16 + execute at L3 / L5 either way); she gains +1 gold and a 4th action in lane. |
| Q13 Execute threshold | a (20%) | same | 10.3 marked decided; 15% kept as the fallback. `ttk.py` now uses 20% (no average changed). |
| Q14 Who takes each draft pick | a (next seat in seat order, seat swap in lobby) | same | 10.2 marked decided; Commander: the one player takes all of the team's picks. |
| Q15 Bans | a (none until 3 heroes per role) | same | 10.2 marked decided. |
| Q16 First pick | dc (coin flip for first pick, the other team chooses who starts round 1; alternate on rematches) | same | Section 4 (round-1 starter) and 10.2: seeded coin flip for first pick; the other team chooses round-1 starter; rematch gives first pick to the other team. Section 13 RNG list updated. |
| Q17 Viper's damage over time | **no option picked; his note: "combine trait and scaling with POW. Adjust for lvl6 being the peak dmg point"** | differs | 6.9/10.3: Poison stays her trait **and** each tick adds her POW; Kiss of Death Poison 3 → 2 so she peaks at the max level. `ttk.py --viper` (avg activations to KO; rank of 13 attackers): L1 3.0 (#6), L3 2.8 (#4, was 2.4 #1), **L5 1.9 (#3, behind Frostbow/Deadeye 1.8)**. v1.0 has no level 6, so "peak" = level 5; **new open Q18** asks whether to add level 6 (at a hypothetical L6 she would tie Deadeye as the strongest, 1.6). |

### His general note (verbatim)

> "Make clear what wiping the wave means for Shade. If it needs killing 3 minions in a single turn, then option b would be better."

Applied: see Q12 row. Definition used for the measurement: "wiping the wave" = killing every minion left in the enemy
wave of that lane, so the number of kills a wipe needs = the enemy wave count at the start of Shade's activation.
Result: about 3 (median 3, mean 3.4 when not empty) → option b.

## New question for Eddie

**Q18 — level 6?** (GDD 17.2) Recommendation: keep 5 levels (round 11 is reached in only 22–39% of Rift team
matches and 0% of Twin Hollow 4v4; a level 6 makes Viper tie for the strongest attacker unless retuned).

## Reproduce
- `python3 docs/design/sim/lanefall_sim.py` (v1.0 table, Shade wave report) · `--variants` (4v4 levers)
- `python3 docs/design/sim/ttk.py --viper --stun --shade --l6`
