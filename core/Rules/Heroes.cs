using System.Collections.Generic;

namespace Lanefall.Core
{
    public enum HeroId
    {
        None = -1,
        Bulwark = 0, Butcher, Blademaster, Ravager, Shade, Viper, Pyra, Stormcaller,
        Frostbow, Deadeye, Lumen, Tidesinger, Quake, Bramblehorn
    }

    public enum Role { Tank, Fighter, Assassin, Mage, Marksman, Support, Initiator }

    /// <summary>How an ability chooses its target (drives validation and LegalActions).</summary>
    public enum TargetKind
    {
        /// <summary>No target: self, "around you" or global.</summary>
        None,
        /// <summary>An enemy unit (hero or neutral) within Range; HeroOnly limits to heroes.</summary>
        EnemyUnit,
        /// <summary>An allied hero (or you) within Range.</summary>
        AllyHero,
        /// <summary>A target hex within Range; Radius 1 or 2 area around it.</summary>
        HexArea,
        /// <summary>A direction (0..5); the line runs Range hexes and stops at a wall or the board edge.</summary>
        Line,
        /// <summary>Destination hex: dash up to Range along a path (GDD 6.8).</summary>
        Dash,
        /// <summary>Destination hex: jump up to Range, no wall hex on the straight line (GDD 6.8).</summary>
        Jump,
        /// <summary>Enemy unit within Range plus a free landing hex adjacent to it (Target2).</summary>
        TeleportToEnemy,
        /// <summary>Your own hex or a free adjacent hex ("move 1 hex now").</summary>
        Step1,
        /// <summary>An adjacent enemy wave or adjacent wolf camp (Devour).</summary>
        Devour,
        /// <summary>A direction: dash in a line up to Range to the first enemy on it (Charge).</summary>
        Charge
    }

    public enum AbilityId
    {
        ShieldBash, IronStance, Charge, SolarFlare,
        MeatHook, Rot, Devour, Dismember,
        BladeSpin, BattleCry, DecisiveStrike, Omnislash,
        Cleave, Hamstring, Leap, Guillotine,
        Shuriken, ShadowStep, SmokeVeil, DeathMark,
        VenomFang, ToxicCloud, Slither, KissOfDeath,
        Fireball, FlameRing, Scorch, Pyroblast,
        ChainLightning, StaticField, Gust, Thunderstorm,
        Volley, FrostArrows, Tumble, CrystalArrow,
        PiercingShot, SnareTrap, RocketJump, Headshot,
        Mend, BindingLight, Barrier, Wish,
        Bubble, Riptide, Current, TidalWave,
        Fissure, EnchantTotem, Tremor, EchoSlam,
        HornToss, ThickHide, WarBellow, Earthshaker
    }

    public sealed class AbilityDef
    {
        public AbilityId Id;
        public HeroId Hero;
        public int Slot; // 0 Q, 1 W, 2 E, 3 R
        public string Name;
        public int Cd;
        public TargetKind Kind;
        public int Range;
        public int Radius;
        public int Wave;
        public bool Free;
        public bool HeroOnly;
        public bool AllowWaveTarget;
        public string Text;

        public string Key { get { return "QWER".Substring(Slot, 1); } }
    }

    public sealed class HeroDef
    {
        public HeroId Id;
        public string Name;
        public Role Role;
        public int Hp, Atk, Rng, Arm, Spd;
        public int Stars;
        public AbilityDef[] Abilities = new AbilityDef[4];

        public bool TwinShot { get { return Role == Role.Marksman; } }
    }

    /// <summary>The 14 heroes of GDD v1.0 section 10 (level-1 numbers).</summary>
    public static class Heroes
    {
        public const int Count = 14;
        static readonly HeroDef[] _defs = Build();
        static readonly Dictionary<AbilityId, AbilityDef> _abilities = Index();

        public static HeroDef Get(HeroId id) { return _defs[(int)id]; }
        public static AbilityDef Ability(AbilityId id) { return _abilities[id]; }
        public static IEnumerable<HeroDef> All { get { return _defs; } }

        static Dictionary<AbilityId, AbilityDef> Index()
        {
            var d = new Dictionary<AbilityId, AbilityDef>();
            foreach (var h in _defs) foreach (var a in h.Abilities) d[a.Id] = a;
            return d;
        }

        static HeroDef H(HeroId id, string name, Role role, int hp, int atk, int rng, int arm, int spd, int stars)
        {
            return new HeroDef { Id = id, Name = name, Role = role, Hp = hp, Atk = atk, Rng = rng, Arm = arm, Spd = spd, Stars = stars };
        }

        static AbilityDef A(HeroDef h, int slot, AbilityId id, string name, int cd, TargetKind kind, int range, string text,
            int radius = 0, int wave = 0, bool free = false, bool heroOnly = false, bool allowWave = false)
        {
            var a = new AbilityDef
            {
                Id = id, Hero = h.Id, Slot = slot, Name = name, Cd = cd, Kind = kind, Range = range, Radius = radius,
                Wave = wave, Free = free, HeroOnly = heroOnly, AllowWaveTarget = allowWave, Text = text
            };
            h.Abilities[slot] = a;
            return a;
        }

        static HeroDef[] Build()
        {
            var list = new HeroDef[Count];
            HeroDef h;

            h = H(HeroId.Bulwark, "Bulwark", Role.Tank, 16, 2, 1, 2, 3, 1);
            A(h, 0, AbilityId.ShieldBash, "Shield Bash", 2, TargetKind.EnemyUnit, 1, "Adjacent enemy: 2 dmg, Stun.");
            A(h, 1, AbilityId.IronStance, "Iron Stance", 2, TargetKind.None, 0, "Shield 4 on yourself.");
            A(h, 2, AbilityId.Charge, "Charge", 2, TargetKind.Charge, 3, "Dash up to 3 hexes in a line to an enemy: 1 dmg, Slow. Wave 1.", wave: 1);
            A(h, 3, AbilityId.SolarFlare, "Solar Flare", 4, TargetKind.HexArea, 2, "Target hex within 2 and its 6 neighbors: 3 dmg + Stun to each enemy. Wave 3.", radius: 1, wave: 3);
            list[(int)h.Id] = h;

            h = H(HeroId.Butcher, "Butcher", Role.Tank, 16, 2, 1, 1, 3, 2);
            A(h, 0, AbilityId.MeatHook, "Meat Hook", 2, TargetKind.Line, 4, "Line 4: first enemy hero hit takes 3 dmg and is pulled adjacent to you.", heroOnly: true);
            A(h, 1, AbilityId.Rot, "Rot", 1, TargetKind.None, 1, "1 dmg to every adjacent enemy; you lose 1 HP. Wave 2.", wave: 2);
            A(h, 2, AbilityId.Devour, "Devour", 2, TargetKind.Devour, 1, "Eat 2 minions of an adjacent wave (or a wolf camp at <=4 HP): heal 3. Counts as last hits.");
            A(h, 3, AbilityId.Dismember, "Dismember", 4, TargetKind.EnemyUnit, 1, "Adjacent enemy: 5 dmg, Stun, heal half the damage dealt.");
            list[(int)h.Id] = h;

            h = H(HeroId.Blademaster, "Blademaster", Role.Fighter, 14, 3, 1, 1, 3, 1);
            A(h, 0, AbilityId.BladeSpin, "Blade Spin", 1, TargetKind.None, 1, "2 dmg to every adjacent enemy. Wave 3.", wave: 3);
            A(h, 1, AbilityId.BattleCry, "Battle Cry", 2, TargetKind.Step1, 1, "+1 ATK this activation and move 1 hex now.");
            A(h, 2, AbilityId.DecisiveStrike, "Decisive Strike", 2, TargetKind.EnemyUnit, 1, "Adjacent enemy: 3 dmg, Silence.");
            A(h, 3, AbilityId.Omnislash, "Omnislash", 4, TargetKind.TeleportToEnemy, 3, "Teleport adjacent to an enemy within 3: 6 dmg.");
            list[(int)h.Id] = h;

            h = H(HeroId.Ravager, "Ravager", Role.Fighter, 15, 2, 1, 1, 3, 1);
            A(h, 0, AbilityId.Cleave, "Cleave", 1, TargetKind.None, 1, "2 dmg to every adjacent enemy; heal 2 per enemy hero hit. Wave 2.", wave: 2);
            A(h, 1, AbilityId.Hamstring, "Hamstring", 2, TargetKind.EnemyUnit, 1, "Adjacent enemy: 2 dmg, Slow (2).");
            A(h, 2, AbilityId.Leap, "Leap", 2, TargetKind.Jump, 3, "Jump 3 to a free hex: 1 dmg + Slow to each adjacent enemy where you land. Wave 1.", wave: 1);
            A(h, 3, AbilityId.Guillotine, "Guillotine", 4, TargetKind.EnemyUnit, 1, "Adjacent enemy: 3 dmg + 2 per 5 missing HP.");
            list[(int)h.Id] = h;

            h = H(HeroId.Shade, "Shade", Role.Assassin, 10, 3, 1, 0, 4, 3);
            A(h, 0, AbilityId.Shuriken, "Shuriken", 1, TargetKind.Line, 3, "Line 3: first enemy hit takes 2 dmg. Wave 1.", wave: 1);
            A(h, 1, AbilityId.ShadowStep, "Shadow Step", 2, TargetKind.TeleportToEnemy, 4, "Teleport adjacent to an enemy within 4 (ignores walls): 2 dmg.");
            A(h, 2, AbilityId.SmokeVeil, "Smoke Veil", 3, TargetKind.Step1, 1, "Hidden until your next activation and move 1 hex.");
            A(h, 3, AbilityId.DeathMark, "Death Mark", 4, TargetKind.EnemyUnit, 1, "Adjacent enemy: 4 dmg; then a hero at or below 1/5 of its max HP is KO'd.");
            list[(int)h.Id] = h;

            h = H(HeroId.Viper, "Viper", Role.Assassin, 10, 2, 1, 0, 4, 2);
            A(h, 0, AbilityId.VenomFang, "Venom Fang", 1, TargetKind.EnemyUnit, 1, "Adjacent enemy: 2 dmg, Poison 1.");
            A(h, 1, AbilityId.ToxicCloud, "Toxic Cloud", 2, TargetKind.HexArea, 3, "Target hex within 3, radius 1: Poison 1 + Slow to each enemy hero. Wave 2.", radius: 1, wave: 2);
            A(h, 2, AbilityId.Slither, "Slither", 3, TargetKind.Dash, 3, "Free. Dash 3.", free: true);
            A(h, 3, AbilityId.KissOfDeath, "Kiss of Death", 4, TargetKind.EnemyUnit, 2, "Enemy within 2: 3 dmg, Silence, Poison 2.");
            list[(int)h.Id] = h;

            h = H(HeroId.Pyra, "Pyra", Role.Mage, 10, 1, 2, 0, 3, 2);
            A(h, 0, AbilityId.Fireball, "Fireball", 1, TargetKind.HexArea, 3, "Target hex within 3 and neighbors: 2 dmg to each enemy. Wave 3.", radius: 1, wave: 3);
            A(h, 1, AbilityId.FlameRing, "Flame Ring", 2, TargetKind.EnemyUnit, 3, "Enemy within 3: 1 dmg, Root.");
            A(h, 2, AbilityId.Scorch, "Scorch", 2, TargetKind.EnemyUnit, 3, "Enemy within 3: 3 dmg.");
            A(h, 3, AbilityId.Pyroblast, "Pyroblast", 4, TargetKind.EnemyUnit, 3, "Enemy within 3: 6 dmg.");
            list[(int)h.Id] = h;

            h = H(HeroId.Stormcaller, "Stormcaller", Role.Mage, 10, 1, 2, 0, 3, 3);
            A(h, 0, AbilityId.ChainLightning, "Chain Lightning", 1, TargetKind.EnemyUnit, 3, "Enemy within 3: 3 dmg, Chain 2 (each jump 2 dmg). Wave 1.", wave: 1, allowWave: true);
            A(h, 1, AbilityId.StaticField, "Static Field", 3, TargetKind.HexArea, 3, "Target hex within 3, radius 1: 1 dmg + Silence to each enemy. Wave 2.", radius: 1, wave: 2);
            A(h, 2, AbilityId.Gust, "Gust", 2, TargetKind.Line, 3, "Line 3: first enemy hero hit takes 1 dmg and is knocked back 2.", heroOnly: true);
            A(h, 3, AbilityId.Thunderstorm, "Thunderstorm", 4, TargetKind.HexArea, 4, "Target hex within 4, radius 2: 3 dmg to each enemy. Wave 3.", radius: 2, wave: 3);
            list[(int)h.Id] = h;

            h = H(HeroId.Frostbow, "Frostbow", Role.Marksman, 10, 2, 3, 0, 3, 1);
            A(h, 0, AbilityId.Volley, "Volley", 2, TargetKind.HexArea, 3, "Target hex within 3 and neighbors: 1 dmg + Slow to each enemy. Wave 3.", radius: 1, wave: 3);
            A(h, 1, AbilityId.FrostArrows, "Frost Arrows", 2, TargetKind.None, 0, "This activation: your Attacks deal +1 and Slow.");
            A(h, 2, AbilityId.Tumble, "Tumble", 2, TargetKind.Dash, 2, "Move 2 hexes (may pass through enemies).");
            A(h, 3, AbilityId.CrystalArrow, "Crystal Arrow", 4, TargetKind.Line, 6, "Line 6: first enemy hero hit takes 3 dmg, Stun.", heroOnly: true);
            list[(int)h.Id] = h;

            h = H(HeroId.Deadeye, "Deadeye", Role.Marksman, 9, 2, 4, 0, 3, 2);
            A(h, 0, AbilityId.PiercingShot, "Piercing Shot", 2, TargetKind.Line, 5, "Line 5: every enemy on it takes 1 dmg. Wave 2.", wave: 2);
            A(h, 1, AbilityId.SnareTrap, "Snare Trap", 2, TargetKind.EnemyUnit, 4, "Enemy within 4: 1 dmg, Root.");
            A(h, 2, AbilityId.RocketJump, "Rocket Jump", 3, TargetKind.Jump, 3, "Free. Jump 3.", free: true);
            A(h, 3, AbilityId.Headshot, "Headshot", 4, TargetKind.EnemyUnit, 7, "Enemy hero within 7: 5 dmg reduced by ARM (min 1).", heroOnly: true);
            list[(int)h.Id] = h;

            h = H(HeroId.Lumen, "Lumen", Role.Support, 11, 1, 2, 0, 3, 1);
            A(h, 0, AbilityId.Mend, "Mend", 1, TargetKind.AllyHero, 3, "Ally (or you) within 3: heal 3.");
            A(h, 1, AbilityId.BindingLight, "Binding Light", 2, TargetKind.Line, 4, "Line 4: first enemy hit takes 1 dmg, Root. Wave 1.", wave: 1);
            A(h, 2, AbilityId.Barrier, "Barrier", 1, TargetKind.AllyHero, 3, "Ally (or you) within 3: Shield 3.");
            A(h, 3, AbilityId.Wish, "Wish", 4, TargetKind.None, 0, "Every allied hero, anywhere: heal 4.");
            list[(int)h.Id] = h;

            h = H(HeroId.Tidesinger, "Tidesinger", Role.Support, 12, 1, 2, 0, 3, 2);
            A(h, 0, AbilityId.Bubble, "Bubble", 3, TargetKind.EnemyUnit, 3, "Enemy within 3: 1 dmg, Stun.");
            A(h, 1, AbilityId.Riptide, "Riptide", 2, TargetKind.AllyHero, 3, "Ally (or you) within 3: heal 2, Cleanse.");
            A(h, 2, AbilityId.Current, "Current", 2, TargetKind.AllyHero, 4, "Ally (or you) within 4: Shield 1 and Haste.");
            A(h, 3, AbilityId.TidalWave, "Tidal Wave", 4, TargetKind.None, 2, "Every enemy within 2 of you: 2 dmg + Slow; every allied hero within 2 (you included): heal 3. Wave 2.", wave: 2);
            list[(int)h.Id] = h;

            h = H(HeroId.Quake, "Quake", Role.Initiator, 13, 2, 1, 1, 3, 2);
            A(h, 0, AbilityId.Fissure, "Fissure", 3, TargetKind.Line, 4, "Line 4: every enemy on it takes 1 dmg, Stun. Wave 2.", wave: 2);
            A(h, 1, AbilityId.EnchantTotem, "Enchant Totem", 2, TargetKind.None, 0, "Your next Attack this activation deals double ATK (also vs structures).");
            A(h, 2, AbilityId.Tremor, "Tremor", 1, TargetKind.None, 1, "1 dmg + Slow to every adjacent enemy. Wave 2.", wave: 2);
            A(h, 3, AbilityId.EchoSlam, "Echo Slam", 4, TargetKind.None, 2, "Every enemy within 2: 2 dmg, +1 per other enemy unit in range (max +3). Wave 3.", wave: 3);
            list[(int)h.Id] = h;

            h = H(HeroId.Bramblehorn, "Bramblehorn", Role.Initiator, 15, 2, 1, 2, 3, 2);
            A(h, 0, AbilityId.HornToss, "Horn Toss", 2, TargetKind.EnemyUnit, 1, "Adjacent enemy: 2 dmg, knocked back 1, Stun.");
            A(h, 1, AbilityId.ThickHide, "Thick Hide", 2, TargetKind.None, 0, "Shield 3 on yourself.");
            A(h, 2, AbilityId.WarBellow, "War Bellow", 3, TargetKind.None, 2, "Free. Every allied hero within 2 (you included): Shield 2.", free: true);
            A(h, 3, AbilityId.Earthshaker, "Earthshaker", 4, TargetKind.HexArea, 3, "Target hex within 3, radius 2: pull every enemy hero to the centre, then 2 dmg + Root to each enemy in the area. Wave 3.", radius: 2, wave: 3);
            list[(int)h.Id] = h;

            return list;
        }

        /// <summary>Bot draft role priority (GDD 10.2).</summary>
        public static readonly Role[] DraftRolePriority =
        {
            Role.Tank, Role.Mage, Role.Marksman, Role.Support, Role.Fighter, Role.Initiator, Role.Assassin
        };
    }
}
