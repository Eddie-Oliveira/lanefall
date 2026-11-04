using System.Collections.Generic;

namespace Lanefall.Core
{
    public static partial class Engine
    {
        /// <summary>
        /// Snake pick order (GDD 10.2): first-pick team picks 1, then the teams alternate 2 picks each, last pick
        /// single. 1v1 A B · 2v2/Commander A BB A · 3v3 A BB AA B · 4v4 A BB AA BB A.
        /// </summary>
        public static List<int> DraftOrder(int size, int firstTeam)
        {
            var order = new List<int> { firstTeam };
            int t = 1 - firstTeam;
            while (order.Count < 2 * size)
            {
                order.Add(t);
                if (order.Count < 2 * size) order.Add(t);
                t = 1 - t;
            }
            return order;
        }

        public static bool HeroTaken(GameState s, HeroId id)
        {
            foreach (var h in s.Heroes) if (h.Hero == id) return true;
            return false;
        }

        public static List<HeroId> FreeHeroes(GameState s)
        {
            var list = new List<HeroId>();
            for (int i = 0; i < Heroes.Count; i++) if (!HeroTaken(s, (HeroId)i)) list.Add((HeroId)i);
            return list;
        }

        /// <summary>The seat that picks next in Draft mode: the next seat of that team without a hero (GDD 10.2, Q14).</summary>
        public static int DraftCurrentHero(GameState s)
        {
            if (s.Phase != Phase.Draft || s.PickMode == PickMode.FreePick || s.Draft.PickIndex >= s.Draft.Order.Count) return -1;
            int team = s.Draft.Order[s.Draft.PickIndex];
            foreach (var h in s.Heroes) if (h.Team == team && h.Hero == HeroId.None) return h.Index;
            return -1;
        }

        static string ValidateDraftPick(GameState s, GameAction a)
        {
            if (s.Phase != Phase.Draft) return "not drafting";
            if (a.HeroId < 0 || (int)a.HeroId >= Heroes.Count) return "bad hero";
            if (HeroTaken(s, a.HeroId)) return "hero already taken (heroes are unique)";
            if (s.PickMode == PickMode.FreePick)
            {
                if (a.Team != 0 && a.Team != 1) return "free pick needs a team";
                if (a.Seat < 0 || a.Seat >= s.Size) return "bad seat";
                if (s.Heroes[a.Team * s.Size + a.Seat].Hero != HeroId.None) return "seat already picked";
                return null;
            }
            int cur = DraftCurrentHero(s);
            if (cur < 0) return "no pick pending";
            if (a.Team >= 0 && a.Team != s.Heroes[cur].Team) return "not this team's pick";
            if (a.Seat >= 0 && a.Seat != s.Heroes[cur].Seat) return "not this seat's pick";
            return null;
        }

        static string ValidateDraftHover(GameState s, GameAction a)
        {
            if (s.Phase != Phase.Draft) return "not drafting";
            if (a.Team != 0 && a.Team != 1) return "bad team";
            if (a.Seat < 0 || a.Seat >= s.Size) return "bad seat";
            if (a.HeroId != HeroId.None && (a.HeroId < 0 || (int)a.HeroId >= Heroes.Count)) return "bad hero";
            return null;
        }

        static void ExecDraftPick(GameState s, GameAction a)
        {
            int idx = s.PickMode == PickMode.FreePick ? a.Team * s.Size + a.Seat : DraftCurrentHero(s);
            LockPick(s, idx, a.HeroId);
        }

        static void LockPick(GameState s, int heroIndex, HeroId id)
        {
            s.Heroes[heroIndex].Hero = id;
            s.Draft.PickIndex++;
            Emit(s, EventType.DraftPicked, heroIndex, heroIndex, (int)id);
            bool done = true;
            foreach (var h in s.Heroes) if (h.Hero == HeroId.None) { done = false; break; }
            if (done) StartMatch(s);
        }

        /// <summary>Pick timer ran out: lock the hovered hero if still free, else the bot rule pick (GDD 10.2).</summary>
        static void ExecDraftTimeout(GameState s)
        {
            if (s.PickMode == PickMode.FreePick)
            {
                foreach (var h in s.Heroes)
                {
                    if (s.Phase != Phase.Draft) return;
                    if (h.Hero != HeroId.None) continue;
                    LockPick(s, h.Index, TimeoutPick(s, h.Index));
                }
                return;
            }
            int cur = DraftCurrentHero(s);
            if (cur >= 0) LockPick(s, cur, TimeoutPick(s, cur));
        }

        static HeroId TimeoutPick(GameState s, int heroIndex)
        {
            var hover = s.Draft.Hover[heroIndex];
            if (hover != HeroId.None && !HeroTaken(s, hover)) return hover;
            return BotDraftPick(s, s.Heroes[heroIndex].Team, ref s.BotRngState);
        }

        /// <summary>
        /// Bot draft rule (GDD 10.2): the first role in priority order (Tank, Mage, Marksman, Support, Fighter,
        /// Initiator, Assassin) that the team lacks and that still has a free hero; random hero within the role
        /// (bot RNG stream); if every role is covered, any free hero.
        /// </summary>
        public static HeroId BotDraftPick(GameState s, int team, ref ulong botRng)
        {
            var have = new HashSet<Role>();
            foreach (var h in s.Heroes) if (h.Team == team && h.Hero != HeroId.None) have.Add(h.Def.Role);
            var free = FreeHeroes(s);
            foreach (var role in Heroes.DraftRolePriority)
            {
                if (have.Contains(role)) continue;
                var options = free.FindAll(x => Heroes.Get(x).Role == role);
                if (options.Count > 0) return options[Rng.Range(ref botRng, options.Count)];
            }
            return free[Rng.Range(ref botRng, free.Count)];
        }

        /// <summary>The "Suggested" pick for the UI without advancing the bot RNG stream.</summary>
        public static HeroId SuggestDraftPick(GameState s, int team)
        {
            ulong copy = s.BotRngState;
            return BotDraftPick(s, team, ref copy);
        }
    }
}
