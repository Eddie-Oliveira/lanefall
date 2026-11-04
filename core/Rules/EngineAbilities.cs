using System;
using System.Collections.Generic;

namespace Lanefall.Core
{
    public static partial class Engine
    {
        // ------------------------------------------------------------------ geometry helpers

        /// <summary>Open hexes within radius of a centre (areas: radius 1 = 7 hexes, radius 2 = 19, GDD 6.8).</summary>
        public static List<Hex> AreaHexes(GameState s, Hex centre, int radius)
        {
            var list = new List<Hex>();
            foreach (var h in Hex.Range(centre, radius)) if (s.Map.IsOpen(h)) list.Add(h);
            return list;
        }

        /// <summary>Hexes of a Line ability: up to len hexes in a direction; a wall or the board edge stops it (GDD 3).</summary>
        public static List<Hex> LineHexes(GameState s, Hex origin, int dir, int len)
        {
            var list = new List<Hex>();
            for (int k = 1; k <= len; k++)
            {
                var h = origin + Hex.Directions[dir] * k;
                if (!s.Map.IsOpen(h)) break;
                list.Add(h);
            }
            return list;
        }

        static List<HeroState> EnemyHeroesOn(GameState s, HeroState caster, List<Hex> hexes)
        {
            var list = new List<HeroState>();
            foreach (var v in s.Heroes)
            {
                if (v.Team != caster.Team && v.OnBoard && !v.KO && hexes.Contains(v.Pos)) list.Add(v);
            }
            return list;
        }

        static List<HeroState> AllyHeroesOn(GameState s, HeroState caster, List<Hex> hexes)
        {
            var list = new List<HeroState>();
            foreach (var v in s.Heroes)
            {
                if (v.Team == caster.Team && v.OnBoard && !v.KO && hexes.Contains(v.Pos)) list.Add(v);
            }
            return list;
        }

        static List<NeutralState> NeutralsOn(GameState s, List<Hex> hexes)
        {
            var list = new List<NeutralState>();
            foreach (var n in s.Neutrals) if (n.Alive && hexes.Contains(n.Hex)) list.Add(n);
            return list;
        }

        /// <summary>
        /// "Wave N": kill up to N enemy minions in a clash zone the ability touches (any of its hexes within 2 of a
        /// lane's Front). GDD-AMBIGUOUS: if several clash zones are touched, the N kills are shared in lane order.
        /// </summary>
        static int WaveClear(GameState s, HeroState h, List<Hex> touched, int n)
        {
            if (n <= 0) return 0;
            int left = n, total = 0;
            for (int lane = 0; lane < s.Lanes.Length && left > 0; lane++)
            {
                if (s.Lanes[lane].Wave[1 - h.Team] <= 0) continue;
                var fh = FrontHex(s, lane);
                bool touch = false;
                foreach (var x in touched) if (Hex.Distance(x, fh) <= ClashRadius) { touch = true; break; }
                if (!touch) continue;
                int k = KillMinions(s, h, lane, left);
                left -= k;
                total += k;
            }
            return total;
        }

        static Hex TargetHex(GameState s, Target t)
        {
            switch (t.Type)
            {
                case TargetType.Hero: return s.Heroes[t.Index].Pos;
                case TargetType.Neutral: return s.Neutrals[t.Index].Hex;
                case TargetType.Wave: return FrontHex(s, t.Index);
                case TargetType.Structure: return s.Structures[t.Index].Hex;
                default: return t.Hex;
            }
        }

        // ------------------------------------------------------------------ validation

        static string ValidateAbility(GameState s, HeroState h, GameAction a)
        {
            if (a.Slot < 0 || a.Slot > 3) return "bad ability slot";
            var def = h.Def.Abilities[a.Slot];
            if (s.Act.AbilityUsed[a.Slot]) return "ability already used this activation";
            if (h.Cd[a.Slot] > 0) return "on cooldown";
            if (a.Slot == 3 && s.Level < 3) return "ultimate unlocks at level 3";
            if (s.Act.Silenced) return "silenced";
            if (!def.Free && ActionsLeft(s) <= 0) return "no actions left";
            return ValidateAbilityTarget(s, h, def, a);
        }

        static string ValidateEnemyUnit(GameState s, HeroState h, AbilityDef def, Target t, bool needSight)
        {
            Hex at;
            switch (t.Type)
            {
                case TargetType.Hero:
                    {
                        if (t.Index < 0 || t.Index >= s.Heroes.Count) return "bad hero";
                        var v = s.Heroes[t.Index];
                        if (v.Team == h.Team) return "not an enemy";
                        if (!v.OnBoard || v.KO) return "target not on the board";
                        if (v.Hidden) return "target is Hidden";
                        at = v.Pos;
                        break;
                    }
                case TargetType.Neutral:
                    {
                        if (def.HeroOnly) return "heroes only";
                        if (t.Index < 0 || t.Index >= s.Neutrals.Count) return "bad neutral";
                        var n = s.Neutrals[t.Index];
                        if (!n.Alive) return "neutral not up";
                        at = n.Hex;
                        break;
                    }
                case TargetType.Wave:
                    {
                        if (!def.AllowWaveTarget) return "cannot target the wave";
                        if (t.Index < 0 || t.Index >= s.Lanes.Length) return "bad lane";
                        if (s.Lanes[t.Index].Wave[1 - h.Team] <= 0) return "no enemy minions";
                        at = FrontHex(s, t.Index);
                        break;
                    }
                default: return "needs an enemy target";
            }
            if (Hex.Distance(h.Pos, at) > def.Range) return "out of range";
            if (needSight && !RangedSightOk(s, h.Pos, at)) return "no line of sight";
            return null;
        }

        static Hex HexOf(GameAction a, Target t)
        {
            return t.Type == TargetType.Hex ? t.Hex : a.Hex;
        }

        static string ValidateAbilityTarget(GameState s, HeroState h, AbilityDef def, GameAction a)
        {
            switch (def.Kind)
            {
                case TargetKind.None:
                    return null;
                case TargetKind.EnemyUnit:
                    return ValidateEnemyUnit(s, h, def, a.Target, true);
                case TargetKind.AllyHero:
                    {
                        var t = a.Target;
                        if (t.Type != TargetType.Hero || t.Index < 0 || t.Index >= s.Heroes.Count) return "needs an allied hero";
                        var v = s.Heroes[t.Index];
                        if (v.Team != h.Team) return "not an ally";
                        if (!v.OnBoard || v.KO) return "ally not on the board";
                        if (Hex.Distance(h.Pos, v.Pos) > def.Range) return "out of range";
                        return null; // ally effects never need LoS (GDD 3)
                    }
                case TargetKind.HexArea:
                    {
                        if (a.Target.Type != TargetType.Hex) return "needs a target hex";
                        var c = a.Target.Hex;
                        if (!s.Map.IsOpen(c)) return "target hex must be open (not a wall)";
                        if (Hex.Distance(h.Pos, c) > def.Range) return "out of range";
                        if (!RangedSightOk(s, h.Pos, c)) return "no line of sight";
                        return null;
                    }
                case TargetKind.Line:
                    if (a.Target.Type != TargetType.Direction || a.Target.Index < 0 || a.Target.Index > 5) return "needs a direction 0..5";
                    return null;
                case TargetKind.Dash:
                    {
                        if (s.Act.Rooted) return "rooted";
                        var to = HexOf(a, a.Target);
                        bool throughEnemies = def.Id == AbilityId.Tumble;
                        if (!Reachable(s, h, def.Range, throughEnemies).Contains(to)) return "hex not reachable";
                        return null;
                    }
                case TargetKind.Jump:
                    {
                        if (s.Act.Rooted) return "rooted";
                        var to = HexOf(a, a.Target);
                        int d = Hex.Distance(h.Pos, to);
                        if (d < 1 || d > def.Range) return "out of range";
                        if (!IsFree(s, to)) return "hex not free";
                        if (!HasLineOfSight(s.Map, h.Pos, to)) return "a wall is on the line";
                        return null;
                    }
                case TargetKind.TeleportToEnemy:
                    {
                        if (s.Act.Rooted) return "rooted";
                        // Shadow Step ignores walls (GDD 3); Omnislash needs LoS to its target like any ranged ability.
                        string e = ValidateEnemyUnit(s, h, def, a.Target, def.Id != AbilityId.ShadowStep);
                        if (e != null) return e;
                        var tgt = TargetHex(s, a.Target);
                        if (a.Target2.Type != TargetType.Hex) return "needs a landing hex";
                        var land = a.Target2.Hex;
                        if (Hex.Distance(land, tgt) != 1) return "landing hex must be adjacent to the target";
                        if (land != h.Pos && !IsFree(s, land)) return "landing hex not free";
                        return null;
                    }
                case TargetKind.Step1:
                    {
                        var to = HexOf(a, a.Target);
                        if (to == h.Pos) return null;
                        if (s.Act.Rooted) return "rooted";
                        if (Hex.Distance(h.Pos, to) != 1 || !IsFree(s, to)) return "move 1 hex to a free hex";
                        return null;
                    }
                case TargetKind.Devour:
                    {
                        var t = a.Target;
                        if (t.Type == TargetType.Wave)
                        {
                            if (t.Index < 0 || t.Index >= s.Lanes.Length) return "bad lane";
                            if (s.Lanes[t.Index].Wave[1 - h.Team] <= 0) return "no enemy minions";
                            if (Hex.Distance(h.Pos, FrontHex(s, t.Index)) > 1) return "wave not adjacent";
                            return null;
                        }
                        if (t.Type == TargetType.Neutral)
                        {
                            if (t.Index < 0 || t.Index >= s.Neutrals.Count) return "bad neutral";
                            var n = s.Neutrals[t.Index];
                            if (!n.Alive || n.Kind != NeutralKind.Wolf) return "only a wolf camp";
                            if (n.Hp > 4) return "wolf camp above 4 HP";
                            if (Hex.Distance(h.Pos, n.Hex) > 1) return "not adjacent";
                            return null;
                        }
                        return "needs an adjacent wave or wolf camp";
                    }
                case TargetKind.Charge:
                    {
                        if (a.Target.Type != TargetType.Direction || a.Target.Index < 0 || a.Target.Index > 5) return "needs a direction 0..5";
                        if (s.Act.Rooted) return "rooted";
                        Hex land; Target tgt;
                        if (!ChargeScan(s, h, a.Target.Index, def.Range, out land, out tgt)) return "no enemy to charge in that direction";
                        return null;
                    }
            }
            return "unknown targeting";
        }

        /// <summary>Charge: the first enemy unit within Range+1 in a straight line; land on the hex before it.</summary>
        static bool ChargeScan(GameState s, HeroState h, int dir, int range, out Hex land, out Target tgt)
        {
            land = h.Pos;
            tgt = Target.None;
            for (int k = 1; k <= range + 1; k++)
            {
                var hex = h.Pos + Hex.Directions[dir] * k;
                if (!s.Map.IsOpen(hex)) return false;
                var v = HeroAt(s, hex);
                if (v != null && v.Team != h.Team && !v.Hidden)
                {
                    tgt = Target.OfHero(v.Index);
                    land = h.Pos + Hex.Directions[dir] * (k - 1);
                    return k == 1 || IsFree(s, land);
                }
                var n = NeutralAt(s, hex);
                if (n != null)
                {
                    tgt = Target.OfNeutral(n.Index);
                    land = h.Pos + Hex.Directions[dir] * (k - 1);
                    return k == 1 || IsFree(s, land);
                }
                if (StructureAt(s, hex) != null) return false;
                if (v != null && v.Hidden && v.Team != h.Team) return false;
            }
            return false;
        }

        // ------------------------------------------------------------------ execution

        /// <summary>Damage to a targeted unit (ability damage ignores ARM, GDD 6.5). Returns the hero hit, or null.</summary>
        static HeroState HitUnit(GameState s, HeroState h, Target t, int dmg)
        {
            switch (t.Type)
            {
                case TargetType.Hero:
                    {
                        var v = s.Heroes[t.Index];
                        DamageHero(s, h.Index, v, dmg, DamageKind.Ability);
                        return v;
                    }
                case TargetType.Neutral:
                    DamageNeutral(s, h, s.Neutrals[t.Index], dmg);
                    return null;
                case TargetType.Wave:
                    KillMinions(s, h, t.Index, 1);
                    return null;
            }
            return null;
        }

        static void HitArea(GameState s, HeroState h, List<Hex> area, int dmg, Action<HeroState> onHero)
        {
            foreach (var v in EnemyHeroesOn(s, h, area))
            {
                DamageHero(s, h.Index, v, dmg, DamageKind.Ability);
                if (onHero != null && !v.KO) onHero(v);
            }
            foreach (var n in NeutralsOn(s, area)) DamageNeutral(s, h, n, dmg);
        }

        static void Knockback(GameState s, HeroState v, int dir, int n)
        {
            if (v.KO || v.Hidden) return;
            for (int i = 0; i < n; i++)
            {
                var next = v.Pos.Neighbor(dir);
                if (!IsFree(s, next)) break; // wall, unit or board edge stops it (GDD 6.8)
                MoveHero(s, v, next);
            }
        }

        static void PullToCentre(GameState s, HeroState v, Hex centre)
        {
            if (v.KO || v.Hidden) return;
            var best = v.Pos;
            int bestD = Hex.Distance(v.Pos, centre);
            var seen = new HashSet<Hex> { v.Pos };
            var frontier = new List<Hex> { v.Pos };
            for (int step = 0; step < 2; step++)
            {
                var next = new List<Hex>();
                foreach (var f in frontier)
                {
                    for (int dir = 0; dir < 6; dir++)
                    {
                        var nx = f.Neighbor(dir);
                        if (seen.Contains(nx) || !IsFree(s, nx)) continue;
                        seen.Add(nx);
                        next.Add(nx);
                    }
                }
                next.Sort(Hex.Compare);
                foreach (var c in next)
                {
                    int d = Hex.Distance(c, centre);
                    if (d < bestD) { bestD = d; best = c; }
                }
                frontier = next;
            }
            MoveHero(s, v, best);
        }

        static void ExecAbility(GameState s, HeroState h, GameAction a)
        {
            var def = h.Def.Abilities[a.Slot];
            s.Act.AbilityUsed[a.Slot] = true;
            h.Cd[a.Slot] = def.Cd;
            if (!def.Free) SpendAction(s);
            else s.Act.ShopOpen = false;
            int killsBefore = h.KillScore;
            int pow = Pow(s, h);
            Emit(s, EventType.AbilityUsed, h.Index, (int)def.Id, a.Slot);

            switch (def.Id)
            {
                // ---------------- Bulwark
                case AbilityId.ShieldBash:
                    {
                        var v = HitUnit(s, h, a.Target, 2 + pow);
                        if (v != null && !v.KO) ApplyStun(s, v);
                        break;
                    }
                case AbilityId.IronStance: ApplyShield(s, h, 4 + pow); break;
                case AbilityId.Charge:
                    {
                        Hex land; Target tgt;
                        ChargeScan(s, h, a.Target.Index, def.Range, out land, out tgt);
                        var path = new List<Hex> { h.Pos };
                        int steps = Hex.Distance(h.Pos, land);
                        for (int k = 1; k <= steps; k++) path.Add(h.Pos + Hex.Directions[a.Target.Index] * k);
                        path.Add(TargetHex(s, tgt));
                        MoveHero(s, h, land);
                        var v = HitUnit(s, h, tgt, 1 + pow);
                        if (v != null && !v.KO) ApplySlow(s, v, 1);
                        WaveClear(s, h, path, def.Wave);
                        break;
                    }
                case AbilityId.SolarFlare:
                    {
                        var area = AreaHexes(s, a.Target.Hex, 1);
                        HitArea(s, h, area, 3 + pow, v => ApplyStun(s, v));
                        WaveClear(s, h, area, def.Wave);
                        break;
                    }
                // ---------------- Butcher
                case AbilityId.MeatHook:
                    {
                        int dir = a.Target.Index;
                        var line = LineHexes(s, h.Pos, dir, def.Range);
                        foreach (var hex in line)
                        {
                            var v = HeroAt(s, hex);
                            if (v == null || v.Team == h.Team) continue;
                            DamageHero(s, h.Index, v, 3 + pow, DamageKind.Ability);
                            if (!v.KO && !v.Hidden)
                            {
                                // GDD 6.8 Pull: to the free hex next to you on the line (else the closest free one on it).
                                int k = Hex.Distance(h.Pos, v.Pos);
                                for (int j = 1; j < k; j++)
                                {
                                    var dest = h.Pos + Hex.Directions[dir] * j;
                                    if (IsFree(s, dest)) { MoveHero(s, v, dest); break; }
                                }
                            }
                            break;
                        }
                        break;
                    }
                case AbilityId.Rot:
                    {
                        var area = AreaHexes(s, h.Pos, 1);
                        HitArea(s, h, area, 1 + pow, null);
                        WaveClear(s, h, area, def.Wave);
                        // GDD-AMBIGUOUS: "you lose 1 HP" is HP loss (not damage), so Shield does not absorb it and it can KO.
                        if (!h.KO) LoseHp(s, h, 1);
                        break;
                    }
                case AbilityId.Devour:
                    {
                        bool ate = false;
                        if (a.Target.Type == TargetType.Wave) ate = KillMinions(s, h, a.Target.Index, 2) > 0;
                        else
                        {
                            var n = s.Neutrals[a.Target.Index];
                            ClaimNeutral(s, h, n);
                            ate = true;
                        }
                        if (ate) Heal(s, h, 3 + pow);
                        break;
                    }
                case AbilityId.Dismember:
                    {
                        int dmg = 5 + pow;
                        if (a.Target.Type == TargetType.Hero)
                        {
                            var v = s.Heroes[a.Target.Index];
                            int hpBefore = v.Hp;
                            int lost = DamageHero(s, h.Index, v, dmg, DamageKind.Ability);
                            if (lost > hpBefore) lost = hpBefore;
                            Heal(s, h, lost / 2);
                            if (!v.KO) ApplyStun(s, v);
                        }
                        else
                        {
                            var n = s.Neutrals[a.Target.Index];
                            int dealt = Math.Min(dmg, n.Hp);
                            DamageNeutral(s, h, n, dmg);
                            Heal(s, h, dealt / 2);
                        }
                        break;
                    }
                // ---------------- Blademaster
                case AbilityId.BladeSpin:
                    {
                        var area = AreaHexes(s, h.Pos, 1);
                        HitArea(s, h, area, 2 + pow, null);
                        WaveClear(s, h, area, def.Wave);
                        break;
                    }
                case AbilityId.BattleCry:
                    s.Act.AtkBonus += 1;
                    MoveHero(s, h, HexOf(a, a.Target));
                    break;
                case AbilityId.DecisiveStrike:
                    {
                        var v = HitUnit(s, h, a.Target, 3 + pow);
                        if (v != null && !v.KO) ApplySilence(s, v, 1);
                        break;
                    }
                case AbilityId.Omnislash:
                case AbilityId.ShadowStep:
                    {
                        MoveHero(s, h, a.Target2.Hex);
                        HitUnit(s, h, a.Target, (def.Id == AbilityId.Omnislash ? 6 : 2) + pow);
                        break;
                    }
                // ---------------- Ravager
                case AbilityId.Cleave:
                    {
                        var area = AreaHexes(s, h.Pos, 1);
                        int heroes = EnemyHeroesOn(s, h, area).Count;
                        HitArea(s, h, area, 2 + pow, null);
                        WaveClear(s, h, area, def.Wave);
                        if (!h.KO && heroes > 0) Heal(s, h, (2 + pow) * heroes);
                        break;
                    }
                case AbilityId.Hamstring:
                    {
                        var v = HitUnit(s, h, a.Target, 2 + pow);
                        if (v != null && !v.KO) ApplySlow(s, v, 2);
                        break;
                    }
                case AbilityId.Leap:
                    {
                        MoveHero(s, h, HexOf(a, a.Target));
                        var area = AreaHexes(s, h.Pos, 1);
                        HitArea(s, h, area, 1 + pow, v => ApplySlow(s, v, 1));
                        WaveClear(s, h, area, def.Wave);
                        break;
                    }
                case AbilityId.Guillotine:
                    {
                        int missing;
                        if (a.Target.Type == TargetType.Hero)
                        {
                            var v = s.Heroes[a.Target.Index];
                            missing = MaxHp(s, v) - v.Hp;
                        }
                        else
                        {
                            var n = s.Neutrals[a.Target.Index];
                            missing = n.MaxHp - n.Hp;
                        }
                        // GDD 6.9: +2 per full 5 HP missing when the ability resolves.
                        HitUnit(s, h, a.Target, 3 + pow + 2 * (missing / 5));
                        break;
                    }
                // ---------------- Shade
                case AbilityId.Shuriken:
                case AbilityId.BindingLight:
                    {
                        var line = LineHexes(s, h.Pos, a.Target.Index, def.Range);
                        var touched = new List<Hex>();
                        foreach (var hex in line)
                        {
                            touched.Add(hex);
                            var v = HeroAt(s, hex);
                            if (v != null && v.Team != h.Team)
                            {
                                DamageHero(s, h.Index, v, (def.Id == AbilityId.Shuriken ? 2 : 1) + pow, DamageKind.Ability);
                                if (def.Id == AbilityId.BindingLight && !v.KO) ApplyRoot(s, v, 1);
                                break;
                            }
                            var n = NeutralAt(s, hex);
                            if (n != null)
                            {
                                DamageNeutral(s, h, n, (def.Id == AbilityId.Shuriken ? 2 : 1) + pow);
                                break;
                            }
                        }
                        WaveClear(s, h, touched, def.Wave);
                        break;
                    }
                case AbilityId.SmokeVeil:
                    MoveHero(s, h, HexOf(a, a.Target));
                    h.Hidden = true;
                    Emit(s, EventType.Hidden, h.Index, h.Index, 0);
                    break;
                case AbilityId.DeathMark:
                    {
                        var v = HitUnit(s, h, a.Target, 4 + pow);
                        // GDD 10.3 (Q13): execute a hero left at or below 1/5 of its max HP (rounded down).
                        if (v != null && !v.KO && v.Hp <= MaxHp(s, v) / 5) KnockOut(s, v, h.Index);
                        break;
                    }
                // ---------------- Viper (trait: Poison n + POW, GDD 6.9 / Q17)
                case AbilityId.VenomFang:
                    {
                        var v = HitUnit(s, h, a.Target, 2 + pow);
                        if (v != null && !v.KO) ApplyPoison(s, h, v, 1);
                        break;
                    }
                case AbilityId.ToxicCloud:
                    {
                        var area = AreaHexes(s, a.Target.Hex, 1);
                        foreach (var v in EnemyHeroesOn(s, h, area))
                        {
                            ApplyPoison(s, h, v, 1);
                            ApplySlow(s, v, 1);
                        }
                        WaveClear(s, h, area, def.Wave);
                        break;
                    }
                case AbilityId.Slither:
                case AbilityId.Tumble:
                case AbilityId.RocketJump:
                    MoveHero(s, h, HexOf(a, a.Target));
                    break;
                case AbilityId.KissOfDeath:
                    {
                        var v = HitUnit(s, h, a.Target, 3 + pow);
                        if (v != null && !v.KO) { ApplySilence(s, v, 1); ApplyPoison(s, h, v, 2); }
                        break;
                    }
                // ---------------- Pyra
                case AbilityId.Fireball:
                    {
                        var area = AreaHexes(s, a.Target.Hex, 1);
                        HitArea(s, h, area, 2 + pow, null);
                        WaveClear(s, h, area, def.Wave);
                        break;
                    }
                case AbilityId.FlameRing:
                    {
                        var v = HitUnit(s, h, a.Target, 1 + pow);
                        if (v != null && !v.KO) ApplyRoot(s, v, 1);
                        break;
                    }
                case AbilityId.Scorch: HitUnit(s, h, a.Target, 3 + pow); break;
                case AbilityId.Pyroblast: HitUnit(s, h, a.Target, 6 + pow); break;
                // ---------------- Stormcaller
                case AbilityId.ChainLightning: ExecChain(s, h, a, pow); break;
                case AbilityId.StaticField:
                    {
                        var area = AreaHexes(s, a.Target.Hex, 1);
                        HitArea(s, h, area, 1 + pow, v => ApplySilence(s, v, 1));
                        WaveClear(s, h, area, def.Wave);
                        break;
                    }
                case AbilityId.Gust:
                case AbilityId.CrystalArrow:
                    {
                        int dir = a.Target.Index;
                        foreach (var hex in LineHexes(s, h.Pos, dir, def.Range))
                        {
                            var v = HeroAt(s, hex);
                            if (v == null || v.Team == h.Team) continue;
                            if (def.Id == AbilityId.Gust)
                            {
                                DamageHero(s, h.Index, v, 1 + pow, DamageKind.Ability);
                                Knockback(s, v, dir, 2);
                            }
                            else
                            {
                                DamageHero(s, h.Index, v, 3 + pow, DamageKind.Ability);
                                if (!v.KO) ApplyStun(s, v);
                            }
                            break;
                        }
                        break;
                    }
                case AbilityId.Thunderstorm:
                    {
                        var area = AreaHexes(s, a.Target.Hex, 2);
                        HitArea(s, h, area, 3 + pow, null);
                        WaveClear(s, h, area, def.Wave);
                        break;
                    }
                // ---------------- Frostbow
                case AbilityId.Volley:
                    {
                        var area = AreaHexes(s, a.Target.Hex, 1);
                        HitArea(s, h, area, 1 + pow, v => ApplySlow(s, v, 1));
                        WaveClear(s, h, area, def.Wave);
                        break;
                    }
                case AbilityId.FrostArrows: s.Act.FrostArrows = true; break;
                // ---------------- Deadeye
                case AbilityId.PiercingShot:
                case AbilityId.Fissure:
                    {
                        var line = LineHexes(s, h.Pos, a.Target.Index, def.Range);
                        if (def.Id == AbilityId.Fissure) HitArea(s, h, line, 1 + pow, v => ApplyStun(s, v));
                        else HitArea(s, h, line, 1 + pow, null);
                        WaveClear(s, h, line, def.Wave);
                        break;
                    }
                case AbilityId.SnareTrap:
                    {
                        var v = HitUnit(s, h, a.Target, 1 + pow);
                        if (v != null && !v.KO) ApplyRoot(s, v, 1);
                        break;
                    }
                case AbilityId.Headshot:
                    {
                        var v = s.Heroes[a.Target.Index];
                        // GDD 10.3: 5 dmg reduced by ARM (min 1) like an Attack; Piercing Edge applies; POW is added
                        // to the card number first (GDD 6.1).
                        int dmg = Math.Max(1, 5 + pow - Math.Max(0, Arm(v) - Pierce(h)));
                        DamageHero(s, h.Index, v, dmg, DamageKind.Ability);
                        break;
                    }
                // ---------------- Lumen
                case AbilityId.Mend: Heal(s, s.Heroes[a.Target.Index], 3 + pow); break;
                case AbilityId.Barrier: ApplyShield(s, s.Heroes[a.Target.Index], 3 + pow); break;
                case AbilityId.Wish:
                    foreach (var x in s.Heroes) if (x.Team == h.Team && x.OnBoard && !x.KO) Heal(s, x, 4 + pow);
                    break;
                // ---------------- Tidesinger
                case AbilityId.Bubble:
                    {
                        var v = HitUnit(s, h, a.Target, 1 + pow);
                        if (v != null && !v.KO) ApplyStun(s, v);
                        break;
                    }
                case AbilityId.Riptide:
                    {
                        var v = s.Heroes[a.Target.Index];
                        Heal(s, v, 2 + pow);
                        Cleanse(s, v);
                        break;
                    }
                case AbilityId.Current:
                    {
                        var v = s.Heroes[a.Target.Index];
                        ApplyShield(s, v, 1 + pow);
                        ApplyHaste(s, v);
                        break;
                    }
                case AbilityId.TidalWave:
                    {
                        var area = AreaHexes(s, h.Pos, 2);
                        var allies = AllyHeroesOn(s, h, area);
                        HitArea(s, h, area, 2 + pow, v => ApplySlow(s, v, 1));
                        WaveClear(s, h, area, def.Wave);
                        foreach (var x in allies) Heal(s, x, 3 + pow);
                        break;
                    }
                // ---------------- Quake
                case AbilityId.EnchantTotem: s.Act.Totem = true; break;
                case AbilityId.Tremor:
                    {
                        var area = AreaHexes(s, h.Pos, 1);
                        HitArea(s, h, area, 1 + pow, v => ApplySlow(s, v, 1));
                        WaveClear(s, h, area, def.Wave);
                        break;
                    }
                case AbilityId.EchoSlam:
                    {
                        var area = AreaHexes(s, h.Pos, 2);
                        var heroes = EnemyHeroesOn(s, h, area);
                        var neutrals = NeutralsOn(s, area);
                        // "+1 per other enemy unit in range (heroes and minions, max +3)" (GDD 10.3)
                        int units = heroes.Count;
                        for (int lane = 0; lane < s.Lanes.Length; lane++)
                            if (Hex.Distance(FrontHex(s, lane), h.Pos) <= 2) units += s.Lanes[lane].Wave[1 - h.Team];
                        foreach (var v in heroes)
                            DamageHero(s, h.Index, v, 2 + pow + Math.Min(3, units - 1), DamageKind.Ability);
                        foreach (var n in neutrals)
                            DamageNeutral(s, h, n, 2 + pow + Math.Min(3, units));
                        WaveClear(s, h, area, def.Wave);
                        break;
                    }
                // ---------------- Bramblehorn
                case AbilityId.HornToss:
                    {
                        var v = HitUnit(s, h, a.Target, 2 + pow);
                        if (v != null && !v.KO)
                        {
                            Knockback(s, v, Hex.ApproxDirection(h.Pos, v.Pos), 1);
                            ApplyStun(s, v);
                        }
                        break;
                    }
                case AbilityId.ThickHide: ApplyShield(s, h, 3 + pow); break;
                case AbilityId.WarBellow:
                    foreach (var x in AllyHeroesOn(s, h, AreaHexes(s, h.Pos, 2))) ApplyShield(s, x, 2 + pow);
                    break;
                case AbilityId.Earthshaker:
                    {
                        var centre = a.Target.Hex;
                        var area = AreaHexes(s, centre, 2);
                        var pulled = EnemyHeroesOn(s, h, area);
                        // GDD 6.8: resolve closest-to-centre first; ties in fixed hero order (the bots' fixed order).
                        pulled.Sort((x, y) =>
                        {
                            int dx = Hex.Distance(x.Pos, centre), dy = Hex.Distance(y.Pos, centre);
                            if (dx != dy) return dx.CompareTo(dy);
                            return x.Index.CompareTo(y.Index);
                        });
                        foreach (var v in pulled) PullToCentre(s, v, centre);
                        HitArea(s, h, area, 2 + pow, v => ApplyRoot(s, v, 1));
                        WaveClear(s, h, area, def.Wave);
                        break;
                    }
            }

            // Shade's Shadow Reset (GDD 6.2 / 10.3, Eddie Q12 b): once per activation, a Q/W/E kill gives +1 action.
            if (h.Hero == HeroId.Shade && a.Slot <= 2 && !s.Act.ResetUsed && !h.KO && s.Act.Hero == h.Index &&
                h.KillScore > killsBefore)
            {
                s.Act.ResetUsed = true;
                s.Act.MaxActions += 1;
                Emit(s, EventType.ShadowReset, h.Index, h.Index, 1);
            }
        }

        /// <summary>Chain Lightning: 3 dmg, then up to 2 jumps of 2 dmg within 2 of the last unit hit (GDD 6.9).</summary>
        static void ExecChain(GameState s, HeroState h, GameAction a, int pow)
        {
            var hit = new List<Target> { a.Target };
            Hex last = TargetHex(s, a.Target);
            HitUnit(s, h, a.Target, 3 + pow);
            for (int jump = 0; jump < 2; jump++)
            {
                if (h.KO || s.Phase == Phase.GameOver) return;
                var cands = ChainCandidates(s, h, last, hit);
                if (cands.Count == 0) return;
                Target pick = cands[0];
                if (a.Chain != null && jump < a.Chain.Count)
                {
                    foreach (var c in cands) if (c.SameAs(a.Chain[jump])) { pick = c; break; }
                }
                hit.Add(pick);
                last = TargetHex(s, pick);
                HitUnit(s, h, pick, 2 + pow);
            }
        }

        /// <summary>Jump candidates in the engine's default order: closest first, heroes, neutrals, waves, index.</summary>
        public static List<Target> ChainCandidates(GameState s, HeroState h, Hex last, List<Target> already)
        {
            var list = new List<Target>();
            foreach (var v in s.Heroes)
                if (v.Team != h.Team && v.OnBoard && !v.KO && !v.Hidden && Hex.Distance(v.Pos, last) <= 2) list.Add(Target.OfHero(v.Index));
            foreach (var n in s.Neutrals)
                if (n.Alive && Hex.Distance(n.Hex, last) <= 2) list.Add(Target.OfNeutral(n.Index));
            for (int lane = 0; lane < s.Lanes.Length; lane++)
                if (s.Lanes[lane].Wave[1 - h.Team] > 0 && Hex.Distance(FrontHex(s, lane), last) <= 2) list.Add(Target.OfWave(lane));
            list.RemoveAll(t => already.Exists(x => x.SameAs(t)));
            var keyed = new List<KeyValuePair<int, Target>>();
            for (int i = 0; i < list.Count; i++)
            {
                int d = Hex.Distance(TargetHex(s, list[i]), last);
                keyed.Add(new KeyValuePair<int, Target>(d * 1000 + i, list[i]));
            }
            keyed.Sort((x, y) => x.Key.CompareTo(y.Key));
            var result = new List<Target>();
            foreach (var kv in keyed) result.Add(kv.Value);
            return result;
        }
    }
}
