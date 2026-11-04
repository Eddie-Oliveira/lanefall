using System;
using System.Collections.Generic;

namespace Lanefall.Core
{
    /// <summary>
    /// The rules of GDD v1.0. Pure functions over a GameState: Apply validates an action and, only if it is legal,
    /// mutates the state. Deterministic: integer math only, RNG streams live in the state.
    /// </summary>
    public static partial class Engine
    {
        // GDD 5 (lanes, structures)
        public const int SpawnPerRound = 2;
        public const int SpawnPerRoundLate = 3;
        public const int SpawnLateFromRound = 7;
        public const int WaveCap = 6;
        public const int TowerHp = 8;
        public const int CoreHp = 12;
        public const int StructureRange = 2;
        public const int StructureShot = 3;
        public const int SiegeKills = 2;
        public const int HeroStructureDamage = 2;
        public const int ClashRadius = 2;
        // GDD 6
        public const int ActionsPerActivation = 3;
        public const int LateRespawnFromRound = 8;
        public const int KoGold = 3;
        public const int AssistGold = 1;
        public const int TowerTeamGold = 2;
        public const int RelicHeal = 4;
        public const int RelicRespawn = 2;

        static readonly int[] LevelHp = { 0, 0, 2, 4, 6, 8 };
        static readonly int[] LevelAtk = { 0, 0, 0, 0, 1, 1 };
        static readonly int[] LevelPow = { 0, 0, 0, 0, 1, 1 };

        // ------------------------------------------------------------------ setup

        public static GameState NewMatch(MatchSetup setup)
        {
            if (setup == null) throw new ArgumentNullException("setup");
            if (setup.Size < 1 || setup.Size > 4) throw new ArgumentException("Size must be 1..4");
            if (setup.Commander && setup.Size != 2) throw new ArgumentException("Commander is 2v2 (GDD 4.1)");
            var map = Maps.Get(setup.Map);
            var s = new GameState();
            s.Setup = setup.Clone();
            s.Map = map;
            s.Size = setup.Size;
            s.PickMode = setup.PickMode == PickMode.Default ? map.DefaultPickMode : setup.PickMode;
            s.RoundLimit = map.RoundLimit(setup.Size);
            s.VpTarget = map.VpTarget(setup.Size);
            s.RngState = Rng.Stream(setup.Seed, 1);
            s.BotRngState = Rng.Stream(setup.Seed, 2);
            s.Level = LevelForRound(map, 1);

            for (int t = 0; t < 2; t++)
                for (int seat = 0; seat < s.Size; seat++)
                    s.Heroes.Add(new HeroState { Index = t * s.Size + seat, Team = t, Seat = seat });

            for (int t = 0; t < 2; t++)
            {
                for (int lane = 0; lane < map.LaneCount; lane++)
                {
                    foreach (int abs in map.TowerNodes)
                    {
                        int node = Team.Side(t) * abs;
                        s.Structures.Add(new StructureState
                        {
                            Index = s.Structures.Count, Team = t, Lane = lane, Node = node, Hex = map.NodeHex(lane, node),
                            Hp = TowerHp, MaxHp = TowerHp
                        });
                    }
                }
                s.Structures.Add(new StructureState
                {
                    Index = s.Structures.Count, Team = t, Lane = -1, Node = Team.Side(t) * map.NodeMax, Hex = map.CoreHex[t],
                    Hp = CoreHp, MaxHp = CoreHp
                });
            }

            s.Lanes = new LaneState[map.LaneCount];
            for (int i = 0; i < s.Lanes.Length; i++) s.Lanes[i] = new LaneState();

            foreach (var sp in map.NeutralSpawns)
            {
                var n = new NeutralState { Index = s.Neutrals.Count, Kind = sp.Kind, Hex = sp.Hex };
                NeutralStats(sp.Kind, out n.MaxHp, out n.Arm, out n.Bite, out n.AppearRound);
                s.Neutrals.Add(n);
            }
            foreach (var a in map.Altars) s.Altars.Add(new AltarState { Hex = a.Hex, Lane = a.Lane });
            foreach (var r in map.Relics) s.Relics.Add(new RelicState { Hex = r, AvailableFromRound = 1 });

            s.Draft.Hover = new HeroId[2 * s.Size];
            for (int i = 0; i < s.Draft.Hover.Length; i++) s.Draft.Hover[i] = HeroId.None;

            // First pick: seeded coin flip; a rematch gives it to the other team (GDD 10.2, Eddie Q16).
            if (setup.PreviousFirstPick == 0 || setup.PreviousFirstPick == 1) s.FirstPickTeam = 1 - setup.PreviousFirstPick;
            else s.FirstPickTeam = Rng.Range(ref s.RngState, 2);
            s.Draft.Order = DraftOrder(s.Size, s.FirstPickTeam);

            s.Phase = Phase.Draft;
            if (setup.FixedHeroes != null)
            {
                if (setup.FixedHeroes.Length != 2 * s.Size) throw new ArgumentException("FixedHeroes needs 2 * Size entries");
                var seen = new HashSet<HeroId>();
                for (int i = 0; i < setup.FixedHeroes.Length; i++)
                {
                    if (setup.FixedHeroes[i] == HeroId.None || !seen.Add(setup.FixedHeroes[i]))
                        throw new ArgumentException("FixedHeroes must be unique heroes");
                    s.Heroes[i].Hero = setup.FixedHeroes[i];
                }
                s.Draft.PickIndex = s.Draft.Order.Count;
                StartMatch(s);
            }
            else if (s.PickMode == PickMode.AllRandom)
            {
                // GDD 10.2: seeded draw from the pool, unique heroes, no role balancing.
                var pool = new List<HeroId>();
                for (int i = 0; i < Heroes.Count; i++) pool.Add((HeroId)i);
                for (int i = pool.Count - 1; i > 0; i--)
                {
                    int j = Rng.Range(ref s.RngState, i + 1);
                    var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
                }
                for (int i = 0; i < s.Heroes.Count; i++) s.Heroes[i].Hero = pool[i];
                s.Draft.PickIndex = s.Draft.Order.Count;
                StartMatch(s);
            }
            return s;
        }

        internal static void NeutralStats(NeutralKind k, out int hp, out int arm, out int bite, out int appear)
        {
            // GDD 8 table: HP / ARM / Bite, first appearance round.
            switch (k)
            {
                case NeutralKind.Wolf: hp = 4; arm = 0; bite = 1; appear = 1; break;
                case NeutralKind.Drake: hp = 10; arm = 1; bite = 2; appear = 3; break;
                case NeutralKind.Golem: hp = 16; arm = 2; bite = 3; appear = 6; break;
                default: hp = 16; arm = 1; bite = 3; appear = 5; break;
            }
        }

        internal static int NeutralRespawn(NeutralKind k)
        {
            switch (k)
            {
                case NeutralKind.Wolf: return 3;
                case NeutralKind.Drake: return 4;
                case NeutralKind.Golem: return 5;
                default: return 4;
            }
        }

        public static int LevelForRound(MapDef map, int round)
        {
            if (map.StartLevel >= 3)
            {
                // Frost Bridge: start at level 3, level 4 at round 3, level 5 at round 5 (GDD 6.4, 11.3).
                if (round >= 5) return 5;
                if (round >= 3) return 4;
                return 3;
            }
            if (round >= 9) return 5;
            if (round >= 7) return 4;
            if (round >= 5) return 3;
            if (round >= 3) return 2;
            return 1;
        }

        static void StartMatch(GameState s)
        {
            s.Level = LevelForRound(s.Map, 1);
            foreach (var h in s.Heroes)
            {
                h.Gold = s.Map.StartGold;
                h.OnBoard = true;
                h.Pos = FreeBaseHex(s, h.Team, h.Index);
                h.Hp = MaxHp(s, h);
            }
            s.Round = 0;
            BeginRound(s);
        }

        // ------------------------------------------------------------------ apply

        /// <summary>Validates and applies one action. On error the state is unchanged.</summary>
        public static ActionResult Apply(GameState s, GameAction a)
        {
            if (a == null) return ActionResult.Fail("null action");
            string err = Validate(s, a);
            if (err != null) return ActionResult.Fail(err);
            s.Events = new List<GameEvent>();
            Execute(s, a);
            s.Log.Add(a.Clone());
            return new ActionResult { Ok = true, Events = s.Events };
        }

        /// <summary>Applies an action and throws if it is illegal (tests, replays).</summary>
        public static void ApplyOrThrow(GameState s, GameAction a)
        {
            var r = Apply(s, a);
            if (!r.Ok) throw new InvalidOperationException("Illegal action " + a + ": " + r.Error);
        }

        /// <summary>Re-runs a match from its setup and action log (GDD 13).</summary>
        public static GameState Replay(MatchSetup setup, IList<GameAction> log)
        {
            var s = NewMatch(setup);
            foreach (var a in log) ApplyOrThrow(s, a);
            return s;
        }

        /// <summary>Applies the action to a copy and returns the copy (previews for bots and UI).</summary>
        public static GameState Preview(GameState s, GameAction a, out ActionResult result)
        {
            var c = s.Clone();
            result = Apply(c, a);
            return c;
        }

        /// <summary>Null if the action is legal now, else the reason.</summary>
        public static string Validate(GameState s, GameAction a)
        {
            if (s.Phase == Phase.GameOver) return "game over";
            switch (a.Type)
            {
                case ActionType.DraftPick: return ValidateDraftPick(s, a);
                case ActionType.DraftHover: return ValidateDraftHover(s, a);
                case ActionType.DraftTimeout: return s.Phase == Phase.Draft ? null : "not drafting";
                case ActionType.ChooseFirst:
                    if (s.Phase != Phase.ChooseFirst) return "no choice pending";
                    if (a.Team != 0 && a.Team != 1) return "team must be 0 or 1";
                    return null;
                case ActionType.ClaimGoNext: return ValidateClaim(s, a);
                case ActionType.ActivateHero: return ValidateActivate(s, a);
            }
            if (s.Phase != Phase.HeroPhase || !s.Act.Active) return "no active hero";
            var h = s.ActiveHero;
            if (s.Act.StunPending && a.Type != ActionType.EndActivation && !(a.Type == ActionType.UseItem && a.Item == ItemId.CleansingVeil))
                return "stunned: use Cleansing Veil or end the activation";
            switch (a.Type)
            {
                case ActionType.Move: return ValidateMove(s, h, a.Hex);
                case ActionType.Attack: return ValidateAttack(s, h, a);
                case ActionType.Ability: return ValidateAbility(s, h, a);
                case ActionType.UseItem: return ValidateUseItem(s, h, a);
                case ActionType.BuyItem: return ValidateBuy(s, h, a);
                case ActionType.Capture: return ValidateCapture(s, h);
                case ActionType.Recall:
                    if (!s.Map.RecallAllowed) return "no recall on this map";
                    return null;
                case ActionType.EndActivation: return null;
            }
            return "unknown action";
        }

        static void Execute(GameState s, GameAction a)
        {
            switch (a.Type)
            {
                case ActionType.DraftPick: ExecDraftPick(s, a); return;
                case ActionType.DraftHover: s.Draft.Hover[a.Team * s.Size + a.Seat] = a.HeroId; return;
                case ActionType.DraftTimeout: ExecDraftTimeout(s); return;
                case ActionType.ChooseFirst:
                    Emit(s, EventType.FirstTeamChosen, s.Chooser, a.Team, 0);
                    s.Chooser = -1;
                    StartHeroPhase(s, a.Team);
                    return;
                case ActionType.ClaimGoNext: s.GoNext[s.Heroes[a.Hero].Team] = a.Hero; return;
                case ActionType.ActivateHero: BeginActivation(s, a.Hero); return;
            }
            var h = s.ActiveHero;
            switch (a.Type)
            {
                case ActionType.Move:
                    s.Act.Moves++;
                    SpendAction(s);
                    MoveHero(s, h, a.Hex);
                    break;
                case ActionType.Attack: ExecAttack(s, h, a); break;
                case ActionType.Ability: ExecAbility(s, h, a); break;
                case ActionType.UseItem: ExecUseItem(s, h, a); break;
                case ActionType.BuyItem: ExecBuy(s, h, a); break;
                case ActionType.Capture: ExecCapture(s, h); break;
                case ActionType.Recall:
                    h.RecallPending = true;
                    Emit(s, EventType.RecallStarted, h.Index, h.Index, 0);
                    FinishActivation(s, false);
                    return;
                case ActionType.EndActivation:
                    if (s.Act.StunPending) { StunSkip(s, h); return; }
                    FinishActivation(s, false);
                    return;
            }
            AfterHeroAction(s);
        }

        /// <summary>Resolves a pending tower-dive shot and ends the activation if the active hero was KO'd.</summary>
        static void AfterHeroAction(GameState s)
        {
            if (s.Phase == Phase.GameOver || !s.Act.Active) return;
            var h = s.ActiveHero;
            if (s.Act.PendingDive >= 0)
            {
                var st = s.Structures[s.Act.PendingDive];
                s.Act.PendingDive = -1;
                if (st.Standing && !h.KO)
                {
                    Emit(s, EventType.TowerShot, -1, h.Index, StructureShot);
                    DamageHero(s, -1, h, StructureShot, DamageKind.Structure);
                }
            }
            if (s.Phase == Phase.GameOver) return;
            if (h.KO) FinishActivation(s, false);
        }

        static void SpendAction(GameState s)
        {
            s.Act.ActionsUsed++;
            s.Act.ShopOpen = false;
        }

        internal static int ActionsLeft(GameState s) { return s.Act.MaxActions - s.Act.ActionsUsed; }

        // ------------------------------------------------------------------ rounds and turns

        static void BeginRound(GameState s)
        {
            s.Round++;
            Emit(s, EventType.RoundStart, -1, -1, s.Round);
            int newLevel = LevelForRound(s.Map, s.Round);
            if (newLevel != s.Level)
            {
                int delta = LevelHp[newLevel] - LevelHp[s.Level];
                s.Level = newLevel;
                // GDD-AMBIGUOUS: the GDD gives level HP as max HP; current HP rises by the same amount (as in lanefall_sim.py).
                foreach (var h in s.Heroes) if (!h.KO) h.Hp = Math.Min(MaxHp(s, h), h.Hp + delta);
                Emit(s, EventType.LevelUp, -1, -1, newLevel);
            }
            foreach (var h in s.Heroes)
            {
                h.Gold += 1;
                h.DamagedByMask = 0;
                h.Activated = false;
            }
            foreach (var n in s.Neutrals)
            {
                if (!n.Alive && n.AppearRound <= s.Round)
                {
                    n.Alive = true;
                    n.Hp = n.MaxHp;
                    n.DamagedThisRound = false;
                    Emit(s, EventType.NeutralAppeared, -1, n.Index, 0);
                }
            }
            s.GoNext[0] = -1; s.GoNext[1] = -1;
            if (s.Round == 1)
            {
                // GDD 4 / 10.2 (Q16): the team without first pick chooses who activates first in round 1.
                s.Chooser = 1 - s.FirstPickTeam;
                s.Phase = Phase.ChooseFirst;
            }
            else if (s.Vp[0] != s.Vp[1])
            {
                // GDD 4: the team with fewer VP chooses.
                s.Chooser = s.Vp[0] < s.Vp[1] ? 0 : 1;
                s.Phase = Phase.ChooseFirst;
            }
            else
            {
                // Tied VP: the team that went second last round goes first.
                StartHeroPhase(s, 1 - s.FirstTeamLastRound);
            }
        }

        static void StartHeroPhase(GameState s, int first)
        {
            s.FirstTeamThisRound = first;
            s.TurnTeam = first;
            s.Phase = Phase.HeroPhase;
            s.Act = new ActivationState();
            AutoResolveSkips(s);
        }

        static bool HasUnactivated(GameState s, int team)
        {
            foreach (var h in s.Heroes) if (h.Team == team && !h.Activated) return true;
            return false;
        }

        /// <summary>True if the hero's next activation will be skipped (KO respawn wait, or Stun without a ready Veil).</summary>
        public static bool WillSkip(GameState s, HeroState h)
        {
            if (h.KO) return h.SkipsLeft > 0;
            return h.Stun && !CanUseVeil(h);
        }

        /// <summary>GDD 4: a skipped activation that is the team's last one resolves at once.</summary>
        static void AutoResolveSkips(GameState s)
        {
            if (s.Phase != Phase.HeroPhase || s.Act.Active) return;
            int last = -1, count = 0;
            foreach (var h in s.Heroes)
            {
                if (h.Team == s.TurnTeam && !h.Activated) { count++; last = h.Index; }
            }
            if (count == 1 && WillSkip(s, s.Heroes[last])) BeginActivation(s, last);
        }

        static void BeginActivation(GameState s, int idx)
        {
            var h = s.Heroes[idx];
            h.Activated = true;
            s.GoNext[h.Team] = -1;
            s.Act = new ActivationState { Hero = idx, MaxActions = ActionsPerActivation };
            Emit(s, EventType.Activated, idx, idx, 0);
            if (h.KO)
            {
                if (h.SkipsLeft > 0)
                {
                    h.SkipsLeft--;
                    Emit(s, EventType.Skipped, idx, idx, 0);
                    FinishActivation(s, true);
                    return;
                }
                // GDD 6.5: respawn on the Fountain at full HP at the start of the following activation (may shop).
                h.KO = false;
                h.OnBoard = true;
                h.Pos = FreeBaseHex(s, h.Team, idx);
                h.Hp = MaxHp(s, h);
                Emit(s, EventType.Respawned, idx, idx, 0);
            }
            else if (h.RecallPending)
            {
                // GDD 6.7: appear on the Fountain at the start of the next activation.
                h.RecallPending = false;
                if (!InBase(s, h)) h.Pos = FreeBaseHex(s, h.Team, idx);
                Emit(s, EventType.RecallArrived, idx, idx, 0);
            }
            if (InBase(s, h))
            {
                // Base heals to full and clears Poison at the start of each activation (GDD 6.7, 6.9).
                h.Hp = MaxHp(s, h);
                ClearPoison(h);
                s.Act.ShopOpen = true;
            }
            if (h.PoisonLeft > 0)
            {
                // GDD 6.9: before anything else (after recall arrival), lose n + POW; skipped activations too.
                h.PoisonLeft--;
                int tick = h.PoisonTick;
                int src = h.PoisonSource;
                if (h.PoisonLeft == 0) { h.PoisonTick = 0; h.PoisonSource = -1; }
                Emit(s, EventType.PoisonTick, src, idx, tick);
                DamageHero(s, src, h, tick, DamageKind.Poison);
                if (s.Phase == Phase.GameOver) return;
                if (h.KO)
                {
                    // GDD-AMBIGUOUS: a Poison KO at the start of the activation ends this activation; the respawn
                    // skip then applies to the hero's following activation(s).
                    FinishActivation(s, true);
                    return;
                }
            }
            // Shield expires at the start of the owner's next activation (GDD 6.5); Hidden ends (Smoke Veil).
            h.Shield = 0;
            h.Hidden = false;
            // Conditions affect this activation and are consumed now (GDD 6.6: "until the end of the next activation").
            s.Act.Rooted = h.Root > 0; if (h.Root > 0) h.Root--;
            s.Act.Slowed = h.Slow > 0; if (h.Slow > 0) h.Slow--;
            s.Act.Silenced = h.Silence > 0; if (h.Silence > 0) h.Silence--;
            s.Act.Hasted = h.Haste > 0; if (h.Haste > 0) h.Haste--;
            if (h.Stun)
            {
                if (CanUseVeil(h)) { s.Act.StunPending = true; return; }
                StunSkip(s, h);
                return;
            }
            s.Act.SteadfastAtStart = h.Steadfast;
        }

        static void StunSkip(GameState s, HeroState h)
        {
            // GDD 6.6: skip the activation entirely, then Steadfast until the end of the next real activation.
            h.Stun = false;
            h.Steadfast = true;
            s.Act.StunPending = false;
            Emit(s, EventType.Skipped, h.Index, h.Index, 1);
            FinishActivation(s, true);
        }

        static void FinishActivation(GameState s, bool skipped)
        {
            var h = s.ActiveHero;
            if (h != null && !skipped && s.Act.SteadfastAtStart) h.Steadfast = false;
            if (h != null) Emit(s, EventType.ActivationEnded, h.Index, h.Index, skipped ? 1 : 0);
            s.Act = new ActivationState();
            if (s.Phase == Phase.GameOver) return;
            PassTurn(s);
        }

        static void PassTurn(GameState s)
        {
            bool all = true;
            foreach (var h in s.Heroes) if (!h.Activated) { all = false; break; }
            if (all)
            {
                s.FirstTeamLastRound = s.FirstTeamThisRound;
                LanePhase(s);
                if (s.Phase == Phase.GameOver) return;
                EndStep(s);
                if (s.Phase == Phase.GameOver) return;
                BeginRound(s);
                return;
            }
            int other = 1 - s.TurnTeam;
            if (HasUnactivated(s, other)) s.TurnTeam = other;
            Emit(s, EventType.TurnPassed, -1, s.TurnTeam, 0);
            AutoResolveSkips(s);
        }

        static string ValidateActivate(GameState s, GameAction a)
        {
            if (s.Phase != Phase.HeroPhase) return "not the hero phase";
            if (s.Act.Active) return "a hero is already active";
            if (a.Hero < 0 || a.Hero >= s.Heroes.Count) return "bad hero";
            var h = s.Heroes[a.Hero];
            if (h.Team != s.TurnTeam) return "not this team's turn";
            if (h.Activated) return "already activated this round";
            return null;
        }

        static string ValidateClaim(GameState s, GameAction a)
        {
            if (s.Phase != Phase.HeroPhase) return "not the hero phase";
            if (a.Hero < 0 || a.Hero >= s.Heroes.Count) return "bad hero";
            var h = s.Heroes[a.Hero];
            if (h.Activated) return "already activated";
            if (h.Team == s.TurnTeam) return "claims are made during the enemy's turn";
            if (s.GoNext[h.Team] >= 0) return "slot already claimed";
            return null;
        }

        /// <summary>Default hero for a team's next slot online: the "Go next" claim, else the lowest seat (GDD 4).</summary>
        public static int DefaultNextHero(GameState s, int team)
        {
            if (s.GoNext[team] >= 0 && !s.Heroes[s.GoNext[team]].Activated) return s.GoNext[team];
            foreach (var h in s.Heroes) if (h.Team == team && !h.Activated) return h.Index;
            return -1;
        }

        // ------------------------------------------------------------------ stats

        public static int MaxHp(GameState s, HeroState h)
        {
            int v = h.Def.Hp + LevelHp[s.Level];
            foreach (var it in h.Items) v += Items.Get(it).Hp;
            return v;
        }

        public static int Atk(GameState s, HeroState h)
        {
            int v = h.Def.Atk + LevelAtk[s.Level] + s.DrakeStacks[h.Team];
            foreach (var it in h.Items) v += Items.Get(it).Atk;
            if (s.Act.Hero == h.Index) v += s.Act.AtkBonus;
            return v;
        }

        public static int Pow(GameState s, HeroState h)
        {
            int v = LevelPow[s.Level];
            foreach (var it in h.Items) v += Items.Get(it).Pow;
            return v;
        }

        public static int Arm(HeroState h)
        {
            int v = h.Def.Arm;
            foreach (var it in h.Items) v += Items.Get(it).Arm;
            return v;
        }

        /// <summary>SPD for a Move: Haste +2, Slow -2 (min 1) (GDD 6.6, 6.9).</summary>
        public static int Spd(GameState s, HeroState h)
        {
            int v = h.Def.Spd;
            foreach (var it in h.Items) v += Items.Get(it).Spd;
            bool active = s.Act.Hero == h.Index;
            bool hasted = active ? s.Act.Hasted : h.Haste > 0;
            bool slowed = active ? s.Act.Slowed : h.Slow > 0;
            if (hasted) v += 2;
            if (slowed) { v -= 2; if (v < 1) v = 1; }
            return v;
        }

        public static int Pierce(HeroState h)
        {
            int v = 0;
            foreach (var it in h.Items) if (it == ItemId.PiercingEdge) v++;
            return v;
        }

        public static bool HasItem(HeroState h, ItemId id) { return h.Items.Contains(id); }

        static bool CanUseVeil(HeroState h) { return h.Items.Contains(ItemId.CleansingVeil) && h.VeilCd == 0; }

        public static bool InBase(GameState s, HeroState h)
        {
            return h.OnBoard && s.Map.BaseHexes[h.Team].Contains(h.Pos);
        }

        internal static void Emit(GameState s, EventType t, int source, int target, int amount)
        {
            s.Events.Add(new GameEvent(t, source, target, amount));
        }
    }
}
