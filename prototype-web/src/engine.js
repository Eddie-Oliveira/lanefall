"use strict";
/* ===== Lanefall engine: pure game rules, no DOM ===== */
let W = 15, H = 15;
const TEAMS = [{ name: 'Azure', col: '#56a8ff', dark: '#173452' }, { name: 'Ember', col: '#ff6d4d', dark: '#4d1f17' }];
const D8 = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
const K = (x, y) => x + ',' + y;
const dist = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
const inB = (x, y) => x >= 0 && y >= 0 && x < W && y < H;

/* Maps are point-symmetric: Azure's half is described, Ember's is mirrored. */
function mkMap(o) {
  const mx = p => ({ x: o.W - 1 - p.x, y: o.H - 1 - p.y });
  const M = Object.assign({}, o);
  M.wall = new Set();
  for (const [x, y] of o.walls) { M.wall.add(K(x, y)); const m = mx({ x, y }); M.wall.add(K(m.x, m.y)); }
  M.laneSet = o.lanes.map(l => new Set(l.map(p => K(p.x, p.y))));
  M.towers = [o.towers, o.towers.map(t => Object.assign(mx(t), { lane: o.mirLane(t.lane), tier: t.tier }))];
  M.cores = [o.core, mx(o.core)];
  M.fount = [o.fount, mx(o.fount)];
  M.camps = [].concat(...(o.camps || []).map(c => [c, Object.assign(mx(c), { t: c.t })]), o.center || []);
  M.relics = [].concat(...(o.relics || []).map(r => [r, mx(r)]));
  M.altars = [].concat(...(o.altars || []).map(r => [r, mx(r)]));
  const b = o.base, rb = { x0: o.W - 1 - b.x1, x1: o.W - 1 - b.x0, y0: o.H - 1 - b.y1, y1: o.H - 1 - b.y0 };
  const inR = (r, x, y) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
  M.zone = (x, y) => inR(b, x, y) ? 0 : inR(rb, x, y) ? 1 : -1;
  M.river = new Set(o.river || []);
  return M;
}
const MAPS = {
  rift: mkMap((() => {
    const lanes = [[], [], []];
    for (let y = 13; y >= 1; y--) lanes[0].push({ x: 1, y });
    for (let x = 2; x <= 13; x++) lanes[0].push({ x, y: 1 });
    for (let x = 1; x <= 13; x++) lanes[1].push({ x, y: 14 - x });
    for (let x = 1; x <= 13; x++) lanes[2].push({ x, y: 13 });
    for (let y = 12; y >= 1; y--) lanes[2].push({ x: 13, y });
    const river = []; for (let i = 2; i <= 12; i++) river.push(K(i, i));
    return {
      id: 'rift', n: 'The Rift', size: '3 lanes · 15×15', best: 'Best for 3v3 and 4v4',
      desc: 'The classic: three lanes, a river, wolf camps, the Ancient Drake and the Stone Golem.',
      W: 15, H: 15, walls: [[3,5],[3,6],[4,6],[7,10],[8,10],[8,11],[10,12]], lanes, laneNames: ['Top', 'Mid', 'Bot'], mirLane: l => 2 - l,
      towers: [{ x: 2, y: 7, lane: 0, tier: 1 }, { x: 5, y: 10, lane: 1, tier: 1 }, { x: 7, y: 12, lane: 2, tier: 1 }],
      core: { x: 1, y: 13 }, fount: { x: 0, y: 14 }, base: { x0: 0, x1: 2, y0: 12, y1: 14 }, river,
      camps: [{ t: 'camp', x: 3, y: 8 }, { t: 'camp', x: 9, y: 11 }], center: [{ t: 'drake', x: 10, y: 10 }, { t: 'golem', x: 4, y: 4 }],
      rules: { recall: true, startGold: 450, startLvl: 1, overtime: 25, random: false, wave: r => r <= 12 ? (r - 1) % 3 === 0 : r % 2 === 0 },
    };
  })()),
  hollow: mkMap((() => {
    const top = [{x:1,y:5},{x:1,y:4},{x:2,y:3},{x:3,y:2}]; for (let x = 4; x <= 14; x++) top.push({ x, y: 1 }); top.push({x:15,y:2},{x:16,y:3},{x:17,y:4},{x:17,y:5});
    const bot = top.map(p => ({ x: 18 - p.x, y: 10 - p.y })).reverse();
    const walls = []; for (let x = 0; x < 19; x++) walls.push([x, 0]);
    walls.push([5,3],[5,4],[4,6],[4,7],[7,6],[7,7],[8,4],[10,4],[8,5]);
    return {
      id: 'hollow', n: 'Twin Hollow', size: '2 lanes · 19×11', best: 'Best for 2v2 and 3v3',
      desc: 'Two lanes around a tight jungle. Hold the altars for team bonuses and fight over the Spider Queen in the central pit.',
      W: 19, H: 11, walls, lanes: [top, bot], laneNames: ['Top', 'Bot'], mirLane: l => 1 - l,
      towers: [{ x: 6, y: 2, lane: 0, tier: 1 }, { x: 3, y: 3, lane: 0, tier: 2 }, { x: 6, y: 8, lane: 1, tier: 1 }, { x: 3, y: 7, lane: 1, tier: 2 }],
      core: { x: 1, y: 5 }, fount: { x: 0, y: 5 }, base: { x0: 0, x1: 2, y0: 3, y1: 7 },
      camps: [{ t: 'camp', x: 6, y: 3 }, { t: 'camp', x: 6, y: 7 }], center: [{ t: 'queen', x: 9, y: 5 }],
      relics: [{ x: 9, y: 2 }], altars: [{ x: 6, y: 5, n: 'West Altar' }],
      rules: { recall: true, startGold: 450, startLvl: 1, overtime: 25, random: false, wave: r => r <= 12 ? (r - 1) % 3 === 0 : r % 2 === 0 },
    };
  })()),
  bridge: mkMap((() => {
    const lane = []; for (let x = 1; x <= 17; x++) lane.push({ x, y: 3 });
    const walls = []; for (let x = 0; x < 19; x++) walls.push([x, 0]);
    walls.push([5, 1], [8, 5]);
    return {
      id: 'bridge', n: 'Frost Bridge', size: '1 lane · 19×7', best: 'Quick brawls, any size',
      desc: 'One long lane and nowhere to hide. No recall, start at level 3 with extra gold, grab health relics. Heroes are random by default.',
      W: 19, H: 7, walls, lanes: [lane], laneNames: ['Bridge'], mirLane: () => 0,
      towers: [{ x: 6, y: 2, lane: 0, tier: 1 }, { x: 3, y: 4, lane: 0, tier: 2 }],
      core: { x: 1, y: 3 }, fount: { x: 0, y: 3 }, base: { x0: 0, x1: 1, y0: 1, y1: 5 },
      relics: [{ x: 6, y: 5 }, { x: 9, y: 1 }],
      rules: { recall: false, startGold: 1100, startLvl: 3, overtime: 16, random: true, wave: r => (r - 1) % 2 === 0 },
    };
  })()),
};
const MAP_KEYS = Object.keys(MAPS);
let MAP = MAPS.rift;
function setMap(id) { MAP = MAPS[id] || MAPS.rift; W = MAP.W; H = MAP.H; }
const isWall = (x, y) => MAP.wall.has(K(x, y));
const zoneOf = (x, y) => MAP.zone(x, y);
const isRiver = (x, y) => MAP.river.has(K(x, y));
const overtimeAt = () => MAP.rules.overtime;

const NEUTRALS = {
  camp:  { n: 'Wolf Pack', i: '🐺', hp: 16, atk: 3, arm: 0, res: 0, first: 1, respawn: 6 },
  drake: { n: 'Ancient Drake', i: '🐉', hp: 42, atk: 5, arm: 1, res: 1, first: 4, respawn: 10 },
  golem: { n: 'Stone Golem', i: '🗿', hp: 56, atk: 6, arm: 2, res: 2, first: 7, respawn: 12 },
  queen: { n: 'Spider Queen', i: '🕷️', hp: 64, atk: 7, arm: 2, res: 2, first: 8, respawn: 12 },
};

const ITEMS = {
  potion:     { n: 'Health Potion', c: 50, tier: 0, use: 'potion', d: 'Use (free): heal 8 HP. Carry up to 3.' },
  long_sword: { n: 'Long Sword', c: 300, tier: 1, s: { atk: 2 }, d: '+2 ATK' },
  tome:       { n: 'Amplifying Tome', c: 300, tier: 1, s: { pwr: 2 }, d: '+2 PWR' },
  ruby:       { n: 'Ruby Crystal', c: 300, tier: 1, s: { hp: 8 }, d: '+8 HP' },
  cloth:      { n: 'Cloth Armor', c: 300, tier: 1, s: { arm: 1 }, d: '+1 ARM' },
  mantle:     { n: 'Null Mantle', c: 300, tier: 1, s: { res: 1 }, d: '+1 RES' },
  boots:      { n: 'Boots of Speed', c: 350, tier: 1, s: { mov: 1 }, grp: 'boots', d: '+1 MOV' },
  vamp:       { n: 'Vampiric Scepter', c: 800, tier: 2, s: { atk: 2, ls: 0.3 }, d: '+2 ATK. Basic attacks heal you for 30% of damage dealt.' },
  blink:      { n: 'Blink Charm', c: 900, tier: 2, use: 'blink', cd: 4, uniq: 1, d: 'Use (free): teleport up to 4 tiles, over walls. 4-turn cooldown.' },
  treads:     { n: 'Swift Treads', c: 950, tier: 2, s: { mov: 2 }, grp: 'boots', up: 'boots', d: '+2 MOV. Costs 600 if you own Boots of Speed (they get upgraded).' },
  spiked:     { n: 'Thorn Mail', c: 1000, tier: 2, s: { arm: 2, hp: 6, thorns: 2 }, d: '+2 ARM, +6 HP. Heroes who basic-attack you take 2 damage.' },
  veil:       { n: 'Purifying Veil', c: 1000, tier: 2, s: { res: 2, hp: 8 }, use: 'cleanse', cd: 5, uniq: 1, d: '+2 RES, +8 HP. Use (free, even while stunned): remove stun, root, slow, silence and burn.' },
  hammer:     { n: 'Frost Hammer', c: 1100, tier: 2, s: { atk: 3, hp: 6 }, slowHit: 1, d: '+3 ATK, +6 HP. Basic attacks slow the target.' },
  plate:      { n: 'Titan Plate', c: 1300, tier: 3, s: { hp: 16, arm: 2 }, d: '+16 HP, +2 ARM' },
  staff:      { n: 'Archmage Staff', c: 1500, tier: 3, s: { pwr: 6, hp: 6 }, d: '+6 PWR, +6 HP' },
  blade:      { n: 'Infinity Blade', c: 1500, tier: 3, s: { atk: 5, crit: 0.3 }, d: '+5 ATK. Basic attacks have a 30% chance to crit for double damage.' },
  guardian:   { n: 'Guardian Angel', c: 1800, tier: 3, s: { arm: 2, res: 2 }, uniq: 1, d: '+2 ARM, +2 RES. The first time you would die, revive at half HP. Then it shatters.' },
};

const HEROES = {
  bulwark: { n: 'Bulwark', i: '🛡️', role: 'Tank', hp: 42, atk: 3, rng: 1, mov: 3, arm: 2, res: 1, pwr: 1, g: { hp: 5, atk: .5, pwr: .5 },
    about: 'Armored guardian. Walks in first, stuns, and absorbs tower shots for the team.',
    build: ['ruby','boots','cloth','plate','spiked','treads','veil','guardian'],
    ab: {
      q: { n: 'Shield Bash', type: 'enemy', range: 1, cd: 3, dmg: { b: 2, atk: .5 }, stun: 1, d: 'Hit an adjacent enemy and stun it for 1 turn.', tip: 'The classic tank point-blank stun.' },
      w: { n: 'Iron Stance', type: 'self', cd: 3, shield: { b: 5, pwr: 1 }, d: 'Gain a shield that absorbs damage until the end of your next turn.', tip: 'Raise it before you dive under a tower.' },
      e: { n: 'Charge', type: 'dashEnemy', range: 4, cd: 4, dmg: { b: 3, atk: .5 }, slow: 1, d: 'Dash next to an enemy up to 4 tiles away, hit it and slow it.', tip: 'Gap closer. Charge in, then Bash.' },
      r: { n: 'Solar Flare', type: 'tile', range: 3, radius: 1, cd: 6, dmg: { b: 4, pwr: 1 }, mag: 1, stun: 1, d: 'Strike a 3×3 area up to 3 tiles away: magic damage and a 1-turn stun on everything inside.', tip: 'Teamfight ultimate. Aim where two enemies stand.' } } },
  butcher: { n: 'Butcher', i: '🪝', role: 'Tank', hp: 44, atk: 4, rng: 1, mov: 3, arm: 1, res: 1, pwr: 2, g: { hp: 5, atk: .5, pwr: .6 },
    about: 'Hook specialist. Drags enemies out of position, then eats them.',
    build: ['ruby','boots','mantle','spiked','treads','plate','blink','guardian'],
    ab: {
      q: { n: 'Meat Hook', type: 'line', range: 5, cd: 4, dmg: { b: 4, pwr: 1 }, pull: 1, d: 'Throw a hook in a straight line (any of 8 directions, 5 tiles). The first enemy hit takes damage and is pulled next to you.', tip: 'The famous hook. Diagonals count too.' },
      w: { n: 'Rot', type: 'self', radius: 1, cd: 1, dmg: { b: 2, pwr: .5 }, mag: 1, special: 'rot', d: 'Magic damage to every adjacent enemy. Costs you 1 HP.', tip: 'Cheap aura damage. Use it every turn after a hook.' },
      e: { n: 'Devour', type: 'enemy', range: 1, cd: 4, special: 'gorge', d: 'Eat an adjacent minion or wolf (up to 12 + 2×PWR HP) instantly and heal 6.', tip: 'Deny a minion, steal a camp, top up HP.' },
      r: { n: 'Dismember', type: 'enemy', range: 1, cd: 6, dmg: { b: 6, pwr: 1.5 }, mag: 1, stun: 1, special: 'drain', d: 'Grab an adjacent enemy: heavy magic damage, a 1-turn stun, and heal for half the damage.', tip: 'Hook, then Dismember on your next turn.' } } },
  blademaster: { n: 'Blademaster', i: '⚔️', role: 'Fighter', hp: 38, atk: 5, rng: 1, mov: 3, arm: 1, res: 0, pwr: 0, g: { hp: 4, atk: 1, pwr: 0 },
    about: 'Duelist who wins long fights. Spins through groups and finishes with a flurry.',
    build: ['long_sword','boots','vamp','hammer','treads','blade','plate','guardian'],
    ab: {
      q: { n: 'Blade Spin', type: 'self', radius: 1, cd: 2, dmg: { b: 2, atk: .8 }, d: 'Spin and hit every adjacent enemy.', tip: 'Spin to win. Best when surrounded by minions.' },
      w: { n: 'Battle Cry', type: 'self', quick: 1, cd: 4, buff: { s: { atk: 2 }, dur: 2 }, mvNow: 1, d: 'Free action: +2 ATK this turn and next, and +1 move right now.', tip: 'Use it before moving to reach your target.' },
      e: { n: 'Decisive Strike', type: 'enemy', range: 1, cd: 3, dmg: { b: 3, atk: 1 }, silence: 1, d: 'A heavy hit that silences the target (no abilities) for 1 turn.', tip: 'Shut down a mage before they cast.' },
      r: { n: 'Omnislash', type: 'self', radius: 2, cd: 6, dmg: { b: 1, atk: .8 }, special: 'omni', d: 'Strike 4 times at random enemies within 2 tiles. Heroes are hit first when present.', tip: 'Best when one hero stands alone.' } } },
  shade: { n: 'Shade', i: '🗡️', role: 'Assassin', reset: 1, hp: 30, atk: 5, rng: 1, mov: 4, arm: 0, res: 0, pwr: 1, g: { hp: 3, atk: 1, pwr: .3 },
    about: 'Fragile killer. When Shuriken or Shadow Step kills a unit, her action resets. Executes a weakened hero, then vanishes.',
    build: ['long_sword','boots','vamp','treads','blade','blink','guardian','hammer'],
    ab: {
      q: { n: 'Shuriken', type: 'line', range: 4, cd: 2, dmg: { b: 3, atk: .7 }, d: 'Throw a blade in a straight line; it hits the first enemy.', tip: 'Poke and last-hit from safety.' },
      w: { n: 'Shadow Step', type: 'dashEnemy', range: 4, cd: 3, dmg: { b: 2, atk: .5 }, d: 'Teleport next to an enemy up to 4 tiles away and strike it.', tip: 'Blink-strike. Walls do not stop it.' },
      e: { n: 'Smoke Veil', type: 'self', quick: 1, cd: 4, buff: { tag: 'veil', dur: 1 }, mvNow: 1, d: 'Free action: vanish and gain +1 move. Heroes and towers cannot target you until your next turn. Attacking reveals you.', tip: 'Stealth escape, or a sneaky approach.' },
      r: { n: 'Death Mark', type: 'enemy', range: 1, cd: 6, dmg: { b: 5, atk: 1 }, special: 'execute', d: 'Strike an adjacent enemy. A hero left at or under 20% HP is executed outright.', tip: 'Finisher. Wait until they are low.' } } },
  pyra: { n: 'Pyra', i: '🔥', role: 'Mage', los: 1, hp: 28, atk: 2, rng: 2, mov: 3, arm: 0, res: 1, pwr: 5, g: { hp: 3, atk: .3, pwr: 1 },
    about: 'Burst mage. Fireballs groups from range and deletes one target with her ultimate. Needs line of sight: walls block her spells and attacks.',
    build: ['tome','boots','staff','mantle','treads','blink','guardian','ruby'],
    ab: {
      q: { n: 'Fireball', type: 'tile', range: 4, radius: 1, cd: 2, dmg: { b: 3, pwr: .8 }, mag: 1, d: 'Hurl a fireball at a 3×3 area up to 4 tiles away: magic damage to every enemy inside.', tip: 'Your farming and poke tool. Hit waves and heroes together.' },
      w: { n: 'Flame Ring', type: 'enemy', range: 3, cd: 4, dmg: { b: 2, pwr: .4 }, mag: 1, stun: 1, d: 'Trap an enemy up to 3 tiles away: magic damage and a 1-turn stun.', tip: 'Stun first, then let the team follow up.' },
      e: { n: 'Ignite', type: 'enemy', range: 3, cd: 3, burn: { b: 2, pwr: .3, t: 3 }, d: 'Set an enemy ablaze: it takes burn damage at the start of each of its next 3 turns.', tip: 'Burn ignores armor. Great on tanks.' },
      r: { n: 'Pyroblast', type: 'enemy', range: 5, cd: 6, dmg: { b: 8, pwr: 1.5 }, mag: 1, d: 'Long-range nuke: huge magic damage to one enemy up to 5 tiles away.', tip: 'Point-and-click finisher.' } } },
  frostbow: { n: 'Frostbow', i: '🏹', role: 'Marksman', freeAttack: 1, hp: 28, atk: 5, rng: 3, mov: 3, arm: 0, res: 0, pwr: 1, g: { hp: 3, atk: 1, pwr: .3 },
    about: 'Ranged carry. Her first basic attack each turn is free, so she can shoot and still use an ability. Kites with slows and a long stun arrow.',
    build: ['long_sword','boots','vamp','blade','treads','hammer','guardian','plate'],
    ab: {
      q: { n: 'Volley', type: 'tile', range: 3, radius: 1, cd: 3, dmg: { b: 1, atk: .6 }, slow: 1, d: 'Rain arrows on a 3×3 area up to 3 tiles away: damage and slow.', tip: 'Clear a wave or slow a chase.' },
      w: { n: 'Frost Shot', type: 'self', quick: 1, cd: 4, buff: { tag: 'frost', s: { atk: 1 }, dur: 2 }, d: 'Free action: +1 ATK and your basic attacks slow, this turn and next.', tip: 'Turn it on, then attack. Kite forever.' },
      e: { n: 'Tumble', type: 'dash', range: 2, quick: 1, cd: 3, buff: { tag: 'tumble', dur: 1 }, d: 'Free action: roll to a free tile up to 2 away. Your next basic attack this turn deals +2.', tip: 'Attack, then roll out of reach.' },
      r: { n: 'Crystal Arrow', type: 'line', range: 8, cd: 6, dmg: { b: 5, atk: 1 }, mag: 1, stun: 2, d: 'Fire a long arrow (8 tiles). The first enemy hit takes magic damage and is stunned for 2 turns.', tip: 'Cross-map engage. Line it up.' } } },
  lumen: { n: 'Lumen', i: '✨', role: 'Support', hp: 30, atk: 2, rng: 2, mov: 3, arm: 0, res: 1, pwr: 4, g: { hp: 3, atk: .3, pwr: 1 },
    about: 'Healer. Keeps the carry alive, roots divers, and saves the whole team with a global wish.',
    build: ['tome','boots','ruby','veil','staff','treads','guardian','mantle'],
    ab: {
      q: { n: 'Mend', type: 'ally', range: 3, cd: 2, heal: { b: 5, pwr: 1 }, d: 'Heal an allied hero (or yourself) up to 3 tiles away.', tip: 'Heal the one in front, not the one at full HP.' },
      w: { n: 'Binding Light', type: 'line', range: 4, cd: 3, dmg: { b: 2, pwr: .5 }, mag: 1, root: 1, d: 'A beam in a straight line. The first enemy hit takes magic damage and is rooted (cannot move) for 1 turn.', tip: 'Root a diver, then walk away.' },
      e: { n: 'Barrier', type: 'ally', range: 3, cd: 3, shield: { b: 4, pwr: 1 }, d: 'Shield an allied hero (or yourself) up to 3 tiles away until the end of their next turn.', tip: 'Shield first, heal later.' },
      r: { n: 'Wish', type: 'global', cd: 7, heal: { b: 6, pwr: 1 }, d: 'Heal every living allied hero, anywhere on the map.', tip: 'Global save. Watch the other lanes.' } } },
  quake: { n: 'Quake', i: '🌋', role: 'Initiator', hp: 36, atk: 4, rng: 1, mov: 3, arm: 1, res: 1, pwr: 3, g: { hp: 4, atk: .5, pwr: .8 },
    about: 'Fight starter. Stuns a whole line and wins teamfights with one huge slam.',
    build: ['ruby','boots','tome','blink','treads','staff','plate','guardian'],
    ab: {
      q: { n: 'Fissure', type: 'line', range: 4, pierce: 1, cd: 4, dmg: { b: 2, pwr: .6 }, mag: 1, stun: 1, d: 'Split the ground in a straight line (4 tiles): magic damage and a 1-turn stun to every enemy on it.', tip: 'Hits everyone on the line, not just the first.' },
      w: { n: 'Enchant Totem', type: 'self', quick: 1, cd: 3, buff: { tag: 'totem', dur: 1 }, d: 'Free action: your next basic attack this turn deals double damage.', tip: 'Totem, then attack. Great for last hits on towers.' },
      e: { n: 'Tremor', type: 'self', radius: 1, cd: 2, dmg: { b: 2, pwr: .5 }, mag: 1, slow: 1, d: 'Shake the ground: magic damage and slow to every adjacent enemy.', tip: 'Keeps enemies from escaping.' },
      r: { n: 'Echo Slam', type: 'self', radius: 2, cd: 7, dmg: { b: 3, pwr: .5 }, mag: 1, special: 'echo', d: 'Slam within 2 tiles: magic damage to every enemy, +2 more for each other enemy caught (minions count).', tip: 'Blink into the middle of the crowd first.' } } },

  /* ---- second hero per class ---- */
  ravager: { n: 'Ravager', i: '🪓', role: 'Fighter', hp: 40, atk: 4, rng: 1, mov: 3, arm: 1, res: 0, pwr: 1, g: { hp: 4, atk: 1, pwr: .3 },
    about: 'Brawler who heals by cleaving heroes, then finishes the wounded with a heavy axe.',
    build: ['long_sword','boots','hammer','spiked','treads','plate','vamp','guardian'],
    ab: {
      q: { n: 'Cleave', type: 'self', radius: 1, cd: 2, dmg: { b: 2, atk: .7 }, special: 'cleave', d: 'Hit every adjacent enemy. Heal 3 for each hero hit.', tip: 'Stand next to two of them and sustain.' },
      w: { n: 'Hamstring', type: 'enemy', range: 1, cd: 3, dmg: { b: 2, atk: .5 }, slow: 2, d: 'Cut an adjacent enemy: damage and slow for 2 turns.', tip: 'They can\'t run from you after this.' },
      e: { n: 'Leap', type: 'dash', range: 3, cd: 4, dmg: { b: 2, atk: .5 }, radius: 1, slow: 1, d: 'Jump to a free tile up to 3 away. Enemies next to where you land take damage and are slowed.', tip: 'Engage over a minion wave.' },
      r: { n: 'Guillotine', type: 'enemy', range: 1, cd: 6, dmg: { b: 5, atk: 1 }, special: 'missing', d: 'Execute swing on an adjacent enemy: damage plus 40% of its missing HP.', tip: 'The lower they are, the harder it hits.' } } },
  viper: { n: 'Viper', i: '🐍', role: 'Assassin', hp: 30, atk: 4, rng: 1, mov: 4, arm: 0, res: 1, pwr: 3, g: { hp: 3, atk: .6, pwr: .7 },
    about: 'Poison assassin. Stacks burns that ignore armor, then slips away before the target drops.',
    build: ['tome','boots','long_sword','treads','staff','blink','guardian','vamp'],
    ab: {
      q: { n: 'Venom Fang', type: 'enemy', range: 1, cd: 2, dmg: { b: 2, atk: .5 }, burn: { b: 1, pwr: .4, t: 3 }, d: 'Bite an adjacent enemy: damage and poison (burn) for 3 turns.', tip: 'Bite, then walk away. The poison does the rest.' },
      w: { n: 'Toxic Cloud', type: 'tile', range: 3, radius: 1, cd: 3, slow: 1, burn: { b: 1, pwr: .3, t: 2 }, d: 'Release a 3×3 cloud up to 3 tiles away: poison and slow everything inside.', tip: 'Great on a minion wave with a hero in it.' },
      e: { n: 'Slither', type: 'dash', range: 3, quick: 1, cd: 3, d: 'Free action: slide to a free tile up to 3 away.', tip: 'Escape after the bite, or close the gap first.' },
      r: { n: 'Kiss of Death', type: 'enemy', range: 2, cd: 6, dmg: { b: 4, pwr: 1 }, mag: 1, silence: 1, burn: { b: 3, pwr: .5, t: 3 }, d: 'Magic damage to an enemy up to 2 away, silence it for 1 turn and poison it heavily for 3 turns.', tip: 'Silence the healer or the mage before the fight.' } } },
  stormcaller: { n: 'Stormcaller', i: '⚡', role: 'Mage', los: 1, hp: 28, atk: 2, rng: 2, mov: 3, arm: 0, res: 1, pwr: 4, g: { hp: 3, atk: .3, pwr: 1 },
    about: 'Control mage. Chains lightning between enemies and blows divers away. Needs line of sight.',
    build: ['tome','boots','mantle','staff','treads','veil','guardian','ruby'],
    ab: {
      q: { n: 'Chain Lightning', type: 'enemy', range: 3, cd: 2, dmg: { b: 2, pwr: .7 }, mag: 1, special: 'chain', d: 'Strike an enemy up to 3 away; the bolt jumps to up to 2 more enemies within 2 tiles of the last one (70% damage).', tip: 'Best into a crowd of minions with a hero inside.' },
      w: { n: 'Static Field', type: 'tile', range: 3, radius: 1, cd: 4, dmg: { b: 1, pwr: .4 }, mag: 1, silence: 1, d: 'Charge a 3×3 area up to 3 tiles away: magic damage and silence 1 turn.', tip: 'Stops their whole team from casting.' },
      e: { n: 'Gust', type: 'line', range: 3, cd: 3, dmg: { b: 1, pwr: .3 }, mag: 1, knock: 2, d: 'A blast of wind in a straight line. The first enemy hit takes damage and is knocked back 2 tiles.', tip: 'Push a diver off you, or into your tower.' },
      r: { n: 'Thunderstorm', type: 'tile', range: 4, radius: 2, cd: 6, dmg: { b: 4, pwr: 1 }, mag: 1, d: 'Call a storm on a 5×5 area up to 4 tiles away: heavy magic damage to every enemy inside.', tip: 'Wait until they group up for the drake.' } } },
  deadeye: { n: 'Deadeye', i: '🎯', role: 'Marksman', freeAttack: 1, los: 1, hp: 26, atk: 5, rng: 4, mov: 3, arm: 0, res: 0, pwr: 1, g: { hp: 3, atk: 1, pwr: .3 },
    about: 'Sniper with the longest range. First basic attack each turn is free. Needs line of sight.',
    build: ['long_sword','boots','blade','treads','vamp','guardian','hammer','plate'],
    ab: {
      q: { n: 'Piercing Shot', type: 'line', range: 5, pierce: 1, cd: 3, dmg: { b: 1, atk: .8 }, d: 'A shot in a straight line (5 tiles) that hits every enemy on it.', tip: 'Line up the wave and the hero behind it.' },
      w: { n: 'Snare Trap', type: 'enemy', range: 4, cd: 4, dmg: { b: 1 }, root: 1, d: 'Throw a snare at an enemy up to 4 away: small damage and root (no moving) for 1 turn.', tip: 'Root, then shoot. They can\'t step out of range.' },
      e: { n: 'Rocket Jump', type: 'dash', range: 3, quick: 1, cd: 4, d: 'Free action: jump to a free tile up to 3 away.', tip: 'Your only escape. Keep it for divers.' },
      r: { n: 'Headshot', type: 'enemy', range: 7, cd: 6, dmg: { b: 6, atk: 1.5 }, d: 'Aimed shot at an enemy up to 7 tiles away: heavy physical damage.', tip: 'Cross-map finisher. Needs a clear line.' } } },
  tidesinger: { n: 'Tidesinger', i: '🌊', role: 'Support', hp: 32, atk: 2, rng: 2, mov: 3, arm: 0, res: 1, pwr: 4, g: { hp: 3, atk: .3, pwr: 1 },
    about: 'Protective support. Bubbles divers, cleanses and speeds up allies, and turns teamfights with a wave.',
    build: ['tome','boots','ruby','veil','treads','staff','guardian','mantle'],
    ab: {
      q: { n: 'Bubble', type: 'enemy', range: 3, cd: 4, dmg: { b: 1, pwr: .3 }, mag: 1, stun: 1, d: 'Trap an enemy up to 3 away in a bubble: small magic damage and a 1-turn stun.', tip: 'Bubble the assassin the moment they jump in.' },
      w: { n: 'Riptide', type: 'ally', range: 3, cd: 3, heal: { b: 3, pwr: .7 }, special: 'cleanse', d: 'Heal an allied hero (or yourself) up to 3 away and remove stun, root, slow, silence and burn.', tip: 'Free your carry from a stun.' },
      e: { n: 'Current', type: 'ally', range: 4, cd: 3, shield: { b: 2, pwr: .5 }, special: 'haste', d: 'An allied hero (or you) up to 4 away gains a small shield and +2 MOV this turn and next.', tip: 'Speed the tank in, or the carry out.' },
      r: { n: 'Tidal Wave', type: 'self', radius: 2, cd: 7, dmg: { b: 3, pwr: .8 }, mag: 1, heal: { b: 4, pwr: .8 }, special: 'wave', slow: 1, d: 'A wave around you (2 tiles): magic damage and slow to enemies, heals every allied hero inside.', tip: 'Stand in the middle of the fight first.' } } },
  bramblehorn: { n: 'Bramblehorn', i: '🦏', role: 'Initiator', hp: 40, atk: 4, rng: 1, mov: 3, arm: 2, res: 0, pwr: 2, g: { hp: 5, atk: .5, pwr: .6 },
    about: 'Armored charger. Tosses one enemy, shields the team, then drags a whole group together.',
    build: ['ruby','boots','cloth','blink','treads','plate','spiked','guardian'],
    ab: {
      q: { n: 'Horn Toss', type: 'enemy', range: 1, cd: 3, dmg: { b: 2, atk: .5 }, stun: 1, knock: 1, d: 'Toss an adjacent enemy 1 tile back and stun it for 1 turn.', tip: 'Toss them toward your team or your tower.' },
      w: { n: 'Thick Hide', type: 'self', cd: 3, shield: { b: 5, pwr: 1 }, d: 'Gain a shield until the end of your next turn.', tip: 'Shield, then walk under their tower.' },
      e: { n: 'War Bellow', type: 'self', radius: 2, quick: 1, cd: 4, special: 'roar', d: 'Free action: every allied hero within 2 tiles (you included) gains a 3 HP shield.', tip: 'Shout right before the fight starts.' },
      r: { n: 'Earthshaker', type: 'tile', range: 3, radius: 1, cd: 6, dmg: { b: 3, pwr: .8 }, mag: 1, stun: 1, special: 'vortex', d: 'Slam a 3×3 area up to 3 tiles away: pull every enemy inside to the centre, deal magic damage and stun 1 turn.', tip: 'Pull them together for your mage\'s ultimate.' } } },
};
const HERO_KEYS = Object.keys(HEROES);
const ROLES = ['Tank', 'Fighter', 'Assassin', 'Mage', 'Marksman', 'Support', 'Initiator'];
const XPL = [0, 3, 7, 12, 18, 25];
const AB_KEYS = ['q', 'w', 'e', 'r'];

/* ---------- basic helpers ---------- */
const fresh = () => ({ stun: 0, slow: 0, root: 0, silence: 0, burn: null });
function heroes(G, team) { return G.units.filter(u => u.kind === 'hero' && (team == null || u.team === team)); }
function byId(G, id) { return G.units.find(u => u.id === id); }
function alive(u) { return u && u.hp > 0 && !u.dead; }
function unitAt(G, x, y) { for (const u of G.units) if (u.x === x && u.y === y && alive(u)) return u; return null; }
function freeAt(G, x, y, ignore) {
  if (!inB(x, y) || isWall(x, y)) return false;
  const o = unitAt(G, x, y); return !o || o === ignore;
}
function itemSum(u, k) { let v = 0; if (!u.items) return 0; for (const id of u.items) { const I = ITEMS[id]; if (I && I.s && I.s[k]) v += I.s[k]; } return v; }
function hasBuff(u, tag) { return u.buffs && u.buffs.some(b => b.tag === tag); }
const isVeiled = u => u.kind === 'hero' && hasBuff(u, 'veil');
function stat(G, u, k) {
  if (u.kind !== 'hero') return u[k] || 0;
  const d = HEROES[u.hero];
  let v = d[k] || 0;
  if (d.g[k]) v += d.g[k] * (u.lvl - 1);
  v += itemSum(u, k);
  if (k === 'atk' || k === 'pwr') v += teamBonus(G, u.team);
  for (const b of u.buffs) if (b.s && b.s[k]) v += b.s[k];
  if (k === 'mov') { if (u.st.slow > 0) v -= 1; if (u.st.root > 0) v = 0; }
  return Math.max(0, Math.floor(v));
}
function recalcHp(G, u) {
  const m = stat(G, u, 'hp');
  if (m > u.mhp) u.hp += m - u.mhp;
  u.mhp = m; if (u.hp > m) u.hp = m;
}
function unitName(u) {
  if (!u) return '?';
  if (u.kind === 'hero') return HEROES[u.hero].n;
  if (u.kind === 'minion') return TEAMS[u.team].name + (u.mtype === 'melee' ? ' minion' : ' caster');
  if (u.kind === 'tower') return TEAMS[u.team].name + ' ' + (MAP.laneNames[u.lane] || '') + ' tower';
  if (u.kind === 'core') return TEAMS[u.team].name + ' Core';
  if (u.kind === 'neutral') return NEUTRALS[u.ntype].n;
  return '?';
}
function log(G, text, team) { G.log.push({ r: G.round, t: text, team: team == null ? -1 : team }); if (G.log.length > 70) G.log.shift(); }
function fx(G, o) { if (G.fx.length < 120) G.fx.push(o); }
function invuln(G, t) {
  if (t.kind === 'tower') return t.tier > 1 && G.units.some(o => o.kind === 'tower' && o.team === t.team && o.lane === t.lane && o.tier < t.tier && alive(o));
  if (t.kind !== 'core') return false;
  return MAP.lanes.every((_, l) => G.units.some(o => o.kind === 'tower' && o.team === t.team && o.lane === l && alive(o)));
}
function teamBonus(G, team) {
  let v = (G.tbuff && G.tbuff[team]) || 0;
  if (G.altars) v += G.altars.filter(a => a.owner === team).length;
  if (G.crown && G.crown[team] > 0) v += 2;
  return v;
}
/* Standing in your own base fully heals and clears burns, no potions needed. */
function fountain(G, u) {
  if (u.kind !== 'hero' || u.dead || !inBase(u)) return;
  if (u.st.burn) u.st.burn = null;
  if (u.hp < u.mhp) heal(G, u, u.mhp - u.hp);
}
function pickRelic(G, u) {
  if (!G.relics || u.kind !== 'hero') return;
  const r = G.relics.find(r => r.x === u.x && r.y === u.y && r.timer <= 0);
  if (!r) return;
  r.timer = 4; heal(G, u, 8 + Math.round(u.mhp * 0.1));
  log(G, `${HEROES[u.hero].n} grabbed a health relic`, u.team);
}
function targetable(G, src, t) {
  return alive(t) && t.team !== src.team && !isVeiled(t) && !invuln(G, t);
}
function inBase(u) { return zoneOf(u.x, u.y) === u.team; }
function fountainSpot(G, team, ignore) {
  const f = MAP.fount[team];
  let best = null, bd = 99;
  for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) {
    if (zoneOf(x, y) !== team || !freeAt(G, x, y, ignore)) continue;
    const d = dist(f, { x, y }); if (d < bd) { bd = d; best = { x, y }; }
  }
  return best || { x: f.x, y: f.y };
}
function occGrid(G) { const o = {}; for (const u of G.units) if (alive(u)) o[K(u.x, u.y)] = u; return o; }

/* reachable tiles for unit u from (sx,sy) within maxSteps. Allies passable (not structures), can't end on occupied. */
function reach(G, u, maxSteps, sx, sy) {
  sx = sx == null ? u.x : sx; sy = sy == null ? u.y : sy;
  const occ = occGrid(G); const seen = new Map(); seen.set(K(sx, sy), 0);
  const q = [[sx, sy, 0]]; const out = new Map(); out.set(K(sx, sy), 0);
  while (q.length) {
    const [x, y, d] = q.shift(); if (d >= maxSteps) continue;
    for (const [dx, dy] of D8) {
      const nx = x + dx, ny = y + dy, k = K(nx, ny);
      if (!inB(nx, ny) || isWall(nx, ny) || seen.has(k)) continue;
      const o = occ[k];
      if (o && o !== u && !(o.team === u.team && (o.kind === 'hero' || o.kind === 'minion'))) continue;
      seen.set(k, d + 1); q.push([nx, ny, d + 1]);
      if (!o || o === u) out.set(k, d + 1);
    }
  }
  return out;
}
function adjFree(G, t, from, ignore) {
  let best = null, bd = 99;
  for (const [dx, dy] of D8) {
    const x = t.x + dx, y = t.y + dy;
    if (!freeAt(G, x, y, ignore)) continue;
    const d = dist({ x, y }, from); if (d < bd) { bd = d; best = { x, y }; }
  }
  return best;
}

/* ---------- damage, healing, death ---------- */
function heal(G, t, amt) {
  if (!alive(t)) return 0;
  const h = Math.min(amt, t.mhp - t.hp); t.hp += h;
  if (h > 0) fx(G, { k: 'heal', x: t.x, y: t.y, v: h });
  return h;
}
function gainXp(G, u, n) {
  if (u.kind !== 'hero' || u.lvl >= 6) return;
  u.xp += n;
  while (u.lvl < 6 && u.xp >= XPL[u.lvl]) {
    u.lvl++; recalcHp(G, u);
    fx(G, { k: 'lvl', x: u.x, y: u.y });
    log(G, `${HEROES[u.hero].n} reached level ${u.lvl}${u.lvl === 3 ? ' and unlocked the ultimate' : ''}`, u.team);
  }
}
function dealDamage(G, src, t, amt, mag, o) {
  o = o || {};
  if (!alive(t) || invuln(G, t)) return 0;
  let d;
  if (o.true) d = Math.round(amt);
  else {
    const def = t.kind === 'hero' ? stat(G, t, mag ? 'res' : 'arm') : (mag ? (t.res || 0) : (t.arm || 0));
    d = Math.max(1, Math.round(amt - def));
  }
  if (t.shield > 0) { const a = Math.min(t.shield, d); t.shield -= a; d -= a; if (a) fx(G, { k: 'shield', x: t.x, y: t.y, v: a }); }
  t.hp -= d;
  if (t.kind === 'hero') { t.recall = false; if (src && src.kind === 'hero') t.dmgBy[src.id] = G.round; }
  if (src && src.kind === 'hero' && t.kind === 'hero') src.aggro = G.round;
  if (t.kind === 'neutral' && src && src.kind === 'hero') t.aggro = src.id;
  if (d > 0) fx(G, { k: 'hit', x: t.x, y: t.y, v: d, c: o.crit ? 1 : 0 });
  if (o.basic && src && src.kind === 'hero') {
    const ls = itemSum(src, 'ls'); if (ls && d > 0) heal(G, src, Math.max(1, Math.round(d * ls)));
  }
  if (o.basic && t.kind === 'hero' && src && src.kind === 'hero' && !o.noThorns) {
    const th = itemSum(t, 'thorns'); if (th && alive(src)) dealDamage(G, t, src, th, true, { true: 1, noThorns: 1 });
  }
  if (t.hp <= 0) killUnit(G, t, src);
  return d;
}
function killUnit(G, t, src) {
  const sh = src && src.kind === 'hero';
  if (t.kind === 'hero') {
    if (t.aegis) { t.aegis = false; t.hp = Math.ceil(t.mhp / 2); fx(G, { k: 'lvl', x: t.x, y: t.y }); log(G, `${HEROES[t.hero].n}'s Aegis shattered and revived them`, t.team); return; }
    const gi = t.items.indexOf('guardian');
    if (gi >= 0) { t.items.splice(gi, 1); recalcHp(G, t); t.hp = Math.ceil(t.mhp / 2); fx(G, { k: 'lvl', x: t.x, y: t.y }); log(G, `${HEROES[t.hero].n}'s Guardian Angel revived them`, t.team); return; }
    t.dead = true; t.hp = 0; t.respawn = 1 + Math.ceil(t.lvl / 2) + Math.floor(G.round / 15); t.deaths++;
    t.buffs = []; t.st = fresh(); t.shield = 0; t.recall = false; t.done = true; t.mv = 0;
    fx(G, { k: 'die', x: t.x, y: t.y });
    const foe = 1 - t.team; G.kills[foe]++;
    const ass = heroes(G, foe).filter(h => h !== src && t.dmgBy[h.id] != null && t.dmgBy[h.id] >= G.round - 1);
    if (sh) {
      const g = 100 + 20 * t.lvl; src.gold += g; src.kills++; gainXp(G, src, 3 + t.lvl);
      fx(G, { k: 'gold', x: src.x, y: src.y, v: g });
      log(G, `${HEROES[src.hero].n} slew ${HEROES[t.hero].n} (+${g} gold)`, foe);
    } else log(G, `${HEROES[t.hero].n} was slain by ${src ? unitName(src) : 'burn damage'}`, foe);
    for (const h of ass) { h.gold += 50; h.assists++; gainXp(G, h, 2); }
    t.dmgBy = {};
  } else if (t.kind === 'minion') {
    if (sh) { const g = t.mtype === 'melee' ? 20 : 28; src.gold += g; fx(G, { k: 'gold', x: t.x, y: t.y, v: g }); }
    for (const h of heroes(G, 1 - t.team)) if (alive(h) && dist(h, t) <= 3) gainXp(G, h, 1);
  } else if (t.kind === 'tower') {
    G.tlost[t.team]++;
    for (const h of heroes(G, 1 - t.team)) { h.gold += 80; gainXp(G, h, 2); }
    fx(G, { k: 'die', x: t.x, y: t.y });
    log(G, `${unitName(t)} fell. ${TEAMS[1 - t.team].name} heroes +80 gold. The ${TEAMS[t.team].name} Core is now vulnerable`, 1 - t.team);
  } else if (t.kind === 'core') {
    G.winner = 1 - t.team; G.phase = 'over';
    fx(G, { k: 'die', x: t.x, y: t.y });
    log(G, `The ${TEAMS[t.team].name} Core shattered. ${TEAMS[1 - t.team].name} wins!`, 1 - t.team);
  } else if (t.kind === 'neutral') {
    const c = G.camps.find(c => c.id === t.campId); if (c) c.timer = NEUTRALS[t.ntype].respawn;
    if (sh) {
      const team = src.team;
      if (t.ntype === 'camp') { src.gold += 45; gainXp(G, src, 2); fx(G, { k: 'gold', x: t.x, y: t.y, v: 45 }); }
      else if (t.ntype === 'drake') {
        G.tbuff[team]++;
        for (const h of heroes(G, team)) h.gold += 60;
        gainXp(G, src, 3);
        log(G, `${TEAMS[team].name} slew the Ancient Drake: +1 ATK and PWR for the whole team, +60 gold each`, team);
      } else if (t.ntype === 'queen') {
        G.crown[team] = 8; for (const h of heroes(G, team)) h.gold += 80; gainXp(G, src, 4);
        log(G, `${TEAMS[team].name} slew the Spider Queen: +2 ATK and PWR for 8 rounds, +80 gold each`, team);
      } else if (t.ntype === 'golem') {
        src.aegis = true; for (const h of heroes(G, team)) h.gold += 100; gainXp(G, src, 4);
        log(G, `${HEROES[src.hero].n} toppled the Stone Golem and claimed the Aegis (one free revive). +100 gold each`, team);
      }
    }
  }
}

/* ---------- abilities ---------- */
function dmgVal(G, u, f) { if (!f) return 0; return Math.max(0, Math.round((f.b || 0) + (f.atk || 0) * stat(G, u, 'atk') + (f.pwr || 0) * stat(G, u, 'pwr'))); }
function abUnlocked(u, k) { return k !== 'r' || u.lvl >= 3; }
function abReadyErr(G, u, k) {
  const A = HEROES[u.hero].ab[k];
  if (!A) return 'No such ability';
  if (!abUnlocked(u, k)) return 'Ultimate unlocks at level 3';
  if (u.cd[k] > 0) return `${A.n} is on cooldown (${u.cd[k]})`;
  if (u.st.silence > 0) return 'Silenced';
  if (u.st.stun > 0) return 'Stunned';
  if (!A.quick && u.acted) return 'You already used your action this turn';
  return null;
}
function abHits(G, u, k, tx, ty, from) {
  const A = HEROES[u.hero].ab[k], P = from || u;
  const R = { hits: [], heals: [], shields: [], dest: null, area: null, line: null, target: null };
  const base = dmgVal(G, u, A.dmg);
  const mk = (t, extra) => Object.assign({ u: t, dmg: base, mag: !!A.mag, stun: A.stun || 0, slow: A.slow || 0, root: A.root || 0, silence: A.silence || 0,
    burn: A.burn ? { d: dmgVal(G, u, A.burn), t: A.burn.t } : null, pull: !!A.pull, execute: A.special === 'execute' }, extra || {});
  const T = { x: tx, y: ty };
  switch (A.type) {
    case 'enemy': {
      const t = unitAt(G, tx, ty);
      if (!targetable(G, u, t) || dist(P, t) > A.range || !losOk(u, P, t)) return null;
      if (A.special === 'gorge') {
        if (!(t.kind === 'minion' || (t.kind === 'neutral' && t.ntype === 'camp'))) return null;
        if (t.hp > 12 + 2 * stat(G, u, 'pwr')) return null;
        R.hits.push({ u: t, dmg: t.hp, true: 1 }); R.heals.push({ u, amt: 6 });
      } else if (A.special === 'missing') R.hits.push(mk(t, { dmg: base + Math.floor(0.4 * (t.mhp - t.hp)) }));
      else R.hits.push(mk(t));
      if (A.special === 'chain') {
        let last = t; const hit = [t];
        for (let j = 0; j < 2; j++) {
          const nx = G.units.filter(o => !hit.includes(o) && targetable(G, u, o) && dist(o, last) <= 2).sort((a, b) => dist(a, last) - dist(b, last))[0];
          if (!nx) break; hit.push(nx); R.hits.push(mk(nx, { dmg: Math.max(1, Math.round(base * 0.7)) })); last = nx;
        }
      }
      R.target = t; break;
    }
    case 'ally': {
      const t = unitAt(G, tx, ty);
      if (!t || t.team !== u.team || t.kind !== 'hero' || dist(P, t) > A.range) return null;
      R.target = t; break;
    }
    case 'line': {
      const dx = tx - P.x, dy = ty - P.y;
      if (!dx && !dy) return null;
      if (dx && dy && Math.abs(dx) !== Math.abs(dy)) return null;
      if (dist(P, T) > A.range) return null;
      const sx = Math.sign(dx), sy = Math.sign(dy); let x = P.x, y = P.y; R.line = [];
      for (let i = 0; i < A.range; i++) {
        x += sx; y += sy;
        if (!inB(x, y) || isWall(x, y)) break;
        R.line.push({ x, y });
        const t = unitAt(G, x, y);
        if (t && t !== u && targetable(G, u, t)) { R.hits.push(mk(t)); if (!A.pierce) break; }
        else if (t && t !== u && !A.pierce && t.team !== u.team) break; // blocked by untargetable enemy
      }
      break;
    }
    case 'tile': {
      if (!inB(tx, ty) || isWall(tx, ty) || dist(P, T) > A.range || !losOk(u, P, T)) return null;
      R.area = { x: tx, y: ty, r: A.radius };
      for (const t of G.units) if (targetable(G, u, t) && dist(t, T) <= A.radius) R.hits.push(mk(t));
      break;
    }
    case 'self': {
      if (A.radius != null) {
        R.area = { x: P.x, y: P.y, r: A.radius };
        const ts = G.units.filter(t => targetable(G, u, t) && dist(t, P) <= A.radius);
        if (A.special === 'echo') { const n = ts.length; ts.forEach(t => R.hits.push(mk(t, { dmg: base + 2 * Math.max(0, n - 1) }))); }
        else if (A.special === 'omni') {
          const hs = ts.filter(t => t.kind === 'hero');
          if (ts.length) for (let i = 0; i < 4; i++) { const pool = hs.length ? hs : ts; R.hits.push(mk(pool[Math.floor(Math.random() * pool.length)])); }
        } else if (A.dmg || A.slow || A.stun) ts.forEach(t => R.hits.push(mk(t)));
        if (A.special === 'wave' || A.special === 'roar') for (const h of heroes(G, u.team)) if (alive(h) && dist(h, P) <= A.radius) {
          if (A.special === 'wave') R.heals.push({ u: h, amt: dmgVal(G, u, A.heal) });
          else R.shields.push({ u: h, amt: 3 });
        }
      }
      break;
    }
    case 'dashEnemy': {
      const t = unitAt(G, tx, ty);
      if (!targetable(G, u, t) || dist(P, t) > A.range) return null;
      const spot = adjFree(G, t, P, u); if (!spot) return null;
      R.dest = spot; R.hits.push(mk(t)); R.target = t; break;
    }
    case 'dash': {
      if (dist(P, T) > A.range || dist(P, T) === 0 || !freeAt(G, tx, ty, u)) return null;
      R.dest = { x: tx, y: ty };
      if (A.dmg) { R.area = { x: tx, y: ty, r: A.radius || 1 }; for (const t of G.units) if (targetable(G, u, t) && dist(t, T) <= (A.radius || 1)) R.hits.push(mk(t)); }
      break;
    }
    case 'global': break;
  }
  if (A.knock) for (const h of R.hits) { const sx = Math.sign(h.u.x - P.x), sy = Math.sign(h.u.y - P.y); h.knock = { dx: sx, dy: sy, n: A.knock }; }
  if (A.special === 'vortex') for (const h of R.hits) h.vortex = { x: tx, y: ty };
  if (A.special === 'cleanse' && R.target) R.cleanse = R.target;
  if (A.special === 'haste' && R.target) R.haste = R.target;
  if (A.heal && A.special !== 'wave') {
    const amt = dmgVal(G, u, A.heal);
    if (A.type === 'ally') R.heals.push({ u: R.target, amt });
    else if (A.type === 'global') for (const h of heroes(G, u.team)) { if (alive(h)) R.heals.push({ u: h, amt }); }
    else R.heals.push({ u, amt });
  }
  if (A.shield) R.shields.push({ u: A.type === 'ally' ? R.target : u, amt: dmgVal(G, u, A.shield) });
  return R;
}
function abTargetTiles(G, u, k, from) {
  const A = HEROES[u.hero].ab[k], P = from || u; const out = [];
  const add = (x, y) => out.push({ x, y });
  if (A.type === 'self' || A.type === 'global') { add(P.x, P.y); return out; }
  if (A.type === 'line') {
    for (const [dx, dy] of D8) { let x = P.x, y = P.y; for (let i = 0; i < A.range; i++) { x += dx; y += dy; if (!inB(x, y) || isWall(x, y)) break; add(x, y); } }
    return out;
  }
  if (A.type === 'tile') { for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) if (dist(P, { x, y }) <= A.range && !isWall(x, y) && losOk(u, P, { x, y })) add(x, y); return out; }
  if (A.type === 'dash') { for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) if (dist(P, { x, y }) <= A.range && dist(P, { x, y }) > 0 && freeAt(G, x, y, u)) add(x, y); return out; }
  for (const t of G.units) {
    if (!alive(t)) continue;
    if (abHits(G, u, k, t.x, t.y, P)) add(t.x, t.y);
  }
  return out;
}
function applyAbility(G, u, k, tx, ty) {
  const err = abReadyErr(G, u, k); if (err) return err;
  const A = HEROES[u.hero].ab[k];
  if (A.type === 'self' || A.type === 'global') { tx = u.x; ty = u.y; }
  const R = abHits(G, u, k, tx, ty);
  if (!R) return 'Not a valid target for ' + A.n;
  if ((A.type === 'tile' || A.type === 'line' || A.type === 'self') && A.dmg && !R.hits.length && A.special !== 'rot' && A.type !== 'self') {
    // allowed: casting into empty space just wastes it, but block to avoid misclicks
    return 'No enemy would be hit';
  }
  const from = { x: u.x, y: u.y };
  if (R.dest) { u.x = R.dest.x; u.y = R.dest.y; u.recall = false; fx(G, { k: 'move', x: from.x, y: from.y, x2: u.x, y2: u.y, team: u.team }); pickRelic(G, u); }
  if (A.dmg || A.burn || A.special === 'gorge') u.buffs = u.buffs.filter(b => b.tag !== 'veil');
  if (R.area) fx(G, { k: 'area', x: R.area.x, y: R.area.y, r: R.area.r, team: u.team });
  if (R.line && R.line.length) { const e = R.hits.length && !A.pierce ? R.hits[0].u : R.line[R.line.length - 1]; fx(G, { k: 'beam', x: u.x, y: u.y, x2: e.x, y2: e.y, team: u.team }); }
  let total = 0; const names = [];
  for (const h of R.hits) {
    const t = h.u; if (!alive(t)) continue;
    if (A.type === 'enemy' || A.type === 'dashEnemy') fx(G, { k: 'beam', x: u.x, y: u.y, x2: t.x, y2: t.y, team: u.team });
    const d = h.dmg > 0 ? dealDamage(G, u, t, h.dmg, h.mag, { true: h.true }) : 0;
    total += d; if (t.kind === 'hero' && !names.includes(HEROES[t.hero].n)) names.push(HEROES[t.hero].n);
    if (!alive(t)) continue;
    if (h.execute && t.kind === 'hero' && t.hp <= EXECUTE * t.mhp) { t.hp = 0; killUnit(G, t, u); continue; }
    const cc = t.kind !== 'tower' && t.kind !== 'core';
    if (cc) {
      if (h.stun) t.st.stun = Math.max(t.st.stun, h.stun);
      if (h.slow) t.st.slow = Math.max(t.st.slow, h.slow);
      if (h.root) t.st.root = Math.max(t.st.root, h.root);
      if (h.silence) t.st.silence = Math.max(t.st.silence, h.silence);
      if (h.burn) t.st.burn = { d: h.burn.d, t: h.burn.t, src: u.id };
      if (t.kind === 'hero' && (h.stun || h.root)) t.recall = false;
    }
    if (h.knock && cc && t.kind !== 'neutral' && (h.knock.dx || h.knock.dy)) {
      const ox = t.x, oy = t.y;
      for (let j = 0; j < h.knock.n; j++) { const nx = t.x + h.knock.dx, ny = t.y + h.knock.dy; if (!freeAt(G, nx, ny, t)) break; t.x = nx; t.y = ny; }
      if (t.x !== ox || t.y !== oy) fx(G, { k: 'move', x: ox, y: oy, x2: t.x, y2: t.y, team: t.team });
    }
    if (h.vortex && cc && t.kind !== 'neutral' && dist(t, h.vortex) > 0) {
      const spot = freeAt(G, h.vortex.x, h.vortex.y, t) ? h.vortex : (dist(t, h.vortex) > 1 ? adjFree(G, h.vortex, t, t) : null);
      if (spot) { fx(G, { k: 'move', x: t.x, y: t.y, x2: spot.x, y2: spot.y, team: t.team }); t.x = spot.x; t.y = spot.y; }
    }
    if (h.pull && cc && t.kind !== 'neutral') {
      const spot = adjFree(G, u, t, t);
      if (spot && dist(spot, u) <= 1) { fx(G, { k: 'move', x: t.x, y: t.y, x2: spot.x, y2: spot.y, team: t.team }); t.x = spot.x; t.y = spot.y; }
    }
  }
  if (A.special === 'drain' && total > 0) heal(G, u, Math.round(total / 2));
  const killed = R.hits.some(h => h.u.kind === 'hero' ? h.u.dead : h.u.hp <= 0);
  let reset = false;
  if (HEROES[u.hero].reset && k !== 'r' && !A.quick && killed) reset = true;
  if (A.special === 'rot') { u.hp = Math.max(1, u.hp - 1); }
  if (A.special === 'cleave') { const n = R.hits.filter(h => h.u.kind === 'hero').length; if (n) heal(G, u, 3 * n); }
  if (R.cleanse && alive(R.cleanse)) R.cleanse.st = fresh();
  if (R.haste && alive(R.haste)) {
    const t = R.haste; t.buffs = t.buffs.filter(b => b.tag !== 'haste'); t.buffs.push({ k, tag: 'haste', s: { mov: 2 }, dur: 2 });
    if (t.team === G.turnTeam && !t.done) t.mv += 2;
  }
  for (const he of R.heals) heal(G, he.u, he.amt);
  for (const s of R.shields) { if (!alive(s.u)) continue; s.u.shield = Math.min(25, (s.u.shield || 0) + s.amt); s.u.shieldT = 2; fx(G, { k: 'shield', x: s.u.x, y: s.u.y, v: s.amt }); }
  if (A.buff) { u.buffs = u.buffs.filter(b => !(A.buff.tag && b.tag === A.buff.tag)); u.buffs.push({ k, tag: A.buff.tag || null, s: A.buff.s || null, dur: A.buff.dur }); }
  if (A.mvNow) u.mv += A.mvNow;
  u.cd[k] = A.cd;
  if (!A.quick && !reset) u.acted = true;
  let msg = `${HEROES[u.hero].n} used ${A.n}`;
  if (names.length) msg += ' on ' + names.join(', ');
  if (total) msg += ` for ${total}`;
  if (reset) msg += '. The kill reset the action';
  log(G, msg, u.team);
  return null;
}
function canBasic(G, u, t, from) {
  const P = from || u;
  return targetable(G, u, t) && dist(P, t) <= stat(G, u, 'rng') && losOk(u, P, t);
}
/* Line of sight: only terrain walls block (units do not). Sampled along the centre-to-centre line. */
const EXECUTE = 0.2;
function hasLOS(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, n = Math.max(Math.abs(dx), Math.abs(dy)) * 8;
  for (let i = 1; i < n; i++) {
    const x = Math.round(a.x + dx * i / n), y = Math.round(a.y + dy * i / n);
    if ((x !== a.x || y !== a.y) && (x !== b.x || y !== b.y) && isWall(x, y)) return false;
  }
  return true;
}
function losOk(u, P, T) { return !(u.kind === 'hero' && HEROES[u.hero].los) || hasLOS(P, T); }
function basicDamage(G, u) {
  let d = stat(G, u, 'atk');
  if (hasBuff(u, 'totem')) d *= 2;
  if (hasBuff(u, 'tumble')) d += 2;
  return d;
}
function freeAttackReady(u) { return u.kind === 'hero' && !!HEROES[u.hero].freeAttack && !u.freeUsed; }
function attackReady(u) { return u.st.stun <= 0 && (!u.acted || freeAttackReady(u)); }
function basicAttack(G, u, t) {
  if (!attackReady(u)) return u.st.stun > 0 ? 'Stunned' : 'You already used your action this turn';
  if (u.st.stun > 0) return 'Stunned';
  if (!canBasic(G, u, t)) return 'Target out of range';
  let d = basicDamage(G, u), crit = false;
  const cr = itemSum(u, 'crit'); if (cr && Math.random() < cr) { d *= 2; crit = true; }
  u.buffs = u.buffs.filter(b => b.tag !== 'totem' && b.tag !== 'tumble' && b.tag !== 'veil');
  if (freeAttackReady(u)) u.freeUsed = true; else u.acted = true;
  fx(G, { k: 'beam', x: u.x, y: u.y, x2: t.x, y2: t.y, team: u.team, thin: 1 });
  dealDamage(G, u, t, d, false, { basic: 1, crit });
  if (alive(t) && t.kind !== 'tower' && t.kind !== 'core' && (hasBuff(u, 'frost') || u.items.some(i => ITEMS[i].slowHit))) t.st.slow = Math.max(t.st.slow, 1);
  return null;
}

/* ---------- items ---------- */
function shopErr(G, u, id) {
  const I = ITEMS[id]; if (!I) return 'Unknown item';
  if (G.phase !== 'play') return 'The game is not running';
  if (!(u.dead || inBase(u))) return 'Return to your base (or be dead) to shop';
  const price = itemPrice(u, id);
  if (u.gold < price) return 'Not enough gold';
  const replacing = I.up && u.items.includes(I.up);
  if (u.items.length >= 6 && !replacing) return 'Inventory full (6 slots). Sell something first';
  if (I.uniq && u.items.includes(id)) return 'You already own one';
  if (I.grp && u.items.some(x => ITEMS[x].grp === I.grp && x !== I.up)) return 'You already have boots';
  if (id === 'potion' && u.items.filter(x => x === 'potion').length >= 3) return 'You can carry 3 potions';
  return null;
}
function itemPrice(u, id) { const I = ITEMS[id]; if (I.up && u.items.includes(I.up)) return I.c - ITEMS[I.up].c; return I.c; }
function buyItem(G, u, id) {
  const e = shopErr(G, u, id); if (e) return e;
  const I = ITEMS[id]; const p = itemPrice(u, id);
  if (I.up && u.items.includes(I.up)) u.items.splice(u.items.indexOf(I.up), 1, id); else u.items.push(id);
  u.gold -= p; recalcHp(G, u);
  return null;
}
function sellItem(G, u, i) {
  if (!(u.dead || inBase(u))) return 'Return to your base to sell';
  const id = u.items[i]; if (!id) return 'Empty slot';
  u.items.splice(i, 1); u.gold += Math.floor(ITEMS[id].c / 2); recalcHp(G, u); return null;
}
function useItem(G, u, i, tx, ty) {
  const id = u.items[i]; const I = id && ITEMS[id];
  if (!I || !I.use) return 'That item has no active';
  if ((u.icd[id] || 0) > 0) return `${I.n} is on cooldown (${u.icd[id]})`;
  if (I.use === 'potion') {
    if (u.hp >= u.mhp) return 'Already at full HP';
    u.items.splice(i, 1); heal(G, u, 8); log(G, `${HEROES[u.hero].n} drank a potion`, u.team); return null;
  }
  if (I.use === 'cleanse') {
    const wasStun = u.st.stun > 0 && u.stunTurn;
    u.st = fresh(); u.icd[id] = I.cd;
    if (wasStun) { u.acted = false; u.mv = stat(G, u, 'mov'); u.stunTurn = false; u.done = false; }
    fx(G, { k: 'area', x: u.x, y: u.y, r: 0, team: u.team });
    log(G, `${HEROES[u.hero].n} purified all disables`, u.team); return null;
  }
  if (I.use === 'blink') {
    if (u.st.stun > 0 || u.st.root > 0) return 'Cannot blink while stunned or rooted';
    if (tx == null || dist(u, { x: tx, y: ty }) > 4 || dist(u, { x: tx, y: ty }) === 0 || !freeAt(G, tx, ty, u)) return 'Pick a free tile up to 4 away';
    fx(G, { k: 'move', x: u.x, y: u.y, x2: tx, y2: ty, team: u.team, blink: 1 });
    u.x = tx; u.y = ty; u.recall = false; u.icd[id] = I.cd; log(G, `${HEROES[u.hero].n} blinked`, u.team); pickRelic(G, u); return null;
  }
  return 'Unknown';
}

/* ---------- setup ---------- */
function newLobby(mode) {
  return {
    v: 3, phase: 'lobby', mode, cfg: { size: 1, map: 'rift', pick: 'draft' },
    slots: [
      { team: 0, hero: 'blademaster', ctrl: 'human', peer: null, diff: 1 },
      { team: 1, hero: 'pyra', ctrl: 'ai', peer: null, diff: 1 }],
    players: [], host: null, log: [], fx: [], fxId: 0,
  };
}
function setTeamSize(G, n) {
  n = Math.max(1, Math.min(4, n)); G.cfg.size = n;
  const picks = ['blademaster','pyra','bulwark','frostbow','lumen','shade','butcher','quake'];
  for (const team of [0, 1]) {
    let mine = G.slots.filter(s => s.team === team);
    while (mine.length < n) {
      const used = G.slots.map(s => s.hero);
      const hero = picks.find(h => !used.includes(h));
      G.slots.push({ team, hero, ctrl: 'ai', peer: null, diff: 1 }); mine = G.slots.filter(s => s.team === team);
    }
    while (mine.length > n) { const s = mine.pop(); G.slots.splice(G.slots.indexOf(s), 1); }
  }
  G.slots.sort((a, b) => a.team - b.team);
}
/* ---------- hero draft ----------
   Snake order: Azure picks 1, then each team picks 2 in turn, and the last pick is single.
   4v4: A BB AA BB A · 3v3: A BB AA B · 2v2: A BB A · 1v1: A B */
function draftOrder(n) {
  const out = [0], left = [n - 1, n]; let t = 1;
  while (left[0] + left[1] > 0) {
    for (let j = 0; j < 2 && left[t] > 0; j++) { out.push(t); left[t]--; }
    t = 1 - t;
  }
  return out;
}
function startDraft(G) {
  G.phase = 'draft';
  G.draft = { order: draftOrder(G.cfg.size), i: 0 };
  G.slots.forEach(s => { s.hero = null; });
  G.log = []; log(G, 'Draft started. Azure has first pick.');
}
function draftSlot(G) {
  if (!G.draft || G.draft.i >= G.draft.order.length) return -1;
  const team = G.draft.order[G.draft.i];
  return G.slots.findIndex(s => s.team === team && !s.hero);
}
function draftPick(G, slotIdx, hero) {
  if (G.phase !== 'draft') return 'The draft is over';
  if (slotIdx !== draftSlot(G)) return 'It is not this seat\'s pick';
  if (!HEROES[hero]) return 'Unknown hero';
  if (G.slots.some(s => s.hero === hero)) return `${HEROES[hero].n} is already taken`;
  const s = G.slots[slotIdx]; s.hero = hero; G.draft.i++;
  log(G, `${TEAMS[s.team].name} picked ${HEROES[hero].n} (${HEROES[hero].role})`, s.team);
  if (draftSlot(G) < 0) startGame(G);
  return null;
}
/* Bots draft for a balanced team: fill missing roles in this priority, random hero within the role. */
const ROLE_PRIORITY = ['Tank', 'Mage', 'Marksman', 'Support', 'Fighter', 'Initiator', 'Assassin'];
function botDraftHero(G, slotIdx) {
  const team = G.slots[slotIdx].team;
  const taken = G.slots.map(s => s.hero).filter(Boolean);
  const have = G.slots.filter(s => s.team === team && s.hero).map(s => HEROES[s.hero].role);
  const free = HERO_KEYS.filter(k => !taken.includes(k));
  for (const role of ROLE_PRIORITY) {
    if (have.includes(role)) continue;
    const opts = free.filter(k => HEROES[k].role === role);
    if (opts.length) return opts[Math.floor(Math.random() * opts.length)];
  }
  return free[Math.floor(Math.random() * free.length)];
}
function activeLanes(G) { return MAP.lanes.map((_, i) => i); }
function laneStart(G, lane, team) {
  const p = MAP.lanes[lane];
  if (team === 0) { for (let i = 0; i < p.length; i++) if (zoneOf(p[i].x, p[i].y) !== 0) return i; }
  else { for (let i = p.length - 1; i >= 0; i--) if (zoneOf(p[i].x, p[i].y) !== 1) return i; }
  return 0;
}
function startGame(G) {
  G.phase = 'play'; G.round = 0; G.units = []; G.nid = 1; G.log = []; G.fx = []; G.fxId = (G.fxId || 0) + 1;
  setMap(G.cfg.map);
  G.kills = [0, 0]; G.tlost = [0, 0]; G.tbuff = [0, 0]; G.crown = [0, 0]; G.winner = null; G.turnTeam = 0; G.first = 0;
  const RU = MAP.rules;
  if (G.cfg.pick === 'random') {
    const pool = [...HERO_KEYS].sort(() => Math.random() - 0.5);
    G.slots.forEach((s, i) => { s.hero = pool[i % pool.length]; });
  }
  for (const team of [0, 1]) {
    for (const p of MAP.towers[team]) G.units.push({ id: G.nid++, kind: 'tower', team, lane: p.lane, tier: p.tier, x: p.x, y: p.y, hp: p.tier > 1 ? 46 : 40, mhp: p.tier > 1 ? 46 : 40, atk: 7, rng: 2, arm: 1, res: 1, st: fresh(), buffs: [], shield: 0 });
    const c = MAP.cores[team]; G.units.push({ id: G.nid++, kind: 'core', team, x: c.x, y: c.y, hp: 60, mhp: 60, atk: 6, rng: 2, arm: 1, res: 1, st: fresh(), buffs: [], shield: 0 });
  }
  G.slots.forEach((s, idx) => {
    const sp = fountainSpot(G, s.team);
    const u = { id: G.nid++, kind: 'hero', hero: s.hero, team: s.team, slot: idx, x: sp.x, y: sp.y, lvl: RU.startLvl, xp: XPL[RU.startLvl - 1], gold: RU.startGold, items: [],
      cd: { q: 0, w: 0, e: 0, r: 0 }, icd: {}, st: fresh(), buffs: [], shield: 0, shieldT: 0, kills: 0, deaths: 0, assists: 0, dmgBy: {},
      mv: 0, acted: false, done: false, dead: false, respawn: 0, recall: false, aggro: -1, aegis: false, moved: false, mhp: 0, hp: 0, lane: 1 };
    u.mhp = stat(G, u, 'hp'); u.hp = u.mhp;
    G.units.push(u);
  });
  // lane assignment for bots
  for (const team of [0, 1]) {
    const hs = heroes(G, team); const nl = MAP.lanes.length;
    const order = nl === 1 ? [0, 0, 0, 0] : nl === 2 ? [1, 0, 1, 0] : (hs.length === 1 ? [1] : hs.length === 2 ? [1, 2] : hs.length === 3 ? [1, 2, 0] : [1, 2, 0, 2]);
    const carry = nl === 1 ? 0 : nl === 2 ? 1 : 2;  // support follows the bottom lane
    hs.forEach((h, i) => { h.lane = order[i] != null ? order[i] : 0; if (HEROES[h.hero].role === 'Support' && hs.length > 1) h.lane = carry; });
  }
  G.camps = MAP.camps.map((c, i) => ({ id: i, ntype: c.t, x: c.x, y: c.y, timer: NEUTRALS[c.t].first }));
  G.relics = MAP.relics.map(r => ({ x: r.x, y: r.y, timer: 0 }));
  G.altars = MAP.altars.map((a, i) => ({ x: a.x, y: a.y, n: i === 0 ? 'West Altar' : 'East Altar', owner: -1, lock: 3 }));
  log(G, `Battle begins on ${MAP.n}. ${MAP.towers[0].length > MAP.lanes.length ? 'Break both towers in a lane' : 'Destroy a tower'}, then the enemy Core.`);
  newRound(G);
}
function spawnWave(G) {
  const bonus = Math.floor(G.round / 10);
  for (const l of activeLanes(G)) for (const team of [0, 1]) {
    if (G.units.filter(u => u.kind === 'minion' && u.team === team && u.lane === l).length >= 6) continue;
    const p = MAP.lanes[l]; const st = laneStart(G, l, team); const dir = team === 0 ? 1 : -1;
    const types = ['melee', 'melee', 'caster'];
    const tiles = [p[st], p[st - dir], p[st - 2 * dir], p[st + dir]].filter(Boolean);
    for (const mt of types) {
      let spot = tiles.find(t => freeAt(G, t.x, t.y));
      if (!spot) { const a = adjFree(G, p[st], p[st]); spot = a; }
      if (!spot) continue;
      const mel = mt === 'melee';
      G.units.push({ id: G.nid++, kind: 'minion', mtype: mt, team, lane: l, wp: st, x: spot.x, y: spot.y,
        hp: (mel ? 8 : 6) + bonus, mhp: (mel ? 8 : 6) + bonus, atk: 3 + Math.floor(bonus / 2), rng: mel ? 1 : 2, arm: 0, res: 0, st: fresh(), buffs: [], shield: 0 });
    }
  }
}
function spawnCamp(G, c) {
  const N = NEUTRALS[c.ntype];
  if (!freeAt(G, c.x, c.y)) { c.timer = 1; return; }
  G.units.push({ id: G.nid++, kind: 'neutral', ntype: c.ntype, campId: c.id, team: 2, x: c.x, y: c.y, hp: N.hp + G.round, mhp: N.hp + G.round, atk: N.atk + Math.floor(G.round / 8),
    rng: 1, arm: N.arm, res: N.res, st: fresh(), buffs: [], shield: 0, aggro: null });
}

/* ---------- turn flow ---------- */
function startTeamPhase(G, team) {
  G.turnTeam = team;
  for (const u of heroes(G, team)) {
    u.buffs = u.buffs.filter(b => { b.dur--; return b.dur > 0; });
    if (u.shieldT > 0) { u.shieldT--; if (u.shieldT <= 0) u.shield = 0; }
    u.moved = false; u.stunTurn = false;
    if (u.dead) { u.done = true; u.mv = 0; continue; }
    if (u.recall) {
      u.recall = false; const s = fountainSpot(G, team, u);
      fx(G, { k: 'move', x: u.x, y: u.y, x2: s.x, y2: s.y, team, blink: 1 });
      u.x = s.x; u.y = s.y; log(G, `${HEROES[u.hero].n} recalled to base and was fully healed`, team); fountain(G, u);
    }
    if (u.st.burn) { const b = u.st.burn; dealDamage(G, byId(G, b.src) || null, u, b.d, true, { true: 1 }); if (u.dead) continue; }
    u.mv = stat(G, u, 'mov'); u.acted = false; u.done = false; u.freeUsed = false;
    fountain(G, u);
    if (u.st.stun > 0) {
      u.mv = 0; u.acted = true; u.stunTurn = true;
      const canCleanse = u.items.includes('veil') && !(u.icd.veil > 0);
      if (!canCleanse) u.done = true;
    }
  }
}
function endTeamPhase(G, team) {
  for (const a of G.altars || []) {
    if (a.lock > 0 || a.owner === team) continue;
    const h = heroes(G, team).find(h => alive(h) && h.x === a.x && h.y === a.y);
    if (h) { a.owner = team; a.lock = 3; fx(G, { k: 'area', x: a.x, y: a.y, r: 0, team }); log(G, `${HEROES[h.hero].n} captured the ${a.n} for ${TEAMS[team].name}: +1 ATK and PWR for the team`, team); }
  }
  for (const u of heroes(G, team)) {
    for (const k of ['stun', 'slow', 'root', 'silence']) if (u.st[k] > 0) u.st[k]--;
    if (u.st.burn) { u.st.burn.t--; if (u.st.burn.t <= 0) u.st.burn = null; }
    for (const k of AB_KEYS) if (u.cd[k] > 0) u.cd[k]--;
    for (const k in u.icd) if (u.icd[k] > 0) u.icd[k]--;
  }
}
function newRound(G) {
  G.round++; G.first = G.round % 2 === 1 ? 0 : 1;
  for (const u of heroes(G)) {
    if (u.dead) {
      u.respawn--;
      if (u.respawn <= 0) {
        const s = fountainSpot(G, u.team); u.x = s.x; u.y = s.y; u.dead = false; u.hp = u.mhp; u.st = fresh();
        log(G, `${HEROES[u.hero].n} respawned`, u.team);
      }
    }
    u.gold += 15 + 5 * (G.altars || []).filter(a => a.owner === u.team).length;
  }
  for (const r of G.relics || []) if (r.timer > 0) r.timer--;
  for (const a of G.altars || []) if (a.lock > 0) a.lock--;
  if (G.crown) for (const t of [0, 1]) if (G.crown[t] > 0) G.crown[t]--;
  if (MAP.rules.wave(G.round)) spawnWave(G);
  for (const c of G.camps) {
    const up = G.units.some(u => u.campId === c.id && alive(u));
    if (up) continue;
    if (c.timer > 0) c.timer--;
    if (c.timer <= 0) { spawnCamp(G, c); if (c.ntype !== 'camp' && c.timer <= 0) log(G, `The ${NEUTRALS[c.ntype].n} has appeared`); }
  }
  startTeamPhase(G, G.first);
}
function nearest(list, p) { let b = null, bd = 1e9; for (const t of list) { const d = dist(t, p); if (d < bd) { bd = d; b = t; } } return b; }
function structAct(G, s) {
  if (!alive(s)) return;
  const cand = G.units.filter(t => alive(t) && t.team !== s.team && t.team !== 2 && dist(s, t) <= s.rng && !isVeiled(t) && t.kind !== 'tower' && t.kind !== 'core');
  if (!cand.length) return;
  const t = cand.find(h => h.kind === 'hero' && h.aggro === G.round) || nearest(cand.filter(m => m.kind === 'minion'), s) || nearest(cand, s);
  const dmg = t.kind === "hero" ? s.atk + Math.floor(G.round / 6) : 4;
  fx(G, { k: 'beam', x: s.x, y: s.y, x2: t.x, y2: t.y, team: s.team, tower: 1 });
  dealDamage(G, s, t, dmg, false, { true: 1 });
}
function minionTarget(G, m, r) {
  const cand = G.units.filter(t => alive(t) && t.team !== m.team && t.team !== 2 && dist(m, t) <= r && !isVeiled(t) && !invuln(G, t));
  if (!cand.length) return null;
  return cand.find(h => h.kind === 'hero' && h.aggro === G.round && dist(h, m) <= 2)
    || nearest(cand.filter(t => t.kind === 'minion'), m) || nearest(cand.filter(t => t.kind === 'tower' || t.kind === 'core'), m) || nearest(cand, m);
}
function moveToward(G, u, goal, steps) {
  const occ = occGrid(G); const start = K(u.x, u.y); const prev = new Map([[start, null]]); const dd = new Map([[start, 0]]);
  const q = [[u.x, u.y]]; let best = start, bs = dist(u, goal) * 100;
  while (q.length) {
    const [x, y] = q.shift(); const d = dd.get(K(x, y));
    if (d > 14) continue;
    for (const [dx, dy] of D8) {
      const nx = x + dx, ny = y + dy, k = K(nx, ny);
      if (!inB(nx, ny) || isWall(nx, ny) || dd.has(k)) continue;
      const o = occ[k];
      if (o && !(o.team === u.team && (o.kind === 'minion' || o.kind === 'hero'))) continue;
      dd.set(k, d + 1); prev.set(k, K(x, y)); q.push([nx, ny]);
      if (!o) { const s = dist({ x: nx, y: ny }, goal) * 100 + d + 1; if (s < bs) { bs = s; best = k; } }
    }
  }
  if (best === start) return;
  const path = []; let c = best; while (c && c !== start) { path.unshift(c); c = prev.get(c); }
  let idx = Math.min(steps, path.length) - 1;
  while (idx >= 0 && occ[path[idx]]) idx--;
  if (idx < 0) return;
  const [nx, ny] = path[idx].split(',').map(Number); u.x = nx; u.y = ny;
}
function minionAct(G, m) {
  if (!alive(m)) return;
  if (m.st.stun > 0) return;
  let t = minionTarget(G, m, m.rng);
  if (!t) {
    const p = MAP.lanes[m.lane], dir = m.team === 0 ? 1 : -1;
    while (p[m.wp + dir] && dist(m, p[m.wp]) <= 1) m.wp += dir;
    const near = minionTarget(G, m, 3);
    moveToward(G, m, near || p[m.wp], m.st.slow > 0 ? 1 : 2);
    t = minionTarget(G, m, m.rng);
  }
  if (t) dealDamage(G, m, t, m.atk + ((t.kind === "tower" || t.kind === "core") ? 2 + Math.floor(G.round / 8) : t.kind === "minion" ? 2 : 0), false, {});
}
function neutralAct(G, n) {
  if (!alive(n) || n.st.stun > 0) return;
  if (n.aggro != null) {
    const h = byId(G, n.aggro);
    const home = G.camps.find(c => c.id === n.campId) || n;
    if (!h || !alive(h) || dist(h, home) > 3) { n.aggro = null; }
    else if (dist(h, n) <= 1) { fx(G, { k: 'beam', x: n.x, y: n.y, x2: h.x, y2: h.y, team: 2, thin: 1 }); dealDamage(G, n, h, n.atk, false, {}); }
    else {
      const other = G.units.find(x => x.kind === 'hero' && alive(x) && dist(x, n) <= 1 && x.dmgBy !== undefined && x.team !== 2);
      if (other) { fx(G, { k: 'beam', x: n.x, y: n.y, x2: other.x, y2: other.y, team: 2, thin: 1 }); dealDamage(G, n, other, n.atk, false, {}); }
    }
  }
  if (n.aggro == null && alive(n)) n.hp = Math.min(n.mhp, n.hp + 4);
}
function worldPhase(G) {
  G.turnTeam = -1;
  const order = [...G.units];
  for (const s of order) if (s.kind === 'tower' || s.kind === 'core') structAct(G, s);
  if (G.phase !== 'play') return;
  // interleave minions so neither team always strikes first
  const ms = [order.filter(u => u.kind === 'minion' && u.team === G.first), order.filter(u => u.kind === 'minion' && u.team !== G.first)];
  const n = Math.max(ms[0].length, ms[1].length);
  for (let i = 0; i < n; i++) for (const arr of ms) { if (arr[i]) minionAct(G, arr[i]); if (G.phase !== 'play') return; }
  for (const u of order) if (u.kind === 'neutral') neutralAct(G, u);
  for (const u of G.units) {
    if (u.kind === 'hero') {
      if (!u.dead) fountain(G, u);
    } else {
      for (const k of ['stun', 'slow', 'root', 'silence']) if (u.st[k] > 0) u.st[k]--;
      if (u.st.burn && alive(u)) { dealDamage(G, byId(G, u.st.burn.src), u, u.st.burn.d, true, { true: 1 }); if (u.st.burn) { u.st.burn.t--; if (u.st.burn.t <= 0) u.st.burn = null; } }
    }
  }
  if (G.phase === 'play' && G.round >= overtimeAt()) {
    if (G.round === overtimeAt()) log(G, `Overtime! Both Cores now crumble 4 HP at the end of every round`);
    const cs = [0, 1].map(t => G.units.find(u => u.kind === 'core' && u.team === t));
    for (const c of cs) if (c) { c.hp -= 4; fx(G, { k: "hit", x: c.x, y: c.y, v: 4 }); }
    const dead = cs.map(c => !c || c.hp <= 0);
    if (dead[0] && dead[1]) {
      const w = G.kills[0] !== G.kills[1] ? (G.kills[0] > G.kills[1] ? 0 : 1) : (G.tlost[0] !== G.tlost[1] ? (G.tlost[0] < G.tlost[1] ? 0 : 1) : 0);
      G.winner = w; G.phase = 'over'; log(G, `Both Cores crumbled together. ${TEAMS[w].name} wins on the tiebreak (kills, then towers)`, w);
    } else if (dead[0]) killUnit(G, cs[0], null);
    else if (dead[1]) killUnit(G, cs[1], null);
  }
  cleanup(G);
}
function cleanup(G) { G.units = G.units.filter(u => u.kind === 'hero' || u.hp > 0); }
function progress(G) {
  let guard = 0;
  while (G.phase === 'play' && guard++ < 300) {
    const pend = heroes(G, G.turnTeam).some(h => !h.dead && !h.done);
    if (pend) return;
    endTeamPhase(G, G.turnTeam);
    if (G.turnTeam === G.first) startTeamPhase(G, 1 - G.first);
    else { worldPhase(G); if (G.phase !== 'play') return; newRound(G); }
  }
}

/* ---------- action dispatcher ---------- */
function doAction(G, a) {
  if (!a || typeof a !== 'object') return 'Bad action';
  if (G.phase !== 'play') return 'The game is not running';
  const u = byId(G, a.id);
  if (!u || u.kind !== 'hero') return 'No such hero';
  G.fx = []; G.fxId = (G.fxId || 0) + 1;
  let err = null;
  if (a.t === 'buy') err = buyItem(G, u, a.item);
  else if (a.t === 'sell') err = sellItem(G, u, a.i | 0);
  else {
    if (u.team !== G.turnTeam) return `It is ${TEAMS[G.turnTeam] ? TEAMS[G.turnTeam].name : 'the world'}'s turn`;
    if (u.dead) return 'This hero is dead';
    if (u.done && a.t !== 'item') return 'This hero has ended its turn';
    switch (a.t) {
      case 'move': {
        if (u.st.stun > 0) { err = 'Stunned'; break; }
        if (u.recall) { err = 'Recalling'; break; }
        const R = reach(G, u, u.mv); const c = R.get(K(a.x | 0, a.y | 0));
        if (c == null || c === 0) { err = 'Cannot move there'; break; }
        fx(G, { k: 'move', x: u.x, y: u.y, x2: a.x | 0, y2: a.y | 0, team: u.team });
        u.x = a.x | 0; u.y = a.y | 0; u.mv -= c; u.moved = true; pickRelic(G, u); fountain(G, u); break;
      }
      case 'attack': { const t = byId(G, a.tid); if (!t) { err = 'No target'; break; } err = basicAttack(G, u, t); break; }
      case 'ab': if (!AB_KEYS.includes(a.k)) { err = 'Bad ability'; break; } err = applyAbility(G, u, a.k, a.x | 0, a.y | 0); break;
      case 'item': err = useItem(G, u, a.i | 0, a.x == null ? null : a.x | 0, a.y == null ? null : a.y | 0); break;
      case 'recall':
        if (!MAP.rules.recall) { err = `There is no recall on ${MAP.n}`; break; }
        if (u.st.stun > 0) { err = 'Stunned'; break; }
        if (inBase(u)) { err = 'Already in base'; break; }
        u.recall = true; u.mv = 0; u.done = true;
        log(G, `${HEROES[u.hero].n} is channeling Recall: home at the start of their next turn unless damaged`, u.team); break;
      case 'end': u.done = true; break;
      default: err = 'Unknown action';
    }
  }
  if (!err) { cleanup(G); progress(G); }
  return err;
}
function endTeam(G, team, ids) {
  for (const h of heroes(G, team)) if (!ids || ids.includes(h.id)) h.done = true;
  G.fx = []; G.fxId++;
  progress(G);
}
