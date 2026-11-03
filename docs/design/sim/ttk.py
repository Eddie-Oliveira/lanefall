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
