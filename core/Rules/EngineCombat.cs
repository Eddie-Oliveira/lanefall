using System;
using System.Collections.Generic;

namespace Lanefall.Core
{
    public enum DamageKind { Attack, Ability, Poison, Structure, Bite, Thorn, Self }

    public static partial class Engine
    {
        // ------------------------------------------------------------------ line of sight (GDD 3)

        /// <summary>
        /// GDD 3: a straight line between hex centres is blocked if it passes through a wall hex. Traced twice with a
        /// + and - nudge; blocked only if both traces hit a wall (a line along a wall edge is not blocked). Units
        /// never block; the start and target hexes never block. Adjacent hexes always see each other.
        /// </summary>
        public static bool HasLineOfSight(MapDef map, Hex from, Hex to)
        {
            if (Hex.Distance(from, to) <= 1) return true;
            return !TraceBlocked(map, from, to, 1) || !TraceBlocked(map, from, to, -1);
        }

        public static bool HasLineOfSight(GameState s, Hex from, Hex to) { return HasLineOfSight(s.Map, from, to); }

        static bool TraceBlocked(MapDef map, Hex from, Hex to, int sign)
        {
            var line = Hex.LineTrace(from, to, sign);
            for (int i = 1; i < line.Count - 1; i++)
            {
                if (map.IsWall(line[i])) return true;
            }
            return false;
        }

        /// <summary>LoS requirement for enemy-targeted ranged actions: only when the target is 2+ hexes away.</summary>
        static bool RangedSightOk(GameState s, Hex from, Hex to)
        {
            return Hex.Distance(from, to) < 2 || HasLineOfSight(s.Map, from, to);
        }

        // ------------------------------------------------------------------ occupancy and movement

        public static HeroState HeroAt(GameState s, Hex hex)
        {
            foreach (var h in s.Heroes) if (h.OnBoard && h.Pos == hex) return h;
            return null;
        }

        public static StructureState StructureAt(GameState s, Hex hex)
        {
            foreach (var x in s.Structures) if (x.Standing && x.Hex == hex) return x;
            return null;
        }

        public static NeutralState NeutralAt(GameState s, Hex hex)
        {
            foreach (var n in s.Neutrals) if (n.Alive && n.Hex == hex) return n;
            return null;
        }

        /// <summary>A hex a unit can end on: open terrain and no hero, standing structure or living neutral.</summary>
        public static bool IsFree(GameState s, Hex hex)
        {
            return s.Map.IsOpen(hex) && HeroAt(s, hex) == null && StructureAt(s, hex) == null && NeutralAt(s, hex) == null;
        }

        /// <summary>Hexes reachable by walking up to steps hexes (through allies; through enemy heroes if allowed).</summary>
        public static List<Hex> Reachable(GameState s, HeroState h, int steps, bool throughEnemies)
        {
            var result = new List<Hex>();
            var dist = new Dictionary<Hex, int>();
            var queue = new Queue<Hex>();
            dist[h.Pos] = 0;
            queue.Enqueue(h.Pos);
            while (queue.Count > 0)
            {
                var cur = queue.Dequeue();
                int d = dist[cur];
                if (d >= steps) continue;
                for (int dir = 0; dir < 6; dir++)
                {
                    var nx = cur.Neighbor(dir);
                    if (dist.ContainsKey(nx)) continue;
                    if (!s.Map.IsOpen(nx)) continue;
                    if (StructureAt(s, nx) != null || NeutralAt(s, nx) != null) continue;
                    var other = HeroAt(s, nx);
                    if (other != null && other.Team != h.Team && !throughEnemies) continue;
                    dist[nx] = d + 1;
                    queue.Enqueue(nx);
                    if (other == null) result.Add(nx);
                }
            }
            result.Sort(Hex.Compare);
            return result;
        }

        static string ValidateMove(GameState s, HeroState h, Hex to)
        {
            if (ActionsLeft(s) <= 0) return "no actions left";
            if (s.Act.Moves >= 2) return "Move already taken twice";
            if (s.Act.Rooted) return "rooted";
            if (!Reachable(s, h, Spd(s, h), false).Contains(to)) return "hex not reachable";
            return null;
        }

        /// <summary>Places a hero on a hex (own movement or forced) and applies health relics.</summary>
        static void MoveHero(GameState s, HeroState h, Hex to)
        {
            if (h.Pos == to) return;
            h.Pos = to;
            var ev = new GameEvent(EventType.Moved, h.Index, h.Index, 0);
            ev.Hex = to;
            s.Events.Add(ev);
            foreach (var r in s.Relics)
            {
                // GDD 8: health relic, step on it: heal 4, back after 2 rounds.
                // GDD-AMBIGUOUS: "step on" = end any movement on the relic hex.
                if (r.Hex == to && r.AvailableFromRound <= s.Round)
                {
                    r.AvailableFromRound = s.Round + RelicRespawn;
                    Emit(s, EventType.RelicUsed, h.Index, h.Index, RelicHeal);
                    Heal(s, h, RelicHeal);
                }
            }
        }

        /// <summary>First free base hex (closest to the Core first), or the nearest free hex beyond it.</summary>
        static Hex FreeBaseHex(GameState s, int team, int heroIndex)
        {
            foreach (var hex in s.Map.BaseHexes[team])
            {
                var o = HeroAt(s, hex);
                if ((o == null || o.Index == heroIndex) && StructureAt(s, hex) == null && NeutralAt(s, hex) == null) return hex;
            }
            var core = s.Map.CoreHex[team];
            for (int r = 3; r < 30; r++)
            {
                var ring = Hex.Range(core, r);
                ring.Sort(Hex.Compare);
                foreach (var hex in ring) if (IsFree(s, hex)) return hex;
            }
            return core;
        }

        // ------------------------------------------------------------------ damage, healing, KO

        /// <summary>
        /// Deals damage to a hero (GDD 6.5). Shield absorbs first. srcHero = -1 for structures/neutrals/self.
        /// Returns the HP actually lost.
        /// </summary>
        internal static int DamageHero(GameState s, int srcHero, HeroState v, int amount, DamageKind kind)
        {
            if (v.KO || !v.OnBoard || amount <= 0) return 0;
            int absorbed = Math.Min(v.Shield, amount);
            v.Shield -= absorbed;
            int lost = amount - absorbed;
            v.Hp -= lost;
            // GDD 6.7: taking damage cancels a pending Recall.
            v.RecallPending = false;
            HeroState src = srcHero >= 0 ? s.Heroes[srcHero] : null;
            Emit(s, EventType.Damage, srcHero, v.Index, amount);
            if (src != null)
            {
                if (src.Team != v.Team) v.DamagedByMask |= 1 << src.Index;
                // Smoke Veil: Hidden ends if you deal damage.
                if (kind != DamageKind.Poison && kind != DamageKind.Thorn) src.Hidden = false;
                // GDD 5.3 tower dive: once per activation, when the active hero damages an enemy hero while within
                // 2 of an enemy structure, that structure hits it for 3. Resolved right after the current action.
                if (src.Team != v.Team && s.Act.Hero == src.Index && !s.Act.DiveShot && src.OnBoard &&
                    (kind == DamageKind.Attack || kind == DamageKind.Ability))
                {
                    var st = DiveStructure(s, src);
                    if (st != null) { s.Act.DiveShot = true; s.Act.PendingDive = st.Index; }
                }
            }
            if (v.Hp <= 0) KnockOut(s, v, srcHero);
            return lost;
        }

        static StructureState DiveStructure(GameState s, HeroState h)
        {
            foreach (var st in s.Structures)
            {
                if (st.Standing && st.Team != h.Team && Hex.Distance(st.Hex, h.Pos) <= StructureRange) return st;
            }
            return null;
        }

        /// <summary>Loses HP without being damage (Rot's self cost). Can KO; no enemy hero is credited.</summary>
        static void LoseHp(GameState s, HeroState h, int n)
        {
            if (h.KO) return;
            h.Hp -= n;
            Emit(s, EventType.Damage, h.Index, h.Index, n);
            if (h.Hp <= 0) KnockOut(s, h, -1);
        }

        internal static void Heal(GameState s, HeroState h, int n)
        {
            if (h.KO || !h.OnBoard || n <= 0) return;
            int max = MaxHp(s, h);
            int before = h.Hp;
            h.Hp = Math.Min(max, h.Hp + n);
            if (h.Hp > before) Emit(s, EventType.Heal, -1, h.Index, h.Hp - before);
        }

        static void KnockOut(GameState s, HeroState v, int srcHero)
        {
            if (v.Aegis)
            {
                // Stone Golem's Aegis: revive once at half HP (GDD 8).
                v.Aegis = false;
                v.Hp = Math.Max(1, MaxHp(s, v) / 2);
                Emit(s, EventType.Revived, srcHero, v.Index, v.Hp);
                return;
            }
            int sw = v.Items.IndexOf(ItemId.SecondWind);
            if (sw >= 0)
            {
                // Second Wind: revive at half HP, then it becomes a Padded Vest (GDD 7.3).
                v.Items[sw] = ItemId.PaddedVest;
                v.Hp = Math.Max(1, MaxHp(s, v) / 2);
                Emit(s, EventType.Revived, srcHero, v.Index, v.Hp);
                return;
            }
            v.KO = true;
            v.OnBoard = false;
            v.Hp = 0;
            v.Deaths++;
            // GDD 6.5 (Q6): skip the next activation; 2 if KO'd in round 8 or later.
            v.SkipsLeft = s.Round >= LateRespawnFromRound ? 2 : 1;
            // KO removes all conditions and Poison.
            v.Stun = false; v.Root = 0; v.Slow = 0; v.Silence = 0; v.Haste = 0; v.Hidden = false; v.Shield = 0;
            ClearPoison(v);
            v.RecallPending = false;
            Emit(s, EventType.KO, srcHero, v.Index, 0);
            int enemy = 1 - v.Team;
            HeroState src = srcHero >= 0 ? s.Heroes[srcHero] : null;
            if (src != null && src.Team == enemy)
            {
                src.Gold += KoGold;
                src.Kills++;
                src.KillScore++;
                s.KillCounter++;
                Emit(s, EventType.Gold, -1, src.Index, KoGold);
            }
            foreach (var a in s.Heroes)
            {
                if (a.Team == enemy && (src == null || a.Index != src.Index) && (v.DamagedByMask & (1 << a.Index)) != 0)
                {
                    a.Gold += AssistGold;
                    Emit(s, EventType.Gold, -1, a.Index, AssistGold);
                }
            }
            s.HeroKOs[enemy]++;
            AddVp(s, enemy, 1);
        }

        static void ClearPoison(HeroState h) { h.PoisonLeft = 0; h.PoisonTick = 0; h.PoisonSource = -1; }

        internal static void AddVp(GameState s, int team, int n)
        {
            s.Vp[team] += n;
            Emit(s, EventType.Vp, -1, team, n);
            if (s.Phase != Phase.GameOver && s.Vp[team] >= s.VpTarget) SetWinner(s, team, EndReason.Vp);
        }

        internal static void SetWinner(GameState s, int team, EndReason reason)
        {
            if (s.Phase == Phase.GameOver) return;
            s.Winner = team;
            s.End = reason;
            s.Phase = Phase.GameOver;
            Emit(s, EventType.GameOver, -1, team, (int)reason);
        }

        // ------------------------------------------------------------------ conditions (GDD 6.6, 6.9)

        static void ApplyStun(GameState s, HeroState t)
        {
            if (t.KO) return;
            if (t.Steadfast)
            {
                Emit(s, EventType.StunIgnored, -1, t.Index, 0);
                return;
            }
            t.Stun = true;
            t.RecallPending = false; // GDD 6.6: a Stun cancels a pending Recall.
            Emit(s, EventType.Stunned, -1, t.Index, 0);
        }

        static void ApplyRoot(GameState s, HeroState t, int n)
        {
            if (t.KO) return;
            t.Root = Math.Max(t.Root, n);
            Emit(s, EventType.Rooted, -1, t.Index, n);
        }

        static void ApplySlow(GameState s, HeroState t, int n)
        {
            if (t.KO) return;
            t.Slow = Math.Max(t.Slow, n);
            Emit(s, EventType.Slowed, -1, t.Index, n);
        }

        static void ApplySilence(GameState s, HeroState t, int n)
        {
            if (t.KO) return;
            t.Silence = Math.Max(t.Silence, n);
            Emit(s, EventType.Silenced, -1, t.Index, n);
        }

        static void ApplyShield(GameState s, HeroState t, int n)
        {
            if (t.KO || !t.OnBoard) return;
            // Same condition twice does not stack: keep the higher Shield (GDD 6.6).
            t.Shield = Math.Max(t.Shield, n);
            Emit(s, EventType.ShieldGained, -1, t.Index, n);
        }

        static void ApplyHaste(GameState s, HeroState t)
        {
            if (t.KO) return;
            // Haste covers the target's next activation; cast on the active hero it also covers the rest of this one.
            t.Haste = Math.Max(t.Haste, 1);
            if (s.Act.Hero == t.Index) s.Act.Hasted = true;
            Emit(s, EventType.Hasted, -1, t.Index, 1);
        }

        /// <summary>Poison n (Viper, GDD 6.9): n + POW at the start of the target's next 3 activations. Heroes only.</summary>
        static void ApplyPoison(GameState s, HeroState src, HeroState t, int n)
        {
            if (t.KO) return;
            int total = n + Pow(s, src);
            if (t.PoisonLeft > 0 && t.PoisonTick > total)
            {
                t.PoisonLeft = 3; // keep the higher total, restart at 3
            }
            else
            {
                t.PoisonTick = total;
                t.PoisonLeft = 3;
                t.PoisonSource = src.Index;
            }
            Emit(s, EventType.Poisoned, src.Index, t.Index, t.PoisonTick);
        }

        /// <summary>Cleanse: remove Stun, Root, Slow, Silence and Poison (not Shield, Haste, Hidden).</summary>
        static void Cleanse(GameState s, HeroState t)
        {
            t.Stun = false; t.Root = 0; t.Slow = 0; t.Silence = 0;
            ClearPoison(t);
            if (s.Act.Hero == t.Index) { s.Act.Rooted = false; s.Act.Slowed = false; s.Act.Silenced = false; }
            Emit(s, EventType.Cleansed, -1, t.Index, 0);
        }

        // ------------------------------------------------------------------ minions, neutrals, structures

        /// <summary>Kills up to n enemy minions in a lane for the hero: +1 gold each (last hits, GDD 5.2).</summary>
        internal static int KillMinions(GameState s, HeroState h, int lane, int n)
        {
            int enemy = 1 - h.Team;
            int k = Math.Min(n, s.Lanes[lane].Wave[enemy]);
            if (k <= 0) return 0;
            s.Lanes[lane].Wave[enemy] -= k;
            h.Gold += k;
            h.LastHits += k;
            h.KillScore += k;
            s.KillCounter += k;
            Emit(s, EventType.MinionsKilled, h.Index, lane, k);
            return k;
        }

        /// <summary>Deals damage to a neutral; the hero dealing the final point claims it, otherwise it Bites (GDD 8).</summary>
        internal static void DamageNeutral(GameState s, HeroState h, NeutralState n, int amount)
        {
            if (!n.Alive || amount <= 0) return;
            n.Hp -= amount;
            n.DamagedThisRound = true;
            h.Hidden = false;
            var ev = new GameEvent(EventType.Damage, h.Index, -1, amount);
            ev.Hex = n.Hex;
            s.Events.Add(ev);
            if (n.Hp <= 0)
            {
                ClaimNeutral(s, h, n);
                return;
            }
            if (!h.KO)
            {
                // GDD-AMBIGUOUS: Bite is applied per damage instance (each hit of Twin Shot bites) and ignores ARM.
                Emit(s, EventType.Bite, -1, h.Index, n.Bite);
                DamageHero(s, -1, h, n.Bite, DamageKind.Bite);
            }
        }

        static void ClaimNeutral(GameState s, HeroState h, NeutralState n)
        {
            n.Alive = false;
            n.Hp = 0;
            n.AppearRound = s.Round + NeutralRespawn(n.Kind);
            h.KillScore++;
            s.KillCounter++;
            Emit(s, EventType.NeutralClaimed, h.Index, n.Index, (int)n.Kind);
            switch (n.Kind)
            {
                case NeutralKind.Wolf:
                    h.Gold += 2;
                    break;
                case NeutralKind.Drake:
                    s.DrakeStacks[h.Team] = Math.Min(2, s.DrakeStacks[h.Team] + 1);
                    TeamGold(s, h.Team, 2);
                    AddVp(s, h.Team, 2);
                    break;
                case NeutralKind.Golem:
                    if (!h.KO) h.Aegis = true;
                    TeamGold(s, h.Team, 2);
                    AddVp(s, h.Team, 3);
                    break;
                case NeutralKind.SpiderQueen:
                    s.Brood[h.Team] = 2;
                    TeamGold(s, h.Team, 2);
                    AddVp(s, h.Team, 3);
                    break;
            }
        }

        static void TeamGold(GameState s, int team, int n)
        {
            foreach (var x in s.Heroes) if (x.Team == team) x.Gold += n;
        }

        internal static void DamageStructure(GameState s, int attackerTeam, StructureState st, int amount)
        {
            if (!st.Standing || amount <= 0) return;
            st.Hp = Math.Max(0, st.Hp - amount);
            Emit(s, EventType.StructureDamaged, -1, st.Index, amount);
            if (st.Hp > 0) return;
            Emit(s, EventType.StructureDestroyed, -1, st.Index, 0);
            if (st.IsCore)
            {
                SetWinner(s, attackerTeam, EndReason.Core);
                return;
            }
            // GDD 5.3: tower destroyed = +3 VP, +2 gold to each hero of the team.
            s.TowersDestroyed[attackerTeam]++;
            TeamGold(s, attackerTeam, TowerTeamGold);
            AddVp(s, attackerTeam, 3);
        }

        /// <summary>The Core is open when every tower of any one lane of that team is down (GDD 5.3).</summary>
        public static bool CoreOpen(GameState s, int team)
        {
            for (int lane = 0; lane < s.Lanes.Length; lane++)
            {
                bool allDown = true;
                foreach (var st in s.Structures)
                    if (st.Team == team && st.Lane == lane && st.Standing) { allDown = false; break; }
                if (allDown) return true;
            }
            return false;
        }

        public static StructureState Core(GameState s, int team)
        {
            foreach (var st in s.Structures) if (st.IsCore && st.Team == team) return st;
            return null;
        }

        /// <summary>The enemy structure the Front of a lane currently sits on, if standing (and open, for a Core).</summary>
        public static StructureState StructureAtFront(GameState s, int lane, int ownerTeam)
        {
            int front = s.Lanes[lane].Front;
            foreach (var st in s.Structures)
            {
                if (st.Team != ownerTeam || !st.Standing) continue;
                if (st.IsCore)
                {
                    if (front == st.Node && CoreOpen(s, ownerTeam)) return st;
                }
                else if (st.Lane == lane && st.Node == front) return st;
            }
            return null;
        }

        public static Hex FrontHex(GameState s, int lane) { return s.Map.NodeHex(lane, s.Lanes[lane].Front); }

        // ------------------------------------------------------------------ Attack (GDD 6.2, 6.5, 5.2, 5.3)

        static string ValidateAttackTarget(GameState s, HeroState h, Target t)
        {
            int rng = h.Def.Rng;
            switch (t.Type)
            {
                case TargetType.Hero:
                    {
                        if (t.Index < 0 || t.Index >= s.Heroes.Count) return "bad hero";
                        var v = s.Heroes[t.Index];
                        if (v.Team == h.Team) return "not an enemy";
                        if (!v.OnBoard || v.KO) return "target not on the board";
                        if (v.Hidden) return "target is Hidden";
                        if (Hex.Distance(h.Pos, v.Pos) > rng) return "out of range";
                        if (!RangedSightOk(s, h.Pos, v.Pos)) return "no line of sight";
                        return null;
                    }
                case TargetType.Wave:
                    {
                        if (t.Index < 0 || t.Index >= s.Lanes.Length) return "bad lane";
                        if (s.Lanes[t.Index].Wave[1 - h.Team] <= 0) return "no enemy minions";
                        var fh = FrontHex(s, t.Index);
                        if (Hex.Distance(h.Pos, fh) > rng) return "Front out of range";
                        if (!RangedSightOk(s, h.Pos, fh)) return "no line of sight";
                        return null;
                    }
                case TargetType.Neutral:
                    {
                        if (t.Index < 0 || t.Index >= s.Neutrals.Count) return "bad neutral";
                        var n = s.Neutrals[t.Index];
                        if (!n.Alive) return "neutral not up";
                        if (Hex.Distance(h.Pos, n.Hex) > rng) return "out of range";
                        if (!RangedSightOk(s, h.Pos, n.Hex)) return "no line of sight";
                        return null;
                    }
                case TargetType.Structure:
                    {
                        if (t.Index < 0 || t.Index >= s.Structures.Count) return "bad structure";
                        var st = s.Structures[t.Index];
                        if (st.Team == h.Team || !st.Standing) return "not an enemy structure";
                        if (!StructureAttackable(s, h.Team, st)) return "your wave is not at that structure";
                        if (Hex.Distance(h.Pos, st.Hex) > rng) return "out of range";
                        if (!RangedSightOk(s, h.Pos, st.Hex)) return "no line of sight";
                        return null;
                    }
            }
            return "bad attack target";
        }

        /// <summary>GDD 5.3 backdoor protection: only while your own wave is at that structure.</summary>
        public static bool StructureAttackable(GameState s, int attackerTeam, StructureState st)
        {
            if (!st.Standing || st.Team == attackerTeam) return false;
            for (int lane = 0; lane < s.Lanes.Length; lane++)
            {
                if (s.Lanes[lane].Wave[attackerTeam] <= 0) continue;
                var at = StructureAtFront(s, lane, st.Team);
                if (at != null && at.Index == st.Index) return true;
            }
            return false;
        }

        static string ValidateAttack(GameState s, HeroState h, GameAction a)
        {
            if (ActionsLeft(s) <= 0) return "no actions left";
            if (s.Act.Attacked) return "already attacked this activation";
            string e = ValidateAttackTarget(s, h, a.Target);
            if (e != null) return e;
            if (!a.Target2.IsNone)
            {
                if (!h.Def.TwinShot) return "only marksmen hit twice";
                e = ValidateAttackTarget(s, h, a.Target2);
                if (e != null) return "second hit: " + e;
            }
            return null;
        }

        static void ExecAttack(GameState s, HeroState h, GameAction a)
        {
            s.Act.Attacked = true;
            SpendAction(s);
            Emit(s, EventType.Attacked, h.Index, -1, 0);
            int hits = h.Def.TwinShot ? 2 : 1; // Marksman role trait: Twin Shot (GDD 6.2)
            bool totem = s.Act.Totem;
            s.Act.Totem = false;
            for (int i = 0; i < hits; i++)
            {
                if (h.KO || s.Phase == Phase.GameOver) break;
                var t = (i == 1 && !a.Target2.IsNone) ? a.Target2 : a.Target;
                if (ValidateAttackTarget(s, h, t) != null) continue; // target gone after the first hit
                AttackHit(s, h, t, totem);
            }
        }

        static void AttackHit(GameState s, HeroState h, Target t, bool totem)
        {
            int atk = Atk(s, h);
            if (totem) atk *= 2; // Enchant Totem: double ATK
            if (s.Act.FrostArrows) atk += 1;
            switch (t.Type)
            {
                case TargetType.Hero:
                    {
                        var v = s.Heroes[t.Index];
                        int arm = Math.Max(0, Arm(v) - Pierce(h));
                        int dmg = Math.Max(1, atk - arm);
                        DamageHero(s, h.Index, v, dmg, DamageKind.Attack);
                        if (s.Act.FrostArrows && !v.KO) ApplySlow(s, v, 1);
                        if (dmg > 0 && HasItem(h, ItemId.BloodthirstBlade)) Heal(s, h, 1);
                        // GDD-AMBIGUOUS: Thorn Mail, Bloodthirst Blade and Bite apply per hit (Twin Shot = 2 hits).
                        if (HasItem(v, ItemId.ThornMail) && !h.KO) DamageHero(s, v.Index, h, 1, DamageKind.Thorn);
                        break;
                    }
                case TargetType.Wave:
                    KillMinions(s, h, t.Index, 1);
                    break;
                case TargetType.Neutral:
                    {
                        var n = s.Neutrals[t.Index];
                        DamageNeutral(s, h, n, Math.Max(1, atk - n.Arm));
                        break;
                    }
                case TargetType.Structure:
                    DamageStructure(s, h.Team, s.Structures[t.Index], totem ? HeroStructureDamage * 2 : HeroStructureDamage);
                    break;
            }
        }

        // ------------------------------------------------------------------ items, shop, capture

        static string ValidateUseItem(GameState s, HeroState h, GameAction a)
        {
            if (a.Item == ItemId.CleansingVeil)
            {
                if (!HasItem(h, ItemId.CleansingVeil)) return "no Cleansing Veil";
                if (h.VeilCd > 0) return "Cleansing Veil on cooldown";
                if (s.Act.VeilUsed) return "already used this activation";
                return null;
            }
            if (a.Item == ItemId.BlinkCharm)
            {
                if (!HasItem(h, ItemId.BlinkCharm)) return "no Blink Charm";
                if (h.BlinkCd > 0) return "Blink Charm on cooldown";
                if (s.Act.BlinkUsed) return "already used this activation";
                if (s.Act.Rooted) return "rooted";
                var to = a.Target.Type == TargetType.Hex ? a.Target.Hex : a.Hex;
                if (Hex.Distance(h.Pos, to) < 1 || Hex.Distance(h.Pos, to) > 3) return "Blink: 1-3 hexes";
                if (!IsFree(s, to)) return "hex not free";
                return null;
            }
            return "item has no active use";
        }

        static void ExecUseItem(GameState s, HeroState h, GameAction a)
        {
            Emit(s, EventType.ItemUsed, h.Index, (int)a.Item, 0);
            if (a.Item == ItemId.CleansingVeil)
            {
                s.Act.VeilUsed = true;
                h.VeilCd = Items.Get(ItemId.CleansingVeil).Cd;
                bool wasPending = s.Act.StunPending;
                Cleanse(s, h);
                if (wasPending)
                {
                    // GDD 6.6: Veil at the start of a stunned activation: act normally, no Steadfast.
                    s.Act.StunPending = false;
                    s.Act.SteadfastAtStart = h.Steadfast;
                }
                return;
            }
            s.Act.BlinkUsed = true;
            h.BlinkCd = Items.Get(ItemId.BlinkCharm).Cd;
            s.Act.ShopOpen = false;
            MoveHero(s, h, a.Target.Type == TargetType.Hex ? a.Target.Hex : a.Hex);
        }

        static string ValidateBuy(GameState s, HeroState h, GameAction a)
        {
            if (!s.Act.ShopOpen) return "shop only at the start of an activation in base (GDD 7.2)";
            if (a.Item < 0 || (int)a.Item >= Items.Count) return "bad item";
            var d = Items.Get(a.Item);
            bool ownsBasic = !d.Basic && h.Items.Contains(d.BuildsFrom);
            int cost = Items.Cost(a.Item, ownsBasic);
            if (h.Gold < cost) return "not enough gold";
            if (ownsBasic) return null;
            if (h.Items.Count < Items.Slots) return null;
            if (a.Discard < 0 || a.Discard >= h.Items.Count) return "slots full: choose an item to discard";
            return null;
        }

        static void ExecBuy(GameState s, HeroState h, GameAction a)
        {
            var d = Items.Get(a.Item);
            bool ownsBasic = !d.Basic && h.Items.Contains(d.BuildsFrom);
            int cost = Items.Cost(a.Item, ownsBasic);
            int oldMax = MaxHp(s, h);
            h.Gold -= cost;
            if (ownsBasic) h.Items[h.Items.IndexOf(d.BuildsFrom)] = a.Item; // the basic is replaced
            else if (h.Items.Count < Items.Slots) h.Items.Add(a.Item);
            else h.Items[a.Discard] = a.Item; // no refunds
            int newMax = MaxHp(s, h);
            // GDD-AMBIGUOUS: buying HP raises current HP by the same amount; losing max HP caps current HP.
            if (newMax > oldMax) h.Hp += newMax - oldMax;
            if (h.Hp > newMax) h.Hp = newMax;
            Emit(s, EventType.ItemBought, h.Index, (int)a.Item, cost);
        }

        static AltarState AltarUnder(GameState s, HeroState h)
        {
            foreach (var al in s.Altars) if (al.Hex == h.Pos) return al;
            return null;
        }

        static string ValidateCapture(GameState s, HeroState h)
        {
            if (ActionsLeft(s) <= 0) return "no actions left";
            if (s.Act.Captured) return "already captured";
            var al = AltarUnder(s, h);
            if (al == null) return "not on an altar";
            if (al.Owner == h.Team) return "your team holds it";
            if (s.Round <= al.LockedThroughRound) return "altar locked";
            return null;
        }

        static void ExecCapture(GameState s, HeroState h)
        {
            var al = AltarUnder(s, h);
            s.Act.Captured = true;
            SpendAction(s);
            al.Owner = h.Team;
            // GDD 8: "locked 1 round after a capture" = no capture for the rest of this round and the next.
            al.LockedThroughRound = s.Round + 1;
            Emit(s, EventType.AltarCaptured, h.Index, al.Lane, 0);
        }
    }
}
