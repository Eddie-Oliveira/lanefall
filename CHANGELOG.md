# Lanefall — Project Changelog (single source of truth)

Every change by any agent (or by hand) gets ONE entry here, newest at the top.
Agents read only the entries tagged with their area, e.g.:

    grep -n -A12 "areas:.*CODE" CHANGELOG.md | head -80

## Entry format (copy exactly)

```
### [YYYY-MM-DD] vX.Y(-dev) · <short title>
areas: DESIGN | CODE | NET | BOTS | ASSETS | UX | QA | DOCS   (list every area affected)
agent: design | code | net | bots | assets | ux | qa | docs | lead
- What changed and why (1–5 bullets)
- Files: path/one, path/two
- Tests: what was run and the result (CI run link or "n/a")
- Needs: follow-up for another area, e.g. "ASSETS: Bulwark mini, 3 LODs" (or "none")
```

Rules
- One entry per finished change; no entry for work in progress.
- "Needs" lines are how areas hand work to each other. The receiving agent closes it by
  writing its own entry that starts with "Closes: <title of the entry it answers>".
- Never rewrite old entries; correct them with a new entry.
- Eddie is the game designer and has the final word on rules. Agents list options and ask; they do not decide silently.

---

### [2026-11-04] v0.3.3 · Prototype: line of sight for all ranged enemy targeting (Q11)
areas: CODE | QA
agent: lead
- Eddie's decision Q11 applied to the web prototype: every enemy-targeted ranged attack or ability (range 2+) needs line of sight; walls block, units don't; ally effects, globals, lines and dashes exempt. Per-hero LoS flags removed.
- Files: prototype-web/lanefall-v0.3.html, prototype-web/src/{engine,ui}.js, prototype-web/tests/test_v032_draft.js
- Tests: test_v032_draft.js 74/74 (adds LoS for Frostbow basic and Volley), test_v031.js 13/13; bot sims all maps, 0 rule errors
- Needs: none

### [2026-11-04] v1.0 · GDD v1.0 (decided): Eddie's answers to Q1–Q17
areas: DESIGN | CODE | BOTS | NET | ASSETS | UX | QA
agent: design
- Eddie answered Q1–Q17 (raw answers + "how applied" in `docs/design/decisions-2026-11-04.md`); GDD is now v1.0 (decided), §17 = Decision log + one new open question **Q18 (add level 6?)**, recommendation: keep 5 levels.
- Where Eddie differed: **single activations** at every size (4v4 back under 75 min with a 45 s timer at 3v3/4v4 + Twin Hollow 4v4 limit/VP 10); **Stun skips the turn** with safeguards (Steadfast immunity, Cleansing Veil/Riptide save the turn, Flame Ring + Earthshaker root, Bubble CD 3); **respawn skip 2 from round 8**; **Commander** 2v2 (two heroes per player, A1 B1 A2 B2, snake A BB A, starter pairs, §4.1); **Viper Poison + POW**, Kiss of Death Poison 3 → 2 so she peaks at max level.
- LoS is a board rule for all enemy-targeted ranged attacks/abilities (exemptions in §3); Mage and Deadeye LoS traits removed, no replacement; Pyra stays nerfed (Pyroblast range 3, Flame Ring root). Shade: wave-wipe measured at median 3 minions (mean 3.4 when not empty, single-kill wipe 6%), so Shadow Reset = **any Q/W/E kill**, once per activation (Eddie's condition). Q16: coin flip for first pick, other team picks round-1 starter, rematches alternate.
- Files: docs/design/GDD.md, docs/design/decisions-2026-11-04.md, docs/design/sim/lanefall_sim.py, docs/design/sim/ttk.py, docs/design/sim/results.jsonl
- Tests: `python3 docs/design/sim/lanefall_sim.py` (500 games/map/size, v1.0 rules): 4v4 Rift 52/69 min, Twin Hollow 49/66 (expert/learning; no levers: 57/86, 65/97; duo was 37/52); Commander 32–34/48–50; all games end by the limit. `--variants` lever table (GDD 16.3). `ttk.py --viper`: Viper L1/L3/L5 3.0/2.8/1.9, #3 at L5 behind marksmen 1.8. `--stun`: no 1v1 stun-window KO of a full-HP squishy except L5 Frostbow (r3 Pyra could at L3). `--shade`: reset b adds no single-target burst. `draft.py` unchanged.
- Needs: CODE: implement `core/` from GDD v1.0 — single-alternation `ActivationOrder` (skips keep their slot, "Go next" claims), Stun-skip + Steadfast, Veil on a stunned turn, respawn 2 from round 8, LoS for every enemy-targeted ranged action (§3 exemptions), Shadow Reset on any Q/W/E kill, Poison + POW, card changes (Pyroblast 3, Flame Ring/Earthshaker Root, Bubble CD 3, Kiss of Death Poison 2), first-pick coin flip + round-1 choice, Commander lobby, Twin Hollow 4v4 10/10, per-size timers; unit tests listed in GDD §19 "CODE (v1.0)".
- Needs: BOTS: choose which hero activates each team turn (Commander + bot teams), Threat counts stuns as lost turns, skip stuns on Steadfast targets, Shade Shuriken-the-wave-first plan, POW-aware Poison, LoS for all ranged, Commander bot drafts a starter pair.
- Needs: NET: one active hero at a time (duo turns dropped), "Go next" slot claims locking at team-turn start, timers 60 s (1v1/2v2) / 45 s (3v3/4v4) + per-player 30 s bank, Commander (one client, two heroes), coin flip + round-1 choice in the replay log.
- Needs: ASSETS: Steadfast token (grey ring), skipped-turn marker for the turn strip, coin-flip draft animation; Flame Ring/Earthshaker VFX now read as root, not stun.
- Needs: UX: turn-order strip (A B A B, skipped slots), "Go next" button, "Skips next turn" stun preview, LoS overlay for every ranged hero, Commander HUD (two hero cards, choose-who-acts) and draft with starter pairs, first-pick/round-1 choice screen, timer ring per size, planning mode during others' turns (~5 min 4v4 wait), quick reference §15 and tutorial §14 prompts.
- Needs: QA: acceptance tests from GDD §19 (stun before/after activation, Steadfast vs Bubble→Horn Toss, Veil on stunned turn, KO round 7 vs 8, LoS exemptions incl. Shadow Step through a wall, single Shuriken reset, Poison with POW 2, Commander order A1 B1 A2 B2, seeded replay); compare `core/` against `lanefall_sim.py` ranges (§16.2) once all 14 heroes are in.

### [2026-11-04] v0.3.2 · Prototype: 14 heroes (2 per class) and snake draft
areas: CODE | QA
agent: lead
- Six new heroes in the web prototype, one more per class: Ravager (Fighter), Viper (Assassin), Stormcaller (Mage, line of sight), Deadeye (Marksman, free attack, line of sight), Tidesinger (Support), Bramblehorn (Initiator).
- New mechanics: knockback, pull to centre, chain targeting, cleanse, haste, missing-HP damage, area shields; area abilities can no longer target wall tiles.
- Draft before the match (Eddie's pick order): Azure 1, then 2 each alternating, last pick single (4v4 A EE AA EE A). Pick modes Draft (default), Free pick, All random (Frost Bridge default). Bots fill missing roles.
- Draft screen: pick-order strip, both teams, heroes by class with taken ones greyed out, skill details before lock-in, "easy" tags.
- Files: prototype-web/lanefall-v0.3.html, prototype-web/src/{engine,ai,ui}.js, prototype-web/src/shell.html, prototype-web/tests/test_v032_draft.js
- Tests: test_v032_draft.js 71/71 (draft order 1v1–4v4, uniqueness, bot role spread, each new mechanic, 4v4 bot games on all maps); test_v031.js 13/13; browser draft flow at desktop and phone width, 0 errors
- Needs: none (GDD r3 covers the v1 versions)

### [2026-11-04] v1.0-dev · GDD r3: 14 heroes (2 per role) and the hero draft
areas: DESIGN | CODE | BOTS | UX | ASSETS | NET
agent: design
- Eddie's requests: six heroes translated from the prototype into v1 rules (Ravager, Viper, Stormcaller, Deadeye, Tidesinger, Bramblehorn) with stats, cooldowns and MOBA one-liners; roles table with role traits (Marksman: Twin Shot for Frostbow + Deadeye; Mage: Line of Sight for Pyra + Stormcaller, plus Deadeye) and difficulty stars.
- New effects each defined once, condition list still 5: dash/jump/knockback/pull/pull-to-centre (6.8, structures, neutrals and waves can't be moved); cleanse, haste (buff), missing-HP damage, chain, Viper's Poison trait (POW not added) (6.9); Free abilities; condition durations "(2)".
- Hero draft (10.2): snake order A BB AA BB A (3v3 A BB AA B, 2v2 A BB A, 1v1 A B), unique heroes, next seat in seat order, bot role-fill (Tank, Mage, Marksman, Support, Fighter, Initiator, Assassin), modes Draft / Free pick / All random (Frost Bridge default), 30 s pick timer with hover-or-bot auto-pick. Onboarding draft help (14), quick-reference DRAFT line (15).
- Balance (`ttk.py`): new heroes close to their role partner (avg TTK L1/L5: Ravager 2.8/2.8 vs Blademaster 2.5/2.6, Viper 3.0/2.2 vs Shade 2.6/2.2, Stormcaller 2.9/2.4 vs Pyra 2.6/2.4, Deadeye 3.4/1.8 vs Frostbow 4.3/1.8); Bramblehorn weakest damage (5.1/5.7). Watch list 16.4 #9–15 (Deadeye, Earthshaker combos, Viper L3, Ravager sustain). `draft.py`: 0% role denial with 14 heroes and no bans; 1 ban/team → 84% at 4v4, so no bans until 3 per role (6%).
- Open questions Q14 (who takes each pick), Q15 (bans), Q16 (first pick), Q17 (Poison vs Burn condition); 18.2 lists r3 changes.
- Files: docs/design/GDD.md, docs/design/sim/ttk.py, docs/design/sim/draft.py
- Tests: `python3 docs/design/sim/ttk.py` (original 8 rows unchanged), `python3 docs/design/sim/draft.py` (+ `--pool3`); pacing sim not re-run (still 8 heroes, see 16.1)
- Needs: ASSETS: 6 hero miniatures in the existing style, team-color base ring, idle + cast pose: Ravager (axe brawler), Viper (serpent assassin, poison-green), Stormcaller (storm mage, lightning staff), Deadeye (long-rifle sniper, scope), Tidesinger (water priestess, bubble/wave), Bramblehorn (armored rhino-like charger); plus Poison token (n + 3 pips), Haste icon, knockback/pull arrows, chain-lightning and radius-2 area VFX.
- Needs: UX: draft screen — pick-order strip (A BB AA BB A with seat avatars, current pick highlighted), role filter + "Recommended" (★ Easy) filter, hero card (stats, 4 abilities, role trait, stars, MOBA one-liner), hover vs lock-in, 30 s timer ring, "Your team needs" hint, 10 s team view; tutorial hero choice from the 5 Easy heroes (GDD 14, 19).
- Needs: CODE: draft phase before round 1 in core (order, seats, uniqueness, 3 pick modes, timeout auto-pick), the six heroes, Free abilities, 6.8 forced movement, 6.9 cleanse/haste/missing-HP/chain/Poison, condition durations, role traits, previews; unit tests listed in GDD 19.
- Needs: BOTS: draft by role priority (`BotDraftPick`), play the six heroes from previews (Gust/Horn Toss toward own tower, Earthshaker on ≥ 2 heroes, Riptide on stunned ally, Poison-aware recall); 1v1 draft suggestion in GDD 19.
- Needs: NET: draft sync (host-authoritative order and uniqueness, team-only hover), 30 s pick timer, disconnect/timeout auto-pick, picks in the replay log.

### [2026-11-02] v0.3.1 · Prototype: Pyra line of sight, Shade execute 20% and action reset
areas: CODE | QA
agent: lead
- Eddie's playtest feedback applied to the web prototype he is testing (prototype otherwise frozen as reference).
- Pyra: walls block her basic attack and all spells (units don't); Fireball target tiles behind walls are excluded.
- Shade: Death Mark executes at or under 20% HP (was 35%). Shuriken / Shadow Step kills (any unit) refund her action; cooldowns still apply, so the chain is bounded by cooldowns. Bots use the new rules.
- Note: the prototype's reset triggers on any unit kill; GDD v1.0-draft r2 uses a stricter trigger (open question Q12).
- Files: prototype-web/lanefall-v0.3.html, prototype-web/src/{engine,ai,ui}.js, prototype-web/tests/test_v031.js
- Tests: prototype-web/tests/test_v031.js 13/13 pass; bot sims on all 3 maps, 1v1–4v4, 0 rule errors
- Needs: none

### [2026-11-02] v1.0-dev · GDD r2: Pyra line of sight, Shade execute 20% and Shadow Reset
areas: DESIGN | CODE | BOTS | UX
agent: design
- Eddie's v0.3 playtest. New board rule (GDD 3): line of sight from hex center to target center, blocked only by wall hexes; units never block (Skytear-style). Pyra's trait: every Attack and ability needs LoS to its target (Fireball: to the target hex). Numbers unchanged; fallback Pyroblast range 4 → 3.
- Shade Death Mark: execute at or below 20% of max HP, rounded down (14-HP squishy: ≤ 2 HP; 31-HP tank: ≤ 6). 15% kept as the alternative to test.
- Shade trait Shadow Reset: once per activation, a Q/W/E hero KO, neutral claim or wave wipe refunds 1 action (4 total); the killing ability stays on cooldown, no chains. A plain last hit does not count (otherwise +1 action every lane turn).
- Open questions Q11 (LoS for all ranged? recommend yes, allies/globals exempt), Q12 (reset trigger), Q13 (15% vs 20%). Updated sections 3, 6.2, 10, 12, 15, 16.4, 17, 18, 19.
- Files: docs/design/GDD.md, docs/design/sim/ttk.py
- Tests: python3 docs/design/sim/ttk.py (shade_report): one-activation KO from current HP, 20% rule: L3 squishy 11/14 (old ≤4 rule 13), L5+items Pyra 20/20, Blademaster 21/29, Bulwark 20/31. Reset double KO: 2nd squishy from 11/14 HP at L3 (9 without). Reset on every last hit = +2/+4 burst at L3/L5.
- Needs: CODE: HasLineOfSight(from,to) with tests (edge-grazing lines not blocked, units not blocking), Pyra targeting filtered by it, execute = maxHP/5, Shadow Reset refund flag per activation.
- Needs: BOTS: use HasLineOfSight in Threat/positioning vs Pyra; plan Shade's refunded action from previews (grantsAction).
- Needs: UX: Pyra LoS overlay (visible vs wall-blocked hexes, sight line to hover, "No line of sight" preview); Shade 4th reset pip and execute threshold on the target HP bar; quick-reference card lines (GDD 15).

### [2026-11-02] v1.0-dev · GDD v1.0-draft: tabletop redesign
areas: DESIGN
agent: design
- Wrote the v1.0 redesign: hex board, alternating activations (duo turns at 3v3/4v4), 3 actions each once (Move twice), lanes as Front + Power with minion minis and last hits, one tower rule, levels by round (ult at L3 = round 5), 5 conditions, no dice, 14 items / 3 slots, VP race + round limit replacing overtime. 8 heroes and 3 maps rewritten with numbers.
- Kept Eddie's requests: marksman Twin Shot (Attack hits twice), recall at any point, full heal in base (potions removed), Twin Hollow and Frost Bridge.
- Rationale doc lists the 9 v0.3 rules behind the 3-match learning curve. 10 open questions for Eddie in GDD section 17 (resource system, duo turns, stun, lane abstraction, ending, respawn, 2-player mode, denies, Frost Bridge recall, dive damage).
- Files: docs/design/GDD.md, docs/design/v1.0-redesign-rationale.md, docs/design/sim/lanefall_sim.py, docs/design/sim/ttk.py, docs/design/sim/results.jsonl
- Tests: pacing sim, 500 seeded bot games per map/size: Rift 9.7–10.7 rounds (1v1 21–30 min, 4v4 42–58 min), Twin Hollow 4v4 47–66 min, Frost Bridge 14–45 min; every match ends by round 12 (Frost Bridge 8); win split 45–53% except Frost Bridge 1v1 seat bias (41/57, flagged). v0.3 baseline: 26/30 bot games reached overtime.
- Needs: CODE: implement GDD sections 3–11 in core/ (pure C#), deterministic seed + action-log replay, LegalActions with previews, LaneForecast, Threat (section 12); use docs/design/sim as expected-outcome reference.
- Needs: BOTS: plan-scoring bot over action previews (GDD 12); scripted Easy bot for the tutorial (GDD 14).
- Needs: ASSETS: model list: 8 hero miniatures (team-color bases), melee/caster minion minis (2 teams), tower and Core (intact/damaged/destroyed), Front marker, hex tile sets for Rift/Twin Hollow/Frost Bridge, Fountain, wolf, Drake, Stone Golem, Spider Queen, altar, health relic, condition tokens (stun/root/slow/silence/shield/hidden), Aegis.
- Needs: UX: HUD (hero card with 3 actions and cooldown pips, VP/round bar, lane forecast arrows, tower range rings, damage previews), shop with 3 recommended items, tutorial per GDD 14, quick-reference card per GDD 15.
- Needs: NET: duo turns (two allies acting at once, server-ordered validation), 60 s activation timer + bank, seed + action-log sync.

### [2026-11-02] v0.3 · Web prototype frozen, team set up, Unity chosen
areas: DESIGN | CODE | DOCS
agent: lead
- Froze the browser prototype v0.3 (8 heroes, 3 maps, bots, hotseat, online rooms) in `prototype-web/` as the rules reference. No further changes there.
- Set up the agent team in `.claude/agents/` (design, code, net, bots, assets, ux, qa, docs), mirroring the Dicedoku structure.
- Engine: Unity 6 LTS, URP, rules in a pure C# core tested with `dotnet test` (see docs/tech/ENGINE.md).
- Research on Skytear and Rum & Bones for the tabletop redesign: docs/design/research/tabletop-moba.md.
- Playtest note from Eddie: a veteran MOBA player needed ~3 matches to understand v0.3. Marksman free attack, recall at any time and full heal in base were added to v0.3 on request.
- Files: prototype-web/*, .claude/agents/*, docs/design/research/tabletop-moba.md, docs/tech/ENGINE.md, README.md
- Tests: prototype bot simulations (all maps, 1v1–4v4), 0 rule errors
- Needs: DESIGN: GDD v1 redesign for faster learning, using the research.
