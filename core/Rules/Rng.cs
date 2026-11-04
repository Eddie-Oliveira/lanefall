namespace Lanefall.Core
{
    /// <summary>
    /// Deterministic RNG (SplitMix64). The state is a plain ulong stored in GameState so cloning and replay
    /// reproduce every draw. Never use System.Random in the core (GDD 13).
    /// </summary>
    public static class Rng
    {
        public static ulong Next(ref ulong state)
        {
            state += 0x9E3779B97F4A7C15UL;
            ulong z = state;
            z = (z ^ (z >> 30)) * 0xBF58476D1CE4E5B9UL;
            z = (z ^ (z >> 27)) * 0x94D049BB133111EBUL;
            return z ^ (z >> 31);
        }

        /// <summary>Uniform integer in [0, n). n must be > 0.</summary>
        public static int Range(ref ulong state, int n)
        {
            if (n <= 1) { Next(ref state); return 0; }
            ulong v = Next(ref state);
            return (int)(v % (ulong)n);
        }

        /// <summary>Derives an independent stream seed from a match seed and a stream id.</summary>
        public static ulong Stream(ulong seed, ulong streamId)
        {
            ulong s = seed ^ (streamId * 0xD1B54A32D192ED03UL);
            Next(ref s);
            return s;
        }
    }
}
