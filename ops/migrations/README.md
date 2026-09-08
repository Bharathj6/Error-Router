# ErrorRouter Database Migrations

The PostgreSQL database is the source of truth. Migrations are generated and
applied explicitly; application startup does not run migrations implicitly.

For local development, `src/ErrorRouter.Api/appsettings.Development.json`
contains the non-production PostgreSQL defaults used by the planned local
database. Override them with `ConnectionStrings__Postgres` when your database
uses different credentials. Do not copy these development values into a
production environment.

## Generate a migration

From the repository root, with the .NET 8 SDK installed:

```powershell
$env:PATH = "$env:USERPROFILE\.dotnet\tools;$env:PATH"
dotnet-ef migrations add <MigrationName> `
  --project src/ErrorRouter.Infrastructure/ErrorRouter.Infrastructure.csproj `
  --startup-project src/ErrorRouter.Infrastructure/ErrorRouter.Infrastructure.csproj `
  --context ErrorRouterDbContext `
  --output-dir Persistence/Migrations
```

The design-time factory reads `ConnectionStrings__Postgres` when present and
otherwise uses a local development connection string. The factory is for model
generation only; it does not apply migrations.

## Apply migrations

Set the deployment connection string and run:

```powershell
$env:PATH = "$env:USERPROFILE\.dotnet\tools;$env:PATH"
dotnet-ef database update `
  --project src/ErrorRouter.Infrastructure/ErrorRouter.Infrastructure.csproj `
  --startup-project src/ErrorRouter.Infrastructure/ErrorRouter.Infrastructure.csproj `
  --context ErrorRouterDbContext
```

Use a least-privilege deployment identity and TLS-enabled PostgreSQL
connection. Review the generated SQL in a deployment environment before
applying it to production.