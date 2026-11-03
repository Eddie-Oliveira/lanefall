"""Time-to-kill: activations a hero needs to KO each target, fresh cooldowns, 3 actions (2 abilities + 1 Attack,
marksman 2 attacks), no shields/heals. Level 1 no items; level 5 with 3 items (bot build)."""
import lanefall_sim as L
def burst_seq(h, tgt, acts):
    total = 0; cds = {k: 0 for k in h.cd}; out = []
    hp = tgt.mhp()
    for act in range(1, 8):
        a = 3; dmg = 0
        for k, d, cd, cl, ef in sorted(h.d['ab'], key=lambda x: -x[1]):
            if a <= 1: break
            if d > 0 and cds[k] == 0 and not (k == 'R' and h.G.level < 3):
                x = d + h.st('pow')
                if ef and ef.startswith('execute') and hp - dmg - x <= 4: x = hp - dmg
                dmg += x; cds[k] = cd; a -= 1
        for _ in range(2 if h.d['role'] == 'Marksman' else 1):
            dmg += max(1, h.st('atk') - max(0, tgt.st('arm') - h.st('pierce')))
        hp -= dmg
        for k in cds: cds[k] = max(0, cds[k] - 1)
        if hp <= 0: return act
    return 9
import random
rows = []
for lvl, items in ((1, False), (5, True)):
    G = L.Game('rift', 1, 1); G.level = lvl
    hs = {k: L.Hero(k, 0, G) for k in L.H}
    if items:
        for k, h in hs.items():
            h.items = []
            for it in L.BUILD[k]:
                if it in L.UPG and L.UPG[it] in h.items: h.items.remove(L.UPG[it])
                if len(h.items) < 3: h.items.append(it)
    print(f'\nLevel {lvl}{" + 3 items" if items else ""}: activations to KO (rows attacker, cols target)')
    print('%-12s' % '', ' '.join('%5s' % k[:5] for k in L.H))
    for a in L.H:
        print('%-12s' % a, ' '.join('%5d' % burst_seq(hs[a], hs[t], 3) for t in L.H))
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
