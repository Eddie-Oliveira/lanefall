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
