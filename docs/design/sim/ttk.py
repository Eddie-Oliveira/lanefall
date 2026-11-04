"""Time-to-kill: activations a hero needs to KO each target, fresh cooldowns, 3 actions (2 abilities + 1 Attack,
marksman Attack hits twice), no shields/heals. Level 1 no items; level 5 with 3 items (bot build).
r3: adds the six second-per-role heroes (GDD section 10) and the effects they need:
  poison:n  = n (+POW) damage at the start of each of the target's next 3 activations (does not stack: keep higher, refresh)
  missing   = + 2 per 5 missing HP (40%, rounded down), resolved last in the activation
  armor     = this ability's damage is reduced by ARM like an Attack (Deadeye's Headshot)
Poison that KOs during the target's own activation counts as a KO before the attacker's next activation."""
import lanefall_sim as L

# ---- r3 heroes (v1 numbers, GDD section 10). Tuple: key, dmg, cd, wave clear, effect -------------------------------
NEW = {
 'ravager':    dict(hp=15, atk=2, rng=1, arm=1, spd=3, role='Fighter', ab=[('Q',2,1,2,'cleave'),('W',2,2,0,'slow2'),('E',1,2,1,'slow'),('R',3,4,0,'missing')]),
 'viper':      dict(hp=10, atk=2, rng=1, arm=0, spd=4, role='Assassin', ab=[('Q',2,1,0,'poison:1'),('W',0,2,0,'poison:1'),('E',0,3,0,'free'),('R',3,4,0,'poison:3')]),
 'stormcaller':dict(hp=10, atk=1, rng=2, arm=0, spd=3, role='Mage', ab=[('Q',3,1,2,'chain'),('W',1,3,2,'silence'),('E',1,2,0,'knock'),('R',3,4,3,None)]),
 'deadeye':    dict(hp=9,  atk=2, rng=4, arm=0, spd=3, role='Marksman', ab=[('Q',1,2,2,None),('W',1,2,1,'root'),('E',0,3,0,'free'),('R',5,4,0,'armor')]),
 'tidesinger': dict(hp=12, atk=1, rng=2, arm=0, spd=3, role='Support', ab=[('Q',1,2,0,'stun'),('W',0,2,0,'heal:2'),('E',0,2,0,'shield:1'),('R',2,4,2,'tide')]),
 'bramblehorn':dict(hp=15, atk=2, rng=1, arm=2, spd=3, role='Initiator', ab=[('Q',2,2,0,'stun'),('W',0,2,0,'shield:3'),('E',0,3,0,'free'),('R',2,4,3,'stun')]),
}
NEW_BUILD = {'ravager':['sword','vamp','ruby','plate'], 'viper':['sword','edge','tome','blink'],
             'stormcaller':['tome','staff','cloth','angel'], 'deadeye':['sword','vamp','sword','edge'],
             'tidesinger':['tome','staff','ruby','veil'], 'bramblehorn':['ruby','plate','cloth','thorn']}
OLD = list(L.H)
POISON_POW = False   # r3 rule: POW is added to the hit, not to Poison ticks
L.H.update(NEW); L.BUILD.update(NEW_BUILD)

def burst_seq(h, tgt, acts, trace=False):
    cds = {k: 0 for k in h.cd}
    hp = tgt.mhp(); M = hp; arm = max(0, tgt.st('arm') - h.st('pierce')); P = h.st('pow')
    poison = [0, 0]                                   # [per tick, ticks left]
    for act in range(1, 8):
        a = 3; picks = []
        for ab in sorted(h.d['ab'], key=lambda x: -x[1] - (3 * x[4].count('poison') if x[4] else 0)):
            k, d, cd, cl, ef = ab
            if a <= 1: break
            if (d > 0 or (ef or '').startswith('poison')) and cds[k] == 0 and not (k == 'R' and h.G.level < 3):
                picks.append(ab); cds[k] = cd; a -= 1
        picks.sort(key=lambda x: x[4] == 'missing')   # missing-HP hit goes last
        for k, d, cd, cl, ef in [p for p in picks if p[4] != 'missing']:
            x = d + P if d else 0
            if ef == 'armor': x = max(1, x - arm)
            if ef and ef.startswith('execute') and hp - x <= 4: x = hp
            if ef and ef.startswith('poison'):
                n = int(ef.split(':')[1]) + (P if POISON_POW else 0)
                if n >= poison[0]: poison = [n, 3]
            hp -= x
        for _ in range(2 if h.d['role'] == 'Marksman' else 1):
            hp -= max(1, h.st('atk') - arm)
        for k, d, cd, cl, ef in [p for p in picks if p[4] == 'missing']:
            hp -= d + P + (2 * (M - hp)) // 5
        if hp <= 0: return act
        if poison[1] > 0: hp -= poison[0]; poison[1] -= 1      # target's activation: poison ticks
        if hp <= 0: return act
        for k in cds: cds[k] = max(0, cds[k] - 1)
    return 9

def make(lvl, items):
    G = L.Game('rift', 1, 1); G.level = lvl
    hs = {k: L.Hero(k, 0, G) for k in L.H}
    if items:
        for k, h in hs.items():
            h.items = []
            for it in L.BUILD[k]:
                if it in L.UPG and L.UPG[it] in h.items: h.items.remove(L.UPG[it])
                if len(h.items) < 3: h.items.append(it)
    return hs

for lvl, items in ((1, False), (3, False), (5, True)):
    hs = make(lvl, items)
    print(f'\nLevel {lvl}{" + 3 items" if items else ""}: activations to KO (rows attacker, cols target)')
    print('%-12s' % '', ' '.join('%5s' % k[:5] for k in L.H), '|  avg')
    for a in L.H:
        row = [burst_seq(hs[a], hs[t], 3) for t in L.H]
        print('%-12s' % a, ' '.join('%5d' % v for v in row), '| %4.1f' % (sum(row) / len(row)))
    cols = [sum(burst_seq(hs[a], hs[t], 3) for a in L.H if a not in ('lumen', 'tidesinger')) / (len(L.H) - 2) for t in L.H]
    print('%-12s' % 'survive avg', ' '.join('%5.1f' % c for c in cols), ' (activations to KO it, supports excluded)')
    print('HP:', {k: hs[k].mhp() for k in L.H})
    print('ARM:', {k: hs[k].st('arm') for k in L.H})

# ---------------------------------------------------------------------------------------------------------------
# Shade v1.0-draft r2 (Eddie playtest): Death Mark execute = max HP // 5 (20%; alt 15% = max HP * 3 // 20),
# Shadow Reset = once per activation, a Q/W/E KO of a hero (or neutral claim / wave wipe) refunds 1 action.
# Positioning ignored (Shadow Step is her gap closer). Prints the highest CURRENT HP Shade KOs in one activation.
def shade_report():
    rules = {'v1 flat <=4': lambda m: 4, 'v0.3 35%': lambda m: int(m * 0.35), '20% (draft)': lambda m: m // 5,
             '15% (alt)': lambda m: m * 3 // 20}
    for lvl, items in ((3, False), (5, True)):
        G = L.Game('rift', 1, 1); G.level = lvl
        hs = {k: L.Hero(k, 0, G) for k in L.H}
        if items:
            for k, h in hs.items():
                h.items = []
                for it in L.BUILD[k]:
                    if it in L.UPG and L.UPG[it] in h.items: h.items.remove(L.UPG[it])
                    if len(h.items) < 3: h.items.append(it)
        s = hs['shade']; P = s.st('pow')
        q = w = 2 + P; r = 4 + P
        print(f'\nShade L{lvl}{" + 3 items" if items else ""}: POW {P}, ATK {s.st("atk")}, Q {q}, W {w}, R {r}')
        print('%-12s %5s %5s | %s' % ('target', 'maxHP', 'ARM', '  '.join('%-14s' % n for n in rules)))
        for t in ('pyra', 'frostbow', 'lumen', 'blademaster', 'bulwark'):
            tg = hs[t]; M = tg.mhp(); atk = max(1, s.st('atk') - max(0, tg.st('arm') - s.st('pierce')))
            cells = []
            for n, f in rules.items():
                thr = f(M)
                one = q + w + r + thr - 0                          # Q, W, R (best 3 incl. R; Attack <= Q here)
                one = max(one, sorted([q, w, atk])[-1] + sorted([q, w, atk])[-2] + r + thr)
                cells.append('%2d/%2d thr %d' % (one, M, thr))
            print('%-12s %5d %5d | %s' % (t, M, tg.st('arm'), '  '.join('%-14s' % c for c in cells)))
        # double KO: target A (any hero) at <= Q dmg; then hero B. With reset Shade keeps 3 actions, without 2.
        tg = hs['pyra']; M = tg.mhp(); atk = max(1, s.st('atk') - max(0, tg.st('arm') - s.st('pierce')))
        thr = M // 5
        with_r = w + atk + r + thr; without = max(w + r, atk + r, w + atk) + thr
        print(f'Double KO vs Pyra-class (max {M}): Q KOs hero A at <= {q} HP, then hero B KO\'d at <= {with_r} HP'
              f' with reset (W+Attack+R) vs <= {without} without reset (2 actions).')
        print(f'  Reset on every last hit would give 4 actions every lane turn: Q last hit + W/Attack/R on a hero'
              f' = {w + atk + r} dmg + exec vs {max(w + r, atk + r)} with 3 actions.')
shade_report()
