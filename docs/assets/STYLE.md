# Lanefall — Art Direction (STYLE)

Owner: assets · Status: **proposal v1 (2026-11-04)**, for Eddie to approve · Applies to: `unity/Assets/Art/`, UI art, VFX, SFX
Related: `PIPELINE.md` (how to build it), `ASSETS.md` (what to build), `hero-sheets/` (one brief per hero), GDD v1.0.

## 1. The look in one paragraph

**A painted war game on a real table.** The camera looks down at a hex board resting on a dark wooden war table, lit by
one warm lamp. Heroes are **hand-painted miniatures, about 3 cm tall, glued to round bases**; they are slightly chunky,
with big hands, big weapons and bold silhouettes, because a real miniature exaggerates whatever must read at arm's length.
Paint is visible: flat base coats, a darker wash in the recesses, crisp lighter **edge highlights**, and a satin varnish.
The board is a crafted terrain set — bevelled hex tiles of stone, turf, river resin and snow — not a photoreal landscape.
Magic is the only thing that is not "made of paint": VFX glow, float and move, so they never get confused with the pieces.
The 2D prototype's identity carries over: **dark war table, brass accents, Azure vs Ember, Alegreya type**.

Three rules decide every argument:
1. **Readable first.** From the default camera, at phone size, you must tell *who* (silhouette), *which team* (base
   rim pattern + value), and *what state* (tokens on the rim) in under a second.
2. **It is a toy you could own.** Every piece should look like something you could pick up: solid, slightly heavy,
   painted, on a base. No floating parts without a visible support (a flying effect is mounted on a clear acrylic rod).
3. **Original.** No piece may resemble a character, logo or prop of an existing game, film or miniature line
   (including MOBAs, Skytear, Rum & Bones). The briefs in `hero-sheets/` say what each hero must *not* look like.

## 2. Scale and proportion (summary; numbers in PIPELINE.md §2)

| Thing | In game | "Real" miniature equivalent |
|---|---|---|
| 1 hex (flat to flat) | 1.00 m | 40 mm |
| Hero base | Ø 0.80 m, 0.08 m high | Ø 32 mm |
| Hero mini, size S / M / L (base to top of head) | 0.65 / 0.75 / 0.90 m | 26 / 30 / 36 mm |
| Minion | 0.40–0.45 m on Ø 0.36 m base | 16–18 mm |
| Tower / Core | 1.6 m / 2.2 m | 64 / 88 mm |

**Heroic proportions:** head ≈ 1/6 of height (real humans 1/7.5), hands and weapons +25 %, feet planted wide, the
pose leans into the hero's role. Faces are simplified planes with strong brow and nose; eyes are painted dots with a
light catch, never modelled detail.

## 3. Palette

### 3.1 Table and board (neutral world)
| Token | Hex | Use |
|---|---|---|
| `table-ink` | `#0d1719` | Table felt / scene void (= prototype `--ink`) |
| `table-wood` | `#3a2a1e` | War-table rim, dark walnut |
| `panel` | `#142124` | UI panels (= prototype) |
| `line` | `#2b3f43` | Hex outlines, UI rules |
| `brass` | `#d6a748` | Accent: UI frames, selection, LoS line, structure trims. **Never used for team info.** |
| `brass-hi` | `#f1d083` | Highlights on brass |
| `parchment` | `#ebe3cc` | Text, light UI (= prototype `--text`) |
| `stone` | `#7d7a70` / `#57544d` | Walls, structures, tile edges (light / shade) |
| `turf` | `#5f7a46` / `#3f5532` | Grass tiles (muted; must sit *below* hero saturation) |
| `river` | `#2e6f7a` → `#7fb9b6` | Resin river, depth gradient |
| `snow` | `#d9e2e4` / `#a9b8bf` | Frost Bridge |

World saturation is kept **low**; heroes are painted at medium saturation; team rims and VFX are the most saturated
things on screen. Value structure: dark table → mid board → light-edged heroes → brightest VFX.

### 3.2 Team colors — colorblind-safe by value **and** pattern

The prototype's Azure `#56a8ff` (L\* 67) and Ember `#ff6d4d` (L\* 64) differ in hue only; under deuteranopia Ember turns
olive at almost the same lightness, and red-orange on a green board is the worst case for protan/deutan players.
**Adopted: the UX palette and second cues from `docs/ux/ACCESSIBILITY.md` §1.1** (one palette for UI and 3D), with
3D-specific rules below. Teams are separated by hue (blue vs amber, the pair that survives all three common CVDs),
by **value** and by **shape**.

| Team | Main (rim, banner, UI) | Shade (outline, cloth folds) | Highlight | L\* main | Deutan / protan / tritan (sim L\*) |
|---|---|---|---|---|---|
| **Azure** | `#2F7FE8` blue | `#1a4f9c` | `#9cc6ff` | 53.6 | 51.1 / 57.4 / 57.4 |
| **Ember** | `#F5A030` amber | `#a8661a` | `#ffd28a` | 72.7 | 75.3 / 68.3 / 70.6 |
| Neutral monsters | `#D9D4C7` bone white | `#8f8a7d` | — | 85.0 | (unchanged) |

(Machado 2009, severity 1.0. Ember is the **lighter** team, Azure the **deeper** one; UX measured ΔE 106–133 between
them in all modes.)

**3D rules for team color:**
- Team color is **always framed by a dark edge**: rims sit on the black-brown base side (`#1b1714`) and banners have a
  `table-ink` hem, so contrast never depends on the tile behind (Azure on grey stone alone is only ~1.1 : 1; on the dark
  base edge it is > 4 : 1). Rims carry emissive 0.15 so they read in shadow.
- Tile albedo stays at **L\* ≤ 50** for turf and stone (snow tiles are the exception; there the dark base edge does the work).
- No hero, tile or neutral uses a large area of team blue or team amber; amber-ish hero VFX (Pyra's molten glass) are
  emissive and short-lived, and never on the base.

**Shape cues (always present, never optional; these match ACCESSIBILITY 1.1–1.2):**
| Element | Azure | Ember |
|---|---|---|
| Team emblem (banners, UI, minion shields, structure plaques, Front flag, coin) | **Diamond ◆** | **Triangle ▲** |
| **Hero base rim** (separate mesh) | **Solid band + 6 diamond notches** | **Sawtooth (flame) edge**, 12 teeth |
| Cloth pattern (banners, tabards, team pennant on heroes, ground ring decal) | **Horizontal bands** | **Diagonal hatching, 45°** |
| Minion shields (silhouette) | Round with a ◆ boss | Kite/pointed with a ▲ boss |
| Tower and Core silhouette | Round towers, domed caps | Square towers, pointed hip-roof caps |
| Banners / pennants | Square-cut | Swallow-tail |
| Front marker flag | Shows the emblem of the side the Front has pushed toward (see ASSETS.md) | |

**"My team is always blue"** (UX option): `TeamTint` takes the *displayed* team, so the swap is one call; meshes for
both rim shapes ship with every hero prefab.

Heroes are drafted into either team, so a **hero's body is never team-colored**. Team shows on: the base rim, a small
cloth **team pennant or sash** on every mini (masked area, color swapped by material; see PIPELINE §6), and a ground decal
ring under the base. Hero paint avoids large areas of pure Azure or Ember hue; where a hero is fire- or water-themed
(Pyra, Tidesinger) the theme color sits on props/VFX, and the rim pattern carries the team.

### 3.3 Status and feedback colors (always paired with an icon shape)
| Meaning | Hex | Shape |
|---|---|---|
| Good / heal | `#6fd38e` | plus |
| Bad / damage | `#ff5a5a` | sharp burst |
| Shield | `#f1d083` (brass-hi) | hex dome / shield outline |
| Poison | `#9bd44a` | droplet |
| Neutral monsters / objectives | `#D9D4C7` (bone white) | dotted ring + creature icon |

## 4. Materials (URP Lit, stylized)

One master **Shader Graph** on URP Lit (`SG_Mini`) plus a few variants; all opaque pieces share it so the SRP Batcher
can batch them.

| Material family | Look | Settings |
|---|---|---|
| **Painted mini** (heroes, minions, neutrals) | Hand-painted albedo with baked edge highlights and recess wash; satin varnish | Metallic 0 (painted metal is *painted*, not metallic) except real-metal accents ≤ 0.6; Smoothness 0.25–0.4; normal map soft; **edge-highlight boost** from a curvature channel; **team mask** recolors the pennant/sash |
| **Base** | Painted black-brown base with flock/sand top, team rim | Rim color + rim pattern are separate meshes (Azure band + diamond notches / Ember sawtooth); rim gets a faint emissive 0.15 so it reads in shadow |
| **Board tiles** | Crafted terrain: chunky stone, flocked turf, painted snow | Trim-sheet + tileable atlas per map; slight per-tile tint jitter via vertex color so the board doesn't look tiled |
| **River resin** | Glossy "poured resin" water | Smoothness 0.9, depth gradient in albedo, slow normal scroll; no real refraction (mobile) |
| **Structures** | Carved stone + brass fittings + team cloth | Brass = metallic 0.8, smoothness 0.55; damaged states swap meshes, not shaders |
| **VFX** | Glowing, translucent, *not* paint | Unlit additive / alpha-blended, HDR color with bloom; soft particles off on mobile |
| **Hidden (Shade)** | Mini turns to smoky translucent glass | Dithered transparency (opaque pass, no sorting issues) + dark rim light |

Avoid: photoreal PBR scans, high-frequency noise, chromatic aberration, heavy outlines. A thin **screen-space outline**
(1 px, `table-ink`) is allowed only on the selected/hovered piece.

## 5. Lighting

- **Key:** one warm directional "table lamp" light, color `#ffe6c2`, intensity 1.2, pitch 50°, yaw 35° from the camera's
  left, soft shadows (desktop 2 cascades, mobile 1 cascade / 1024 shadow map).
- **Fill:** ambient gradient sky `#2a3a44` / equator `#1e2a2e` / ground `#120d0a`; no realtime fill light.
- **Rim:** heroes get a shader rim term (`#cfe0ff`, 0.2) so dark minis separate from dark tiles.
- **Vignette** to the table edge, the board edge falls into darkness (the table lamp's pool of light).
- **Post (URP Volume):** ACES tonemapping, bloom (threshold 1.1, for VFX only), light vignette, **tilt-shift-style depth of
  field** only in the close-up camera (off on mobile). No film grain.
- **Per map mood:** Rift = warm lamp; Twin Hollow = lamp + violet bounce from the Spider pit; Frost Bridge = cooler
  key `#e6f0ff` and drifting snow particles (low count).
- Lane-phase and ultimates may dim the key to 70 % for 0.5 s ("the lamp flickers") so the VFX carry the moment.

## 6. Cameras

| Camera | Pitch | FOV | Use |
|---|---|---|---|
| **Table (default)** | 55° | 30° (long lens = miniature look, little distortion) | Normal play; whole lane region in view |
| **Top-down** | 85° | 30° | Tactical toggle; LoS and range overlays read best here; same as prototype's 2D view |
| **Close-up** | 35° | 25° + DOF | Ultimate casts, KOs, victory; never used during input |
| **Draft / showcase** | 15° | 22° | Hero turntable on its base in the draft screen |

Yaw rotates in **60° steps** (hex-aligned), default with the player's own base at the bottom of the screen.
Zoom range 0.6–1.6× of the default distance. Heroes are modelled to read from the 55° camera first: the top of the
head, shoulders, weapon and base rim matter more than the face.

## 7. UI style link

UI belongs to the UX agent (`unity/Assets/UI/`, UI Toolkit); art supplies icons and frames that match:
- Fonts: **Alegreya SC** (titles, hero names) and **Alegreya Sans** (body, numbers) — SIL OFL 1.1, commercial use OK.
- Frames: dark `panel` cards with a thin `brass` bevel, corner rivets; parchment text.
- Icons: **flat-painted, 2-tone + outline** on a transparent background, 256 px master, readable at 32 px. One light
  direction (top-left) matches the board lamp. Condition and team icons follow the shape table above.
- Team in UI: owned by UX (`docs/ux/ACCESSIBILITY.md` §1): "emblem + name" (◆ Azure, ▲ Ember), same hex values as above.

## 8. VFX language

### 8.1 Damage types
| Type (GDD rule) | Visual | Color | Number pop |
|---|---|---|---|
| **Attack** (reduced by ARM) | Short, physical: steel spark burst + dust puff + mini "knock" tilt of the target | white-steel `#e8eef0` | White number; if ARM reduced it, a small cracked-shield icon with "−n" beside it |
| **Ability** (ignores ARM) | The hero's element (table below), larger and slower than an Attack | hero element color | Number in element color with a rune frame |
| **Poison tick** | Green bubbles rise from the base, droplet drips | `#9bd44a` | Green number + droplet |
| **Structure shot** (tower dive / no cover) | Brass bolt arcs from the tower crown | brass `#f1d083` | Brass number + tower icon |
| **Neutral Bite** | Claw slash decal | bone white `#D9D4C7` | Bone-white number with a dotted outline |
| **Heal** | Rising motes + soft upward ring | `#6fd38e` | Green "+n" |
| **Shield absorb** | Hex-plate dome flashes and cracks | brass-hi | Brass number struck through |

Hero element palette (VFX only): fire/molten glass (Pyra) orange-gold · storm (Stormcaller) electric violet-white ·
frost (Frostbow) ice cyan-white · shadow (Shade) smoke black + pale moth dust · venom (Viper) acid green · lamplight
(Lumen) warm gold-white · tide (Tidesinger) sea teal + white foam · stone/resonance (Quake) ochre dust + sound rings ·
thorn/earth (Bramblehorn) moss green + bark brown · iron/mirror (Bulwark) white glare + steel · hook/rot (Butcher)
rust and murky brown-green · steel wind (Blademaster) pale steel arcs · splinters/axe (Ravager) wood-chip and dark red.

**Wave clear** ("Wave N"): the minions removed fall over and pop into a puff of paint flakes; a "+1" gold coin flips
up per minion for the hero who earned it.

### 8.2 Conditions (token on the base rim + VFX on the mini)
Every condition is a **physical token** clipped onto the hero's base rim (6 slots) **and** a light effect on the mini.
Token shape alone identifies it (colorblind-safe); icon inside; pips for duration.

| Condition | Token (shape, color) | On-mini VFX | Rule cue |
|---|---|---|---|
| **Stun** | **4-point star**, gold `#f3c94a` | Mini tilts 5° back, a ring of 3 small stars orbits the head; turn strip slot shows a "skip" chevron | "Skips next turn" |
| **Root** | **Square** chip, bark brown `#6b4a2b` with a root glyph | Painted roots curl up over the feet and the base top | Can't move |
| **Slow** | **Hourglass** chip, violet-grey `#8b84b8`; "(2)" adds a second pip | Sluggish grey ripple at the feet, motion trails drag | SPD −2 |
| **Silence** | **Hexagon** seal, wax red-brown `#8a3b2f` with a closed-mouth rune | A wax seal with a cord floats at the mouth/chest; ability icons in the HUD get the same seal | No abilities |
| **Shield n** | **Shield outline**, brass-hi, number inside | Faint hex-plate dome around the mini; cracks per point absorbed | Absorbs n |
| **Poison n** | **Droplet**, acid green, n inside + **3 pips** (ticks left) | Green drips from the base edge, bubbles on each tick | n + POW per tick |
| **Steadfast** | **Plain grey ring** around the whole base (not a chip) | None (calm) | Can't be stunned |
| **Hidden** (state) | **Crescent** chip, smoke grey | Mini becomes dithered smoky glass | Untargetable |
| **Haste** (buff) | **Arrow-wing** chip, pale green | Wind streaks behind the mini when it moves | +2 SPD |
| **Recalling** (state) | **Arch** chip (hearth doorway), brass | Soft hearth-light column; cracks and drops if cancelled | Arrives at the Fountain next turn |
| **Aegis** (item-like) | **Laurel ring** of brass on the base | Slow golden glint | Revives once |

Token animation: a token **drops in** with a small bounce when applied and **flicks off** when it expires — the board
should feel like a tabletop where someone places chits.

### 8.3 Movement and targeting previews (board decals, not paint)
| Preview | Visual |
|---|---|
| Move range | Hexes lit with a soft brass fill; reachable-with-2-Moves in a dimmer outline only |
| Attack/ability range | Brass outline hexes; area shapes (radius 1/2, lines) as filled hexes in the element color at 35 % |
| **Line of sight** | In range + in LoS: brass outline. **In range but blocked: diagonal hatch pattern** (pattern, not color) + darker. The sight line to the hovered target is a **dotted brass cord**; if blocked it turns into broken dashes ending in an **X** at the first wall hex. Preview text "No line of sight" (UX) |
| **Knockback** | Solid arrow from the target to its final hex; ghost mini on the final hex; a short "skid" mark |
| **Pull** (Meat Hook, Earthshaker) | Chain-link arrow toward the puller / centre; ghost minis on final hexes |
| Dash / jump / teleport | Dashed arc (jump), ground streak (dash), two smoke rings (teleport), ghost mini on the landing hex |
| Chain jumps | Zig-zag preview line hex to hex with jump numbers 1, 2 |
| Tower range | Brass ring decal 2 hexes around each structure, pulsing red-edge when the selected action would trigger the dive shot |

Forced-movement VFX at resolution: knockback = shove dust burst + the mini **slides on its base** (no ragdoll, it is a
toy); pull = a cord/chain snaps taut, then the mini slides.

## 9. Animation feel
Minis move like **animated toys**: on Move, the base glides along the hex path while the figure plays a stylized
walk/hop; there is no root motion off the base. Attacks are **snappy, 0.4–0.7 s**; casts 0.8–1.2 s; ultimates up to
1.8 s with the close-up camera. KO: the mini **tips over on its base**, rocks once, then lifts off the board in a puff of
paint flakes (it is "taken off the table"). Respawn: the mini is set down on the Fountain from above with a soft thud.

## 10. Sound direction (list in ASSETS.md §16)
Tabletop foley under fantasy sound: wooden and resin clicks when minis land, chit tokens clacking, dice-tray felt,
paper cards; abilities layer element sounds on top. Music: chamber folk (strings, frame drum, hurdy-gurdy-like drone),
low in the mix during turns.

## 11. Mood references (written, original)

1. **"The lamp-lit campaign table."** Late evening in a study. A single brass lamp throws a warm pool over a hex board
   of crafted stone and moss; the corners of the table vanish into dark walnut. Painted figures cast long soft shadows;
   the only cool light is the glow of a spell hovering over one piece.
2. **"Fresh off the painting desk."** Close up on a single miniature on a turntable: you can see the brush highlights
   on the edges of the armour, the wash pooled in cloth folds, a satin sheen on the varnish and grains of flock on the
   base. Slightly chunky, confident shapes — a figure meant to be held.
3. **"Resin river and moss."** A terrain-maker's river: poured, glassy blue-green resin with painted pebbles under the
   surface and white foam brushed on the rocks; tufts of static grass along the banks; the board edge shows its
   layered cork and plaster profile.
4. **"Frost on the bridge."** A narrow stone causeway dusted with model snow, icicles of clear resin on the parapets,
   breath-mist particles from the minis, and a pale cold lamp that turns every brass fitting silver.

## 12. Do / Don't
| Do | Don't |
|---|---|
| Bold silhouettes; one big readable prop per hero | Thin dangly detail that vanishes at 3 cm |
| Paint the light (edge highlights, washes) into the albedo | Rely on realtime lighting for form |
| Team info as rim pattern + value + emblem | Team info by hue alone |
| Every effect has a source and a landing | Screen-filling VFX that hide the board |
| Original designs, checked against the "must not resemble" lines in the briefs | Recognisable silhouettes or costumes from existing games |
