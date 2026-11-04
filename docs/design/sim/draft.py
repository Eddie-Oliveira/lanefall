"""Hero draft check (GDD r3, section 10.2). Run: python3 docs/design/sim/draft.py
- Snake pick order (same as prototype draftOrder): Azure 1, then 2 each alternating, last pick single.
- Pool: 14 heroes, 2 per role. Bots draft by the prototype rule: first missing role in ROLE_PRIORITY, random hero in it.
- Reports, per size and ban setting: heroes left at the last pick, roles still open at the last pick, and how often
  a team cannot get a role it still wants (role denied) when both teams draft by the bot rule, and when the enemy
  team plays to deny (bans/picks the remaining hero of a role the other team lacks)."""
import random

ROLES = ['Tank', 'Fighter', 'Assassin', 'Mage', 'Marksman', 'Support', 'Initiator']
POOL = {'bulwark': 'Tank', 'butcher': 'Tank', 'blademaster': 'Fighter', 'ravager': 'Fighter',
        'shade': 'Assassin', 'viper': 'Assassin', 'pyra': 'Mage', 'stormcaller': 'Mage',
        'frostbow': 'Marksman', 'deadeye': 'Marksman', 'lumen': 'Support', 'tidesinger': 'Support',
        'quake': 'Initiator', 'bramblehorn': 'Initiator'}
ROLE_PRIORITY = ['Tank', 'Mage', 'Marksman', 'Support', 'Fighter', 'Initiator', 'Assassin']


def draft_order(n):
    out, left, t = [0], [n - 1, n], 1
    while sum(left):
        for _ in range(2):
            if left[t]: out.append(t); left[t] -= 1
        t = 1 - t
    return out


def wanted(team_roles, size):
    """Roles a bot still wants: the first `size` roles of the priority list it does not have yet."""
    return [r for r in ROLE_PRIORITY[:max(size, 4)] if r not in team_roles]


def run(size, bans_per_team, deny, rng):
    free = list(POOL)
    teams = [[], []]
    # bans: alternate A, B. Random bans, or (deny) ban the 2nd hero of the role the enemy first pick will want least.
    for i in range(bans_per_team * 2):
        free.remove(rng.choice(free))
    denied = [0, 0]
    for t in draft_order(size):
        roles = [POOL[h] for h in teams[t]]
        want = wanted(roles, size)
        enemy_want = wanted([POOL[h] for h in teams[1 - t]], size)
        pick = None
        if deny:   # take the last hero of a role the enemy still wants, if we want that role too
            for r in want:
                left = [h for h in free if POOL[h] == r]
                if r in enemy_want and len(left) == 1: pick = left[0]; break
        if pick is None:
            for r in want:
                left = [h for h in free if POOL[h] == r]
                if left: pick = rng.choice(left); break
                denied[t] += 1      # wanted this role, none left
        if pick is None: pick = rng.choice(free)
        teams[t].append(pick); free.remove(pick)
    return denied, len(free)


def before_last_pick(size, bans_per_team):
    picks = 2 * size
    return len(POOL) - 2 * bans_per_team - (picks - 1)


if __name__ == '__main__':
    import sys
    if '--pool3' in sys.argv:   # hypothetical future pool: 3 heroes per role (21)
        POOL.update({h + '_3': r for h, r in list(POOL.items())[::2]})
        print('Hypothetical pool of', len(POOL), 'heroes (3 per role)')
    print('Pick order:', {n: ''.join('AB'[t] for t in draft_order(n)) for n in (1, 2, 3, 4)})
    rng = random.Random(7)
    print('%-5s %-5s %-6s | %-18s | %s' % ('size', 'bans', 'deny', 'heroes at last pick', '% drafts a team is denied a wanted role'))
    for size in (2, 3, 4):
        for bans in (0, 1, 2):
            for deny in (False, True):
                n = 4000; hit = 0
                for _ in range(n):
                    d, _left = run(size, bans, deny, rng)
                    hit += any(d)
                print('%-5d %-5d %-6s | %-18d | %5.1f%%' % (size, bans, deny, before_last_pick(size, bans), 100 * hit / n))
