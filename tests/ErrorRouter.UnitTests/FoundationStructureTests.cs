using System.Xml.Linq;

namespace ErrorRouter.UnitTests;

public class FoundationStructureTests
{
    [Fact]
    public void Solution_Should_Contain_Core_Projects()
    {
        var repoRoot = FindRepoRoot();

        Assert.True(File.Exists(Path.Combine(repoRoot, "Directory.Build.props")));
        Assert.True(File.Exists(Path.Combine(repoRoot, "Directory.Packages.props")));
        Assert.True(File.Exists(Path.Combine(repoRoot, "global.json")));

        var apiProject = Path.Combine(repoRoot, "src", "ErrorRouter.Api", "ErrorRouter.Api.csproj");
        var workerProject = Path.Combine(repoRoot, "src", "ErrorRouter.Worker", "ErrorRouter.Worker.csproj");
        var infraProject = Path.Combine(repoRoot, "src", "ErrorRouter.Infrastructure", "ErrorRouter.Infrastructure.csproj");
        var applicationProject = Path.Combine(repoRoot, "src", "ErrorRouter.Application", "ErrorRouter.Application.csproj");

        Assert.True(File.Exists(apiProject));
        Assert.True(File.Exists(workerProject));
        Assert.True(File.Exists(infraProject));
        Assert.True(File.Exists(applicationProject));
    }

    [Fact]
    public void Application_Should_Be_Referenced_By_API_And_Worker()
    {
        var repoRoot = FindRepoRoot();
        var apiProject = XDocument.Load(Path.Combine(repoRoot, "src", "ErrorRouter.Api", "ErrorRouter.Api.csproj"));
        var workerProject = XDocument.Load(Path.Combine(repoRoot, "src", "ErrorRouter.Worker", "ErrorRouter.Worker.csproj"));

        Assert.Contains(
            "ErrorRouter.Application",
            apiProject.Descendants("ProjectReference").Select(x => x.Attribute("Include")?.Value ?? string.Empty));

        Assert.Contains(
            "ErrorRouter.Application",
            workerProject.Descendants("ProjectReference").Select(x => x.Attribute("Include")?.Value ?? string.Empty));
    }

    [Fact]
    public void Api_Should_Expose_Health_Endpoints()
    {
        var repoRoot = FindRepoRoot();
        var programText = File.ReadAllText(Path.Combine(repoRoot, "src", "ErrorRouter.Api", "Program.cs"));

        Assert.Contains("/health/live", programText, StringComparison.Ordinal);
        Assert.Contains("/health/ready", programText, StringComparison.Ordinal);
    }

    private static string FindRepoRoot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "ErrorRouter.sln")))
            {
                return dir.FullName;
            }

            dir = dir.Parent;
        }

        throw new DirectoryNotFoundException("Could not locate repository root.");
    }
}
