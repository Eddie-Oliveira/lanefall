# Lanefall — Asset List

Owner: assets · Updated 2026-11-04 (GDD v1.0) · Style: `STYLE.md` · Pipeline, budgets, naming: `PIPELINE.md` · Hero briefs: `hero-sheets/`

**Every asset starts as `spec`.** Status moves `spec` → `placeholder` (a `PH_` primitive, true to scale/pivot/name) →
`final`. Paths are under `unity/Assets/Art/` unless they start with `art-source/`. Budgets: tris desktop LOD0 / mobile-web
top LOD; textures desktop / mobile (PIPELINE §7). **License:** everything is made in-house as original work unless a row
says otherwise; a third-party asset may only be added with a license that allows commercial use, and its source URL and
license go in this column. Original designs only: no piece may resemble an existing game's characters or art.

Contents: 1 Heroes · 2 Hero shared parts · 3 Ability icons · 4 Minions · 5 Structures · 6 Front marker · 7 Board and tiles ·
8 Neutrals · 9 Map features and objectives · 10 Tokens and markers · 11 Shared VFX · 12 Item icons · 13 UI icons · 14 Fonts ·
15 SFX · 16 Music · 17 Totals

## 1. Hero miniatures (14)

Budget for every hero: **12k / 6k tris (LOD0/1/2: 12k, 6k, 2.5k), 2048 / 1024 texture set, ≤ 60 bones, 11 clips** (PIPELINE §8.1).
Body colors are team-neutral; team shows on the base rim, pennant/sash (mask) and ground ring (STYLE §3.2). Brief per hero in `hero-sheets/<id>.md`.

| Path | Hero | Silhouette | Key features | Base color | Size class | Weapon / prop | Ability VFX | Budget | Status | License |
|---|---|---|---|---|---|---|---|---|---|---|
| `Heroes/Bulwark/PF_Hero_Bulwark.prefab` | **Bulwark** (Tank) | A walking door: a squat armoured figure behind a tall riveted pavise with a polished mirror boss, under a deep-brimmed kettle helm. | Pavise covers 2/3 of the body from the front; mirror boss is the brightest spot; kettle-helm brim. | Pewter steel + oxblood leather | L (0.90 m) | Tall pavise (0.62 m) with a round mirror boss; short square-headed warhammer. | `VFX_Bulwark_ShieldBash` (Q); `VFX_Bulwark_IronStance` (W); `VFX_Bulwark_Charge` (E); `VFX_Bulwark_SolarFlare` (R) | 12k/6k · 2048/1024 | spec | original (to make) |
| `Heroes/Butcher/PF_Hero_Butcher.prefab` | **Butcher** (Tank) | A barrel-chested salt-marsh butcher with a hand-cranked winch on his back and a long iron harpoon-hook raised on a chain. | Raised hook above the head; round winch drum behind the shoulders; long salt-stained apron. | Tar-black oilskin + rust iron | L (0.90 m) | Iron harpoon-hook on a chain that runs to a back-mounted hand winch; filleting knife on the belt. | `VFX_Butcher_MeatHook` (Q); `VFX_Butcher_Rot` (W); `VFX_Butcher_Devour` (E); `VFX_Butcher_Dismember` (R) | 12k/6k · 2048/1024 | spec | original (to make) |
| `Heroes/Blademaster/PF_Hero_Blademaster.prefab` | **Blademaster** (Fighter) | A stocky grey-braided fencing master carrying a very long two-hand sword across her shoulders, wrists draped over it. | Horizontal sword line wider than the base; long grey braid; ribbon trophies on the belt. | Faded mustard gambeson + olive | M (0.75 m) | Long two-hand sword (1.0 m, straight double edge, wide crossguard), worn across both shoulders. | `VFX_Blademaster_BladeSpin` (Q); `VFX_Blademaster_BattleCry` (W); `VFX_Blademaster_DecisiveStrike` (E); `VFX_Blademaster_Omnislash` (R) | 12k/6k · 2048/1024 | spec | original (to make) |
| `Heroes/Ravager/PF_Hero_Ravager.prefab` | **Ravager** (Fighter) | A broad woodcutter-berserker holding a double-bitted felling axe low across his body, logging chains looped over his shoulders. | Axe held diagonally low (head near the base); chains over the shoulders; fur collar. | Bottle-green plaid + birch white | M (0.80 m) | Double-bitted felling axe on a long birch haft (0.75 m); logging chains. | `VFX_Ravager_Cleave` (Q); `VFX_Ravager_Hamstring` (W); `VFX_Ravager_Leap` (E); `VFX_Ravager_Guillotine` (R) | 12k/6k · 2048/1024 | spec | original (to make) |
| `Heroes/Shade/PF_Hero_Shade.prefab` | **Shade** (Assassin) | A slight crouched figure in layered ash-grey shawls that fan out like folded moth wings, under a wide flat hat, a winged throwing disc in hand. | Wing-like shawl points flaring outward; wide flat hat; low crouch. | Ash grey + dusk lilac lining | S (0.65 m) | Crescent sickle-knife (left hand); moth-wing throwing discs (one in the right hand, three on the belt). | `VFX_Shade_Shuriken` (Q); `VFX_Shade_ShadowStep` (W); `VFX_Shade_SmokeVeil` (E); `VFX_Shade_DeathMark` (R) | 12k/6k · 2048/1024 | spec | original (to make) |
| `Heroes/Viper/PF_Hero_Viper.prefab` | **Viper** (Assassin) | A low-crouching poisoner with a live banded snake coiled round her shoulders like a scarf, two bone-fang daggers held backhand. | Snake head raised beside her own head; glowing green vials on the chest; backhand daggers. | Dark moss leather + bone | S (0.65 m) | Two curved bone-fang daggers (backhand grip); bandolier of glass vials; the live snake (part of the mini). | `VFX_Viper_VenomFang` (Q); `VFX_Viper_ToxicCloud` (W); `VFX_Viper_Slither` (E); `VFX_Viper_KissofDeath` (R) | 12k/6k · 2048/1024 | spec | original (to make) |
| `Heroes/Pyra/PF_Hero_Pyra.prefab` | **Pyra** (Mage) | A glassblower in a heavy leather apron holding a long blowpipe-staff tipped with a glowing bulb of molten glass, goggles pushed up on her brow. | Glowing bulb at the top of the staff (brightest emissive on any hero); apron; goggles. | Scorched leather + soot grey | M (0.75 m) | Iron blowpipe-staff (1.0 m) with a glowing molten glass bulb (Ø 0.12 m); shears on the belt. | `VFX_Pyra_Fireball` (Q); `VFX_Pyra_FlameRing` (W); `VFX_Pyra_Scorch` (E); `VFX_Pyra_Pyroblast` (R) | 12k/6k · 2048/1024 | spec | original (to make) |
| `Heroes/Stormcaller/PF_Hero_Stormcaller.prefab` | **Stormcaller** (Mage) | A lanky old weather-watcher in a long storm coat trailing kite tails, raising a tall staff crowned with a spinning brass cup-anemometer. | Anemometer cups at the staff top; kite-tail ribbons streaming sideways; long coat flaring at the hem. | Storm-slate coat + ochre lining | M (0.78 m) | Tall staff (1.1 m) topped with a 3-cup brass anemometer and a small weathervane arrow. | `VFX_Stormcaller_ChainLightning` (Q); `VFX_Stormcaller_StaticField` (W); `VFX_Stormcaller_Gust` (E); `VFX_Stormcaller_Thunderstorm` (R) | 12k/6k · 2048/1024 | spec | original (to make) |
| `Heroes/Frostbow/PF_Hero_Frostbow.prefab` | **Frostbow** (Marksman) | A fur-mantled glacier guide drawing a bow taller than herself, made of pale spiral horn, with crampons on her boots. | Tall bow arc beside her; wide fur mantle; earflap hat. | Spruce coat + snow-white fur | M (0.75 m) | Recurve bow of spiral horn (1.0 m tall); quiver of crystal arrows; ice axe at the hip. | `VFX_Frostbow_Volley` (Q); `VFX_Frostbow_FrostArrows` (W); `VFX_Frostbow_Tumble` (E); `VFX_Frostbow_CrystalArrow` (R) | 12k/6k · 2048/1024 | spec | original (to make) |
| `Heroes/Deadeye/PF_Hero_Deadeye.prefab` | **Deadeye** (Marksman) | A tall, thin sharpshooter in a long duster, a long-barrelled rifle with a brass spyglass scope standing almost as tall as she is, powder charges strapped to her boots. | Very long vertical rifle line; scope glint; duster flaring at the knees; lens visor over one eye. | Dust-tan duster + gunmetal | M (0.80 m) | Long-barrelled rifle (1.0 m) with a brass spyglass scope and a bipod; powder-charge canisters on both boots (Rocket Jump). | `VFX_Deadeye_PiercingShot` (Q); `VFX_Deadeye_SnareTrap` (W); `VFX_Deadeye_RocketJump` (E); `VFX_Deadeye_Headshot` (R) | 12k/6k · 2048/1024 | spec | original (to make) |
| `Heroes/Lumen/PF_Hero_Lumen.prefab` | **Lumen** (Support) | A robed lamplighter holding a tall hooked pole from which a glass lantern swings, a ring of small candles set in her hair. | Lantern hanging from a hook above her (bright warm emissive); robe to the ground; candle ring on the head. | Cream robes + plum stole | M (0.76 m) | Hooked lamplighter's pole (1.05 m) with a hanging glass lantern; a satchel of wicks. | `VFX_Lumen_Mend` (Q); `VFX_Lumen_BindingLight` (W); `VFX_Lumen_Barrier` (E); `VFX_Lumen_Wish` (R) | 12k/6k · 2048/1024 | spec | original (to make) |
| `Heroes/Tidesinger/PF_Hero_Tidesinger.prefab` | **Tidesinger** (Support) | A tide-keeper on short wading stilts, blowing a large conch horn, with a staff hung with a net of glass fishing floats. | Conch at the mouth; cluster of round glass floats on the staff; stilt-sandals (legs read long). | Sand linen + sea-glass green | M (0.76 m) | Large conch horn (raised to the lips); wading staff with a net of 5 glass floats. | `VFX_Tidesinger_Bubble` (Q); `VFX_Tidesinger_Riptide` (W); `VFX_Tidesinger_Current` (E); `VFX_Tidesinger_TidalWave` (R) | 12k/6k · 2048/1024 | spec | original (to make) |
| `Heroes/Quake/PF_Hero_Quake.prefab` | **Quake** (Initiator) | A basalt-skinned quarry-wright resting a giant two-pronged stone tuning fork on his shoulder like a maul. | Two-pronged fork head above the shoulder; broad flat stone-like shoulders; ochre crystal growing from the crown of the head. | Basalt grey + ochre dust | M (0.78 m) | Stone tuning-fork maul (0.80 m; two prongs, iron-bound handle); chisels on the harness. | `VFX_Quake_Fissure` (Q); `VFX_Quake_EnchantTotem` (W); `VFX_Quake_Tremor` (E); `VFX_Quake_EchoSlam` (R) | 12k/6k · 2048/1024 | spec | original (to make) |
| `Heroes/Bramblehorn/PF_Hero_Bramblehorn.prefab` | **Bramblehorn** (Initiator) | A hulking, hunched bipedal beast with bark-like hide bound in iron bands, a single huge forward horn grown through a crown of brambles. | One massive forward-curving horn (the highest point of the mini); hunched back with moss; thorny crown. | Mossy bark brown + iron | L (0.90 m) | His horn (natural weapon); iron bands and a thorny bramble collar; a cloth banner tied round the horn. | `VFX_Bramblehorn_HornToss` (Q); `VFX_Bramblehorn_ThickHide` (W); `VFX_Bramblehorn_WarBellow` (E); `VFX_Bramblehorn_Earthshaker` (R) | 12k/6k · 2048/1024 | spec | original (to make) |

## 2. Hero shared parts

| Path (under `unity/Assets/Art/`) | Purpose | Budget | Status | License |
|---|---|---|---|---|
| `_Shared/Rigs/RIG_Mini_Biped.fbx` | Shared hero skeleton + avatar (~50 bones, sockets) | ≤ 60 bones | spec | original (to make) |
| `_Shared/Animators/AC_Hero.controller` | Shared hero Animator (states in PIPELINE §8.1); one `AOC_Hero_<Name>` per hero | — | spec | original (to make) |
| `_Shared/Models/SM_Base_Hero.fbx` | Ø 0.80 m hero base (flocked top, 6 token sockets) | 600 / 300 tris | spec | original (to make) |
| `_Shared/Models/SM_BaseRim_Azure.fbx` | Azure rim: **solid band + 6 diamond notches** (ACCESSIBILITY 1.1) | 400 tris, shared 512 | spec | original (to make) |
| `_Shared/Models/SM_BaseRim_Ember.fbx` | Ember rim: **sawtooth (flame) edge**, 12 teeth | 400 tris, shared 512 | spec | original (to make) |
| `_Shared/Materials/M_TeamRim_Azure.mat / M_TeamRim_Ember.mat` | Rim materials (Azure #2F7FE8 deep / Ember #F5A030 light, dark outline, emissive 0.15) | — | spec | original (to make) |
| `Board/Common/Decals/DCL_TeamRing_{Azure,Ember}.png` | Ground ring under a hero's base (Azure solid ring with horizontal bands; Ember ring with 45° diagonal hatch) | 256 px | spec | original (to make) |
| `_Shared/Scripts/TeamTint.cs` | Only Art script: `SetTeam()` swaps rim mesh, sets `_TeamColor`, ring decal | — | spec | original (to make) |
| `_Shared/Shaders/SG_Mini.shadergraph` | Master painted-mini shader (team mask, edge boost, rim light) | — | spec | original (to make) |
| `_Shared/Shaders/SG_Dither.shadergraph` | Hidden (Shade) smoky-glass dither | — | spec | original (to make) |

## 3. Ability icons (56)

`Icons/Abilities/ICO_Ability_<Hero>_<Key>.png`, 256 px master, 2-tone + outline, readable at 32 px (STYLE §7). Ultimate (R) icons get a brass double frame. All: status spec, license original (to make).

| Path | Purpose | Budget | Status | License |
|---|---|---|---|---|
| `Icons/Abilities/ICO_Ability_Bulwark_Q.png` | Bulwark Q — Shield Bash | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Bulwark_W.png` | Bulwark W — Iron Stance | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Bulwark_E.png` | Bulwark E — Charge | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Bulwark_R.png` | Bulwark R — Solar Flare | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Butcher_Q.png` | Butcher Q — Meat Hook | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Butcher_W.png` | Butcher W — Rot | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Butcher_E.png` | Butcher E — Devour | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Butcher_R.png` | Butcher R — Dismember | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Blademaster_Q.png` | Blademaster Q — Blade Spin | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Blademaster_W.png` | Blademaster W — Battle Cry | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Blademaster_E.png` | Blademaster E — Decisive Strike | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Blademaster_R.png` | Blademaster R — Omnislash | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Ravager_Q.png` | Ravager Q — Cleave | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Ravager_W.png` | Ravager W — Hamstring | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Ravager_E.png` | Ravager E — Leap | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Ravager_R.png` | Ravager R — Guillotine | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Shade_Q.png` | Shade Q — Shuriken | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Shade_W.png` | Shade W — Shadow Step | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Shade_E.png` | Shade E — Smoke Veil | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Shade_R.png` | Shade R — Death Mark | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Viper_Q.png` | Viper Q — Venom Fang | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Viper_W.png` | Viper W — Toxic Cloud | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Viper_E.png` | Viper E — Slither | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Viper_R.png` | Viper R — Kiss of Death | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Pyra_Q.png` | Pyra Q — Fireball | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Pyra_W.png` | Pyra W — Flame Ring | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Pyra_E.png` | Pyra E — Scorch | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Pyra_R.png` | Pyra R — Pyroblast | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Stormcaller_Q.png` | Stormcaller Q — Chain Lightning | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Stormcaller_W.png` | Stormcaller W — Static Field | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Stormcaller_E.png` | Stormcaller E — Gust | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Stormcaller_R.png` | Stormcaller R — Thunderstorm | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Frostbow_Q.png` | Frostbow Q — Volley | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Frostbow_W.png` | Frostbow W — Frost Arrows | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Frostbow_E.png` | Frostbow E — Tumble | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Frostbow_R.png` | Frostbow R — Crystal Arrow | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Deadeye_Q.png` | Deadeye Q — Piercing Shot | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Deadeye_W.png` | Deadeye W — Snare Trap | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Deadeye_E.png` | Deadeye E — Rocket Jump | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Deadeye_R.png` | Deadeye R — Headshot | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Lumen_Q.png` | Lumen Q — Mend | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Lumen_W.png` | Lumen W — Binding Light | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Lumen_E.png` | Lumen E — Barrier | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Lumen_R.png` | Lumen R — Wish | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Tidesinger_Q.png` | Tidesinger Q — Bubble | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Tidesinger_W.png` | Tidesinger W — Riptide | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Tidesinger_E.png` | Tidesinger E — Current | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Tidesinger_R.png` | Tidesinger R — Tidal Wave | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Quake_Q.png` | Quake Q — Fissure | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Quake_W.png` | Quake W — Enchant Totem | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Quake_E.png` | Quake E — Tremor | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Quake_R.png` | Quake R — Echo Slam | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Bramblehorn_Q.png` | Bramblehorn Q — Horn Toss | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Bramblehorn_W.png` | Bramblehorn W — Thick Hide | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Bramblehorn_E.png` | Bramblehorn E — War Bellow | 256 px | spec | original (to make) |
| `Icons/Abilities/ICO_Ability_Bramblehorn_R.png` | Bramblehorn R — Earthshaker | 256 px | spec | original (to make) |

## 4. Minions

Cosmetic stack around the Front hex (up to 6 per side per lane, GDD §5). One shared rig and clip set (`idle`, `march`, `clash`, `die`); GPU-instanced.

| Path (under `unity/Assets/Art/`) | Purpose | Budget | Status | License |
|---|---|---|---|---|
| `Minions/PF_Minion_Melee_Azure.prefab` | Melee minion, Azure: squat militia with a **round** shield and short spear; Azure tabard with horizontal bands | 2.5k / 1.2k tris · shared 512 atlas | spec | original (to make) |
| `Minions/PF_Minion_Melee_Ember.prefab` | Melee minion, Ember: same body, **kite** shield, Ember tabard with diagonal hatch, swallow-tail pennant | 2.5k / 1.2k · shared 512 | spec | original (to make) |
| `Minions/PF_Minion_Caster_Azure.prefab` | Caster minion, Azure: hooded acolyte with a short wand topped with a **diamond** crystal | 2.5k / 1.2k · shared 512 | spec | original (to make) |
| `Minions/PF_Minion_Caster_Ember.prefab` | Caster minion, Ember: acolyte with a **pointed** brazier wand (triangle motif) | 2.5k / 1.2k · shared 512 | spec | original (to make) |
| `Minions/SK_Minion.fbx + Animations/A_Minion_{Idle,March,Clash,Die}.anim` | Shared minion mesh base, rig and 4 clips | ≤ 25 bones | spec | original (to make) |

## 5. Structures (towers, Core, fountains)

Azure structures are **round with domed caps**; Ember structures are **square with pointed hip roofs** (silhouette team cue). Each has child states `Intact` / `Damaged` / `Destroyed` (mesh swaps, crumble VFX between).

| Path (under `unity/Assets/Art/`) | Purpose | Budget | Status | License |
|---|---|---|---|---|
| `Structures/Tower/PF_Tower_Azure.prefab → SM_Tower_Azure_Intact.fbx` | Tower Azure intact: round stone tower, domed brass cap, team banner, brass crown that fires the structure shot | 8k / 4k · 1024/512 | spec | original (to make) |
| `Structures/Tower/SM_Tower_Azure_Damaged.fbx` | Tower Azure damaged (HP ≤ 4 of 8): cracks, top 30 % broken, banner torn | 8k / 4k | spec | original (to make) |
| `Structures/Tower/SM_Tower_Azure_Destroyed.fbx` | Tower Azure destroyed: rubble ring + broken base, fallen banner (stays on the board) | 3k / 1.5k | spec | original (to make) |
| `Structures/Core/PF_Core_Azure.prefab → SM_Core_Azure_Intact.fbx` | Core Azure intact: shrine with a large floating team crystal on a brass cradle (sphere crystal) | 12k / 6k · 2048/1024 | spec | original (to make) |
| `Structures/Core/SM_Core_Azure_Damaged.fbx` | Core Azure damaged (HP ≤ 6 of 12) / open: crystal cracked, flickering | 12k / 6k | spec | original (to make) |
| `Structures/Core/SM_Core_Azure_Destroyed.fbx` | Core Azure destroyed: shattered crystal shards, end-of-match moment | 6k / 3k | spec | original (to make) |
| `Structures/Fountain/PF_Fountain_Azure.prefab` | Fountain Azure: base plaza fountain (heal + shop), round basin, team-coloured water glow | 6k / 3k · 1024/512 | spec | original (to make) |
| `Structures/Tower/PF_Tower_Ember.prefab → SM_Tower_Ember_Intact.fbx` | Tower Ember intact: square stone tower, pointed hip-roof cap, team banner, brass crown that fires the structure shot | 8k / 4k · 1024/512 | spec | original (to make) |
| `Structures/Tower/SM_Tower_Ember_Damaged.fbx` | Tower Ember damaged (HP ≤ 4 of 8): cracks, top 30 % broken, banner torn | 8k / 4k | spec | original (to make) |
| `Structures/Tower/SM_Tower_Ember_Destroyed.fbx` | Tower Ember destroyed: rubble ring + broken base, fallen banner (stays on the board) | 3k / 1.5k | spec | original (to make) |
| `Structures/Core/PF_Core_Ember.prefab → SM_Core_Ember_Intact.fbx` | Core Ember intact: shrine with a large floating team crystal on a brass cradle (pointed prism crystal) | 12k / 6k · 2048/1024 | spec | original (to make) |
| `Structures/Core/SM_Core_Ember_Damaged.fbx` | Core Ember damaged (HP ≤ 6 of 12) / open: crystal cracked, flickering | 12k / 6k | spec | original (to make) |
| `Structures/Core/SM_Core_Ember_Destroyed.fbx` | Core Ember destroyed: shattered crystal shards, end-of-match moment | 6k / 3k | spec | original (to make) |
| `Structures/Fountain/PF_Fountain_Ember.prefab` | Fountain Ember: base plaza fountain (heal + shop), square basin, team-coloured water glow | 6k / 3k · 1024/512 | spec | original (to make) |

## 6. Front marker

| Path (under `unity/Assets/Art/`) | Purpose | Budget | Status | License |
|---|---|---|---|---|
| `Props/FrontMarker/PF_FrontMarker.prefab` | Lane Front marker: brass standard on a hex plinth with a two-sided flag; flag shows Azure emblem (diamond ◆) on Azure's side and Ember emblem (triangle ▲) on Ember's; neutral brass when on node 0 | 1.5k / 800 · 512 | spec | original (to make) |
| `Props/FrontMarker/A_FrontMarker_{Slide,Flutter}.anim` | Slide to the next node (Lane phase) + flag flutter | ≤ 6 bones | spec | original (to make) |
| `VFX/Shared/VFX_Lane_Clash.prefab` | Clash dust cloud + paint-flake pops for minions lost | ≤ 60 particles | spec | original (to make) |
| `Props/Banners/SM_LaneBanner_{Azure,Ember}.fbx` | Small lane-side banners (square-cut Azure / swallow-tail Ember) | 300 tris | spec | original (to make) |

## 7. Board, table and hex tiles

Pointy-top hexes, 1.0 m flat-to-flat, 0.15 m thick (PIPELINE §2). Tiles 300–800 tris each, merged per chunk; one 2048 atlas + 1024 trim per map (mobile 1024 + 512). Variants chosen by seeded hash of the hex coordinate.

| Path (under `unity/Assets/Art/`) | Purpose | Budget | Status | License |
|---|---|---|---|---|
| `Board/Common/SM_WarTable.fbx` | Dark walnut war table the board rests on (frames the scene, fades into darkness) | 10k / 5k · 2048/1024 | spec | original (to make) |
| `Board/Common/SM_BoardFrame_{Rift,TwinHollow,FrostBridge}.fbx` | Board edge frame per map showing a layered cork/plaster terrain profile | 4k / 2k each | spec | original (to make) |
| `Board/Common/Decals/DCL_{Range,AreaFill,LoSHatch,LoSCord,LoSBlockX,Arrow_Knockback,Arrow_Pull,Arc_Jump,ChainLine,TowerRing}.png` | Preview decals (STYLE §8.3): LoS-blocked and tower-danger rings use a **hatched** material, never color alone | 256–512 px each | spec | original (to make) |
| `Board/Common/SM_HexHighlight.fbx` | Hex outline mesh for move/range highlights | 48 tris | spec | original (to make) |

### 7.1 The Rift

| Path (under `unity/Assets/Art/`) | Purpose | Budget | Status | License |
|---|---|---|---|---|
| `Board/Rift/SM_Tile_Rift_Turf_01..04.fbx` | Grass hex variants (lane-side open ground) | 300–800 tris | spec | original (to make) |
| `Board/Rift/SM_Tile_Rift_Lane_01..03.fbx` | Worn stone lane path (lane nodes) | 300–800 tris | spec | original (to make) |
| `Board/Rift/SM_Tile_Rift_Jungle_01..03.fbx` | Dense flocked undergrowth (open, passable) | 300–800 tris | spec | original (to make) |
| `Board/Rift/SM_Tile_Rift_Wall_Rock_01..03.fbx` | Blocking wall hexes: rock outcrops 0.5–0.7 m tall (LoS blockers must look solid and taller than a hero's waist) | 800–1.5k tris (walls) | spec | original (to make) |
| `Board/Rift/SM_Tile_Rift_River_01..02.fbx` | Resin river hex (passable) | 300–800 tris | spec | original (to make) |
| `Board/Rift/SM_Tile_Rift_RiverBank_01..02.fbx` | River edge transition | 300–800 tris | spec | original (to make) |
| `Board/Rift/SM_Tile_Rift_Base_01..02.fbx` | Base plaza flagstones (Azure/Ember tint via vertex color) | 300–800 tris | spec | original (to make) |
| `Board/Rift/SM_Tile_Rift_Pit_Drake.fbx` | Drake lair hex (bot river) | 300–800 tris | spec | original (to make) |
| `Board/Rift/SM_Tile_Rift_Pit_Golem.fbx` | Golem ledge hex (top river) | 300–800 tris | spec | original (to make) |
| `Board/Rift/T_Board_Rift_Atlas_{A,N,M}.png` | Rift tile atlas + trim sheet | 2048+1024 / 1024+512 | spec | original (to make) |

### 7.2 Twin Hollow

| Path (under `unity/Assets/Art/`) | Purpose | Budget | Status | License |
|---|---|---|---|---|
| `Board/TwinHollow/SM_Tile_TwinHollow_Turf_01..04.fbx` | Hollow grass, darker and mossier | 300–800 tris | spec | original (to make) |
| `Board/TwinHollow/SM_Tile_TwinHollow_Lane_01..03.fbx` | Root-crossed dirt lane | 300–800 tris | spec | original (to make) |
| `Board/TwinHollow/SM_Tile_TwinHollow_Wall_Root_01..03.fbx` | Blocking walls: giant tangled roots and stumps | 800–1.5k tris (walls) | spec | original (to make) |
| `Board/TwinHollow/SM_Tile_TwinHollow_Edge_Wall_01..02.fbx` | Long board-edge walls (rows y0/y10) | 800–1.5k tris (walls) | spec | original (to make) |
| `Board/TwinHollow/SM_Tile_TwinHollow_Pit_01..03.fbx` | Spider pit floor: web-covered sunken stone with violet glow | 300–800 tris | spec | original (to make) |
| `Board/TwinHollow/SM_Tile_TwinHollow_AltarPad.fbx` | Altar platform hex | 300–800 tris | spec | original (to make) |
| `Board/TwinHollow/SM_Tile_TwinHollow_Base_01..02.fbx` | Base plaza | 300–800 tris | spec | original (to make) |
| `Board/TwinHollow/T_Board_TwinHollow_Atlas_{A,N,M}.png` | TwinHollow tile atlas + trim sheet | 2048+1024 / 1024+512 | spec | original (to make) |

### 7.3 Frost Bridge

| Path (under `unity/Assets/Art/`) | Purpose | Budget | Status | License |
|---|---|---|---|---|
| `Board/FrostBridge/SM_Tile_FrostBridge_Bridge_01..04.fbx` | Stone causeway hexes dusted with snow | 300–800 tris | spec | original (to make) |
| `Board/FrostBridge/SM_Tile_FrostBridge_Snow_01..02.fbx` | Snowbank hexes | 300–800 tris | spec | original (to make) |
| `Board/FrostBridge/SM_Tile_FrostBridge_Wall_Ice_01..02.fbx` | Blocking ice/parapet hexes (the 2 lane walls + edges) | 800–1.5k tris (walls) | spec | original (to make) |
| `Board/FrostBridge/SM_Tile_FrostBridge_Edge_Parapet_01..02.fbx` | Bridge parapet along the board edge with resin icicles | 800–1.5k tris (walls) | spec | original (to make) |
| `Board/FrostBridge/SM_Tile_FrostBridge_Chasm_Edge.fbx` | Edge falling into misty void | 300–800 tris | spec | original (to make) |
| `Board/FrostBridge/SM_Tile_FrostBridge_Base_01..02.fbx` | Base plaza, frosted | 300–800 tris | spec | original (to make) |
| `Board/FrostBridge/T_Board_FrostBridge_Atlas_{A,N,M}.png` | FrostBridge tile atlas + trim sheet | 2048+1024 / 1024+512 | spec | original (to make) |

## 8. Jungle neutrals

Bone white `#D9D4C7` + a **dotted ring** is the neutral cue (health bar, Bite number, base ring; ACCESSIBILITY 1.1). Clips: `idle`, `attack` (Bite), `hit`, `die`, `spawn`.

| Path (under `unity/Assets/Art/`) | Purpose | Budget | Status | License |
|---|---|---|---|---|
| `Neutrals/Wolf/PF_Neutral_Wolf.prefab` | Wolf camp: 2 lean grey-brown wolves on one oval base (one sitting, one prowling), painted moss on the base; GDD 4/0/1 | 4k / 2k · 1024/512 · ≤ 35 bones | spec | original (to make) |
| `Neutrals/Wolf/SM_WolfDen.fbx` | Den prop (stones + bones) marking each camp hex | 1k | spec | original (to make) |
| `Neutrals/Drake/PF_Neutral_Drake.prefab` | **Drake** (Rift bot river): a long-necked river drake curled on a wet rock, short wings folded like fins, copper belly glow (kept away from team hues); mounted on a rock base; not a classic winged fire dragon pose | 15k / 7k · 2048/1024 · ≤ 70 bones | spec | original (to make) |
| `Neutrals/Golem/PF_Neutral_Golem.prefab` | **Stone Golem** (Rift top river): a seated hill of stacked mossy boulders with a carved door-like face slab and runes that light when it wakes; arms are pillars | 15k / 7k · 2048/1024 | spec | original (to make) |
| `Neutrals/SpiderQueen/PF_Neutral_SpiderQueen.prefab` | **Spider Queen** (Twin Hollow pit): a large pale cave spider with a violet-glass abdomen, perched on a web over the pit; egg sacs on the base (Brood reward) | 15k / 7k · 2048/1024 · own 8-leg rig | spec | original (to make) |
| `VFX/Shared/VFX_Neutral_{Bite,Wake,Claim,Respawn}.prefab` | Bite claw slash, wake-up, claim (team-colour flash + VP chip flies to the HUD), respawn | ≤ 80 particles | spec | original (to make) |

## 9. Map features and objectives

| Path (under `unity/Assets/Art/`) | Purpose | Budget | Status | License |
|---|---|---|---|---|
| `Board/Common/SM_River_Flow.fbx + SG_Resin` | River surface overlay (resin look, slow normal scroll), Rift and Twin Hollow | 2k per map | spec | original (to make) |
| `Props/Altar/PF_Altar.prefab` | Twin Hollow altar: standing stone ring around a brass brazier; brazier flame takes the capturing team's value + emblem; 'locked' state = chained | 2.5k / 1.2k · 512 | spec | original (to make) |
| `Props/HealthRelic/PF_HealthRelic.prefab` | Frost Bridge health relic: green-glowing glass flask on an ice plinth; empty state (cracked, dark) while recharging 2 rounds | 1k / 500 · 256 | spec | original (to make) |
| `Props/Aegis/PF_Aegis.prefab` | Aegis (from the Golem): small brass laurel shield floating over the claimer (on an acrylic rod), and the laurel ring on the base | 800 · 256 | spec | original (to make) |
| `VFX/Shared/VFX_Aegis_Revive.prefab` | Aegis revive burst (gold laurel ring expands, mini stands back up) | ≤ 60 particles | spec | original (to make) |
| `VFX/Shared/VFX_Brood_Spawn.prefab` | Spider Queen Brood: +2 small spiderlings join the claimer's waves | ≤ 40 particles | spec | original (to make) |
| `VFX/Shared/VFX_Drake_Buff.prefab` | Drake +1 ATK team buff badge pop on each hero | ≤ 20 particles | spec | original (to make) |

## 10. Tokens and board markers

Physical chits on the base rim (Ø 0.12 m, 120 tris, one shared 512 atlas `Tokens/T_Tokens_Atlas`). Shape identifies the condition (STYLE §8.2).

| Path (under `unity/Assets/Art/`) | Purpose | Budget | Status | License |
|---|---|---|---|---|
| `Tokens/PF_Token_Stun.prefab` | Stun: 4-point gold star | 120 tris | spec | original (to make) |
| `Tokens/PF_Token_Root.prefab` | Root: square bark chip with root glyph | 120 | spec | original (to make) |
| `Tokens/PF_Token_Slow.prefab` | Slow: violet-grey hourglass; 2 pips for Slow (2) | 120 | spec | original (to make) |
| `Tokens/PF_Token_Silence.prefab` | Silence: hexagonal wax seal | 120 | spec | original (to make) |
| `Tokens/PF_Token_Shield.prefab` | Shield n: brass shield outline with number (1–6 decals) | 120 | spec | original (to make) |
| `Tokens/PF_Token_Poison.prefab` | Poison n: green droplet with number + 3 tick pips | 150 | spec | original (to make) |
| `Tokens/PF_Ring_Steadfast.prefab` | Steadfast: plain grey ring around the whole base (GDD 6.6) | 200 | spec | original (to make) |
| `Tokens/PF_Token_Hidden.prefab` | Hidden: smoke-grey crescent | 120 | spec | original (to make) |
| `Tokens/PF_Token_Haste.prefab` | Haste: pale-green arrow-wing | 120 | spec | original (to make) |
| `Tokens/PF_Ring_Aegis.prefab` | Aegis: brass laurel ring on the base | 300 | spec | original (to make) |
| `Tokens/PF_Token_Recall.prefab` | Pending Recall: small hearth/arch chip (cancelled = cracks and drops) | 120 | spec | original (to make) |
| `Tokens/PF_Marker_Respawn.prefab` | KO'd hero placeholder on its Fountain: hourglass plinth with 1–2 skip pips | 300 | spec | original (to make) |
| `Icons/UI/ICO_TurnSlot_Skip.png` | Turn-strip skipped-slot marker (chevron through the slot; Stun star or KO skull variant) | 128 px | spec | original (to make) |
| `Tokens/PF_Coin_Gold.prefab` | Gold coin pop (+1 per last hit, flips up from the wave) | 80 tris | spec | original (to make) |
| `Tokens/PF_Chip_VP.prefab` | VP chip that flies to the VP track on KO/tower/objective | 100 tris | spec | original (to make) |
| `Props/CoinFlip/PF_DraftCoin.prefab + A_DraftCoin_Flip.anim` | First-pick coin flip (GDD 10.2): brass coin, Azure ◆ diamond one side, Ember ▲ triangle the other | 500 tris · 512 | spec | original (to make) |

## 11. Shared VFX

Per-hero ability VFX are listed with each hero (§1) and live in `Heroes/<Name>/VFX/`. Particle budgets: ≤ 150 live particles per effect desktop, ≤ 60 mobile; no full-screen effects.

| Path (under `unity/Assets/Art/`) | Purpose | Budget | Status | License |
|---|---|---|---|---|
| `VFX/Damage/VFX_Hit_Attack.prefab` | Attack hit: steel spark burst + dust (+ cracked-shield '−ARM' badge) | ≤ 40 particles | spec | original (to make) |
| `VFX/Damage/VFX_Hit_Ability.prefab` | Generic ability hit, tinted by element | ≤ 40 | spec | original (to make) |
| `VFX/Damage/VFX_Tick_Poison.prefab` | Poison tick bubbles + drip | ≤ 30 | spec | original (to make) |
| `VFX/Damage/VFX_StructureShot.prefab` | Tower/Core brass bolt (dive / no-cover shot) | ≤ 50 | spec | original (to make) |
| `VFX/Damage/VFX_Heal.prefab` | Heal motes + ring | ≤ 40 | spec | original (to make) |
| `VFX/Damage/VFX_ShieldAbsorb.prefab` | Shield dome flash + crack | ≤ 30 | spec | original (to make) |
| `VFX/Damage/VFX_WaveClear.prefab` | Minion pop into paint flakes + gold coin | ≤ 30 | spec | original (to make) |
| `VFX/Damage/UI_DamageNumber.prefab` | World-space number pop (Attack white / ability element / poison green / heal green / structure brass) | — | spec | original (to make) |
| `VFX/Conditions/VFX_Cond_{Stun,Root,Slow,Silence,Shield,Poison,Hidden,Haste}.prefab` | On-mini condition loops (STYLE §8.2) | ≤ 30 each | spec | original (to make) |
| `VFX/Conditions/VFX_Cleanse.prefab` | Tokens flick off + water/light wash (Riptide, Cleansing Veil) | ≤ 40 | spec | original (to make) |
| `VFX/Previews/VFX_Ghost_Mini.mat` | Ghost mini on forced-move / dash final hex | — | spec | original (to make) |
| `VFX/Previews/VFX_Move_{Knockback,Pull,Dash,Jump,Teleport}.prefab` | Resolution VFX for forced movement and mobility | ≤ 40 each | spec | original (to make) |
| `VFX/Shared/VFX_KO.prefab` | KO: tip-over dust + paint-flake lift-off | ≤ 60 | spec | original (to make) |
| `VFX/Shared/VFX_Respawn.prefab` | Respawn set-down thud ring at the Fountain | ≤ 30 | spec | original (to make) |
| `VFX/Shared/VFX_LevelUp.prefab` | Level-up brass ring rising up the mini; ult unlocked flare at level 3 | ≤ 50 | spec | original (to make) |
| `VFX/Shared/VFX_Recall.prefab` | Recall: hearth-light column, cancels with a crack | ≤ 40 | spec | original (to make) |
| `VFX/Shared/VFX_TowerCrumble.prefab` | Damaged/destroyed transition: stone chunks + dust | ≤ 120 | spec | original (to make) |
| `VFX/Shared/VFX_Core_Shatter.prefab` | Core destroyed: crystal shatter (victory moment) | ≤ 150 | spec | original (to make) |
| `VFX/Shared/VFX_Shade_ResetPip.prefab` | Shadow Reset: moth lands on the hat, 4th action pip lights | ≤ 15 | spec | original (to make) |
| `VFX/Shared/VFX_Victory_Confetti.prefab` | End screen: paper confetti in the winner's value + emblem shapes | ≤ 150 | spec | original (to make) |

## 12. Item icons (14)

`Icons/Items/`, 256 px, 2-tone + outline. Basics on a plain brass disc; upgrades on a brass disc with a double rim. Shapes stay distinct so items read at 32 px.

| Path (under `unity/Assets/Art/`) | Purpose | Budget | Status | License |
|---|---|---|---|---|
| `Icons/Items/ICO_Item_IronSword.png` | Iron Sword (basic): short plain sword, point up | 256 px | spec | original (to make) |
| `Icons/Items/ICO_Item_BloodthirstBlade.png` | Bloodthirst Blade: sword with a dark-red fuller and a drop at the tip | 256 px | spec | original (to make) |
| `Icons/Items/ICO_Item_PiercingEdge.png` | Piercing Edge: narrow blade piercing a small shield outline | 256 px | spec | original (to make) |
| `Icons/Items/ICO_Item_SpellTome.png` | Spell Tome (basic): closed book with a brass clasp | 256 px | spec | original (to make) |
| `Icons/Items/ICO_Item_Archstaff.png` | Archstaff: arched staff with a ring head and a gem | 256 px | spec | original (to make) |
| `Icons/Items/ICO_Item_BlinkCharm.png` | Blink Charm: charm amulet with two dotted footprints jumping | 256 px | spec | original (to make) |
| `Icons/Items/ICO_Item_HeartGem.png` | Heart Gem (basic): faceted heart-cut gem | 256 px | spec | original (to make) |
| `Icons/Items/ICO_Item_TitanPlate.png` | Titan Plate: massive breastplate with rivets | 256 px | spec | original (to make) |
| `Icons/Items/ICO_Item_CleansingVeil.png` | Cleansing Veil: flowing veil with water drops, a broken star (Stun) beneath | 256 px | spec | original (to make) |
| `Icons/Items/ICO_Item_PaddedVest.png` | Padded Vest (basic): quilted vest | 256 px | spec | original (to make) |
| `Icons/Items/ICO_Item_ThornMail.png` | Thorn Mail: mail shirt with thorns on the edges | 256 px | spec | original (to make) |
| `Icons/Items/ICO_Item_SecondWind.png` | Second Wind: vest with a feather/wind swirl rising from it | 256 px | spec | original (to make) |
| `Icons/Items/ICO_Item_TrailBoots.png` | Trail Boots (basic): single walking boot | 256 px | spec | original (to make) |
| `Icons/Items/ICO_Item_SwiftTreads.png` | Swift Treads: boot with wind streaks and a small wing | 256 px | spec | original (to make) |

## 13. UI icons

Supplied to UX (UI Toolkit owns layout). 256 px masters, readable at 24–32 px, single top-left light. Team icons always carry the emblem shape.

| Path (under `unity/Assets/Art/Icons/`) | Purpose | Budget | Status | License |
|---|---|---|---|---|
| `Roles/ICO_Role_{Tank,Fighter,Assassin,Mage,Marksman,Support,Initiator}.png` | 7 role icons (shield, crossed blades, dagger, flame-orb, arrow, lantern-heart, burst) | 256 px (portraits 512) | spec | original (to make) |
| `UI/ICO_Stat_{HP,ATK,RNG,ARM,SPD,POW}.png` | 6 stat icons (heart, sword, target rings, shield, boot, star-rune) | 256 px (portraits 512) | spec | original (to make) |
| `UI/ICO_Action_{Move,Attack,Recall,Shop,Capture,GoNext,EndTurn}.png` | Action buttons | 256 px (portraits 512) | spec | original (to make) |
| `Conditions/ICO_Cond_{Stun,Root,Slow,Silence,Shield,Poison,Steadfast,Hidden,Haste,Aegis}.png` | Condition icons = token shapes (STYLE §8.2) | 256 px (portraits 512) | spec | original (to make) |
| `UI/ICO_Team_{Azure,Ember}.png` | Team emblems: Azure ◆ diamond (blue fill, horizontal bands), Ember ▲ triangle (amber fill, diagonal hatch) | 256 px (portraits 512) | spec | original (to make) |
| `UI/ICO_{VP,Gold,Round,Timer,TimeBank,Lane_Top,Lane_Mid,Lane_Bot,Wave,Power}.png` | Scoreboard/HUD glyphs | 256 px (portraits 512) | spec | original (to make) |
| `UI/ICO_{LoS,NoLoS,Range,TowerDive,Execute,ResetPip,ActionPip,ActionPipUsed}.png` | Preview/HUD markers (No LoS = eye with a wall bar) | 256 px (portraits 512) | spec | original (to make) |
| `UI/ICO_Difficulty_Star.png` | Draft difficulty star (★ / ★★ / ★★★) | 256 px (portraits 512) | spec | original (to make) |
| `UI/ICO_Buff_{DrakeStack,Aegis,Brood,Altar}.png` | Team buff badges (Drake ×1/×2 stacks, Aegis holder, Brood next Lane phase, altar held) | 256 px (portraits 512) | spec | original (to make) |
| `UI/ICO_Frame_{Ally,Enemy}.png` | Hero-card frame corners: straight (ally) vs angled (enemy), ACCESSIBILITY 1.2 | 256 px (portraits 512) | spec | original (to make) |
| `UI/ICO_{Draft_Lock,Draft_Hover,FirstPick,ChooseStart,StarterPair}.png` | Draft screen icons | 256 px (portraits 512) | spec | original (to make) |
| `UI/ICO_Neutral_{Wolf,Drake,Golem,SpiderQueen,Altar,Relic}.png` | Objective timers on the HUD/minimap | 256 px (portraits 512) | spec | original (to make) |
| `UI/ICO_Structure_{Tower,Core}_{Azure,Ember}.png` | Structure HP markers (shape per team) | 256 px (portraits 512) | spec | original (to make) |
| `UI/Portraits/IMG_Portrait_<Hero>.png (14)` | Hero card portraits: rendered bust of the painted mini on a brass frame with the role icon in a corner (512 px) | 256 px (portraits 512) | spec | original (to make) |
| `UI/Frames/IMG_Frame_{Card,Panel,Button,Ult}.png` | 9-slice brass-bevel frames on `panel` (UX may replace with USS) | 256 px (portraits 512) | spec | original (to make) |

## 14. Fonts (third party)

| Path | Purpose | Budget | Status | License |
|---|---|---|---|---|
| `unity/Assets/UI/Fonts/AlegreyaSC-*.ttf` | Titles, hero names (UX folder; listed for the license record) | — | spec | SIL Open Font License 1.1 (commercial use OK), source: Google Fonts / Huerta Tipográfica |
| `unity/Assets/UI/Fonts/AlegreyaSans-*.ttf` | Body text, numbers | — | spec | SIL OFL 1.1, Google Fonts / Huerta Tipográfica |

## 15. SFX

`Audio/SFX/<group>/SFX_<Name>_NN.wav` masters in `art-source/Audio/` (48 kHz/24-bit), imported as Vorbis (PIPELINE §9). 2–3 variations where marked ×n. Tabletop foley under fantasy layers (STYLE §10). Original recordings or CC0 sources only (record source per file when used).

| Path | Purpose | Budget | Status | License |
|---|---|---|---|---|
| `Audio/SFX/Board/SFX_MiniPlace ×3` | Mini set down on a hex (wood/resin click) | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Board/SFX_MiniSlide ×2` | Base glides along the path (move) | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Board/SFX_MiniTip` | KO tip-over + rock | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Board/SFX_MiniLift` | KO lift-off whoosh | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Board/SFX_TokenDrop ×3` | Condition chit placed | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Board/SFX_TokenFlick ×2` | Chit removed / cleansed | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Board/SFX_CoinPop ×3` | Gold +1 | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Board/SFX_VPChip` | VP chip lands on the track | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Board/SFX_FrontSlide` | Front marker slides a node | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Board/SFX_Clash` | Lane clash (crowd scuffle, short) | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Board/SFX_MinionPop ×3` | Minion removed | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Board/SFX_MinionSpawn` | Wave reinforcements | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Board/SFX_LanePhaseStart` | Lane phase sting (drum roll, 1 s) | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Board/SFX_RoundStart` | New round (bell) | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Board/SFX_LevelUp` | Level-up chime; ult-unlock variant | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Board/SFX_Recall / RecallCancel` | Recall hum / crack | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Board/SFX_Respawn` | Fountain set-down | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Structures/SFX_TowerShot` | Structure brass bolt | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Structures/SFX_TowerHit ×2` | Attack on a structure | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Structures/SFX_TowerCrumble` | Damaged state | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Structures/SFX_TowerFall` | Destroyed | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Structures/SFX_CoreOpen` | Core becomes attackable | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Structures/SFX_CoreShatter` | Core destroyed (victory) | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Structures/SFX_FountainHeal` | Base heal | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Neutrals/SFX_Wolf_Growl / Wolf_Bite / Wolf_Die` | Wolf Growl / Wolf Bite / Wolf Die | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Neutrals/SFX_Drake_Wake / Drake_Bite / Drake_Die` | Drake Wake / Drake Bite / Drake Die | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Neutrals/SFX_Golem_Wake / Golem_Bite / Golem_Die` | Golem Wake / Golem Bite / Golem Die | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Neutrals/SFX_SpiderQueen_Wake / _Bite / _Die` | SpiderQueen Wake /  Bite /  Die | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Neutrals/SFX_ObjectiveClaim` | Team claim fanfare (short) | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Neutrals/SFX_AltarCapture` | Altar brazier ignites | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Neutrals/SFX_RelicPickup` | Health relic drink | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Neutrals/SFX_AegisRevive` | Aegis revive | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Conditions/SFX_Stun / Root / Slow / Silence / ShieldUp / ShieldBreak / PoisonTick / Cleanse / Hidden / Haste / Steadfast` | One per state | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Combat/SFX_Hit_Attack ×3 / Hit_Armor ×2 / Hit_Ability ×3 / Heal ×2 / Knockback / Pull / Dash / Jump / Teleport` | Shared hit and movement layers | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/UI/SFX_Click / Hover / Confirm / Cancel / Error / TurnYours / TurnEnemy / TimerWarn / TimerOut / BankUsed / GoNext` | UI feedback | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/UI/SFX_Draft_Hover / Draft_Lock / Draft_CoinFlip / Draft_TeamReveal / Shop_Buy / Shop_Discard` | Draft and shop | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/UI/SFX_Victory / Defeat / Draw` | End stings (3–5 s) | ≤ 2 s (stings ≤ 5 s) | spec | original (to make) |
| `Audio/SFX/Heroes/SFX_Bulwark_{Attack ×2,Q,W,E,R,Hit ×2,KO,Select,Victory}` | Bulwark: attack, 4 abilities (element layer per STYLE §8.1), hit, KO, draft select voice-less grunt/foley, victory | ≤ 2 s each (R ≤ 3 s) | spec | original (to make) |
| `Audio/SFX/Heroes/SFX_Butcher_{Attack ×2,Q,W,E,R,Hit ×2,KO,Select,Victory}` | Butcher: attack, 4 abilities (element layer per STYLE §8.1), hit, KO, draft select voice-less grunt/foley, victory | ≤ 2 s each (R ≤ 3 s) | spec | original (to make) |
| `Audio/SFX/Heroes/SFX_Blademaster_{Attack ×2,Q,W,E,R,Hit ×2,KO,Select,Victory}` | Blademaster: attack, 4 abilities (element layer per STYLE §8.1), hit, KO, draft select voice-less grunt/foley, victory | ≤ 2 s each (R ≤ 3 s) | spec | original (to make) |
| `Audio/SFX/Heroes/SFX_Ravager_{Attack ×2,Q,W,E,R,Hit ×2,KO,Select,Victory}` | Ravager: attack, 4 abilities (element layer per STYLE §8.1), hit, KO, draft select voice-less grunt/foley, victory | ≤ 2 s each (R ≤ 3 s) | spec | original (to make) |
| `Audio/SFX/Heroes/SFX_Shade_{Attack ×2,Q,W,E,R,Hit ×2,KO,Select,Victory}` | Shade: attack, 4 abilities (element layer per STYLE §8.1), hit, KO, draft select voice-less grunt/foley, victory | ≤ 2 s each (R ≤ 3 s) | spec | original (to make) |
| `Audio/SFX/Heroes/SFX_Viper_{Attack ×2,Q,W,E,R,Hit ×2,KO,Select,Victory}` | Viper: attack, 4 abilities (element layer per STYLE §8.1), hit, KO, draft select voice-less grunt/foley, victory | ≤ 2 s each (R ≤ 3 s) | spec | original (to make) |
| `Audio/SFX/Heroes/SFX_Pyra_{Attack ×2,Q,W,E,R,Hit ×2,KO,Select,Victory}` | Pyra: attack, 4 abilities (element layer per STYLE §8.1), hit, KO, draft select voice-less grunt/foley, victory | ≤ 2 s each (R ≤ 3 s) | spec | original (to make) |
| `Audio/SFX/Heroes/SFX_Stormcaller_{Attack ×2,Q,W,E,R,Hit ×2,KO,Select,Victory}` | Stormcaller: attack, 4 abilities (element layer per STYLE §8.1), hit, KO, draft select voice-less grunt/foley, victory | ≤ 2 s each (R ≤ 3 s) | spec | original (to make) |
| `Audio/SFX/Heroes/SFX_Frostbow_{Attack ×2,Q,W,E,R,Hit ×2,KO,Select,Victory}` | Frostbow: attack, 4 abilities (element layer per STYLE §8.1), hit, KO, draft select voice-less grunt/foley, victory | ≤ 2 s each (R ≤ 3 s) | spec | original (to make) |
| `Audio/SFX/Heroes/SFX_Deadeye_{Attack ×2,Q,W,E,R,Hit ×2,KO,Select,Victory}` | Deadeye: attack, 4 abilities (element layer per STYLE §8.1), hit, KO, draft select voice-less grunt/foley, victory | ≤ 2 s each (R ≤ 3 s) | spec | original (to make) |
| `Audio/SFX/Heroes/SFX_Lumen_{Attack ×2,Q,W,E,R,Hit ×2,KO,Select,Victory}` | Lumen: attack, 4 abilities (element layer per STYLE §8.1), hit, KO, draft select voice-less grunt/foley, victory | ≤ 2 s each (R ≤ 3 s) | spec | original (to make) |
| `Audio/SFX/Heroes/SFX_Tidesinger_{Attack ×2,Q,W,E,R,Hit ×2,KO,Select,Victory}` | Tidesinger: attack, 4 abilities (element layer per STYLE §8.1), hit, KO, draft select voice-less grunt/foley, victory | ≤ 2 s each (R ≤ 3 s) | spec | original (to make) |
| `Audio/SFX/Heroes/SFX_Quake_{Attack ×2,Q,W,E,R,Hit ×2,KO,Select,Victory}` | Quake: attack, 4 abilities (element layer per STYLE §8.1), hit, KO, draft select voice-less grunt/foley, victory | ≤ 2 s each (R ≤ 3 s) | spec | original (to make) |
| `Audio/SFX/Heroes/SFX_Bramblehorn_{Attack ×2,Q,W,E,R,Hit ×2,KO,Select,Victory}` | Bramblehorn: attack, 4 abilities (element layer per STYLE §8.1), hit, KO, draft select voice-less grunt/foley, victory | ≤ 2 s each (R ≤ 3 s) | spec | original (to make) |

## 16. Music

| Path (under `unity/Assets/Art/`) | Purpose | Budget | Status | License |
|---|---|---|---|---|
| `Audio/Music/MUS_Menu.ogg` | Menu / lobby: chamber folk theme (strings, frame drum, drone) | 2–3 min loop | spec | original (to make) |
| `Audio/Music/MUS_Draft.ogg` | Draft: tension pulse | 1–2 min loop | spec | original (to make) |
| `Audio/Music/MUS_Board_{Rift,TwinHollow,FrostBridge}.ogg` | In-match beds per map, low in the mix | 3–4 min loops | spec | original (to make) |
| `Audio/Music/MUS_LateGame.ogg` | Round ≥ 8 / VP near target intensity layer | loop | spec | original (to make) |

## 17. Totals (for planning)

| Group | Count | Notes |
|---|---|---|
| Hero miniatures | 14 | + 14 portraits, 56 ability icons, 56 ability VFX, ~150 hero SFX |
| Minions | 4 prefabs (1 mesh base) | 2 kinds × 2 teams |
| Structures | 2 towers × 3 states, 2 Cores × 3 states, 2 fountains |  |
| Neutrals | 4 (wolf, Drake, Golem, Spider Queen) |  |
| Tile meshes | ≈ 60 across 3 maps | + table, 3 frames |
| Tokens / markers | 16 |  |
| Item icons | 14 |  |
| UI icons | ≈ 110 | incl. 7 roles, 6 stats, 10 conditions |
| Shared VFX | ≈ 30 |  |
| SFX | ≈ 260 files | incl. variations |

Suggested order (placeholders first, so CODE can build the board view): hero placeholder + bases + rims → tiles for The Rift → minions, towers, Core, Front marker → tokens and preview decals → the 5 ★ heroes final (Bulwark, Blademaster, Ravager, Frostbow, Lumen) → remaining heroes → Twin Hollow, Frost Bridge → neutrals.
