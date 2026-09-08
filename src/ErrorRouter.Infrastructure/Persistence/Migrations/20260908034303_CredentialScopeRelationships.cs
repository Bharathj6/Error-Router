using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ErrorRouter.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CredentialScopeRelationships : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_api_credentials_application_id",
                table: "api_credentials",
                column: "application_id");

            migrationBuilder.CreateIndex(
                name: "IX_api_credentials_environment_id",
                table: "api_credentials",
                column: "environment_id");

            migrationBuilder.CreateIndex(
                name: "IX_api_credentials_service_id",
                table: "api_credentials",
                column: "service_id");

            migrationBuilder.AddForeignKey(
                name: "FK_api_credentials_applications_application_id",
                table: "api_credentials",
                column: "application_id",
                principalTable: "applications",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_api_credentials_environments_environment_id",
                table: "api_credentials",
                column: "environment_id",
                principalTable: "environments",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_api_credentials_services_service_id",
                table: "api_credentials",
                column: "service_id",
                principalTable: "services",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_api_credentials_applications_application_id",
                table: "api_credentials");

            migrationBuilder.DropForeignKey(
                name: "FK_api_credentials_environments_environment_id",
                table: "api_credentials");

            migrationBuilder.DropForeignKey(
                name: "FK_api_credentials_services_service_id",
                table: "api_credentials");

            migrationBuilder.DropIndex(
                name: "IX_api_credentials_application_id",
                table: "api_credentials");

            migrationBuilder.DropIndex(
                name: "IX_api_credentials_environment_id",
                table: "api_credentials");

            migrationBuilder.DropIndex(
                name: "IX_api_credentials_service_id",
                table: "api_credentials");
        }
    }
}
