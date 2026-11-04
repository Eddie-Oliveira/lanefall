using System.Collections.Generic;

namespace Lanefall.Core
{
    public enum Phase { Draft = 0, ChooseFirst = 1, HeroPhase = 2, GameOver = 3 }

    public enum PickMode { Default = 0, Draft = 1, FreePick = 2, AllRandom = 3 }

    public enum EndReason { None = 0, Core = 1, Vp = 2, RoundLimit = 3, Draw = 4 }

    public static class Team
    {
        public const int Azure = 0;
        public const int Ember = 1;
        public static int Other(int t) { return 1 - t; }
        /// <summary>Lane-node sign of a team's side: Azure is negative, Ember positive (GDD 3).</summary>
        public static int Side(int t) { return t == Azure ? -1 : 1; }
    }

    /// <summary>Lobby settings. Seed + setup + action log replays a match exactly (GDD 13).</summary>
    public sealed class MatchSetup
    {
        public MapId Map = MapId.Rift;
        /// <summary>Heroes per team (1..4). Commander is Size 2 with Commander = true.</summary>
        public int Size = 1;
        public ulong Seed = 1;
        public PickMode PickMode = PickMode.Default;
        /// <summary>Commander mode (GDD 4.1): one player per team runs both heroes. Rules are the 2v2 rules.</summary>
        public bool Commander;
        /// <summary>Rematch in the same lobby: the team that had first pick last match (-1 = none, coin flip).</summary>
        public int PreviousFirstPick = -1;
        /// <summary>Optional: skip the draft with fixed heroes, index = team * Size + seat (tests, tutorial).</summary>
        public HeroId[] FixedHeroes;

        public MatchSetup Clone()
        {
            var c = (MatchSetup)MemberwiseClone();
            if (FixedHeroes != null) c.FixedHeroes = (HeroId[])FixedHeroes.Clone();
            return c;
        }
    }

    public sealed class HeroState
    {
        public int Index;
        public int Team;
        public int Seat;
        public HeroId Hero = HeroId.None;
        public Hex Pos;
        public bool OnBoard;
        public int Hp;
        public int Shield;
        public int Gold;
        public List<ItemId> Items = new List<ItemId>();
        /// <summary>Ability cooldowns in rounds (Q, W, E, R). 0 = ready.</summary>
        public int[] Cd = new int[4];
        public int BlinkCd;
        public int VeilCd;

        // Conditions (GDD 6.6). Counters = how many of the hero's upcoming activations they affect.
        public bool Stun;
        public int Root;
        public int Slow;
        public int Silence;
        /// <summary>Stun immunity after a stun-skipped activation, until the end of the next real activation.</summary>
        public bool Steadfast;
        /// <summary>Haste buff for the hero's next activation(s) (GDD 6.9; not a condition).</summary>
        public int Haste;
        public bool Hidden;
        public int PoisonTick;
        public int PoisonLeft;
        public int PoisonSource = -1;

        public bool KO;
        public int SkipsLeft;
        public bool RecallPending;
        public bool Activated;
        public bool Aegis;
        /// <summary>Bit mask of enemy hero indices that damaged this hero this round (assists, GDD 6.5).</summary>
        public int DamagedByMask;

        public int Kills, Deaths, LastHits;
        /// <summary>Kills credited to this hero (hero KOs + minions + neutral claims); Shadow Reset compares it.</summary>
        public int KillScore;

        public HeroDef Def { get { return Heroes.Get(Hero); } }

        public HeroState Clone()
        {
            var c = (HeroState)MemberwiseClone();
            c.Items = new List<ItemId>(Items);
            c.Cd = (int[])Cd.Clone();
            return c;
        }
    }

    /// <summary>Per-activation bookkeeping for the hero that is acting now.</summary>
    public sealed class ActivationState
    {
        public int Hero = -1;
        public int ActionsUsed;
        public int MaxActions = 3;
        public int Moves;
        public bool Attacked;
        public bool Captured;
        public bool[] AbilityUsed = new bool[4];
        public bool BlinkUsed;
        public bool VeilUsed;
        /// <summary>The hero is Stunned and holds a ready Cleansing Veil: it may use it or accept the skip.</summary>
        public bool StunPending;
        public bool ShopOpen;
        public bool ResetUsed;
        public int AtkBonus;
        public bool FrostArrows;
        public bool Totem;
        public bool DiveShot;
        public int PendingDive = -1;
        public bool Rooted, Slowed, Silenced, Hasted;
        public bool SteadfastAtStart;

        public bool Active { get { return Hero >= 0; } }

        public ActivationState Clone()
        {
            var c = (ActivationState)MemberwiseClone();
            c.AbilityUsed = (bool[])AbilityUsed.Clone();
            return c;
        }
    }

    public sealed class StructureState
    {
        public int Index;
        public int Team;
        /// <summary>Lane index, or -1 for the Core.</summary>
        public int Lane;
        /// <summary>Signed lane node it stands on (Azure negative), e.g. -3; Core = +-NodeMax.</summary>
        public int Node;
        public Hex Hex;
        public int Hp;
        public int MaxHp;
        public bool IsCore { get { return Lane < 0; } }
        public bool Standing { get { return Hp > 0; } }
        public StructureState Clone() { return (StructureState)MemberwiseClone(); }
    }

    public sealed class LaneState
    {
        /// <summary>Front marker node (0 = river, negative = Azure side).</summary>
        public int Front;
        /// <summary>Minions per team in this lane.</summary>
        public int[] Wave = new int[2];
        public LaneState Clone() { var c = (LaneState)MemberwiseClone(); c.Wave = (int[])Wave.Clone(); return c; }
    }

    public sealed class NeutralState
    {
        public int Index;
        public NeutralKind Kind;
        public Hex Hex;
        public bool Alive;
        public int Hp, MaxHp, Arm, Bite;
        /// <summary>Round at whose Start step it (re)appears.</summary>
        public int AppearRound;
        public bool DamagedThisRound;
        public NeutralState Clone() { return (NeutralState)MemberwiseClone(); }
    }

    public sealed class AltarState
    {
        public Hex Hex;
        public int Lane;
        public int Owner = -1;
        /// <summary>Captures are not allowed while Round &lt;= LockedThroughRound.</summary>
        public int LockedThroughRound;
        public AltarState Clone() { return (AltarState)MemberwiseClone(); }
    }

    public sealed class RelicState
    {
        public Hex Hex;
        public int AvailableFromRound = 1;
        public RelicState Clone() { return (RelicState)MemberwiseClone(); }
    }

    public sealed class DraftState
    {
        /// <summary>Team of each pick in snake order (GDD 10.2).</summary>
        public List<int> Order = new List<int>();
        public int PickIndex;
        /// <summary>Hovered hero per hero slot (team * Size + seat), shown to teammates only.</summary>
        public HeroId[] Hover;
        public DraftState Clone()
        {
            var c = (DraftState)MemberwiseClone();
            c.Order = new List<int>(Order);
            c.Hover = Hover == null ? null : (HeroId[])Hover.Clone();
            return c;
        }
    }

    public sealed class GameState
    {
        public MatchSetup Setup;
        public MapDef Map;
        public int Size;
        public PickMode PickMode;
        public Phase Phase;
        public int Round;
        public int Level;
        public int RoundLimit;
        public int VpTarget;

        public int[] Vp = new int[2];
        public int[] DrakeStacks = new int[2];
        public int[] Brood = new int[2];
        /// <summary>Enemy towers destroyed by each team (tie-break 1).</summary>
        public int[] TowersDestroyed = new int[2];
        /// <summary>Enemy hero KOs scored by each team (tie-break 3).</summary>
        public int[] HeroKOs = new int[2];

        public List<HeroState> Heroes = new List<HeroState>();
        public List<StructureState> Structures = new List<StructureState>();
        public LaneState[] Lanes;
        public List<NeutralState> Neutrals = new List<NeutralState>();
        public List<AltarState> Altars = new List<AltarState>();
        public List<RelicState> Relics = new List<RelicState>();
        public DraftState Draft = new DraftState();

        public int FirstPickTeam = -1;
        /// <summary>Team that must choose who activates first (Phase.ChooseFirst).</summary>
        public int Chooser = -1;
        public int FirstTeamThisRound = -1;
        public int FirstTeamLastRound = -1;
        public int TurnTeam = -1;
        public ActivationState Act = new ActivationState();
        /// <summary>"Go next" claim per team (hero index or -1), GDD 4.</summary>
        public int[] GoNext = { -1, -1 };

        public int Winner = -1;
        public EndReason End;

        public ulong RngState;
        public ulong BotRngState;
        /// <summary>Counts every kill credited to a hero (KO, minion, neutral claim); used for Shadow Reset.</summary>
        public int KillCounter;

        /// <summary>Every successfully applied action, in order. Seed + setup + Log replays the match.</summary>
        public List<GameAction> Log = new List<GameAction>();
        /// <summary>Events produced by the last applied action (for the view layer). Not part of the hash.</summary>
        public List<GameEvent> Events = new List<GameEvent>();

        public HeroState ActiveHero { get { return Act.Hero >= 0 ? Heroes[Act.Hero] : null; } }

        public GameState Clone()
        {
            var c = (GameState)MemberwiseClone();
            c.Setup = Setup.Clone();
            c.Vp = (int[])Vp.Clone();
            c.DrakeStacks = (int[])DrakeStacks.Clone();
            c.Brood = (int[])Brood.Clone();
            c.TowersDestroyed = (int[])TowersDestroyed.Clone();
            c.HeroKOs = (int[])HeroKOs.Clone();
            c.Heroes = new List<HeroState>(Heroes.Count);
            foreach (var h in Heroes) c.Heroes.Add(h.Clone());
            c.Structures = new List<StructureState>(Structures.Count);
            foreach (var x in Structures) c.Structures.Add(x.Clone());
            c.Lanes = new LaneState[Lanes.Length];
            for (int i = 0; i < Lanes.Length; i++) c.Lanes[i] = Lanes[i].Clone();
            c.Neutrals = new List<NeutralState>(Neutrals.Count);
            foreach (var n in Neutrals) c.Neutrals.Add(n.Clone());
            c.Altars = new List<AltarState>(Altars.Count);
            foreach (var a in Altars) c.Altars.Add(a.Clone());
            c.Relics = new List<RelicState>(Relics.Count);
            foreach (var r in Relics) c.Relics.Add(r.Clone());
            c.Draft = Draft.Clone();
            c.Act = Act.Clone();
            c.GoNext = (int[])GoNext.Clone();
            c.Log = new List<GameAction>(Log);
            c.Events = new List<GameEvent>(Events);
            return c;
        }

        /// <summary>Deterministic 64-bit hash of every rule-relevant field (FNV-1a). Same log, same hash.</summary>
        public ulong Hash()
        {
            var w = new HashWriter();
            w.Add((int)Setup.Map); w.Add(Size); w.Add((int)PickMode); w.Add((int)Phase); w.Add(Round); w.Add(Level);
            w.Add(RoundLimit); w.Add(VpTarget);
            for (int t = 0; t < 2; t++)
            {
                w.Add(Vp[t]); w.Add(DrakeStacks[t]); w.Add(Brood[t]); w.Add(TowersDestroyed[t]); w.Add(HeroKOs[t]); w.Add(GoNext[t]);
            }
            foreach (var h in Heroes)
            {
                w.Add((int)h.Hero); w.Add(h.Team); w.Add(h.Seat); w.Add(h.Pos.Q); w.Add(h.Pos.R); w.Add(h.OnBoard);
                w.Add(h.Hp); w.Add(h.Shield); w.Add(h.Gold); w.Add(h.Items.Count);
                foreach (var it in h.Items) w.Add((int)it);
                for (int i = 0; i < 4; i++) w.Add(h.Cd[i]);
                w.Add(h.BlinkCd); w.Add(h.VeilCd); w.Add(h.Stun); w.Add(h.Root); w.Add(h.Slow); w.Add(h.Silence);
                w.Add(h.Steadfast); w.Add(h.Haste); w.Add(h.Hidden); w.Add(h.PoisonTick); w.Add(h.PoisonLeft); w.Add(h.PoisonSource);
                w.Add(h.KO); w.Add(h.SkipsLeft); w.Add(h.RecallPending); w.Add(h.Activated); w.Add(h.Aegis); w.Add(h.DamagedByMask);
                w.Add(h.Kills); w.Add(h.Deaths); w.Add(h.LastHits); w.Add(h.KillScore);
            }
            foreach (var x in Structures) { w.Add(x.Team); w.Add(x.Lane); w.Add(x.Node); w.Add(x.Hp); }
            foreach (var l in Lanes) { w.Add(l.Front); w.Add(l.Wave[0]); w.Add(l.Wave[1]); }
            foreach (var n in Neutrals) { w.Add((int)n.Kind); w.Add(n.Alive); w.Add(n.Hp); w.Add(n.AppearRound); w.Add(n.DamagedThisRound); }
            foreach (var a in Altars) { w.Add(a.Owner); w.Add(a.LockedThroughRound); }
            foreach (var r in Relics) { w.Add(r.AvailableFromRound); }
            w.Add(Draft.PickIndex); w.Add(Draft.Order.Count);
            if (Draft.Hover != null) foreach (var hv in Draft.Hover) w.Add((int)hv);
            w.Add(FirstPickTeam); w.Add(Chooser); w.Add(FirstTeamThisRound); w.Add(FirstTeamLastRound); w.Add(TurnTeam);
            var a2 = Act;
            w.Add(a2.Hero); w.Add(a2.ActionsUsed); w.Add(a2.MaxActions); w.Add(a2.Moves); w.Add(a2.Attacked); w.Add(a2.Captured);
            for (int i = 0; i < 4; i++) w.Add(a2.AbilityUsed[i]);
            w.Add(a2.BlinkUsed); w.Add(a2.VeilUsed); w.Add(a2.StunPending); w.Add(a2.ShopOpen); w.Add(a2.ResetUsed); w.Add(a2.AtkBonus);
            w.Add(a2.FrostArrows); w.Add(a2.Totem); w.Add(a2.DiveShot); w.Add(a2.PendingDive); w.Add(a2.Rooted); w.Add(a2.Slowed);
            w.Add(a2.Silenced); w.Add(a2.Hasted); w.Add(a2.SteadfastAtStart);
            w.Add(Winner); w.Add((int)End); w.Add(KillCounter);
            w.Add((long)RngState); w.Add((long)BotRngState);
            return w.Value;
        }
    }

    internal sealed class HashWriter
    {
        ulong _h = 14695981039346656037UL;
        public ulong Value { get { return _h; } }
        public void Add(long v)
        {
            ulong u = (ulong)v;
            for (int i = 0; i < 8; i++)
            {
                _h ^= (u >> (8 * i)) & 0xFF;
                _h *= 1099511628211UL;
            }
        }
        public void Add(int v) { Add((long)v); }
        public void Add(bool v) { Add(v ? 1L : 0L); }
    }
}
