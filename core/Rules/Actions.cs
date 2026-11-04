using System.Collections.Generic;
using System.Text;

namespace Lanefall.Core
{
    public enum ActionType
    {
        // Draft (GDD 10.2)
        DraftPick, DraftHover, DraftTimeout,
        // Round start: the choosing team names the team that activates first (GDD 4)
        ChooseFirst,
        // Online "Go next" slot claim (out of turn, GDD 4)
        ClaimGoNext,
        // Hero phase
        ActivateHero, Move, Attack, Ability, UseItem, BuyItem, Capture, Recall, EndActivation
    }

    public enum TargetType { None, Hero, Wave, Neutral, Structure, Hex, Direction }

    /// <summary>What an Attack or ability is aimed at. Index = hero / lane / neutral / structure / direction index.</summary>
    public struct Target
    {
        public TargetType Type;
        public int Index;
        public Hex Hex;

        public static Target None { get { return new Target { Type = TargetType.None, Index = -1 }; } }
        public static Target OfHero(int i) { return new Target { Type = TargetType.Hero, Index = i }; }
        public static Target OfWave(int lane) { return new Target { Type = TargetType.Wave, Index = lane }; }
        public static Target OfNeutral(int i) { return new Target { Type = TargetType.Neutral, Index = i }; }
        public static Target OfStructure(int i) { return new Target { Type = TargetType.Structure, Index = i }; }
        public static Target OfHex(Hex h) { return new Target { Type = TargetType.Hex, Index = -1, Hex = h }; }
        public static Target OfDirection(int d) { return new Target { Type = TargetType.Direction, Index = d }; }

        public bool IsNone { get { return Type == TargetType.None; } }

        public bool SameAs(Target o)
        {
            if (Type != o.Type) return false;
            if (Type == TargetType.Hex) return Hex == o.Hex;
            return Index == o.Index;
        }

        public override string ToString()
        {
            switch (Type)
            {
                case TargetType.None: return "-";
                case TargetType.Hex: return "hex" + Hex;
                default: return Type.ToString().ToLowerInvariant() + Index;
            }
        }
    }

    /// <summary>
    /// One player (or bot) input. Actions during an activation act for the active hero; the active hero does not
    /// need to be named. Build them with the static factories.
    /// </summary>
    public sealed class GameAction
    {
        public ActionType Type;
        public int Team = -1;
        public int Seat = -1;
        public int Hero = -1;
        public HeroId HeroId = HeroId.None;
        public int Slot = -1;
        public ItemId Item = ItemId.None;
        public int Discard = -1;
        public Hex Hex;
        public Target Target = Lanefall.Core.Target.None;
        public Target Target2 = Lanefall.Core.Target.None;
        /// <summary>Optional Chain Lightning jump targets chosen by the caster (else the engine picks).</summary>
        public List<Target> Chain;

        public static GameAction DraftPick(HeroId hero) { return new GameAction { Type = ActionType.DraftPick, HeroId = hero }; }
        /// <summary>Free pick mode: a seat locks a hero (first to lock gets it).</summary>
        public static GameAction DraftPickFor(int team, int seat, HeroId hero) { return new GameAction { Type = ActionType.DraftPick, Team = team, Seat = seat, HeroId = hero }; }
        public static GameAction DraftHover(int team, int seat, HeroId hero) { return new GameAction { Type = ActionType.DraftHover, Team = team, Seat = seat, HeroId = hero }; }
        public static GameAction DraftTimeout() { return new GameAction { Type = ActionType.DraftTimeout }; }
        public static GameAction ChooseFirst(int firstTeam) { return new GameAction { Type = ActionType.ChooseFirst, Team = firstTeam }; }
        public static GameAction ClaimGoNext(int hero) { return new GameAction { Type = ActionType.ClaimGoNext, Hero = hero }; }
        public static GameAction Activate(int hero) { return new GameAction { Type = ActionType.ActivateHero, Hero = hero }; }
        public static GameAction Move(Hex to) { return new GameAction { Type = ActionType.Move, Hex = to }; }
        public static GameAction Attack(Target t) { return new GameAction { Type = ActionType.Attack, Target = t }; }
        public static GameAction Attack(Target t, Target second) { return new GameAction { Type = ActionType.Attack, Target = t, Target2 = second }; }
        public static GameAction Ability(int slot) { return new GameAction { Type = ActionType.Ability, Slot = slot }; }
        public static GameAction Ability(int slot, Target t) { return new GameAction { Type = ActionType.Ability, Slot = slot, Target = t }; }
        public static GameAction Ability(int slot, Target t, Target second) { return new GameAction { Type = ActionType.Ability, Slot = slot, Target = t, Target2 = second }; }
        public static GameAction UseItem(ItemId item) { return new GameAction { Type = ActionType.UseItem, Item = item }; }
        public static GameAction UseItem(ItemId item, Hex to) { return new GameAction { Type = ActionType.UseItem, Item = item, Hex = to, Target = Lanefall.Core.Target.OfHex(to) }; }
        public static GameAction Buy(ItemId item, int discardSlot = -1) { return new GameAction { Type = ActionType.BuyItem, Item = item, Discard = discardSlot }; }
        public static GameAction Capture() { return new GameAction { Type = ActionType.Capture }; }
        public static GameAction Recall() { return new GameAction { Type = ActionType.Recall }; }
        public static GameAction End() { return new GameAction { Type = ActionType.EndActivation }; }

        public GameAction Clone()
        {
            var c = (GameAction)MemberwiseClone();
            if (Chain != null) c.Chain = new List<Target>(Chain);
            return c;
        }

        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append(Type);
            switch (Type)
            {
                case ActionType.DraftPick:
                case ActionType.DraftHover:
                    sb.Append(' ').Append(HeroId);
                    if (Team >= 0) sb.Append(" t").Append(Team).Append(" s").Append(Seat);
                    break;
                case ActionType.ChooseFirst: sb.Append(" first=").Append(Team); break;
                case ActionType.ClaimGoNext:
                case ActionType.ActivateHero: sb.Append(" h").Append(Hero); break;
                case ActionType.Move: sb.Append(' ').Append(Hex); break;
                case ActionType.Attack: sb.Append(' ').Append(Target).Append(' ').Append(Target2); break;
                case ActionType.Ability: sb.Append(" ").Append("QWER"[Slot < 0 || Slot > 3 ? 0 : Slot]).Append(' ').Append(Target).Append(' ').Append(Target2); break;
                case ActionType.UseItem: sb.Append(' ').Append(Item).Append(' ').Append(Target); break;
                case ActionType.BuyItem: sb.Append(' ').Append(Item).Append(" discard=").Append(Discard); break;
            }
            return sb.ToString();
        }
    }

    public sealed class ActionResult
    {
        public bool Ok;
        public string Error;
        public List<GameEvent> Events;

        public static ActionResult Fail(string error) { return new ActionResult { Ok = false, Error = error, Events = new List<GameEvent>() }; }
    }

    public enum EventType
    {
        RoundStart, LevelUp, FirstTeamChosen, TurnPassed, Activated, Skipped, Respawned, RecallArrived,
        Moved, Damage, Heal, ShieldGained, KO, Revived, Stunned, StunIgnored, Rooted, Slowed, Silenced, Hasted, Cleansed, Hidden,
        Poisoned, PoisonTick, MinionsKilled, Gold, Vp, NeutralClaimed, NeutralAppeared, Bite, TowerShot,
        StructureDamaged, StructureDestroyed, LaneSpawn, LaneClash, FrontMoved, Siege, AltarCaptured, RelicUsed,
        ItemBought, ItemUsed, AbilityUsed, Attacked, ShadowReset, RecallStarted, ActivationEnded, DraftPicked, GameOver
    }

    /// <summary>
    /// Something that happened, for the view layer to animate. Source/Target are hero indices (or -1), except where
    /// noted: MinionsKilled.Target = lane, Structure* .Target = structure index, NeutralClaimed.Target = neutral index.
    /// </summary>
    public struct GameEvent
    {
        public EventType Type;
        public int Source;
        public int Target;
        public int Amount;
        public Hex Hex;

        public GameEvent(EventType type, int source, int target, int amount)
        {
            Type = type; Source = source; Target = target; Amount = amount; Hex = default(Hex);
        }

        public override string ToString() { return Type + " " + Source + "->" + Target + " " + Amount; }
    }
}
