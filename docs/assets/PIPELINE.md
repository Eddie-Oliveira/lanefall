# Lanefall — 3D Asset Pipeline

Owner: assets · Status: **proposal v1 (2026-11-04)** · Engine: Unity 6.3 LTS, URP (see `docs/tech/ENGINE.md`)
Tools: **Blender 4.x** (modelling, rigging, animation) → **FBX** (skinned and static) or **glTF 2.0** (static, optional) →
Unity. Texture painting: Blender texture paint, Krita, or Substance/ArmorPaint (any; deliver the texture sets in §6).

## 1. Flow

```
Blender (.blend, source of truth, kept in art-source/ outside unity/)       
   │  export (§5)                      
   ▼                                   
unity/Assets/Art/<Class>/<Name>/Models/*.fbx  ── import presets (§9) ──► Prefab PF_* (§10)
unity/Assets/Art/<Class>/<Name>/Textures/*.png ─► Materials (SG_Mini) ─┘        │
                                                                                 ▼
                                    Addressables key (e.g. hero/bulwark) ◄── board view (CODE) loads by core id
```
Source `.blend` and paint files live in `art-source/<Class>/<Name>/` at the repo root (Git LFS), never inside
`unity/Assets/` (Unity would try to import them).

## 2. Scale (1 Unity unit = 1 m)

| Measure | Value | Note |
|---|---|---|
| **1 hex**, flat to flat | **1.000 m** | pointy-top hexes (GDD §3); point to point 1.1547 m; corner radius 0.5774 m |
| Hex grid spacing | x 1.000 m, row 0.866 m (odd rows offset 0.5 m) | axial → world: `x = q + r/2`, `z = r·0.866` (CODE owns the math) |
| Tile top surface | y = 0.00 | tiles extend down to y = −0.15; board slab to −0.30; table top at −0.30 |
| Gap between tiles | 0.02 m bevel (visual only) | |
| **Hero base** | Ø 0.80 m, height 0.08 m | real-mini equivalent 32 mm on a 40 mm hex (1 m = 40 mm) |
| **Hero height** (top of base → top of head) | S 0.65 · **M 0.75** · L 0.90 m | weapons may rise to 1.10 m; nothing may overhang the base by > 0.15 m sideways (the neighbour hex must stay clear) |
| Minion | 0.40–0.45 m on Ø 0.36 m base | up to 6 per side stacked around the Front hex (cosmetic) |
| Tower / Core | 1.6 m / 2.2 m on a 1-hex footprint (Core: 1 hex + 0.2 m apron) | |
| Small neutral (wolf) | 0.45 m on Ø 0.70 m oval base | |
| Big neutral (Drake, Golem, Spider Queen) | ≤ 1.3 m tall, Ø 0.95 m base (may overhang decor 0.25 m) | occupies 1 hex in the rules |
| Condition tokens | Ø 0.12 m, 0.02 m thick | 6 slots on the base rim, at 30°, 90°, 150°… |

Blender scene: **Metric, Unit Scale 1.0, length in metres**. Apply all transforms before export (Ctrl-A → All Transforms).

## 3. Pivot and orientation

- **Pivot = centre of the bottom of the base**, at y = 0 (sits on the tile top). Pieces without a base (tiles, walls)
  pivot at the hex centre, top surface = y 0.
- **Facing:** in Blender the model faces **−Y** (Blender "Front" view looks at its face); exported with the settings in §5
  it faces **+Z** in Unity. Hero rotation in game is a multiple of 60° (6 hex directions); the board view sets it.
- **Skeleton root** bone `root` at the origin; `base` bone parented to root carries the base mesh (so KO tip-over
  rotates around the base edge, see §8); hips above it. No root motion: movement is done by the board view.
- **Sockets** (empty bones or child transforms, exact names, CODE/VFX attach by name):

| Socket | Where | Used for |
|---|---|---|
| `socket_weapon_r` / `socket_weapon_l` | Weapon hands | Weapon swaps, trails |
| `socket_cast` | Staff tip / focus / launch point | Projectile spawn |
| `socket_head` | 0.1 m above head | Stun stars, Silence seal, overhead UI anchor |
| `socket_chest` | Sternum | Hit sparks, Shield dome centre |
| `socket_base` | Base top centre | Root vines, Poison drips, Haste trails, ground ring |
| `socket_token_0..5` | On the base rim, 6 positions | Condition tokens |

## 4. Naming

Pattern: `PREFIX_Class_Name[_Variant][_Suffix]`, PascalCase names that match the **core ids** (`bulwark` → `Bulwark`).

| Prefix | Asset | Example |
|---|---|---|
| `SK_` | Skinned mesh FBX | `SK_Hero_Bulwark.fbx` |
| `SM_` | Static mesh | `SM_Tower_Azure_Damaged.fbx`, `SM_Tile_Rift_Turf_03.fbx` |
| `A_` | Animation clip (inside or beside the FBX) | `A_Hero_Bulwark_CastR` |
| `T_` | Texture | `T_Hero_Bulwark_A.png` (`_A` albedo, `_N` normal, `_M` mask, `_E` emissive) |
| `M_` | Material | `M_Hero_Bulwark`, `M_Base_Azure` |
| `SG_` | Shader Graph | `SG_Mini`, `SG_Resin`, `SG_Decal` |
| `AC_` / `AOC_` | Animator Controller / Override | `AC_Hero` (shared), `AOC_Hero_Bulwark` |
| `PF_` | Prefab | `PF_Hero_Bulwark`, `PF_Minion_Melee_Ember` |
| `VFX_` | VFX Graph or particle prefab | `VFX_Bulwark_SolarFlare`, `VFX_Cond_Stun` |
| `ICO_` | UI icon | `ICO_Item_IronSword`, `ICO_Ability_Bulwark_Q`, `ICO_Cond_Root` |
| `SFX_` | Sound | `SFX_Bulwark_ShieldBash_01.wav` |
| `PH_` | **Placeholder** (any type) | `PH_SK_Hero_Bulwark.fbx` — the prefab name stays `PF_Hero_Bulwark` so code never changes when the final lands |

Team variants: `_Azure` / `_Ember` only where the **mesh** differs (towers, Core, minion shields, base rims). Heroes are
team-neutral; their team is a material property (§6).
Animation state names (shared Animator, §8) and **Addressables keys** are lower-case: `hero/bulwark`,
`minion/melee/azure`, `structure/tower/ember`, `tile/rift/turf`, `vfx/cond/stun`, `icon/item/iron_sword`.

## 5. Export settings

**FBX (skinned and static)** — Blender File → Export → FBX:
- Selected objects only · Object types: Armature, Mesh, Empty
- **Apply Scalings: FBX Units Scale** · **Forward: −Z** · **Up: Y** · **Apply Transform: on**
- Armature: Primary bone axis Y, Secondary X, **Add Leaf Bones: off**, Only Deform Bones: on (sockets exported as Empties)
- Bake Animation: on, NLA strips **on** (one strip per action = one clip), Sampling rate 1, **30 fps** scene rate
- Mesh: Smoothing **Face**, Triangulate off (Unity does it), Tangent space on
**glTF 2.0** (optional for static props/tiles; Unity side needs `com.unity.cloud.gltfast`): +Y up, apply modifiers,
no cameras/lights, textures external.
**Check every export** with the orientation test: `PH_SM_OrientationTest` (arrow on +Z, 1 m cube) must import facing
the board's +Z with scale (1,1,1) and rotation (0,0,0).

## 6. Texture sets

| Map | Suffix | Channels | Format in Unity (desktop / mobile+web) |
|---|---|---|---|
| Albedo (painted, lighting baked lightly: edge highlights + wash, **no cast shadows**) | `_A` | RGB, A unused | BC7 / ASTC 6×6 |
| Normal (OpenGL +Y) | `_N` | RG(B) | BC5 / ASTC 6×6 |
| **Mask** | `_M` | **R** metallic · **G** ambient occlusion · **B** team mask (1 = recolor with team color) · **A** smoothness | BC7 / ASTC 6×6, **sRGB off** |
| Emissive (only where needed) | `_E` | RGB | BC7 / ASTC 8×8 |

- Texel density targets: heroes **1024 px/m** desktop (a 0.75 m hero on 2048), minions 512 px/m, board 256 px/m
  (+ tiling detail).
- Team color: `SG_Mini` lerps albedo toward `_TeamColor` × albedo luminance where mask B = 1. Azure and Ember values in
  STYLE §3.2. **Every hero has a team-mask area of 5–10 % of visible surface** (pennant, sash, plume or shield trim).
- One material per hero (single UV set, one texture set); weapons share the body atlas. VFX textures in a shared atlas.

## 7. Budgets

Triangles (incl. base unless noted) · textures per set · bones. **Desktop** = Windows/macOS. **Mobile/web** = Android/iOS,
WebGL/WebGPU (ENGINE "web later").

| Asset class | Desktop LOD0 tris | LOD1 / LOD2 | Mobile/web LOD0 | Texture set desktop / mobile | Bones / influences |
|---|---|---|---|---|---|
| **Hero** (incl. base and weapon) | **12,000** | 6,000 / 2,500 | 6,000 (= LOD1) | 2048 / 1024 | ≤ 60 / 4 (mobile 2) |
| Hero base (shared, alone) | 600 | 300 | 300 | in the hero set; rim in a shared 512 | — |
| **Minion** (melee or caster) | 2,500 | 1,200 / 600 | 1,200 | 512 shared atlas (both kinds, both teams) | ≤ 25 / 2 |
| **Tower** (per damage state) | 8,000 | 4,000 / 1,500 | 4,000 | 1024 / 512 (shared tower+Core set per team) | static |
| **Core** (per damage state) | 12,000 | 6,000 / 2,500 | 6,000 | 2048 / 1024 | static (+ crystal spin) |
| Fountain | 6,000 | 3,000 | 3,000 | 1024 / 512 | static |
| **Neutral: wolf** | 4,000 | 2,000 / 1,000 | 2,000 | 1024 / 512 | ≤ 35 |
| **Neutral: Drake / Golem / Spider Queen** | 15,000 | 7,000 / 3,000 | 7,000 | 2048 / 1024 | ≤ 70 |
| **Board tile** (one hex variant) | 300–800 | 150–400 | same as LOD1 | per-map 2048 atlas + 1024 trim / 1024 + 512 | static |
| Wall hex / river hex | 800–1,500 | 400–700 | LOD1 | in map atlas | static |
| Props (altar, relic, Front marker, banners) | 500–3,000 | 50 % | LOD1 | 512 / 256 or in map atlas | static or ≤ 10 bones |
| Condition token | 120 | — | 120 | one 512 token atlas | static |
| Table + board frame | 10,000 | — | 5,000 | 2048 / 1024 | static |

**Scene totals** (worst case: The Rift 4v4, 72 minions, all structures, close zoom):
desktop ≤ **450k** tris visible, ≤ **300** draw calls (SRP Batcher on); mobile/web ≤ **150k** tris, ≤ **120** draw calls,
≤ **350 MB** texture memory desktop / **150 MB** mobile. Minions use GPU instancing; board tiles are merged per 6×6
chunk at build time (static batching).

**LODs:** Unity `LODGroup` with screen-height transitions LOD0 > 25 %, LOD1 > 10 %, LOD2 > 3 %, culled below 1 %.
At the default camera a hero fills ~6–12 % of screen height, so **LOD1 is the everyday mesh**: make LOD1 carry the
silhouette. Mobile/web builds strip LOD0 (quality-level `maximumLODLevel = 1`). LODs made in Blender (Decimate +
hand cleanup on the silhouette) or Unity's LOD generation package; tokens and tiles have no LODs.

## 8. Rig and animation

One **shared humanoid-ish rig** `RIG_Mini_Biped` (Blender metarig-based, ~50 deform bones: root, base, spine×3, neck,
head, arms with 2-bone IK, fingers merged to 2 per hand, legs with IK, 2 prop bones, 2 cloth/cape bones) for 12 heroes.
**Bramblehorn** uses `RIG_Mini_Biped` with extra head/horn bones; **Butcher's** winch chain uses 6 extra chain bones.
Quadruped neutrals and the Spider Queen get their own rigs. Unity import as **Generic** (not Humanoid: proportions are
stylized and we never retarget mocap); each hero's Animator Override replaces the clips in the shared `AC_Hero`.

### 8.1 Hero clip list (every hero; state names exact)

| State | Clip | Frames @30 fps | Loop | Events (for VFX/SFX timing) |
|---|---|---|---|---|
| `idle` | `A_Hero_<Name>_Idle` | 60–90 | yes | — |
| `idle_break` (optional) | `_IdleBreak` | 60–120 | no | — |
| `move` | `_Move` (stylized walk/hop in place; the board view glides the base) | 16–24 | yes | `Step` |
| `attack` | `_Attack` (Marksmen: `_Attack2` second shot) | 14–20 | no | `Impact` (or `Release` for ranged) |
| `cast_q`, `cast_w`, `cast_e` | `_CastQ/W/E` | 20–36 | no | `Release`, `Impact` |
| `cast_r` | `_CastR` (ultimate, close-up camera) | 36–54 | no | `Release`, `Impact` |
| `hit` | `_Hit` (additive layer) | 8–12 | no | — |
| `stunned` | `_Stunned` (dazed sway; tilts back 5°) | 40–60 | yes | — |
| `ko` | `_KO` (tips over on the base edge, rocks once) | 30–40 | no | `Down` (then the board view lifts the mini off) |
| `victory` | `_Victory` | 60–90 | hold last frame | — |
| `selected` (optional) | `_Selected` (a short ready-pose flourish when picked in the draft) | 30 | no | — |

Moves that relocate the hero (Charge, Leap, Tumble, Slither, Rocket Jump, Shadow Step, Omnislash) reuse the matching
`cast_*` clip; the board view moves the base and plays an arrive puff (no extra locomotion clips).
**Minions:** `idle`, `march`, `clash` (attack loop), `die` (fall + paint-flake pop), team-neutral clips, one rig.
**Neutrals:** `idle`, `attack` (Bite), `hit`, `die`, `spawn`. **Structures:** no rig; damage states are mesh swaps with a
crumble VFX between them.

## 9. Unity import settings (save as Presets in `Art/_Presets/`)

| Preset | Applies to | Key settings |
|---|---|---|
| `PR_Model_Skinned` | `SK_*` | Scale 1, **Bake Axis Conversion on**, Import Cameras/Lights off, Rig: **Generic**, Avatar from this model (shared avatar per rig), Optimize Game Objects on (expose `socket_*` transforms), Anim compression Optimal, Materials: **None** (assigned in prefab), Read/Write off, Mesh compression Low, Blend shapes off |
| `PR_Model_Static` | `SM_*` | Same scale/axis; Rig None; Generate Lightmap UVs off (realtime only); Mesh compression Medium |
| `PR_Tex_Albedo` | `*_A`, `*_E` | sRGB on, mipmaps on, max 2048 (Android/iOS/Web overrides 1024), BC7 / ASTC 6×6 |
| `PR_Tex_Normal` | `*_N` | Normal map, max 2048 / 1024 |
| `PR_Tex_Mask` | `*_M` | **sRGB off**, max 2048 / 1024 |
| `PR_Tex_Icon` | `ICO_*` | Sprite (2D and UI), 256 px, no mipmaps, uncompressed on desktop / ASTC 4×4 |
| `PR_Audio_SFX` | `SFX_*` | Vorbis q 0.6 (desktop) / 0.4 (mobile), Load in background, short clips Decompress on Load |

A `PresetManager` default by folder is set up so imports land correctly without manual clicks.

## 10. Prefab contract (what CODE's board view can rely on)

```
PF_Hero_<Name>                 (root; no scripts from Art except LODGroup; CODE adds its view component)
 ├─ Model                      SK_Hero_<Name> (Animator with AOC_Hero_<Name>), LODGroup
 │    └─ sockets socket_*      (exposed transforms, §3)
 ├─ Base                       SM_Base_Hero + SM_BaseRim_Azure | SM_BaseRim_Ember (both present, one enabled)
 └─ Tokens                     6 empty slots socket_token_0..5
```
- Team is set by calling one method on an Art-side `TeamTint` component (`SetTeam(Azure|Ember)`): swaps the rim mesh,
  sets `_TeamColor` on the material property block, sets the decal ring. This is the only Art script.
- Minions: `PF_Minion_<Melee|Caster>_<Azure|Ember>`; structures: `PF_Tower_<Team>` and `PF_Core_<Team>` with child
  states `Intact`, `Damaged`, `Destroyed` (CODE enables one; thresholds suggested HP > 50 %, > 0, 0).
- Tiles: `PF_Tile_<Map>_<Kind>_<nn>`; the level builder (CODE) chooses variants by a seeded hash of the hex coordinate
  so the board looks hand-made but identical for every client.

## 11. Placeholders (made now, replaced later without code changes)

Placeholders are **ugly on purpose** but true to scale, pivot, sockets and naming, so CODE can build the board view
before any final art. They are marked `PH_` and `status: placeholder` in `ASSETS.md`.

**Option A — Blender Python** (preferred, one script for everything): `art-source/_tools/make_placeholders.py`
(to be written by assets when `unity/` exists) builds:
- hero: Ø 0.8 m cylinder base (16 sides) + rim ring + capsule body (height by size class) + a cone "nose" pointing −Y
  (facing) + a primitive prop (box sword, cylinder staff, torus shield) + empties for every socket; exported with §5;
- minion: small capsule on a Ø 0.36 m disc, round (Azure) or kite (Ember) plane shield;
- structures: cylinder (Azure) / box (Ember) towers with 3 states (full, cracked = top 30 % removed, rubble = flat);
- tiles: 6-sided cylinder, 1.0 m flat-to-flat, 0.15 m tall, one per tile kind, vertex-coloured by kind.

```python
# core of make_placeholders.py (Blender 4.x, run: blender -b -P make_placeholders.py)
import bpy, math
def hex_tile(name, color, h=0.15):
    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.57735, depth=h, location=(0, 0, -h/2))
    o = bpy.context.object; o.name = name; o.rotation_euler[2] = math.radians(30)  # pointy-top in Unity
    return o
def hero(name, height):
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.40, depth=0.08, location=(0, 0, 0.04))
    base = bpy.context.object; base.name = name + "_Base"
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.18, depth=height-0.08, location=(0, 0, 0.08+(height-0.08)/2))
    body = bpy.context.object; body.name = name + "_Body"
    bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=0.06, depth=0.15, location=(0, -0.22, height*0.75),
                                    rotation=(math.radians(90), 0, 0))       # points -Y = forward
    for s, z in [("socket_head", height+0.1), ("socket_chest", height*0.65), ("socket_base", 0.08)]:
        bpy.ops.object.empty_add(location=(0, 0, z)); bpy.context.object.name = s
```
(Blender is Z-up; the FBX export settings convert to Unity Y-up.)

**Option B — Unity ProBuilder** (if no Blender is at hand): same shapes from ProBuilder primitives (Cylinder 6 sides
for tiles, Cylinder 16 for bases, Capsule body), exported to FBX with the FBX Exporter package into the same `PH_`
paths so the prefab references do not change.

Placeholder colours: mid-grey body, team rim in the STYLE team values, prop in brass, one bright marker on the face
side so facing is obvious.

## 12. Folder layout (`unity/Assets/Art/`)

```
unity/Assets/Art/
  _Presets/                 import presets (§9), PresetManager defaults
  _Shared/
    Shaders/                SG_Mini, SG_Resin, SG_Decal, SG_Dither, SG_VFX_*
    Materials/              M_Base_*, M_TeamRim_*, master materials
    Rigs/                   RIG_Mini_Biped (avatar + test FBX), RIG_Quadruped, RIG_Spider
    Animators/              AC_Hero, AC_Minion, AC_Neutral
    Scripts/                TeamTint.cs (the only Art script; Art.asmdef, no gameplay refs)
  Heroes/<Name>/            Models/ Textures/ Materials/ Animations/ VFX/ PF_Hero_<Name>.prefab   (14 folders)
  Minions/                  Models/ Textures/ Animations/ PF_Minion_{Melee,Caster}_{Azure,Ember}.prefab
  Structures/               Tower/ Core/ Fountain/ (Azure + Ember, 3 states each)
  Neutrals/                 Wolf/ Drake/ Golem/ SpiderQueen/
  Board/
    Common/                 table, board frame, edge pieces, decals (range, LoS hatch, arrows)
    Rift/  TwinHollow/  FrostBridge/     tiles, walls, river, map props, per-map atlas
  Props/                    FrontMarker/ Altar/ HealthRelic/ Aegis/ Banners/
  Tokens/                   condition tokens + token atlas
  VFX/
    Damage/  Conditions/  Previews/  Shared/       (per-hero ability VFX live in Heroes/<Name>/VFX/)
  Icons/
    Items/  Abilities/  Conditions/  Roles/  UI/
  Audio/
    SFX/{Heroes,UI,Board,Neutrals,Structures,Conditions}/   Music/
  Placeholders/             PH_* meshes (deleted as finals land; prefabs keep their names)
```
`art-source/` (repo root, Git LFS: `*.blend`, `*.kra`, `*.spp`, `*.psd`, `*.wav` masters) mirrors the same tree.

## 13. Definition of done for a final asset
1. Scale/pivot/facing pass the orientation test; sockets present. 2. Within budget (tris, texture, bones) at every LOD.
3. Reads at the default camera on a 1280×720 phone screenshot: silhouette, team rim, tokens. 4. Greyscale check (team
and conditions still distinguishable). 5. Row in `ASSETS.md` updated to `final` with source and license.
