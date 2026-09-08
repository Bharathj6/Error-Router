using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ErrorRouter.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CredentialScope : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "application_id",
                table: "api_credentials",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "environment_id",
                table: "api_credentials",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTime>(
                name: "expires_at_utc",
                table: "api_credentials",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "last_used_at_utc",
                table: "api_credentials",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "service_id",
                table: "api_credentials",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "ix_api_credentials_prefix_status",
                table: "api_credentials",
                columns: new[] { "key_prefix", "status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_api_credentials_prefix_status",
                table: "api_credentials");

            migrationBuilder.DropColumn(
                name: "application_id",
                table: "api_credentials");

            migrationBuilder.DropColumn(
                name: "environment_id",
                table: "api_credentials");

            migrationBuilder.DropColumn(
                name: "expires_at_utc",
                table: "api_credentials");

            migrationBuilder.DropColumn(
                name: "last_used_at_utc",
                table: "api_credentials");

            migrationBuilder.DropColumn(
                name: "service_id",
                table: "api_credentials");
        }
    }
}
