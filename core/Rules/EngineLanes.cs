using System;
using System.Collections.Generic;

namespace Lanefall.Core
{
    /// <summary>What the next Lane phase would do in one lane if nothing changed (bot/UX helper, GDD 12).</summary>
    public sealed class LaneForecastResult
    {
        public int Lane;
        public int[] Power = new int[2];
        public int[] WaveAfterSpawn = new int[2];
        /// <summary>Winning team, or -1 on a tie.</summary>
        public int Winner = -1;
        public int LoserMinionsLost;
        /// <summary>Front change in nodes (+1 toward Ember, -1 toward Azure, 0 none).</summary>
        public int FrontChange;
        /// <summary>Damage the sieged structure would take (0 if none).</summary>
        public int StructureDamage;
        public int SiegedStructure = -1;
    }

    public static partial class Engine
    {
        public static int SpawnCount(int round) { return round >= SpawnLateFromRound ? SpawnPerRoundLate : SpawnPerRound; }

        /// <summary>Power in a lane's clash zone: minions + heroes within 2 of the Front (+1 altar) (GDD 5.1).</summary>
        public static int LanePower(GameState s, int lane, int team, int minions)
        {
            int p = minions;
            var fh = FrontHex(s, lane);
            foreach (var h in s.Heroes)
                if (h.Team == team && h.OnBoard && !h.KO && Hex.Distance(h.Pos, fh) <= ClashRadius) p++;
            foreach (var al in s.Altars)
                if (al.Lane == lane && al.Owner == team) p++;
            return p;
        }

        public static LaneForecastResult LaneForecast(GameState s, int lane)
        {
            var r = new LaneForecastResult { Lane = lane };
            var ls = s.Lanes[lane];
            int nextRound = s.Round;
            for (int t = 0; t < 2; t++)
            {
                r.WaveAfterSpawn[t] = Math.Min(WaveCap, ls.Wave[t] + SpawnCount(nextRound) + s.Brood[t]);
                r.Power[t] = LanePower(s, lane, t, r.WaveAfterSpawn[t]);
            }
            if (r.Power[0] == r.Power[1]) return r;
            int w = r.Power[0] > r.Power[1] ? 0 : 1;
            int lo = 1 - w;
            r.Winner = w;
            int diff = r.Power[w] - r.Power[lo];
            r.LoserMinionsLost = Math.Min(diff, r.WaveAfterSpawn[lo]);
            int loserLeft = r.WaveAfterSpawn[lo] - r.LoserMinionsLost;
            int front = ls.Front;
            if (loserLeft == 0 && CanFrontAdvance(s, lane, lo)) { front += Team.Side(lo); r.FrontChange = Team.Side(lo); }
            var st = StructureAtNode(s, lane, lo, front);
            if (st != null)
            {
                r.SiegedStructure = st.Index;
                r.StructureDamage = Math.Max(0, r.WaveAfterSpawn[w] - SiegeKills);
            }
            return r;
        }

        /// <summary>The Front can move one node toward the loser unless a standing loser tower is on its node (GDD 5.1 step 4).</summary>
        static bool CanFrontAdvance(GameState s, int lane, int loser)
        {
            int front = s.Lanes[lane].Front;
            if (front == Team.Side(loser) * s.Map.NodeMax) return false; // already on the Core
            foreach (var st in s.Structures)
            {
                if (st.Team == loser && !st.IsCore && st.Lane == lane && st.Standing && st.Node == front) return false;
            }
            return true;
        }

        /// <summary>Standing structure of a team at a node of a lane (towers; the Core only when open).</summary>
        static StructureState StructureAtNode(GameState s, int lane, int team, int node)
        {
            foreach (var st in s.Structures)
            {
                if (st.Team != team || !st.Standing) continue;
                if (st.IsCore) { if (node == st.Node && CoreOpen(s, team)) return st; }
                else if (st.Lane == lane && st.Node == node) return st;
            }
            return null;
        }

        /// <summary>GDD 5.1: per lane in fixed order: spawn, power, clash, push, siege. Then structures shoot.</summary>
        static void LanePhase(GameState s)
        {
            for (int lane = 0; lane < s.Lanes.Length; lane++)
            {
                var ls = s.Lanes[lane];
                for (int t = 0; t < 2; t++)
                {
                    ls.Wave[t] = Math.Min(WaveCap, ls.Wave[t] + SpawnCount(s.Round) + s.Brood[t]);
                }
                Emit(s, EventType.LaneSpawn, -1, lane, SpawnCount(s.Round));
                int p0 = LanePower(s, lane, 0, ls.Wave[0]);
                int p1 = LanePower(s, lane, 1, ls.Wave[1]);
                if (p0 == p1) { Emit(s, EventType.LaneClash, -1, lane, 0); continue; }
                int w = p0 > p1 ? 0 : 1;
                int lo = 1 - w;
                int diff = Math.Abs(p0 - p1);
                ls.Wave[lo] = Math.Max(0, ls.Wave[lo] - diff);
                Emit(s, EventType.LaneClash, w, lane, diff);
                if (ls.Wave[lo] == 0 && CanFrontAdvance(s, lane, lo))
                {
                    ls.Front += Team.Side(lo);
                    var ev = new GameEvent(EventType.FrontMoved, w, lane, ls.Front);
                    ev.Hex = FrontHex(s, lane);
                    s.Events.Add(ev);
                }
                var st = StructureAtNode(s, lane, lo, ls.Front);
                if (st != null)
                {
                    // Siege: the structure kills 2 of the winner's minions, then takes 1 per remaining minion.
                    ls.Wave[w] = Math.Max(0, ls.Wave[w] - SiegeKills);
                    Emit(s, EventType.Siege, w, st.Index, ls.Wave[w]);
                    DamageStructure(s, w, st, ls.Wave[w]);
                    if (s.Phase == Phase.GameOver) return;
                }
            }
            // No minion cover: a structure with no attacking minions at it shoots the lowest-HP enemy hero within 2.
            foreach (var st in s.Structures)
            {
                if (!st.Standing) continue;
                if (HasAttackingMinions(s, st)) continue;
                HeroState target = null;
                foreach (var h in s.Heroes)
                {
                    if (h.Team == st.Team || !h.OnBoard || h.KO || h.Hidden) continue;
                    if (Hex.Distance(h.Pos, st.Hex) > StructureRange) continue;
                    if (target == null || h.Hp < target.Hp) target = h;
                }
                if (target != null)
                {
                    Emit(s, EventType.TowerShot, -1, target.Index, StructureShot);
                    DamageHero(s, -1, target, StructureShot, DamageKind.Structure);
                    if (s.Phase == Phase.GameOver) return;
                }
            }
            foreach (var h in s.Heroes)
            {
                if (InBase(s, h)) { h.Hp = MaxHp(s, h); ClearPoison(h); } // base heals at the end of each Lane phase
            }
            foreach (var al in s.Altars)
            {
                // GDD 7.1: altar held = +1 gold each hero per round (paid in the Lane phase, as in lanefall_sim.py).
                if (al.Owner >= 0) TeamGold(s, al.Owner, 1);
            }
            s.Brood[0] = 0; s.Brood[1] = 0;
        }

        /// <summary>GDD-AMBIGUOUS: "attacking minions" = the enemy wave of a lane whose Front sits on this structure.</summary>
        static bool HasAttackingMinions(GameState s, StructureState st)
        {
            int enemy = 1 - st.Team;
            for (int lane = 0; lane < s.Lanes.Length; lane++)
            {
                if (s.Lanes[lane].Wave[enemy] <= 0) continue;
                if (st.IsCore) { if (s.Lanes[lane].Front == st.Node) return true; }
                else if (st.Lane == lane && s.Lanes[lane].Front == st.Node) return true;
            }
            return false;
        }

        /// <summary>GDD 4 End step: cooldowns -1, shields expire, neutrals heal if untouched, round limit.</summary>
        static void EndStep(GameState s)
        {
            foreach (var h in s.Heroes)
            {
                for (int i = 0; i < 4; i++) if (h.Cd[i] > 0) h.Cd[i]--;
                if (h.BlinkCd > 0) h.BlinkCd--;
                if (h.VeilCd > 0) h.VeilCd--;
                // GDD-AMBIGUOUS: section 4 says shields expire in the End step, 6.5 says at the start of the owner's
                // next activation; both are applied (whichever comes first), as in lanefall_sim.py.
                h.Shield = 0;
            }
            foreach (var n in s.Neutrals)
            {
                if (n.Alive && !n.DamagedThisRound) n.Hp = n.MaxHp;
                n.DamagedThisRound = false;
            }
            if (s.Round >= s.RoundLimit) FinishByRoundLimit(s);
        }

        /// <summary>GDD 9: most VP; tie-breaks towers destroyed, total Front advance, hero KOs; else draw.</summary>
        static void FinishByRoundLimit(GameState s)
        {
            int[] key0 = { s.Vp[0], s.TowersDestroyed[0], FrontAdvance(s, 0), s.HeroKOs[0] };
            int[] key1 = { s.Vp[1], s.TowersDestroyed[1], FrontAdvance(s, 1), s.HeroKOs[1] };
            for (int i = 0; i < key0.Length; i++)
            {
                if (key0[i] != key1[i])
                {
                    SetWinner(s, key0[i] > key1[i] ? 0 : 1, EndReason.RoundLimit);
                    return;
                }
            }
            SetWinner(s, -1, EndReason.Draw);
        }

        /// <summary>Sum of lane Front nodes in a team's favour (Azure: positive nodes are its advance).</summary>
        public static int FrontAdvance(GameState s, int team)
        {
            int sum = 0;
            foreach (var l in s.Lanes) sum += l.Front;
            return team == 0 ? sum : -sum;
        }
    }
}
