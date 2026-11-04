using System.Collections.Generic;

namespace Lanefall.Core
{
    /// <summary>Whose turn it is and who will skip (GDD 12, ActivationOrder).</summary>
    public sealed class ActivationOrderInfo
    {
        public int TurnTeam;
        public int ActiveHero;
        public List<int>[] Unactivated = { new List<int>(), new List<int>() };
        public List<int> WillSkip = new List<int>();
        public int[] DefaultNext = { -1, -1 };
    }

    public static partial class Engine
    {
        public static ActivationOrderInfo ActivationOrder(GameState s)
        {
            var info = new ActivationOrderInfo { TurnTeam = s.TurnTeam, ActiveHero = s.Act.Hero };
            foreach (var h in s.Heroes)
            {
                if (!h.Activated) info.Unactivated[h.Team].Add(h.Index);
                if (!h.Activated && WillSkip(s, h)) info.WillSkip.Add(h.Index);
            }
            info.DefaultNext[0] = DefaultNextHero(s, 0);
            info.DefaultNext[1] = DefaultNextHero(s, 1);
            return info;
        }

        /// <summary>
        /// Every legal action for the side to move (draft seat, choosing team, or the active team/hero). Out-of-turn
        /// actions (ClaimGoNext, DraftHover) are not listed. Each returned action passes Validate.
        /// </summary>
        public static List<GameAction> LegalActions(GameState s)
        {
            var list = new List<GameAction>();
            switch (s.Phase)
            {
                case Phase.GameOver: return list;
                case Phase.Draft:
                    if (s.PickMode == PickMode.FreePick)
                    {
                        foreach (var h in s.Heroes)
                        {
                            if (h.Hero != HeroId.None) continue;
                            foreach (var id in FreeHeroes(s)) list.Add(GameAction.DraftPickFor(h.Team, h.Seat, id));
                        }
                    }
                    else
                    {
                        foreach (var id in FreeHeroes(s)) list.Add(GameAction.DraftPick(id));
                    }
                    list.Add(GameAction.DraftTimeout());
                    return list;
                case Phase.ChooseFirst:
                    list.Add(GameAction.ChooseFirst(0));
                    list.Add(GameAction.ChooseFirst(1));
                    return list;
            }
            if (!s.Act.Active)
            {
                foreach (var h in s.Heroes)
                    if (h.Team == s.TurnTeam && !h.Activated) list.Add(GameAction.Activate(h.Index));
                return list;
            }
            var me = s.ActiveHero;
            if (s.Act.StunPending)
            {
                list.Add(GameAction.UseItem(ItemId.CleansingVeil));
                list.Add(GameAction.End());
                return list;
            }
            // Free actions first
            list.Add(GameAction.End());
            if (s.Map.RecallAllowed) list.Add(GameAction.Recall());
            if (s.Act.ShopOpen)
            {
                for (int i = 0; i < Items.Count; i++)
                {
                    var id = (ItemId)i;
                    var buy = GameAction.Buy(id);
                    if (Validate(s, buy) == null) { list.Add(buy); continue; }
                    for (int slot = 0; slot < me.Items.Count; slot++)
                    {
                        var b2 = GameAction.Buy(id, slot);
                        if (Validate(s, b2) == null) list.Add(b2);
                    }
                }
            }
            if (Validate(s, GameAction.UseItem(ItemId.CleansingVeil)) == null) list.Add(GameAction.UseItem(ItemId.CleansingVeil));
            if (HasItem(me, ItemId.BlinkCharm) && me.BlinkCd == 0 && !s.Act.BlinkUsed && !s.Act.Rooted)
            {
                foreach (var hex in Hex.Range(me.Pos, 3))
                {
                    var b = GameAction.UseItem(ItemId.BlinkCharm, hex);
                    if (Validate(s, b) == null) list.Add(b);
                }
            }
            bool canAct = ActionsLeft(s) > 0;
            if (canAct && s.Act.Moves < 2 && !s.Act.Rooted)
            {
                foreach (var hex in Reachable(s, me, Spd(s, me), false)) list.Add(GameAction.Move(hex));
            }
            if (canAct && !s.Act.Attacked) AddAttacks(s, me, list);
            if (canAct && Validate(s, GameAction.Capture()) == null) list.Add(GameAction.Capture());
            for (int slot = 0; slot < 4; slot++) AddAbility(s, me, slot, list);
            return list;
        }

        static List<Target> AttackTargets(GameState s, HeroState me)
        {
            var targets = new List<Target>();
            foreach (var v in s.Heroes) targets.Add(Target.OfHero(v.Index));
            for (int l = 0; l < s.Lanes.Length; l++) targets.Add(Target.OfWave(l));
            foreach (var n in s.Neutrals) targets.Add(Target.OfNeutral(n.Index));
            foreach (var st in s.Structures) targets.Add(Target.OfStructure(st.Index));
            var ok = new List<Target>();
            foreach (var t in targets) if (ValidateAttackTarget(s, me, t) == null) ok.Add(t);
            return ok;
        }

        static void AddAttacks(GameState s, HeroState me, List<GameAction> list)
        {
            var ok = AttackTargets(s, me);
            foreach (var t in ok)
            {
                list.Add(GameAction.Attack(t));
                if (me.Def.TwinShot)
                    foreach (var t2 in ok) if (!t2.SameAs(t)) list.Add(GameAction.Attack(t, t2));
            }
        }

        static void AddAbility(GameState s, HeroState me, int slot, List<GameAction> list)
        {
            var def = me.Def.Abilities[slot];
            if (s.Act.AbilityUsed[slot] || me.Cd[slot] > 0 || (slot == 3 && s.Level < 3) || s.Act.Silenced) return;
            if (!def.Free && ActionsLeft(s) <= 0) return;
            var candidates = new List<GameAction>();
            switch (def.Kind)
            {
                case TargetKind.None:
                    candidates.Add(GameAction.Ability(slot));
                    break;
                case TargetKind.EnemyUnit:
                case TargetKind.Devour:
                    foreach (var v in s.Heroes) candidates.Add(GameAction.Ability(slot, Target.OfHero(v.Index)));
                    foreach (var n in s.Neutrals) candidates.Add(GameAction.Ability(slot, Target.OfNeutral(n.Index)));
                    for (int l = 0; l < s.Lanes.Length; l++) candidates.Add(GameAction.Ability(slot, Target.OfWave(l)));
                    break;
                case TargetKind.AllyHero:
                    foreach (var v in s.Heroes) if (v.Team == me.Team) candidates.Add(GameAction.Ability(slot, Target.OfHero(v.Index)));
                    break;
                case TargetKind.HexArea:
                case TargetKind.Jump:
                case TargetKind.Step1:
                    foreach (var hex in Hex.Range(me.Pos, def.Range)) candidates.Add(GameAction.Ability(slot, Target.OfHex(hex)));
                    break;
                case TargetKind.Dash:
                    if (!s.Act.Rooted)
                        foreach (var hex in Reachable(s, me, def.Range, def.Id == AbilityId.Tumble))
                            list.Add(GameAction.Ability(slot, Target.OfHex(hex)));
                    return;
                case TargetKind.Line:
                case TargetKind.Charge:
                    for (int d = 0; d < 6; d++) candidates.Add(GameAction.Ability(slot, Target.OfDirection(d)));
                    break;
                case TargetKind.TeleportToEnemy:
                    {
                        var enemies = new List<Target>();
                        foreach (var v in s.Heroes) enemies.Add(Target.OfHero(v.Index));
                        foreach (var n in s.Neutrals) enemies.Add(Target.OfNeutral(n.Index));
                        foreach (var t in enemies)
                        {
                            if (ValidateEnemyUnit(s, me, def, t, def.Id != AbilityId.ShadowStep) != null) continue;
                            var at = TargetHex(s, t);
                            for (int d = 0; d < 6; d++)
                                candidates.Add(GameAction.Ability(slot, t, Target.OfHex(at.Neighbor(d))));
                        }
                        break;
                    }
            }
            foreach (var c in candidates) if (Validate(s, c) == null) list.Add(c);
        }
    }
}
