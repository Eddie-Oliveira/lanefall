using System;
using System.Collections.Generic;

namespace Lanefall.Core
{
    /// <summary>
    /// Pointy-top hex in axial coordinates (GDD section 3). r grows downward (board row), q grows to the right.
    /// Cube coordinates: x = Q, z = R, y = -Q - R.
    /// </summary>
    public struct Hex : IEquatable<Hex>
    {
        public int Q;
        public int R;

        public Hex(int q, int r) { Q = q; R = r; }

        public int S { get { return -Q - R; } }

        /// <summary>The 6 directions: 0 E, 1 NE, 2 NW, 3 W, 4 SW, 5 SE.</summary>
        public static readonly Hex[] Directions =
        {
            new Hex(1, 0), new Hex(1, -1), new Hex(0, -1), new Hex(-1, 0), new Hex(-1, 1), new Hex(0, 1)
        };

        public static readonly string[] DirectionNames = { "E", "NE", "NW", "W", "SW", "SE" };

        public static Hex operator +(Hex a, Hex b) { return new Hex(a.Q + b.Q, a.R + b.R); }
        public static Hex operator -(Hex a, Hex b) { return new Hex(a.Q - b.Q, a.R - b.R); }
        public static Hex operator *(Hex a, int k) { return new Hex(a.Q * k, a.R * k); }
        public static bool operator ==(Hex a, Hex b) { return a.Q == b.Q && a.R == b.R; }
        public static bool operator !=(Hex a, Hex b) { return !(a == b); }

        public bool Equals(Hex other) { return Q == other.Q && R == other.R; }
        public override bool Equals(object obj) { return obj is Hex && Equals((Hex)obj); }
        public override int GetHashCode() { return (Q * 397) ^ R; }
        public override string ToString() { return "(" + Q + "," + R + ")"; }

        public Hex Neighbor(int dir) { return this + Directions[dir]; }

        public static int Distance(Hex a, Hex b)
        {
            int dq = a.Q - b.Q;
            int dr = a.R - b.R;
            int ds = -dq - dr;
            return Math.Max(Math.Abs(dq), Math.Max(Math.Abs(dr), Math.Abs(ds)));
        }

        /// <summary>Direction index (0..5) if b lies on one of the 6 straight lines from a, else -1.</summary>
        public static int DirectionTo(Hex a, Hex b)
        {
            Hex d = b - a;
            int n = Distance(a, b);
            if (n == 0) return -1;
            for (int i = 0; i < 6; i++)
            {
                if (Directions[i] * n == d) return i;
            }
            return -1;
        }

        /// <summary>
        /// The direction (0..5) that best points from a to b (used for knockback "straight away" when the
        /// target is not on a straight line). Ties resolve to the lowest direction index (deterministic).
        /// </summary>
        public static int ApproxDirection(Hex a, Hex b)
        {
            int exact = DirectionTo(a, b);
            if (exact >= 0) return exact;
            int best = 0;
            int bestDist = int.MaxValue;
            int n = Distance(a, b);
            for (int i = 0; i < 6; i++)
            {
                int d = Distance(a + Directions[i] * n, b);
                if (d < bestDist) { bestDist = d; best = i; }
            }
            return best;
        }

        /// <summary>
        /// Hexes on the straight line from a to b (both included), traced with a nudge (sign +1 or -1).
        /// Exact integer math: every cube coordinate is scaled by D = n * 16 so the nudges (+1, +1, -2 in
        /// scaled units) never land on a rounding tie (GDD 3, CODE detail).
        /// </summary>
        public static List<Hex> LineTrace(Hex a, Hex b, int sign)
        {
            var result = new List<Hex>();
            int n = Distance(a, b);
            if (n == 0) { result.Add(a); return result; }
            const int S = 16;
            long D = (long)n * S;
            long ax = a.Q, az = a.R, ay = -a.Q - a.R;
            long bx = b.Q, bz = b.R, by = -b.Q - b.R;
            for (int i = 0; i <= n; i++)
            {
                long vx = ax * D + (bx - ax) * i * S + sign * 1;
                long vy = ay * D + (by - ay) * i * S + sign * 1;
                long vz = az * D + (bz - az) * i * S - sign * 2;
                long rx = RoundDiv(vx, D), ry = RoundDiv(vy, D), rz = RoundDiv(vz, D);
                long dx = Math.Abs(rx * D - vx), dy = Math.Abs(ry * D - vy), dz = Math.Abs(rz * D - vz);
                if (dx > dy && dx > dz) rx = -ry - rz;
                else if (dy > dz) ry = -rx - rz;
                else rz = -rx - ry;
                result.Add(new Hex((int)rx, (int)rz));
            }
            return result;
        }

        static long RoundDiv(long v, long d)
        {
            // floor((2v + d) / 2d) for d > 0
            long num = 2 * v + d;
            long den = 2 * d;
            long q = num / den;
            if ((num % den != 0) && ((num < 0) != (den < 0))) q--;
            return q;
        }

        public static int FloorDiv(int a, int b)
        {
            int q = a / b;
            if ((a % b != 0) && ((a < 0) != (b < 0))) q--;
            return q;
        }

        /// <summary>All hexes within radius of center (unbounded; filter with the board).</summary>
        public static List<Hex> Range(Hex center, int radius)
        {
            var list = new List<Hex>();
            for (int dq = -radius; dq <= radius; dq++)
            {
                int lo = Math.Max(-radius, -dq - radius);
                int hi = Math.Min(radius, -dq + radius);
                for (int dr = lo; dr <= hi; dr++) list.Add(new Hex(center.Q + dq, center.R + dr));
            }
            return list;
        }

        /// <summary>Deterministic order used for ties (row first, then column).</summary>
        public static int Compare(Hex a, Hex b)
        {
            if (a.R != b.R) return a.R.CompareTo(b.R);
            return a.Q.CompareTo(b.Q);
        }
    }
}
