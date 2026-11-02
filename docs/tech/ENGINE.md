# Engine and tech decisions

Owner: code (netcode sections: net) · Decided by: lead, 2026-11-02 (Eddie asked the lead to choose) · Status: accepted

## Decision summary

| Topic | Choice | Why |
|---|---|---|
| Engine | **Unity 6.3 LTS** (6000.3.x), Universal Render Pipeline | Eddie wants 3D art; LTS is the long-term supported line. URP runs on desktop, mobile and web. |
| Rules | **Plain C# core** in `core/`, no UnityEngine references | Same pattern as Dicedoku's `godot/core/`: rules testable headless with `dotnet test` in GitHub Actions without a Unity license; bots and simulations reuse it; host and clients run identical rules. |
| Determinism | Integer math only in the core, seeded RNG passed in, no `System.Random` defaults, no floats in rules | Lets the host replay or verify any client action and lets QA reproduce games from a seed. |
| Multiplayer | **Netcode for GameObjects** + **Unity Relay** via the Multiplayer Services SDK (`com.unity.services.multiplayer`) | Turn-based game with small messages: host-authoritative RPCs, no NetworkTransform syncing. Relay means no port forwarding or servers to run. Join codes match the prototype's room codes. |
| Web build | Supported later: Relay over `wss` with Unity Transport ≥ 2.0 and `UseWebSockets = true` | Keeps the "open a link and play" option from the prototype. |
| Tests in CI | `dotnet test` on `core/` on every push (no license needed). Unity EditMode/PlayMode tests via GameCI later, once a Unity license secret is added to the repo. | Fast, free, and covers every rule from day one. |
| Art pipeline | Blender → FBX/glTF → Unity URP Lit; heroes as miniatures on round bases | See `docs/assets/PIPELINE.md` (assets agent). |

## Why Netcode for GameObjects + Relay over the alternatives

| Option | Fit for Lanefall | Cost (checked 2026-11-02) |
|---|---|---|
| **NGO + Relay (chosen)** | Unity's own stack, maintained, host mode fits a party game with friends, works with web via `wss`. | Relay free up to 50 average monthly CCU (≈2.16M connectivity minutes), 3 GiB per CCU, max 150 GiB/month; then $0.16 per extra CCU. Lobby: 10 GiB/month free per region group. A friends-and-family game stays free. |
| Photon Fusion | Excellent tooling, but built for real-time state sync we don't need. | Free tier is capped at 20 CCU; paid plans after that. |
| Mirror / FishNet | Free and open source, but no hosted relay: players would need port forwarding or a paid relay. | Free library, relay extra. |

Note: the standalone Lobby and Relay SDK packages are deprecated in favor of the unified Multiplayer Services SDK; use that package only.

## Planned project layout (for the code and net agents)

```
core/                       Plain C# (netstandard2.1)
  Lanefall.Core.csproj      also a Unity local package: core/package.json + Lanefall.Core.asmdef (noEngineReferences)
  Rules/                    state, actions, resolution, maps, heroes (data)
  Bots/                     bots agent
  Tests/Lanefall.Core.Tests.csproj   xUnit, run by dotnet test in CI
unity/                      Unity 6.3 LTS project
  Packages/manifest.json    references "com.lanefall.core": "file:../../core"
  Assets/Scripts/Game/      board view, input, turn flow (calls core only)
  Assets/Scripts/Net/       net agent: session, relay, intent/state messages
  Assets/Art/               assets agent
  Assets/UI/                ux agent (UI Toolkit)
.github/workflows/tests.yml dotnet test core/
```

Action flow (same as the prototype): input → `Action` object → host validates with `core` → host applies → host sends the new
state (or the action plus a state hash) to clients → views animate the change. Bots produce the same `Action` objects.

## Sources
- [Unity Gaming Services pricing](https://unity.com/products/gaming-services/pricing)
- [Relay with Netcode for GameObjects (Multiplayer Services SDK)](https://docs.unity.com/en-us/mps-sdk/tutorials/relay-and-ngo)
- [UGS in 2026: SDK consolidation notes](https://crux.supercraft.host/blog/unity-gaming-services-alternatives/)
- [Unity 6 releases (6.3 LTS)](https://unity.com/cn/releases/unity-6)
