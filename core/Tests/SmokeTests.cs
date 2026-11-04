using Xunit;
using Lanefall.Core;
namespace Lanefall.Core.Tests
{
    public class SmokeTests
    {
        [Fact] public void VersionIsSet() { Assert.Equal("0.1.0", CoreInfo.Version); }
    }
}
