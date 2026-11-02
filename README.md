# Lanefall

A tabletop MOBA: lanes, towers, minion waves, a jungle and a shop, translated into a turn-based board game
for 1v1 up to 4v4, with bots for empty seats. Being rebuilt in Unity with 3D art.

| Folder | What | Owner agent |
|---|---|---|
| `unity/` | Official game, Unity 6 LTS (from v1.0) | code (`unity/Assets/Art/`: assets, `unity/Assets/UI/`: ux) |
| `core/` | Rules engine in plain C# (no Unity), shared by game, bots and tests | code (`core/Bots/`: bots) |
| `docs/design/` | Game design document, specs, research | design |
| `docs/tech/` | Architecture, engine and netcode notes | code, net |
| `docs/assets/` | Art style guide, 3D pipeline and asset list | assets |
| `docs/ux/` | Screens, flows, tutorial, accessibility | ux |
| `docs/qa/` | Test plans, playtest reports, bug list | qa |
| `docs/RELEASES.md` | Player-facing release notes | docs |
| `prototype-web/` | Frozen browser prototype v0.3 and its sources | — (reference only) |
| `CHANGELOG.md` | The single log every agent writes to | all |

Eddie is the game designer and has the final word on rules.
