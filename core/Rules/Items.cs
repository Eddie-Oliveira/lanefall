namespace Lanefall.Core
{
    public enum ItemId
    {
        None = -1,
        IronSword = 0, SpellTome, HeartGem, PaddedVest, TrailBoots,
        BloodthirstBlade, PiercingEdge, Archstaff, BlinkCharm, TitanPlate, CleansingVeil, ThornMail, SecondWind, SwiftTreads
    }

    public sealed class ItemDef
    {
        public ItemId Id;
        public string Name;
        public bool Basic;
        public ItemId BuildsFrom = ItemId.None;
        public int Atk, Pow, Hp, Arm, Spd;
        public int Cd; // usable items (Blink Charm, Cleansing Veil)
        public string Text;
    }

    /// <summary>The 14 items of GDD 7.3. Basics cost 3; upgrades 7, or 4 from their basic.</summary>
    public static class Items
    {
        public const int Count = 14;
        public const int BasicCost = 3;
        public const int UpgradeCost = 7;
        public const int UpgradeFromBasicCost = 4;
        public const int Slots = 3;

        static readonly ItemDef[] _defs = Build();

        public static ItemDef Get(ItemId id) { return _defs[(int)id]; }

        public static int Cost(ItemId id, bool ownsBasic)
        {
            var d = Get(id);
            if (d.Basic) return BasicCost;
            return ownsBasic ? UpgradeFromBasicCost : UpgradeCost;
        }

        static ItemDef[] Build()
        {
            var a = new ItemDef[Count];
            a[0] = new ItemDef { Id = ItemId.IronSword, Name = "Iron Sword", Basic = true, Atk = 1, Text = "+1 ATK" };
            a[1] = new ItemDef { Id = ItemId.SpellTome, Name = "Spell Tome", Basic = true, Pow = 1, Text = "+1 POW" };
            a[2] = new ItemDef { Id = ItemId.HeartGem, Name = "Heart Gem", Basic = true, Hp = 3, Text = "+3 HP" };
            a[3] = new ItemDef { Id = ItemId.PaddedVest, Name = "Padded Vest", Basic = true, Arm = 1, Text = "+1 ARM" };
            a[4] = new ItemDef { Id = ItemId.TrailBoots, Name = "Trail Boots", Basic = true, Spd = 1, Text = "+1 SPD" };
            a[5] = new ItemDef { Id = ItemId.BloodthirstBlade, Name = "Bloodthirst Blade", BuildsFrom = ItemId.IronSword, Atk = 2, Text = "+2 ATK; each Attack that damages a hero heals you 1" };
            a[6] = new ItemDef { Id = ItemId.PiercingEdge, Name = "Piercing Edge", BuildsFrom = ItemId.IronSword, Atk = 2, Text = "+2 ATK; your Attacks ignore 1 ARM" };
            a[7] = new ItemDef { Id = ItemId.Archstaff, Name = "Archstaff", BuildsFrom = ItemId.SpellTome, Pow = 2, Hp = 2, Text = "+2 POW, +2 HP" };
            a[8] = new ItemDef { Id = ItemId.BlinkCharm, Name = "Blink Charm", BuildsFrom = ItemId.SpellTome, Pow = 1, Cd = 2, Text = "+1 POW; once per activation, free: teleport 3 hexes (not while Rooted/Stunned), CD 2" };
            a[9] = new ItemDef { Id = ItemId.TitanPlate, Name = "Titan Plate", BuildsFrom = ItemId.HeartGem, Hp = 7, Text = "+7 HP" };
            a[10] = new ItemDef { Id = ItemId.CleansingVeil, Name = "Cleansing Veil", BuildsFrom = ItemId.HeartGem, Hp = 3, Cd = 3, Text = "+3 HP; free, once per activation, even at the start of a stunned activation: remove all conditions and Poison, CD 3" };
            a[11] = new ItemDef { Id = ItemId.ThornMail, Name = "Thorn Mail", BuildsFrom = ItemId.PaddedVest, Arm = 2, Text = "+2 ARM; a hero who Attacks you takes 1 damage" };
            a[12] = new ItemDef { Id = ItemId.SecondWind, Name = "Second Wind", BuildsFrom = ItemId.PaddedVest, Arm = 1, Text = "+1 ARM; the first time you'd be KO'd, revive at half HP instead; then it becomes a Padded Vest" };
            a[13] = new ItemDef { Id = ItemId.SwiftTreads, Name = "Swift Treads", BuildsFrom = ItemId.TrailBoots, Spd = 2, Text = "+2 SPD" };
            return a;
        }
    }
}
