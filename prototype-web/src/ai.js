/* ===== Lanefall bots ===== */
const AIM = {};
function aiDiff(G, u) { const s = G.slots[u.slot]; return s ? (s.diff == null ? 1 : s.diff) : 1; }
function enemyHeroes(G, u) { return heroes(G, 1 - u.team).filter(alive); }
function danger(G, u, P, willAggro) {
  let d = 0;
  for (const s of G.units) {
    if (!alive(s) || s.team === u.team || s.team === 2 || (s.kind !== 'tower' && s.kind !== 'core')) continue;
    if (dist(s, P) > s.rng) continue;
    const shielded = G.units.some(m => m.kind === 'minion' && m.team === u.team && alive(m) && dist(m, s) <= s.rng);
    if (!shielded || willAggro) d += s.atk + 3;
  }
  for (const e of enemyHeroes(G, u)) {
    const r = stat(G, e, 'mov') + Math.max(stat(G, e, 'rng'), 2);
    const dd = dist(e, P);
    if (dd <= r) d += stat(G, e, "atk") * 0.45 + e.lvl * 0.5 + (dd <= 2 ? 1.5 : 0);
  }
  for (const n of G.units) if (n.kind === 'neutral' && alive(n) && n.aggro === u.id && dist(n, P) <= 1) d += n.atk;
  return d * (1.6 - u.hp / u.mhp);
}
function estDmg(G, t, amt, mag) {
  const def = t.kind === 'hero' ? stat(G, t, mag ? 'res' : 'arm') : (mag ? (t.res || 0) : (t.arm || 0));
  return Math.max(1, Math.round(amt - def));
}
function towerSafe(G, u, t) {
  return G.units.some(m => m.kind === 'minion' && m.team === u.team && alive(m) && dist(m, t) <= t.rng);
}
function valueOf(G, u, R, P) {
  let v = 0, hitHero = false;
  const ratio = u.hp / u.mhp;
  for (const h of R.hits) {
    const t = h.u; if (!alive(t)) continue;
    const d = h.true ? t.hp : (h.dmg > 0 ? estDmg(G, t, h.dmg, h.mag) : 0);
    const pool = t.hp + (t.shield || 0);
    const eff = Math.min(d, pool), kill = d >= pool;
    if (t.kind === 'hero') {
      hitHero = true;
      v += eff * 2.2 + (kill ? 32 : 0) + (h.stun || 0) * 8 + (h.root || 0) * 3 + (h.slow || 0) * 2 + (h.silence || 0) * 3 + (h.burn ? h.burn.d * h.burn.t * 1.6 : 0);
      if (!kill && h.execute && t.hp - d <= EXECUTE * t.mhp) v += 32;
      v += (1 - t.hp / t.mhp) * 6;
    } else if (t.kind === 'minion') v += eff * 0.5 + (kill ? 7 : 0) + (h.burn ? 1 : 0);
    else if (t.kind === 'tower') v += invuln(G, t) ? 0 : towerSafe(G, u, t) ? eff * 2.2 + (kill ? 30 : 0) : eff * 0.15;
    else if (t.kind === 'core') v += eff * 2.6 + (kill ? 999 : 0);
    else if (t.kind === 'neutral') {
      if (ratio > 0.55 && !(t.ntype !== 'camp' && u.lvl < 3)) v += eff * 0.6 + (kill ? (t.ntype === 'camp' ? 10 : t.ntype === 'drake' ? 30 : 35) : 0);
    }
  }
  for (const he of R.heals) { const t = he.u; if (!alive(t)) continue; const miss = t.mhp - t.hp; v += Math.min(he.amt, miss) * (t.hp < t.mhp * 0.5 ? 2 : 1.1); }
  for (const s of R.shields) { if (!s.u) continue; const near = enemyHeroes(G, u).some(e => dist(e, s.u) <= 5); v += s.amt * (near ? 0.8 : 0.1); }
  if (R.dest) v -= danger(G, u, R.dest, hitHero) * 0.8;
  if (hitHero) {
    for (const s of G.units) if ((s.kind === 'tower' || s.kind === 'core') && alive(s) && s.team === 1 - u.team && dist(s, R.dest || P) <= s.rng) v -= 9;
  }
  return v;
}
function aiCandidates(G, u, k, P) {
  const A = HEROES[u.hero].ab[k]; const out = [];
  if (A.type === 'self' || A.type === 'global') return [{ x: P.x, y: P.y }];
  if (A.type === 'line') {
    for (const [dx, dy] of D8) { let x = P.x, y = P.y, last = null; for (let i = 0; i < A.range; i++) { x += dx; y += dy; if (!inB(x, y) || isWall(x, y)) break; last = { x, y }; } if (last) out.push(last); }
    return out;
  }
  if (A.type === 'ally') { for (const h of heroes(G, u.team)) if (alive(h) && dist(h, P) <= A.range) out.push({ x: h.x, y: h.y }); return out; }
  if (A.type === 'dash') {
    if (!A.dmg) return [];
    const out2 = [];
    for (const t of G.units) if (targetable(G, u, t) && t.kind === 'hero' && dist(t, P) <= A.range + 1)
      for (const [dx, dy] of D8) { const x = t.x + dx, y = t.y + dy; if (dist(P, { x, y }) <= A.range && dist(P, { x, y }) > 0 && freeAt(G, x, y, u)) out2.push({ x, y }); }
    return out2;
  }
  for (const t of G.units) if (targetable(G, u, t) && dist(t, P) <= (A.range || 0) + (A.radius || 0)) {
    if (A.type === 'tile') { if (dist(t, P) <= A.range) out.push({ x: t.x, y: t.y }); }
    else out.push({ x: t.x, y: t.y });
  }
  return out;
}
function withPos(u, P, fn) { const ox = u.x, oy = u.y; u.x = P.x; u.y = P.y; try { return fn(); } finally { u.x = ox; u.y = oy; } }
function aiBestPlan(G, u, D) {
  const R = reach(G, u, u.mv);
  const noise = D === 0 ? 5 : D === 1 ? 1.5 : 0.3;
  const dw = D === 0 ? 0.5 : D === 1 ? 1 : 1.2;
  let best = null;
  for (const [key, cost] of R) {
    const [x, y] = key.split(',').map(Number); const P = { x, y };
    const dP = danger(G, u, P, false) * dw;
    withPos(u, P, () => {
      if (attackReady(u)) {
        const atk = basicDamage(G, u);
        for (const t of G.units) if (canBasic(G, u, t, P)) {
          const v = valueOf(G, u, { hits: [{ u: t, dmg: atk, mag: false }], heals: [], shields: [] }, P);
          const s = v - dP - cost * 0.05 + Math.random() * noise;
          if (!best || s > best.s) best = { s, v, P, a: { t: 'attack', id: u.id, tid: t.id } };
        }
      }
      if (!u.acted && u.st.stun <= 0) {
        for (const k of AB_KEYS) {
          const A = HEROES[u.hero].ab[k];
          if (A.quick || abReadyErr(G, u, k)) continue;
          if (D === 0 && Math.random() < 0.3) continue;
          for (const c of aiCandidates(G, u, k, P)) {
            const H = abHits(G, u, k, c.x, c.y, P); if (!H) continue;
            if ((A.type === 'tile' || A.type === 'line') && !H.hits.length) continue;
            let v = valueOf(G, u, H, P);
            if (k === 'r') v -= 4; // save the ultimate for better moments
            const s = v - dP - cost * 0.05 + Math.random() * noise;
            if (!best || s > best.s) best = { s, v, P, a: { t: 'ab', id: u.id, k, x: c.x, y: c.y } };
          }
        }
      }
    });
  }
  return best;
}
function laneFront(G, u) {
  const p = MAP.lanes[u.lane]; const dir = u.team === 0 ? 1 : -1;
  let best = null, bp = -1;
  for (const m of G.units) {
    if (m.kind !== 'minion' || m.team !== u.team || m.lane !== u.lane || !alive(m)) continue;
    const prog = dir === 1 ? m.wp : p.length - 1 - m.wp;
    if (prog > bp) { bp = prog; best = m; }
  }
  return best;
}
function aiGoal(G, u) {
  if (u.hp < u.mhp * 0.45) {
    const rel = (G.relics || []).filter(r => r.timer <= 0 && dist(r, u) <= 5).sort((a, b) => dist(a, u) - dist(b, u))[0];
    if (rel) return rel;
    return MAP.fount[u.team];
  }
  for (const al of G.altars || []) {
    if (al.owner === u.team || al.lock > 1) continue;
    if (enemyHeroes(G, u).some(e => dist(e, al) <= 2)) continue;
    const mates = heroes(G, u.team).filter(h => alive(h) && h.hp > h.mhp * 0.5);
    const closest = mates.sort((a, b) => dist(a, al) - dist(b, al))[0];
    if (closest === u && dist(u, al) <= 7) return al;
  }
  const role = HEROES[u.hero].role;
  if (role === 'Support') {
    const carry = heroes(G, u.team).filter(h => h !== u && alive(h)).sort((a, b) => (a.lane === u.lane ? 0 : 1) - (b.lane === u.lane ? 0 : 1))[0];
    if (carry) return carry;
  }
  const f = laneFront(G, u);
  if (f) return f;
  const own = G.units.find(t => t.kind === 'tower' && t.team === u.team && t.lane === u.lane && alive(t));
  if (own) { const p = MAP.lanes[u.lane]; const i = p.findIndex(q => dist(q, own) <= 1); const step = u.team === 0 ? 1 : -1; return p[Math.max(0, Math.min(p.length - 1, i + step))] || own; }
  return MAP.cores[u.team];
}
function aiPosition(G, u, goal, retreat) {
  if (u.mv <= 0 || u.st.root > 0) return null;
  const R = reach(G, u, u.mv); const ranged = stat(G, u, 'rng') > 1;
  let best = null, bs = Infinity;
  for (const [key] of R) {
    const [x, y] = key.split(',').map(Number); const P = { x, y };
    let s = dist(P, goal) * (retreat ? 1.5 : 1) + danger(G, u, P, false) * (retreat ? 2 : 1.1);
    if (ranged && u.acted) { const e = nearest(enemyHeroes(G, u), P); if (e) s -= Math.min(dist(e, P), 3) * 0.6; }
    if (u.hp < u.mhp * 0.8 && (G.relics || []).some(r => r.timer <= 0 && r.x === x && r.y === y)) s -= 5;
    if (s < bs - 0.01) { bs = s; best = P; }
  }
  if (!best || (best.x === u.x && best.y === u.y)) return null;
  return { t: 'move', id: u.id, x: best.x, y: best.y };
}
function aiBuy(G, u) {
  const b = HEROES[u.hero].build;
  for (const id of b) {
    if (u.items.includes(id)) continue;
    if (id === 'boots' && u.items.includes('treads')) continue;
    if (!shopErr(G, u, id)) return { t: 'buy', id: u.id, item: id };
    if (ITEMS[id].c > u.gold) break; // save up for the next item in order
  }
  if (!u.items.includes('potion') && u.items.length < 5 && u.lvl < 5 && !shopErr(G, u, 'potion')) return { t: 'buy', id: u.id, item: 'potion' };
  return null;
}
function aiStep(G, u) {
  const D = aiDiff(G, u);
  const id = u.id;
  if (u.dead || inBase(u)) { const b = aiBuy(G, u); if (b) return b; }
  if (u.dead || u.done) return { t: 'end', id };
  const mem = AIM[id];
  if (mem && mem.r === G.round && mem.a) { const a = mem.a; mem.a = null; return a; }
  if (!mem || mem.r !== G.round) AIM[id] = { r: G.round, a: null, pos: 0 };
  const M = AIM[id];
  // cleanse disables
  const vi = u.items.indexOf('veil');
  if (vi >= 0 && !(u.icd.veil > 0) && (u.st.stun > 0 || u.st.root > 0 || u.st.silence > 0) && enemyHeroes(G, u).some(e => dist(e, u) <= 5)) return { t: 'item', id, i: vi };
  if (u.st.stun > 0) return { t: 'end', id };
  const ratio = u.hp / u.mhp;
  const pi = u.items.indexOf('potion');
  if (pi >= 0 && ratio < 0.5) return { t: 'item', id, i: pi };
  const near = e => enemyHeroes(G, u).filter(h => dist(h, u) <= e);
  const low = ratio < (D === 0 ? 0.2 : 0.32);
  // shopping trip
  const nextItem = HEROES[u.hero].build.find(i => !u.items.includes(i) && !(i === 'boots' && u.items.includes('treads')));
  const rich = nextItem && u.gold >= itemPrice(u, nextItem) + 250 && ratio < 0.75;
  if ((low || (rich && MAP.rules.recall)) && !inBase(u)) {
    if (MAP.rules.recall && !near(4).length) return { t: 'recall', id };
    if (low) {
      const bi = u.items.indexOf('blink');
      if (bi >= 0 && !(u.icd.blink > 0) && near(4).length && u.st.root <= 0) {
        let best = null, bd = 99; const f = MAP.fount[u.team];
        for (let x = u.x - 4; x <= u.x + 4; x++) for (let y = u.y - 4; y <= u.y + 4; y++) if (freeAt(G, x, y, u) && dist(u, { x, y }) <= 4) { const d = dist({ x, y }, f); if (d < bd) { bd = d; best = { x, y }; } }
        if (best) return { t: 'item', id, i: bi, x: best.x, y: best.y };
      }
      if (u.hero === 'shade' && !abReadyErr(G, u, 'e') && near(5).length) return { t: 'ab', id, k: 'e', x: u.x, y: u.y };
      if (!u.acted) {
        const atk = basicDamage(G, u);
        const kill = G.units.find(t => canBasic(G, u, t) && estDmg(G, t, atk, false) >= t.hp + (t.shield || 0) && t.kind === 'hero');
        if (kill) return { t: 'attack', id, tid: kill.id };
      }
      if (u.hero === 'frostbow' && !abReadyErr(G, u, 'e') && near(3).length) { const t = aiPosition(G, Object.assign({}, u, { mv: 2 }), MAP.fount[u.team], true); if (t) return { t: 'ab', id, k: 'e', x: t.x, y: t.y }; }
      const mv = aiPosition(G, u, MAP.fount[u.team], true); if (mv) return mv;
      return { t: 'end', id };
    }
  }
  // quick buffs before committing
  if (!u.acted) {
    const hn = near(stat(G, u, 'mov') + 3).length;
    if (u.hero === 'blademaster' && hn && !abReadyErr(G, u, 'w')) return { t: 'ab', id, k: 'w', x: u.x, y: u.y };
    if (u.hero === 'frostbow' && near(6).length && !abReadyErr(G, u, 'w')) return { t: 'ab', id, k: 'w', x: u.x, y: u.y };
    if (u.hero === 'quake' && !abReadyErr(G, u, 'w') && G.units.some(t => targetable(G, u, t) && dist(t, u) <= u.mv + 1 && t.kind !== 'neutral')) return { t: 'ab', id, k: 'w', x: u.x, y: u.y };
    if (u.hero === 'shade' && ratio < 0.45 && near(4).length && !abReadyErr(G, u, 'e')) return { t: 'ab', id, k: 'e', x: u.x, y: u.y };
  }
  if (attackReady(u)) {
    const plan = aiBestPlan(G, u, D);
    const min = D === 0 ? 2 : 1.2;
    if (plan && plan.s > min) {
      if (plan.P.x !== u.x || plan.P.y !== u.y) { M.a = plan.a; return { t: 'move', id, x: plan.P.x, y: plan.P.y }; }
      return plan.a;
    }
  }
  if (u.hero === 'frostbow' && u.acted && !abReadyErr(G, u, 'e') && near(2).length) {
    const mv = aiPosition(G, Object.assign({}, u, { mv: 2 }), MAP.fount[u.team], true);
    if (mv) return { t: 'ab', id, k: 'e', x: mv.x, y: mv.y };
  }
  if (M.pos < 3) { M.pos++; const mv = aiPosition(G, u, aiGoal(G, u), false); if (mv) return mv; }
  return { t: 'end', id };
}
