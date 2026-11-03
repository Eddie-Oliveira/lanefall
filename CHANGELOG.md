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
