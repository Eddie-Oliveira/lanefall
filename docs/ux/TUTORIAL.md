# Lanefall — First-match tutorial and veteran fast track (v1.0)

Owner: ux (screens, prompts, checks) · BOTS owns the scripted Easy bot · Rules: GDD v1.0 section 14 (this file
follows its round-by-round order and prompts; changes to the GDD wording are marked **[copy edit]**).

**Goal:** after this one match a player can play any mode without help. One new idea per round; the match is real and
continues after the script (GDD 14).

## Part A — The tutorial match

### A.1 Setup
| Item | Value |
|---|---|
| Mode | 1v1 on The Rift vs **Easy bot playing Pyra**; VP target 6, 12 rounds |
| Lanes | **Mid only** in rounds 1–3 (Top/Bot waves frozen and greyed, "Opens in round 4"); all lanes from round 4 |
| Hero choice | One screen with the 5 ★ Easy heroes (Bulwark, Blademaster, Ravager, Frostbow, Lumen); no draft |
| Start position (tutorial only) | Both heroes start **next to their own Mid tower** (node ∓3), not in base, so round 1 can be "Move, Move, Attack" (base → river is 3 Moves, GDD 6.7). Needs DESIGN/CODE |
| Starting waves (tutorial only) | **2 minions per side in Mid at round 1**, so there is a wave to last-hit before the first Lane phase. Needs DESIGN to confirm whether real matches also start with waves (GDD 5.1 only spawns in the Lane phase) |
| Who starts | Round 1: the player. Then the normal rule (fewer VP chooses; tie = the team that went second) — so with VP tied the bot starts round 2, the player round 3, … |
| Objectives | Wolf camps from round 1 but not mentioned until round 6; **Drake appears in round 6** in the tutorial (normally round 3) so it is taught when the player has room for it |
| Timer | None. Pause works |
| Prompts | Coach bubble (top-centre, ≤ 1 line) + highlight ring on the control or hex it refers to + optional "Why?" link to the quick-reference line |

**Prompt behavior.** A prompt stays until its success check passes. If nothing happens for 20 s, the highlighted
control pulses once. Only steps marked **gated** disable other controls (round 1 only); everything else is soft.
Every prompt has **[Skip tip]**; Pause menu has **Skip all tips** (the match continues normally). A skipped or missed
lesson is re-offered later in the match when its trigger happens (e.g. the first Stun), and listed on the results
screen ("You learned: …").

### A.2 Hero choice screen
```
┌────────────────────────────────────────────────────────────────┐
│ CHOOSE YOUR HERO              "All five are good first heroes." │
│ [Bulwark]  [Blademaster]  [Ravager]  [Frostbow]  [Lumen]         │
│  Tank       Fighter        Fighter    Marksman    Support        │
│  Stuns and  Wins long      Sticks and Hits twice, Heals and      │
│  shields    melee fights   heals      from range  protects       │
│                       [ Play as Frostbow ]                       │
└────────────────────────────────────────────────────────────────┘
```
Copy under the row: "You'll face Pyra, a fire mage, played by an easy bot."

### A.3 Script (round by round)

Columns: **Ask** = what the player is asked to do · **Bot** = what the scripted Easy bot does · **Copy** = exact
prompt text · **Check** = what completes the step.

#### Intro (before round 1, 8 s, skippable)
| Step | Ask | Bot | Copy | Check |
|---|---|---|---|---|
| 0.1 | Watch | — | Camera glides along Mid. "This is the Mid lane. The flag is the **Front**: where the two minion waves meet." | auto / tap |
| 0.2 | Watch | — | Top bar highlighted. "First to **6 VP** wins. VP come from KOs, towers and big monsters." | auto / tap |

#### Round 1 — Move, Attack, last hit (player starts)
| Step | Ask | Bot | Copy | Check |
|---|---|---|---|---|
| 1.1 **gated** | Select your hero | — | "This is you. Click your hero." (touch: "Tap your hero.") | Hero selected |
| 1.2 **gated** | Move toward the Front | — | "Choose **Move**, then a lit hex. You can Move twice in one turn." | Hero ends a Move with the enemy wave in Attack range, or has used both Moves |
| 1.3 **gated** | Attack the enemy wave | — | "Attack the enemy wave: each minion you kill is **1 gold**. (Veterans: last hit.)" Frostbow adds: "Marksmen hit twice: 2 minions, 2 gold." | Gold increased by a last hit |
| 1.4 | Notice the action pips | — | Pips ring highlighted. "That's your **3 actions**. Your turn is over." (If one is left: "You have 1 action left. Press **End turn** when you're done.") | Turn ended |
| 1.5 | Watch the enemy turn | Pyra moves to Mid, Attacks the wave (1 last hit) | Turn strip highlighted. "Now Pyra's turn. Teams take turns, **one hero at a time**." | Bot turn done |
| 1.6 | Read the forecast | — | Forecast arrow on the Front highlighted. "This arrow shows who wins the next clash." | 3 s / tap |
| 1.7 | Watch the Lane phase | Lane phase (Mid only); animation pauses at the Power numbers | "**More Power wins the clash and pushes the Front.** Power = minions + heroes near the Front — you count too." | Tap **Continue**; Front moved or "no change" summary shown |

#### Round 2 — abilities, cooldowns, 3 actions, line of sight (bot starts: VP tied, it went second)
| Step | Ask | Bot | Copy | Check |
|---|---|---|---|---|
| 2.0 | Watch | Pyra uses Fireball on the player's wave (Wave 3), then moves **behind the Mid wall** within 3 hexes of the player's likely position | Small label before the strip: "Pyra starts: she went second last round." | Bot turn done |
| 2.1 | Use the hero's teaching ability (table A.4) | — | "Abilities are actions too. Use **[key] [name]**." | Ability used |
| 2.2 | See the cooldown | — | Button highlighted. "Abilities come back after a cooldown. This one: **ready in 2 rounds**." (text follows the actual value) | 3 s / tap |
| 2.3 | Aim at Pyra | — | Player chooses Attack or an ability; board shows hatched hexes. "**Walls block shots.** Hatched hexes are behind a wall — for Pyra too." Melee heroes: "Walls block ranged shots. Pyra can't hit you from behind that wall either." | An aim mode was opened with ≥ 1 hatched hex visible for 1 s, or tap "Got it" |
| 2.4 | Finish the turn with 3 actions | — | Pips highlighted. "**3 actions, each once** (Move twice). Mix them: Move, Attack, Q." | Turn ended |
| 2.5 | — | Lane phase | (no prompt; summary card only) | — |

#### Round 3 — level up, trading with the enemy hero, conditions (player starts)
| Step | Ask | Bot | Copy | Check |
|---|---|---|---|---|
| 3.0 | Watch | — | Round banner: "Round 3 · **Everyone is level 2** (+2 HP)." Level clock highlighted: "Levels come by round, for everyone." | auto |
| 3.1 | Hit Pyra (any damaging action) | — | "Hit Pyra. The number shows the damage **before** you commit." | Damage dealt to Pyra |
| 3.2 | — | Pyra: Flame Ring on the player (**Root**), then Scorch | — | Bot turn done |
| 3.3 | Read a condition | — | Root token on the player's base ring highlighted. "You're **Rooted**: no Move on your next turn. Hover (or hold) any token to read it." | Token tooltip opened, or tap "Got it" |
| 3.4 | Read the condition card | — | One card with the 4 conditions (icons + one line each, from HUD 4.3): "**A Stunned hero skips its next turn, then can't be Stunned again right away.**" Bulwark players add: "Your Shield Bash Stuns." | Tap "Got it" |

#### Round 4 — tower rule, recall, base heal, shop (all lanes open)
| Step | Ask | Bot | Copy | Check |
|---|---|---|---|---|
| 4.0 | Watch | Bot starts (VP tied); Pyra retreats **inside her Mid tower's range** and Attacks the wave | Banner: "**Top and Bot lanes are open.** Their waves fight from now on." | auto |
| 4.1 | Aim at Pyra under her tower | — | Hatched tower ring + preview warning highlighted. "**Hurting a hero under their tower = 3 damage to you.** Your call." | Player committed or cancelled an aim at Pyra while the warning showed |
| 4.2 | Recall | — | Recall button highlighted (shown when HP ≤ 70%, else at the end of the turn). "**Recall any time;** next turn you start in base, fully healed." [copy edit: GDD "base heals fully" made explicit] | Recall used, or turn ended (re-offered when HP ≤ 50%) |
| 4.3 | Buy an item | — | At the start of the player's next turn in base the shop opens itself, recommended row highlighted. "Buy one. Basics cost 3. **You can only shop here, at the start of your turn.**" | Item bought, or shop closed |
| 4.4 | Note: no recall cancel | Bot does not damage the recalling player (script) | If the player recalls while in Pyra's range, a one-time line: "If you're hit before your next turn, the recall is cancelled." | — |

#### Round 5 — ultimate, KO and respawn
| Step | Ask | Bot | Copy | Check |
|---|---|---|---|---|
| 5.0 | Watch | — | Banner: "Round 5 · **Everyone is level 3. Your R is ready.**" R button highlighted | auto |
| 5.1 | Use R | Pyra is scripted to be at ≤ the player's R damage + 3 HP and in reach (Easy bot stays forward this round) | "Use your **R** (ultimate). It comes back in 4 rounds." | R used |
| 5.2a | (Pyra KO'd) | Pyra's next slot shows the skip marker | "KO! **+1 VP**, +3 gold. Pyra **skips her next turn**, then comes back in base." Strip highlighted. | auto |
| 5.2b | (player KO'd, fallback) | — | "You were KO'd: **you skip your next turn**, then start in base at full HP. Ember +1 VP." | auto |
| 5.3 | — | — | If no KO happened by round end, 5.2 waits for the first KO of the match. Late-game add-on at the first KO in round 8+: "From round 8 a KO costs **2 turns**." | first KO |

#### Rounds 6–7 — jungle, Drake, stealing
| Step | Ask | Bot | Copy | Check |
|---|---|---|---|---|
| 6.1 | Take a wolf camp | Bot ignores wolves | Nearest camp highlighted. "**Wolf camp**: hit it until it dies. The last hit claims it: +2 gold. It bites back for 1." | Camp claimed, or end of round 7 |
| 6.2 | See the Drake | Drake appears (bot river) | Objective panel + Drake highlighted. "**Drake = 2 VP** and +1 ATK for your team. Damage stays on it — the enemy can steal it with the last hit." | Tap "Got it" |
| 7.1 | Fight for the Drake | Pyra walks to the Drake and hits it once (so a steal is possible either way) | If Drake HP < max: "Damage stays. Whoever lands the **last hit** gets it." | Drake claimed by anyone, or round 8 |
| 7.2 | — | — | Round-7 banner: "Waves are bigger now: **3 minions** each round." | auto |

#### Round 8+ — the VP race and the end
| Step | Ask | Bot | Copy | Check |
|---|---|---|---|---|
| 8.1 | Read the VP bar | Bot plays as a normal Easy bot from here | VP bar highlighted. "**First to 6 VP**, or most VP after round 12, or break their Core." | Tap "Got it" |
| 8.2 | — | — | Top-bar chip appears: "Late game: a KO costs 2 turns." | auto |
| 8.3 | (optional) Destroy a tower | — | At the first time the player's wave is at an enemy tower: "Your wave is at their tower: **Attack it for 2**. A tower is 3 VP." | Tower damaged |
| 8.4 | — | — | "That's every rule. **F1 / ☰ → Quick reference** has them all on one screen." | auto, once |

**End of match:** results screen (FLOWS 9) with "You learned" checklist; primary button **"Next: Commander vs a bot
(2 heroes each)"**; secondary "Play a 1v1 duel", "Back to title".

### A.4 Teaching ability per hero (step 2.1)
Chosen to be safe (no enemy hero needed) and to touch the wave where possible.
| Hero | Ability | Why |
|---|---|---|
| Bulwark | W Iron Stance (Shield 4) | Self, always legal; shows the Shield segment |
| Blademaster | Q Blade Spin (Wave 3) | Wave clear, +gold, CD 1 ("ready next round") |
| Ravager | Q Cleave (Wave 2) | Wave clear, CD 1 |
| Frostbow | Q Volley (Wave 3) | Area on the wave; LoS hatched hexes appear while aiming (sets up 2.3) |
| Lumen | E Barrier on yourself (Shield 3) | Ally/self effect, always legal |

### A.5 Scripted Easy bot (for BOTS)
- Rounds 1–2: farm only (Attack the wave, Fireball on the wave); never targets the player; ends round 1 turn in the
  open, round 2 turn **behind the Mid wall** within 3 hexes of the player (LoS lesson).
- Round 3: Flame Ring (Root) + Scorch on the player; never KOs the player before round 5.
- Round 4: retreats inside its tower ring; doesn't hit a recalling player.
- Round 5: stays within the player's reach, HP set so the player's R + one hit can KO.
- Rounds 6–7: ignores wolves; hits the Drake once in round 7.
- Round 8+: normal Easy bot (scores previews with noise, never dives).
- Fallbacks: if the player leaves Mid before round 4, the bot keeps farming; every lesson trigger is position-free
  except 2.3 and 4.1, which re-trigger the next time their condition occurs.

## Part B — Veteran fast track ("I know MOBAs")

Shown from the title's first-launch card and from Learn. One screen; the tutorial then runs with prompts only (no
gating, coach bubbles as 3 s toasts).

```
LANEFALL FOR MOBA PLAYERS — what's the same, what's different
───────────────────────────────────────────────────────────────────────────────────────────────
Laning, last hits    Same idea. Attack the enemy wave (the minions at the Front) = kill 1 minion = +1 gold.
                     "Wave 2" abilities kill 2. No denies.
Waves, pushing       Minions don't walk around. Each lane has a Front flag. After all heroes act, the Lane phase
                     compares Power (minions + heroes within 2 of the Front): more Power wins, the loser loses the
                     difference; wipe them and the Front moves toward their tower. Farming = pushing.
Tower aggro, diving  One rule: hurt a hero while you're within 2 of their tower → it shoots you for 3 (once a turn).
                     Stand under it without your minions → it shoots you in the Lane phase.
Taking towers        Only Attacks (2 dmg) and only while your wave is at the tower. Tower = 3 VP. Core opens when
                     every tower in one lane is down.
Turns, not APM       Teams alternate one hero at a time. Your turn = 3 actions (Move, Attack, Q, W, E, R),
                     each once, Move twice. Recall and Shop are free.
Mana, XP             None. Everyone levels by round (ult at level 3 = round 5). Cooldowns are in rounds.
Damage               Attacks: ATK − armor. Abilities: card number + POW, ignore armor. No crits, no dice, no RNG.
CC                   Stun = skip your next turn (then immune once: Steadfast). Root = no Move. Slow = −2 SPD.
                     Silence = no abilities. One token each, they don't stack.
Skillshots           Lines hit the first enemy; walls stop them. Ranged shots 2+ hexes away need line of sight;
                     units never block it.
Death timer          KO = skip your next turn (2 from round 8), respawn in base. Enemy +1 VP, killer +3 gold.
Jungle, objectives   Wolf camps (gold), Drake (2 VP, +1 ATK team), Golem (3 VP, Aegis). Last hit claims — steals work.
Items                3 slots. Basic 3 gold, upgrade 7 (4 if you own its basic). Shop in base only. No selling.
Winning              Break the Core, or first to the VP target, or most VP when the round limit ends.
───────────────────────────────────────────────────────────────────────────────────────────────
[ Play the tutorial match with tips only ]   [ Skip — straight to a match ]
```
