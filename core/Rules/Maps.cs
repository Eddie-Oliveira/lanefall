using System;
using System.Collections.Generic;

namespace Lanefall.Core
{
    public enum MapId { Rift = 0, TwinHollow = 1, FrostBridge = 2 }

    public enum NeutralKind { Wolf = 0, Drake = 1, Golem = 2, SpiderQueen = 3 }

    public sealed class NeutralSpawn
    {
        public NeutralKind Kind;
        public Hex Hex;
    }

    public sealed class AltarDef
    {
        public Hex Hex;
        public int Lane;
    }

    /// <summary>
    /// Static map data (GDD 3, 9, 11). Immutable after construction; shared by every GameState.
    ///
    /// Board layout: pointy-top hexes in rows. The middle row (Mid = (H-1)/2) and every row an even distance from
    /// it hold W hexes; the other rows hold W-1 hexes shifted half a hex right. With odd W this makes the board
    /// point-symmetric around the centre hex, so Ember's half is the exact reflection of Azure's
    /// ("Point-symmetric", GDD 11). Offset (x, y) -> axial: r = y, q = x - floor((y - Mid) / 2).
    /// </summary>
    public sealed class MapDef
    {
        public MapId Id;
        public string Name;
        public int W, H, Mid;
        public string[] Rows;
        /// <summary>Lane nodes: Nodes[lane][i] is node (i - NodeMax). Node 0 = river, -NodeMax = Azure Core.</summary>
        public List<Hex[]> Nodes = new List<Hex[]>();
        /// <summary>Every hex the lane path walks through (Azure Core to Ember Core).</summary>
        public List<Hex[]> LanePaths = new List<Hex[]>();
        public string[] LaneNames;
        public int NodeMax;
        /// <summary>Tower nodes on each side, outer first (absolute values), e.g. {3} or {3, 4}.</summary>
        public int[] TowerNodes;
        public Hex[] CoreHex = new Hex[2];
        public List<Hex>[] BaseHexes = new List<Hex>[2];
        public List<NeutralSpawn> NeutralSpawns = new List<NeutralSpawn>();
        public List<AltarDef> Altars = new List<AltarDef>();
        public List<Hex> Relics = new List<Hex>();

        public int DefaultRoundLimit;
        public int[] VpTargets; // index size-1
        public int StartGold;
        public int StartLevel;
        public bool RecallAllowed;
        public PickMode DefaultPickMode;

        bool[] _walls;
        int _qMin, _qMax, _rMin, _rMax, _qSpan;

        public int RowLength(int y) { return ((y - Mid) % 2 == 0) ? W : W - 1; }

        public Hex FromOffset(int x, int y) { return new Hex(x - Hex.FloorDiv(y - Mid, 2), y); }
        public void ToOffset(Hex h, out int x, out int y) { y = h.R; x = h.Q + Hex.FloorDiv(h.R - Mid, 2); }

        public bool InBounds(Hex h)
        {
            int x, y;
            ToOffset(h, out x, out y);
            return y >= 0 && y < H && x >= 0 && x < RowLength(y);
        }

        public char CharAt(Hex h)
        {
            int x, y;
            ToOffset(h, out x, out y);
            if (y < 0 || y >= H || x < 0 || x >= RowLength(y)) return '#';
            return Rows[y][x];
        }

        public bool IsWall(Hex h)
        {
            if (!InBounds(h)) return true;
            return _walls[Index(h)];
        }

        /// <summary>Open = on the board and not a wall.</summary>
        public bool IsOpen(Hex h) { return InBounds(h) && !_walls[Index(h)]; }

        int Index(Hex h) { return (h.R - _rMin) * _qSpan + (h.Q - _qMin); }

        public Hex Center { get { return FromOffset((W - 1) / 2, Mid); } }

        /// <summary>Point reflection through the centre hex (Azure half to Ember half).</summary>
        public Hex Reflect(Hex h)
        {
            Hex c = Center;
            return new Hex(2 * c.Q - h.Q, 2 * c.R - h.R);
        }

        public IEnumerable<Hex> AllHexes()
        {
            for (int y = 0; y < H; y++)
                for (int x = 0; x < RowLength(y); x++)
                    yield return FromOffset(x, y);
        }

        public int LaneCount { get { return Nodes.Count; } }

        public Hex NodeHex(int lane, int node) { return Nodes[lane][node + NodeMax]; }

        public int VpTarget(int size)
        {
            // GDD 9: Twin Hollow 4v4 VP target 10.
            return VpTargets[size - 1];
        }

        public int RoundLimit(int size)
        {
            // GDD 9: Twin Hollow 4v4 round limit 10.
            if (Id == MapId.TwinHollow && size == 4) return 10;
            return DefaultRoundLimit;
        }

        internal void Finish()
        {
            _qMin = int.MaxValue; _qMax = int.MinValue; _rMin = 0; _rMax = H - 1;
            foreach (var h in AllHexes())
            {
                if (h.Q < _qMin) _qMin = h.Q;
                if (h.Q > _qMax) _qMax = h.Q;
            }
            _qSpan = _qMax - _qMin + 1;
            _walls = new bool[_qSpan * H];
            foreach (var h in AllHexes())
            {
                _walls[Index(h)] = CharAt(h) == '#';
            }
            for (int t = 0; t < 2; t++)
            {
                BaseHexes[t] = new List<Hex>();
                foreach (var h in Hex.Range(CoreHex[t], 2))
                {
                    if (h != CoreHex[t] && IsOpen(h)) BaseHexes[t].Add(h);
                }
                Hex core = CoreHex[t];
                BaseHexes[t].Sort((a, b) =>
                {
                    int da = Hex.Distance(a, core), db = Hex.Distance(b, core);
                    if (da != db) return da.CompareTo(db);
                    return Hex.Compare(a, b);
                });
            }
        }
    }

    /// <summary>The three maps as data (GDD 3 table, 9, 11). See docs/tech/ARCHITECTURE.md for the ASCII legend.</summary>
    public static class Maps
    {
        // Legend: '#' wall, '.' floor, 'w' wolf camp, 'D' Drake, 'G' Stone Golem, 'Q' Spider Queen,
        // 'a' altar, '+' health relic. Odd rows (relative to the middle row) are one hex shorter (see MapDef).
        // GDD-AMBIGUOUS: the GDD sketches are schematic ("one character cell = 2 hexes") while section 3 says lane
        // nodes are exactly 2 hexes apart. These layouts keep the literal rule (consecutive nodes at hex distance
        // 2, 9 or 11 nodes per lane) and the board sizes, so lanes are shortest paths between the two Cores and the
        // Rift's lanes sit closer together than the sketch suggests. Needs DESIGN review (CHANGELOG).
        static readonly string[] RiftRows =
        {
            "#################",
            "################",
            "#############...#",
            "#####...........",
            "#####............",
            "####...#w.......",
            "####...G........#",
            "###...#.......##",
            "###..w#...#w..###",
            "##.......#...###",
            "#........D...####",
            ".......w#...####",
            "............#####",
            "...........#####",
            "#...#############",
            "################",
            "#################",
        };

        static readonly string[] HollowRows =
        {
            "####################",
            ".....................",
            "....................",
            ".....w.a.......w.....",
            "........#..#........",
            ".......#..Q..#.......",
            "........#..#........",
            ".....w.......a.w.....",
            "....................",
            ".....................",
            "####################",
        };

        static readonly string[] BridgeRows =
        {
            "##################",
            "...+...........+...",
            ".......#..........",
            "...................",
            "..........#.......",
            "...+...........+...",
            "##################",
        };

        static readonly MapDef[] _maps = new MapDef[3];

        public static MapDef Get(MapId id)
        {
            lock (_maps)
            {
                if (_maps[(int)id] == null) _maps[(int)id] = Build(id);
                return _maps[(int)id];
            }
        }

        static MapDef Build(MapId id)
        {
            var m = new MapDef();
            m.Id = id;
            switch (id)
            {
                case MapId.Rift:
                    m.Name = "The Rift"; m.W = 17; m.H = 17; m.Rows = RiftRows; m.NodeMax = 4;
                    m.TowerNodes = new[] { 3 };
                    m.LaneNames = new[] { "Top", "Mid", "Bot" };
                    m.DefaultRoundLimit = 12; m.VpTargets = new[] { 6, 8, 10, 12 };
                    m.StartGold = 3; m.StartLevel = 1; m.RecallAllowed = true; m.DefaultPickMode = PickMode.Draft;
                    Init(m, 2, 12, new[] { "NE8 E8", "E1 NE1 E1 NE1 E1 NE1 E1 NE1 NE1 E1 NE1 E1 NE1 E1 NE1 E1", "E8 NE8" });
                    break;
                case MapId.TwinHollow:
                    m.Name = "Twin Hollow"; m.W = 21; m.H = 11; m.Rows = HollowRows; m.NodeMax = 5;
                    m.TowerNodes = new[] { 3, 4 };
                    m.LaneNames = new[] { "Top", "Bot" };
                    m.DefaultRoundLimit = 12; m.VpTargets = new[] { 6, 8, 10, 10 };
                    m.StartGold = 3; m.StartLevel = 1; m.RecallAllowed = true; m.DefaultPickMode = PickMode.Draft;
                    Init(m, 2, 5, new[] { "NE4 E12 SE4", "SE4 E12 NE4" });
                    break;
                default:
                    m.Name = "Frost Bridge"; m.W = 19; m.H = 7; m.Rows = BridgeRows; m.NodeMax = 4;
                    m.TowerNodes = new[] { 2, 3 };
                    m.LaneNames = new[] { "Mid" };
                    m.DefaultRoundLimit = 8; m.VpTargets = new[] { 5, 6, 7, 8 };
                    m.StartGold = 6; m.StartLevel = 3; m.RecallAllowed = false; m.DefaultPickMode = PickMode.AllRandom;
                    Init(m, 1, 3, new[] { "E16" });
                    break;
            }
            return m;
        }

        static void Init(MapDef m, int azureCoreX, int azureCoreY, string[] laneSteps)
        {
            m.Mid = (m.H - 1) / 2;
            for (int y = 0; y < m.H; y++)
            {
                if (m.Rows[y].Length != m.RowLength(y))
                    throw new InvalidOperationException(m.Name + ": row " + y + " has length " + m.Rows[y].Length);
            }
            m.CoreHex[0] = m.FromOffset(azureCoreX, azureCoreY);
            m.CoreHex[1] = m.Reflect(m.CoreHex[0]);
            foreach (var steps in laneSteps)
            {
                var path = new List<Hex> { m.CoreHex[0] };
                Hex cur = m.CoreHex[0];
                foreach (var tok in steps.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries))
                {
                    int split = 0;
                    while (split < tok.Length && !char.IsDigit(tok[split])) split++;
                    string dirName = tok.Substring(0, split);
                    int count = int.Parse(tok.Substring(split));
                    int dir = Array.IndexOf(Hex.DirectionNames, dirName);
                    if (dir < 0) throw new InvalidOperationException("bad direction " + dirName);
                    for (int i = 0; i < count; i++) { cur = cur.Neighbor(dir); path.Add(cur); }
                }
                if (cur != m.CoreHex[1]) throw new InvalidOperationException(m.Name + ": lane does not reach Ember Core");
                m.LanePaths.Add(path.ToArray());
                var nodes = new Hex[2 * m.NodeMax + 1];
                for (int i = 0; i < nodes.Length; i++) nodes[i] = path[2 * i];
                m.Nodes.Add(nodes);
            }
            m.Finish();
            foreach (var h in m.AllHexes())
            {
                char c = m.CharAt(h);
                switch (c)
                {
                    case 'w': m.NeutralSpawns.Add(new NeutralSpawn { Kind = NeutralKind.Wolf, Hex = h }); break;
                    case 'D': m.NeutralSpawns.Add(new NeutralSpawn { Kind = NeutralKind.Drake, Hex = h }); break;
                    case 'G': m.NeutralSpawns.Add(new NeutralSpawn { Kind = NeutralKind.Golem, Hex = h }); break;
                    case 'Q': m.NeutralSpawns.Add(new NeutralSpawn { Kind = NeutralKind.SpiderQueen, Hex = h }); break;
                    case '+': m.Relics.Add(h); break;
                    case 'a':
                        {
                            // The altar powers the lane whose path passes closest (GDD 11.2: Top altar powers Top).
                            int best = 0, bestD = int.MaxValue;
                            for (int l = 0; l < m.LanePaths.Count; l++)
                            {
                                foreach (var p in m.LanePaths[l])
                                {
                                    int d = Hex.Distance(p, h);
                                    if (d < bestD) { bestD = d; best = l; }
                                }
                            }
                            m.Altars.Add(new AltarDef { Hex = h, Lane = best });
                            break;
                        }
                }
            }
        }
    }
}
