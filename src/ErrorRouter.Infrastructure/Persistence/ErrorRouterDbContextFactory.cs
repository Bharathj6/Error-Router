using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace ErrorRouter.Infrastructure.Persistence;

public sealed class ErrorRouterDbContextFactory : IDesignTimeDbContextFactory<ErrorRouterDbContext>
{
    public ErrorRouterDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__Postgres")
            ?? "Host=localhost;Port=5432;Database=errorrouter;Username=errorrouter;Password=errorrouter";

        var options = new DbContextOptionsBuilder<ErrorRouterDbContext>()
            .UseNpgsql(connectionString, npgsql => npgsql.MigrationsAssembly(typeof(ErrorRouterDbContext).Assembly.FullName))
            .Options;

        return new ErrorRouterDbContext(options);
    }
}