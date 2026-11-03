"""Lanefall v1.0-draft pacing simulator (docs/design/sim/lanefall_sim.py). Run: python3 lanefall_sim.py
Rules modelled exactly as written in docs/design/GDD.md (numbers in the dicts below):
 - Round = Hero phase (alternating single activations, 3 actions + marksman free Attack) then Lane phase.
 - Lane phase per lane: spawn, Power = minions + heroes in lane zone, winner deals the difference to loser's
   minions and pushes Front 1 step; at a tower: tower kills 2 attackers, each remaining attacker deals 1.
 - Heroes: last hit (Attack = 1 minion, AoE abilities clear N), fight, siege (Attack on structure = 2 when own wave there),
   tower shots on divers (3), objectives with last-hit claim, recall (arrive next activation, full heal), respawn skip 1.
 - Levels by round, gold for items, VP race + round limit.
Geometry is abstracted: each hero is in base / travelling / a lane zone / an objective. Bots: simple seeded heuristics.
"""
import random, statistics, json, sys

LEVEL_AT = [(1, 1), (3, 2), (5, 3), (7, 4), (9, 5)]  # (round, level)
def level_of(r, start=1):
    if start > 1: return min(5, start + (r - 1) // 2)
    return max(L for rr, L in LEVEL_AT if r >= rr)
LVL_BONUS = {1: dict(hp=0, atk=0, pow=0), 2: dict(hp=2, atk=0, pow=0), 3: dict(hp=4, atk=0, pow=0),
             4: dict(hp=6, atk=1, pow=1), 5: dict(hp=8, atk=1, pow=1)}

# ability: key, dmg, cd, clear(minions), effect, range-kind ; effect in stun/root/slow/silence/shield:n/heal:n/...
H = {
 'bulwark':    dict(hp=16, atk=2, rng=1, arm=2, spd=3, role='Tank', ab=[('Q',2,2,0,'stun'),('W',0,2,0,'shield:4'),('E',1,2,1,'slow'),('R',3,4,3,'stun')]),
 'butcher':    dict(hp=16, atk=2, rng=1, arm=1, spd=3, role='Tank', ab=[('Q',3,2,0,'pull'),('W',1,1,2,'rot'),('E',0,2,2,'heal:3'),('R',5,4,0,'stun+drain')]),
 'blademaster':dict(hp=14, atk=3, rng=1, arm=1, spd=3, role='Fighter', ab=[('Q',2,1,3,None),('W',0,2,0,'atk+1'),('E',3,2,0,'silence'),('R',6,4,0,'omni')]),
 'shade':      dict(hp=10, atk=3, rng=1, arm=0, spd=4, role='Assassin', ab=[('Q',2,1,1,None),('W',2,2,0,'gap'),('E',0,3,0,'hide'),('R',4,4,0,'execute:4')]),
 'pyra':       dict(hp=10, atk=1, rng=2, arm=0, spd=3, role='Mage', ab=[('Q',2,1,3,None),('W',1,2,0,'stun'),('E',3,2,0,None),('R',6,4,0,None)]),
 'frostbow':   dict(hp=10, atk=2, rng=3, arm=0, spd=3, role='Marksman', ab=[('Q',1,2,3,'slow'),('W',0,2,0,'atk+1'),('E',0,2,0,'tumble'),('R',3,4,0,'stun')]),
 'lumen':      dict(hp=11, atk=1, rng=2, arm=0, spd=3, role='Support', ab=[('Q',0,1,0,'heal:3'),('W',1,2,1,'root'),('E',0,1,0,'shield:3'),('R',0,4,0,'wish:4')]),
 'quake':      dict(hp=13, atk=2, rng=1, arm=1, spd=3, role='Initiator', ab=[('Q',1,3,2,'stun'),('W',0,2,0,'totem'),('E',1,1,2,'slow'),('R',2,4,3,'echo')]),
}
ITEMS = {'sword':(3,dict(atk=1)),'tome':(3,dict(pow=1)),'ruby':(3,dict(hp=3)),'cloth':(3,dict(arm=1)),'boots':(3,dict(spd=1)),
  'vamp':(7,dict(atk=2,ls=1)),'edge':(7,dict(atk=2,pierce=1)),'staff':(7,dict(pow=2,hp=2)),'plate':(7,dict(hp=7)),
  'thorn':(7,dict(arm=2,thorn=1)),'treads':(7,dict(spd=2)),'blink':(7,dict(pow=1)),'angel':(7,dict(arm=1,revive=1)),'veil':(7,dict(hp=3))}
UPG = {'vamp':'sword','edge':'sword','staff':'tome','blink':'tome','plate':'ruby','veil':'ruby','thorn':'cloth','angel':'cloth','treads':'boots'}
BUILD = {'bulwark':['ruby','plate','cloth','thorn'],'butcher':['ruby','plate','cloth','thorn'],'blademaster':['sword','vamp','ruby','plate'],
  'shade':['sword','edge','tome','blink'],'pyra':['tome','staff','cloth','angel'],'frostbow':['sword','vamp','sword','edge'],
  'lumen':['tome','staff','ruby','veil'],'quake':['tome','blink','ruby','plate']}

MAPS = {
 # N: front positions -N..N (team0 side negative). towers: front position (abs) where a tower stands, outer first.
 'rift':   dict(lanes=3, N=4, towers=[3], tower_hp=8, core_hp=12, vp=[6,8,10,12], limit=12, travel=2, start_lvl=1, recall=True,
                start_gold=3, objs=[dict(n='drake',hp=10,arm=1,bite=2,first=3,respawn=4,vp=2,buff='atk'),
                                     dict(n='golem',hp=16,arm=2,bite=3,first=6,respawn=5,vp=3,buff='aegis')], camps=2),
 'hollow': dict(lanes=2, N=5, towers=[3,4], tower_hp=8, core_hp=12, vp=[6,8,10,12], limit=12, travel=2, start_lvl=1, recall=True,
                start_gold=3, objs=[dict(n='queen',hp=16,arm=1,bite=3,first=5,respawn=4,vp=3,buff='brood')], camps=2, altars=2),
 'bridge': dict(lanes=1, N=4, towers=[2,3], tower_hp=8, core_hp=12, vp=[5,6,7,8], limit=8, travel=1, start_lvl=3, recall=False,
                start_gold=6, objs=[], camps=0),
}
SPAWN = lambda r: 2 if r < 7 else 3
ORDER = 'trail'
SHOPRECALL = True
CAP, TOWER_KILLS, TOWER_SHOT, SIEGE, CAMP_HP, CAMP_GOLD = 6, 2, 3, 2, 4, 2

class Hero:
    def __init__(s, key, team, G):
        s.key, s.team, s.d = key, team, H[key]
        s.items = []; s.gold = G.M['start_gold']; s.cd = {a[0]: 0 for a in s.d['ab']}
        s.loc = 'base'; s.dead = False; s.skip = False; s.recall = False; s.stun = False; s.silence = False
        s.shield = 0; s.aegis = False; s.kills = s.deaths = s.lasthits = 0; s.buff = None; s.hidden = False
        s.travel = 0; s.lane = 0; s.hp = 0; s.G = G
    def st(s, k):
        v = s.d.get(k, 0) + LVL_BONUS[s.G.level].get(k, 0)
        for it in s.items: v += ITEMS[it][1].get(k, 0)
        if k == 'atk': v += s.G.tatk[s.team]
        return v
    def mhp(s): return s.st('hp')
    def ready(s, k): return s.cd[k] == 0 and not (k == 'R' and s.G.level < 3)

class Game:
    def __init__(s, mapk, size, seed, act_h=40, act_b=10, humans=None):
        s.M = M = MAPS[mapk]; s.mk = mapk; s.rng = random.Random(seed); s.size = size
        s.vpt = M['vp'][size-1]; s.round = 0; s.level = M['start_lvl']; s.vp = [0, 0]; s.tatk = [0, 0]; s.brood = [0, 0]
        pool = list(H); s.rng.shuffle(pool)
        s.heroes = [Hero(pool[i], 0, s) for i in range(size)] + [Hero(pool[size + i], 1, s) for i in range(size)]
        for h in s.heroes: h.hp = h.mhp()
        s.front = [0] * M['lanes']; s.wave = [[0, 0] for _ in range(M['lanes'])]
        s.towers = {(t, l, p): M['tower_hp'] for t in (0, 1) for l in range(M['lanes']) for p in M['towers']}
        s.core = [M['core_hp']] * 2; s.winner = None; s.end = None
        s.obj = {o['n']: dict(o, cur=0, up=False, timer=o['first']) for o in M['objs']}
        s.camps = {(t, i): 0 for t in (0, 1) for i in range(M.get('camps', 0))}  # respawn timer, 0 = up
        s.altars = [-1] * M.get('altars', 0)
        for t in (0, 1):
            hs = [h for h in s.heroes if h.team == t]
            order = {3: [1, 0, 2, 2], 2: [0, 1, 0, 1], 1: [0, 0, 0, 0]}[M['lanes']]
            for j, h in enumerate(hs): h.lane = order[j]
        s.stats = dict(kills=0, towers=0, objs=0, first_tower=None, dive_shots=0, lasthits=0, acts=0)

    def sgn(s, t): return -1 if t == 0 else 1  # side of team t on the front track
    def tower_at_front(s, l, attacker):
        """Enemy tower currently being sieged in lane l by attacker (front sits at that tower)."""
        foe = 1 - attacker; f = s.front[l]
        for p in s.M['towers']:
            if s.towers[(foe, l, p)] > 0 and f * s.sgn(foe) >= p: return (foe, l, p)
        return None
    def next_tower(s, l, foe):
        for p in s.M['towers']:
            if s.towers[(foe, l, p)] > 0: return p
        return None
    def core_open(s, foe):
        return any(all(s.towers[(foe, l, p)] <= 0 for p in s.M['towers']) for l in range(s.M['lanes']))
    def in_tower_range(s, h):
        """Hero h in its lane zone is within range of an enemy tower when the front is at/after that tower minus 1."""
        if not (isinstance(h.loc, tuple) and h.loc[0] == 'lane'): return False
        l = h.loc[1]; foe = 1 - h.team; p = s.next_tower(l, foe)
        return p is not None and s.front[l] * s.sgn(foe) >= p - 1

    def foes_here(s, h):
        return [e for e in s.heroes if e.team != h.team and not e.dead and e.loc == h.loc and not e.hidden]
    def allies_here(s, h):
        return [e for e in s.heroes if e.team == h.team and not e.dead and e.loc == h.loc]

    def damage(s, src, tgt, n, attack=False):
        if attack:
            arm = max(0, tgt.st('arm') - (src.st('pierce') if src else 0)); n = max(1, n - arm)
        if tgt.shield: a = min(tgt.shield, n); tgt.shield -= a; n -= a
        tgt.hp -= n; tgt.recall = False
        if attack and src and 'thorn' in tgt.items: src.hp -= 1
        if attack and src and 'vamp' in src.items and n > 0: src.hp = min(src.mhp(), src.hp + 1)
        if src and tgt.team != src.team and s.in_tower_range(src) and not getattr(src, '_shot', False):
            src._shot = True; src.hp -= TOWER_SHOT; s.stats['dive_shots'] += 1
            if src.hp <= 0: s.ko(src, None)
        if tgt.hp <= 0 and not tgt.dead: s.ko(tgt, src)
        return n

    def ko(s, h, src):
        if h.aegis or 'angel' in h.items:
            if h.aegis: h.aegis = False
            else: h.items.remove('angel'); h.items.append('cloth')
            h.hp = h.mhp() // 2; return
        h.dead = True; h.skip = True; h.deaths += 1; h.loc = 'dead'; h.recall = False
        s.vp[1 - h.team] += 1; s.stats['kills'] += 1
        if src: src.gold += 3; src.kills += 1
        for a in s.heroes:
            if a.team != h.team and a is not src and not a.dead: a.gold += 1 if a.loc == (src.loc if src else None) else 0

    # ---------------- hero activation ----------------
    def activate(s, h):
        s.stats['acts'] += 1; h._shot = False; h.hidden = False
        if h.dead:
            if h.skip: h.skip = False; return  # skips this activation
            h.dead = False; h.hp = h.mhp(); h.loc = 'base'
        a = 3
        if h.stun: a = 1; h.stun = False
        sil = h.silence; h.silence = False
        if h.recall: h.recall = False; h.loc = 'base'
        if h.loc == 'base':
            h.hp = h.mhp(); s.shop(h)
            h.loc = ('travel', h.lane, s.M['travel'])
        if isinstance(h.loc, tuple) and h.loc[0] == 'travel':
            rem = h.loc[2]; use = min(rem, a); a -= use
            h.loc = ('travel', h.loc[1], rem - use) if rem - use > 0 else ('lane', h.loc[1])
            if a == 0: return
        # recall when low (free, ends activation): any time
        if s.M['recall'] and (h.hp <= 0.35 * h.mhp() or (h.gold >= 6 and h.hp <= 0.8 * h.mhp() and SHOPRECALL)):
            if a >= 1: s.lane_actions(h, 1, sil)
            h.recall = True; return
        # objective decision
        if h.loc[0] == 'lane' and a >= 2 and h.hp > 0.6 * h.mhp() and s.level >= 2:
            for o in s.obj.values():
                if o['up'] and s.rng.random() < s.obj_desire(h):
                    h.loc = ('obj', o['n']); a -= 1; break
        if h.loc[0] == 'obj':
            o = s.obj[h.loc[1]]
            foes = s.foes_here(h)
            if foes: s.fight(h, foes, a, sil); return
            if not o['up']: h.loc = ('lane', h.lane); s.lane_actions(h, a, sil); return
            s.hit_obj(h, o, a, sil); return
        if s.altars and a >= 2:
            for i, ow in enumerate(s.altars):
                if ow != h.team and s.rng.random() < 0.3:
                    s.altars[i] = h.team; a -= 2; break
        # jungle camp (own side) if lane is empty of enemy minions
        if s.camps and a >= 2 and s.wave[h.loc[1]][1 - h.team] == 0:
            for (t, i), tm in s.camps.items():
                if t == h.team and tm == 0 and s.rng.random() < 0.5:
                    s.camps[(t, i)] = 3; h.gold += CAMP_GOLD; h.hp -= 1; a -= 2; break
        foes = s.foes_here(h)
        if foes and a > 0:
            tgt = min(foes, key=lambda e: e.hp)
            burst = s.est_burst(h, tgt, a, sil)
            dive = s.in_tower_range(h)
            if burst >= tgt.hp or (not dive and (h.hp >= tgt.hp and s.rng.random() < 0.5 or s.rng.random() < 0.2)):
                s.fight(h, foes, a, sil); return
        s.lane_actions(h, a, sil)

    def obj_desire(s, h):
        down = sum(1 for e in s.heroes if e.team != h.team and e.dead)
        return 0.2 + 0.2 * down + (0.1 if h.d['role'] in ('Assassin', 'Fighter', 'Tank') else 0)

    def attacks(s, h): return 2 if h.d['role'] == 'Marksman' else 1

    def hit_obj(s, h, o, a, sil):
        dmg = 0
        for _ in range(s.attacks(h)): dmg += max(1, h.st('atk') - o['arm'])
        a -= 1
        if not sil:
            for k, d, cd, cl, ef in h.d['ab']:
                if a <= 0: break
                if d > 0 and h.ready(k) and k != 'R': dmg += d + h.st('pow'); h.cd[k] = cd; a -= 1
        o['cur'] -= dmg
        if o['cur'] <= 0:
            o['up'] = False; o['timer'] = o['respawn']; s.vp[h.team] += o['vp']; s.stats['objs'] += 1
            for x in s.heroes:
                if x.team == h.team: x.gold += 2
            if o['buff'] == 'atk': s.tatk[h.team] = min(2, s.tatk[h.team] + 1)
            if o['buff'] == 'aegis': h.aegis = True
            if o['buff'] == 'brood': s.brood[h.team] = 2
            h.loc = ('lane', h.lane)
        else:
            h.hp -= o['bite']
            if h.hp <= 0: s.ko(h, None)

    def est_burst(s, h, tgt, a, sil):
        dmg = sum(max(1, h.st('atk') - tgt.st('arm')) for _ in range(s.attacks(h))); a -= 1
        if not sil:
            for k, d, cd, cl, ef in sorted(h.d['ab'], key=lambda x: -x[1]):
                if a <= 0: break
                if d > 0 and h.ready(k): dmg += d + h.st('pow'); a -= 1
                if ef and ef.startswith('execute') and h.ready(k): dmg += 4
        return dmg - tgt.shield

    def fight(s, h, foes, a, sil):
        tgt = min(foes, key=lambda e: e.hp)
        if not sil:
            order = sorted(h.d['ab'], key=lambda x: -(x[1] + (4 if x[4] and 'stun' in x[4] else 0) + (3 if x[0] == 'R' else 0)))
            for k, d, cd, cl, ef in order:
                if a <= 1 or tgt.dead: break
                if not h.ready(k): continue
                ef = ef or ''
                if d == 0 and not any(ef.startswith(x) for x in ('shield', 'heal', 'wish', 'atk+1', 'totem')): continue
                h.cd[k] = cd; a -= 1
                if ef.startswith('shield'): h.shield = int(ef.split(':')[1]); continue
                if ef.startswith('heal'):
                    w = min(s.allies_here(h), key=lambda x: x.hp / x.mhp()); w.hp = min(w.mhp(), w.hp + int(ef.split(':')[1]) + h.st('pow')); continue
                if ef.startswith('wish'):
                    for x in s.heroes:
                        if x.team == h.team and not x.dead: x.hp = min(x.mhp(), x.hp + 4 + h.st('pow'))
                    continue
                if ef in ('atk+1', 'totem'): h.buff = ef; continue
                dmg = d + h.st('pow')
                l = h.loc[1] if h.loc[0] == 'lane' else None
                if ef == 'echo': dmg += min(3, len(foes) - 1 + (s.wave[l][1 - h.team] if l is not None else 0))
                if ef == 'rot':
                    for f in foes:
                        if not f.dead: s.damage(h, f, dmg)
                    h.hp -= 1
                else:
                    s.damage(h, tgt, dmg)
                if ef.startswith('execute') and not tgt.dead and tgt.hp <= 4: s.damage(h, tgt, tgt.hp + 99)
                if 'drain' in ef: h.hp = min(h.mhp(), h.hp + dmg // 2)
                if not tgt.dead:
                    if 'stun' in ef: tgt.stun = True
                    if ef == 'silence': tgt.silence = True
                if cl and l is not None: s.clear(h, l, cl)
                if tgt.dead:
                    foes = [f for f in foes if not f.dead]
                    if not foes: break
                    tgt = min(foes, key=lambda e: e.hp)
        if a > 0 and not tgt.dead:
            for i in range(s.attacks(h)):
                if tgt.dead: break
                bonus = 1 if h.buff == 'atk+1' else (h.st('atk') if h.buff == 'totem' and i == 0 else 0)
                s.damage(h, tgt, h.st('atk') + bonus, attack=True)
            a -= 1
        h.buff = None
        if a > 0 and not h.dead and tgt.dead: s.lane_actions(h, a, sil)

    def clear(s, h, l, n):
        foe = 1 - h.team; k = min(n, s.wave[l][foe]); s.wave[l][foe] -= k; h.gold += k; h.lasthits += k; s.stats['lasthits'] += k

    def lane_actions(s, h, a, sil):
        if not (isinstance(h.loc, tuple) and h.loc[0] == 'lane'): return
        l = h.loc[1]; foe = 1 - h.team
        if not sil:
            for k, d, cd, cl, ef in sorted(h.d['ab'], key=lambda x: -x[3]):
                if a <= 1 or s.wave[l][foe] < 2: break
                if cl >= 2 and h.ready(k) and k != 'R': s.clear(h, l, cl); h.cd[k] = cd; a -= 1
        attacked = False
        while a > 0 and not attacked:   # rule: at most one Attack action per activation
            attacked = True
            if s.wave[l][foe] > 0:
                s.clear(h, l, s.attacks(h)); a -= 1; continue
            key = s.tower_at_front(l, h.team)
            if key and s.wave[l][h.team] > 0:
                if key in s.towers and s.towers[key] > 0:
                    s.towers[key] -= SIEGE * s.attacks(h) * (2 if h.buff == 'totem' else 1); s.tower_check(key)
                a -= 1; continue
            if s.core_open(foe) and s.front[l] * s.sgn(foe) >= s.M['N'] and s.wave[l][h.team] > 0:
                s.core[foe] -= SIEGE * s.attacks(h); a -= 1
                if s.core[foe] <= 0 and s.winner is None: s.winner, s.end = h.team, 'core'
                continue
            break

    def tower_check(s, key):
        if s.towers[key] <= 0 and key not in getattr(s, 'fallen', set()):
            s.fallen = getattr(s, 'fallen', set()) | {key}
            s.vp[1 - key[0]] += 3; s.stats['towers'] += 1
            if s.stats['first_tower'] is None: s.stats['first_tower'] = s.round
            for x in s.heroes:
                if x.team != key[0]: x.gold += 2

    def shop(s, h):
        for it in BUILD[h.key]:
            if it in h.items and it not in ('sword',): continue
            if it in UPG and UPG[it] in h.items:
                c = ITEMS[it][0] - ITEMS[UPG[it]][0]
                if h.gold >= c: h.gold -= c; h.items.remove(UPG[it]); h.items.append(it); continue
                break
            if it in h.items: continue
            if len(h.items) >= 3: break
            if h.gold >= ITEMS[it][0]: h.gold -= ITEMS[it][0]; h.items.append(it); continue
            break

    # ---------------- lane phase ----------------
    def lane_phase(s):
        M = s.M
        for l in range(M['lanes']):
            for t in (0, 1): s.wave[l][t] = min(CAP, s.wave[l][t] + SPAWN(s.round) + s.brood[t])
            pw = [s.wave[l][t] + sum(1 for h in s.heroes if h.team == t and h.loc == ('lane', l) and not h.dead) + (1 if s.altars and l < len(s.altars) and s.altars[l] == t else 0) for t in (0, 1)]
            if pw[0] == pw[1]: continue
            w = 0 if pw[0] > pw[1] else 1; lo = 1 - w; D = pw[w] - pw[lo]
            s.wave[l][lo] = max(0, s.wave[l][lo] - D)
            key = s.tower_at_front(l, w)
            if key:
                s.wave[l][w] = max(0, s.wave[l][w] - TOWER_KILLS)
                s.towers[key] -= s.wave[l][w]; s.tower_check(key)
                if s.towers[key] <= 0: s.wave[l][w] = max(0, s.wave[l][w] - 0)
            elif s.front[l] * s.sgn(lo) >= M['N']:
                if s.core_open(lo):
                    s.wave[l][w] = max(0, s.wave[l][w] - TOWER_KILLS); s.core[lo] -= s.wave[l][w]
                    if s.core[lo] <= 0 and s.winner is None: s.winner, s.end = w, 'core'
            elif s.wave[l][lo] == 0:
                s.front[l] += s.sgn(lo)
        for t in (0, 1): s.brood[t] = 0
        # objectives retaliate already in hit_obj; spawn timers
        for o in s.obj.values():
            if not o['up']:
                if s.round + 1 >= o['first'] and o['timer'] <= 1: o['up'] = True; o['cur'] = o['hp']
                else: o['timer'] -= 1
        for k in s.camps:
            if s.camps[k] > 0: s.camps[k] -= 1
        for i, ow in enumerate(s.altars):
            if ow >= 0:
                for h in s.heroes:
                    if h.team == ow: h.gold += 1

    def play(s):
        M = s.M
        for o in s.obj.values():
            if o['first'] <= 1: o['up'] = True; o['cur'] = o['hp']
        for r in range(1, M['limit'] + 1):
            s.round = r; s.level = level_of(r, M['start_lvl'])
            for h in s.heroes:
                h.gold += 1; h.shield = 0
                if not h.dead: h.hp = min(h.hp + (LVL_BONUS[s.level]['hp'] - LVL_BONUS[level_of(r - 1, M['start_lvl']) if r > 1 else s.level]['hp']), h.mhp())
            first = (0 if s.vp[0] < s.vp[1] else 1 if s.vp[1] < s.vp[0] else (r + 1) % 2) if ORDER == 'trail' else (0 if s.vp[0] > s.vp[1] else 1 if s.vp[1] > s.vp[0] else (r + 1) % 2) if ORDER == 'lead' else (r + 1) % 2
            A = [h for h in s.heroes if h.team == first]; B = [h for h in s.heroes if h.team != first]
            s.rng.shuffle(A); s.rng.shuffle(B)
            gs = 2 if s.size >= 3 else 1; DA = [A[i:i+gs] for i in range(0, len(A), gs)]; DB = [B[i:i+gs] for i in range(0, len(B), gs)]
            seq = []
            for x, y in zip(DA, DB): seq += x + y
            if True:
                for h in seq:
                    s.activate(h)
                    if s.winner is not None: return s.result()
                    if max(s.vp) >= s.vpt: s.winner = 0 if s.vp[0] >= s.vpt else 1; s.end = 'vp'; return s.result()
            s.lane_phase()
            for h in s.heroes:
                for k in h.cd: h.cd[k] = max(0, h.cd[k] - 1)
            if s.winner is not None: return s.result()
            if max(s.vp) >= s.vpt: s.winner = 0 if s.vp[0] > s.vp[1] else 1; s.end = 'vp'; return s.result()
        if s.vp[0] != s.vp[1]: s.winner = 0 if s.vp[0] > s.vp[1] else 1; s.end = 'limit'
        else:
            # tiebreak: towers destroyed, then core HP, then team that went second in the last round
            s.end = 'limit-tiebreak'
            tw = [sum(1 for k, v in s.towers.items() if k[0] == 1 - t and v <= 0) for t in (0, 1)]
            kd = [sum(h.kills for h in s.heroes if h.team == t) for t in (0, 1)]
            fr = [sum(s.front[l] * (1 if t == 0 else -1) for l in range(M['lanes'])) for t in (0, 1)]
            key = [(tw[t], fr[t], kd[t]) for t in (0, 1)]
            s.winner = 0 if key[0] > key[1] else 1 if key[1] > key[0] else -1
        return s.result()

    def result(s):
        return dict(round=s.round, end=s.end, winner=s.winner, vp=list(s.vp), acts=s.stats['acts'], **{k: v for k, v in s.stats.items() if k != 'acts'})

def summarize(mk, size, n=500, seed0=1, sec_h=40, sec_b=10, lane_sec=20):
    R = [Game(mk, size, seed0 + i).play() for i in range(n)]
    rounds = sorted(r['round'] for r in R)
    ends = {}
    for r in R: ends[r['end']] = ends.get(r['end'], 0) + 1
    acts = statistics.mean(r['acts'] for r in R)
    lanes = MAPS[mk]['lanes']
    # minutes: all heroes human-controlled at sec_h per activation, + lane phase (lane_sec + 5/lane) per round
    slots = 2 * size if size <= 2 else 2 * ((size + 1) // 2)   # 1v1/2v2 single activations, 3v3/4v4 duo turns
    slot_sec = 45 if size <= 2 else 55
    lane = 15 + 5 * lanes
    mins = statistics.mean(rounds) * (slots * slot_sec + lane) / 60
    bots_only = statistics.mean(rounds) * (2 * size * 3 + lane) / 60
    ft = [r['first_tower'] for r in R if r['first_tower']]
    return dict(map=mk, size=f'{size}v{size}', rounds_mean=round(statistics.mean(rounds), 1), p10=rounds[n // 10], p90=rounds[9 * n // 10],
                ends={k: f'{round(100 * v / n)}%' for k, v in ends.items()}, minutes_human=round(mins), minutes_1human_rest_bots=round(statistics.mean(rounds) * ((2*size-1)*4 + 45 + 15 + 5*lanes) / 60), acts=round(acts, 1),
                kills=round(statistics.mean(r['kills'] for r in R), 1), towers=round(statistics.mean(r['towers'] for r in R), 1),
                first_tower=round(statistics.mean(ft), 1) if ft else None, objs=round(statistics.mean(r['objs'] for r in R), 1),
                lasthits=round(statistics.mean(r['lasthits'] for r in R), 1), dive_shots=round(statistics.mean(r['dive_shots'] for r in R), 1),
                team0_win=f"{round(100 * sum(r['winner'] == 0 for r in R) / n)}%", team1_win=f"{round(100 * sum(r['winner'] == 1 for r in R) / n)}%")

if __name__ == '__main__':
    for mk, sizes in (('rift', (1, 2, 3, 4)), ('hollow', (1, 2, 3, 4)), ('bridge', (1, 2, 3, 4))):
        for sz in sizes: print(json.dumps(summarize(mk, sz)))
