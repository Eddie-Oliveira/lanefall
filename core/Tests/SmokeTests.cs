using Xunit;
using Lanefall.Core;
namespace Lanefall.Core.Tests
{
    public class SmokeTests
    {
        [Fact] public void VersionIsSet() { Assert.Equal("0.1.0", CoreInfo.Version); }

        [Fact]
        public void AllMapsBuild()
        {
            foreach (MapId id in new[] { MapId.Rift, MapId.TwinHollow, MapId.FrostBridge })
            {
                var m = Maps.Get(id);
                Assert.NotNull(m);
            }
        }

        [Fact]
        public void NewMatchStarts()
        {
            var s = Engine.NewMatch(new MatchSetup { Map = MapId.Rift, Size = 2, Seed = 3 });
            Assert.Equal(Phase.Draft, s.Phase);
        }
    }
}
