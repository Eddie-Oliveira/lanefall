# Lanefall — Accessibility (v1.0)

Owner: ux · Applies to every screen in `FLOWS.md` and `HUD.md`. Art-side items (miniature paint, tile patterns, icon
drawings) are requests to the assets agent through the CHANGELOG, not edits to `docs/assets/`.

**Rule zero:** no information is carried by color alone. Every color cue has a second cue: a pattern, a shape, an icon,
a word or a number.

## 1. Team colors and team identity

### 1.1 Proposed palette (for ASSETS to confirm in their style guide)
| Role | Proposed sRGB | Second cue (always present) |
|---|---|---|
| **Azure** | `#2F7FE8` (blue) | **Diamond ◆** emblem; base ring with **solid band + 6 diamond notches**; banner/tile edge pattern: **horizontal bands** |
| **Ember** | `#F5A030` (amber-orange) | **Triangle ▲** emblem; base ring with **sawtooth (flame) edge**; banner/tile edge pattern: **diagonal hatching** at 45° |
| Neutral monsters | `#D9D4C7` (bone white) | Dotted ring + creature icon |
| Board ground (reference) | `#1E2B24` (dark moss) | — |

Why these two: blue vs amber is the pair that stays apart in all three common color-vision deficiencies. Checked with
the Machado 2009 simulation (CIELAB ΔE between the two team colors, and luminance contrast against the board ground):

| Vision | ΔE Azure–Ember | Azure vs ground | Ember vs ground |
|---|---|---|---|
| Typical | 128 | 3.7 : 1 | 7.0 : 1 |
| Protan (red-weak) | 125 | 4.2 : 1 | 6.0 : 1 |
| Deutan (green-weak) | 133 | 3.5 : 1 | 7.6 : 1 |
| Tritan (blue-weak) | 106 | 3.9 : 1 | 6.9 : 1 |

ΔE > 40 reads as clearly different; both colors are ≥ 3 : 1 against the ground (WCAG non-text contrast). Ember is
also clearly **lighter** than Azure (≈ 1.9 : 1), so the teams differ in brightness, not only hue, which also helps in
grayscale. The prototype's `#ff6d4d` red-orange is dropped: red-orange vs a green board is the worst case for protan
and deutan players.

### 1.2 Rules for team cues
- **Miniatures:** base ring in team color **and** team ring shape (diamond notches vs sawtooth). Readable from the
  default camera at minimum zoom (ring ≥ 6 px tall on a 1080p screen).
- **Front markers, towers, Core, wave minis:** team emblem on the banner/top + team color.
- **HUD:** every team mention is "emblem + name" (◆ Azure, ▲ Ember); turn-strip chips use the emblem and the edge
  pattern; VP bars carry the emblem at the end.
- **You / Ally / Enemy first:** HUD text says "Enemy Shade", "Ally Lumen"; hero cards of enemies have a thin angled
  frame (enemy) vs a straight frame (ally) in addition to color.
- **Option "My team is always blue"** (default **on** online and vs bots, **off** in hotseat): your team uses the Azure
  palette and patterns on your screen whatever its real side; names stay correct ("You are Ember (shown blue)").
- **Colorblind filter presets** (Protan / Deutan / Tritan / High contrast): they swap the palette only; patterns and
  emblems never change, so screenshots and spoken descriptions stay valid across players.

### 1.3 Other color-coded states (second cue each)
| State | Color | Second cue |
|---|---|---|
| Legal target / reachable hex | Light outline | Solid outline + hex fill dots |
| No line of sight | Dark | **Hatched** fill + eye-with-slash icon on hover + "No line of sight" |
| Danger (tower would shoot, Threat) | Warm | **Hatched** ring + tower icon + number |
| Damage numbers | — | Minus sign and number ("−3"); heals "+3"; shield "⛨3" |
| KO preview | — | Skull icon + "KO" |
| Ready / used / cooldown | — | Check mark, clock ring with number, lock |
| Your turn | Team color glow | "YOUR TURN" banner + sound + timer ring |

## 2. Text and readability

| Element | Desktop (1080p, UI 100%) | Phone (dp) | Notes |
|---|---|---|---|
| Body, tooltips, log | 18 px | 14 dp | Never below 12 dp on phone at any scale |
| Labels on buttons | 16 px, semibold | 13 dp | |
| Numbers on the board (damage, Power) | 24 px, bold, outlined | 18 dp | Screen-space, never scaled by camera zoom |
| Prompts / banners | 24–32 px | 18–20 dp | |
| Small caps labels (section headers) | 14 px | 12 dp | Only for 1–3 word labels |
- **UI scale** 80–150% (Settings). At > 120% on phone, the right rail becomes a bottom sheet.
- Font: a humanist sans with distinct `Il1` and `O0` (e.g. Atkinson Hyperlegible or similar; ASSETS/UX pick); a
  **dyslexia-friendly** alternate font option.
- Text contrast ≥ 4.5 : 1 for body, ≥ 3 : 1 for large text; text over the 3D board always sits on a panel or has a
  2 px outline.
- Line length ≤ 70 characters in tooltips and the quick reference.
- **High-contrast mode:** solid panels (no translucency), thicker outlines (2×), board desaturated to 50% except units.

## 3. Icons + text

- Every icon has a text label or a tooltip with its name; icons that carry rules (conditions, action states) show the
  **word** next to the icon on the hero card and in previews ("⨯ Stun", "Root"), icons alone only on the 3D base
  ring, where tapping/hovering gives the word.
- Condition icons are distinct by **shape**, not color (spiral, vines, chevron boot, crossed rune, shield, drop, wing,
  smoke, grey ring), readable at 24 px.
- Hero portraits, not emoji (prototype). Each portrait has the role icon in a corner.

## 4. Motion

**Reduce motion** setting (default follows the OS setting):
- Camera: no automatic pans; cuts instead (or "Camera follows: Off"). No idle orbit on the title.
- Lane phase: 1 s per lane, no marching minions; numbers and the Front move appear as a static before/after with an
  arrow. Skip always available.
- No screen shake, no flashes; KO and level-up become a short fade + banner.
- Pulsing highlights become a static thick outline.
- Nothing flashes faster than 3 times per second in any mode.

## 5. Input

- **Full remapping** of every action for keyboard, mouse buttons and gamepad; conflicts flagged; per-device profiles.
- **No timing or precision demands:** nothing needs a double-click, a drag, or a hold under 0.5 s. Holds (End turn,
  info) can be switched to **toggle / press twice**.
- **Click-again confirm vs one-click** setting (one-click commits from the preview; off by default for the first 5
  matches).
- **Touch:** targets ≥ 44×44 dp; tap-and-hold for info has an alternative (an "i" info mode toggle) for players who
  can't hold. Pinch-zoom has +/− buttons; two-finger rotate has rotate buttons.
- **One-hand play:** every in-match action reachable from the right rail (phone) or keyboard alone (desktop: arrow
  keys move a hex cursor, Enter selects).
- Gamepad (later): a hex cursor on the left stick with snapping to units; bumpers cycle legal targets so aiming never
  requires stick precision.

## 6. Hotseat privacy

**None needed.** Lanefall has no hidden information during a match (GDD 12: public state only): heroes, cooldowns,
items, gold and conditions are visible to everyone. Consequences:
- No "pass the device" screen between players. A 1 s "Ember's turn" banner prevents a stray click carrying over.
- Planning overlays and pinned plans clear when the turn passes (they are aids, not secrets).
- The only private information anywhere is a **draft hover** (team-only, GDD 10.2). In hotseat it is simply visible to
  all; this is stated on the hotseat lobby ("On one device, draft hovers are visible to everyone").

## 7. Timers

- **Offline (vs bots, hotseat): no timers** by default; optional "Practice timer".
- **Learning lobbies** (GDD 4, 10.2): 90 s turns at 1v1/2v2/Commander, 60 s at 3v3/4v4; 45 s picks. Lobby option,
  default on when anyone in the room has < 5 matches.
- **Timer display:** ring around the active portrait **plus** seconds as a number; at 10 s the ring becomes thick and
  striped and a tick sound starts (sound can be replaced by vibration on phone or turned off). The number is always
  shown, so the warning never relies on color or sound alone.
- **Bank:** +30 s once per match, used automatically at 0 s (proposal; see HUD 12) with the banner "Using your 30 s
  bank".
- **Planning mode** (HUD 8) lets slower players prepare during others' turns, so the turn timer rarely matters.
- **Pause:** offline the game pauses; online it can't, and the pause overlay shows the timer.
- **Accessibility timer option (online, host setting):** "Extended timers ×2" for a lobby, shown as a room badge so
  everyone knows before joining.

## 8. Audio and other

- Separate volume sliders: music, effects, voice, UI ticks. Every sound cue has a visual equivalent (turn start =
  banner, timer = ring, tower shot = icon + log line).
- Subtitles/captions for any voiced line (tutorial coach), on by default.
- The log is plain text and complete: every event that animates on the board is written there, so a player who missed
  an animation can read what happened.
- Screen-reader support (UI Toolkit) for menus, lobby and draft in v1; in-match narration of turn events
  ("Enemy Shade used Shadow Step on Lumen, 2 damage") is a later goal, built on the same event stream as the log.
