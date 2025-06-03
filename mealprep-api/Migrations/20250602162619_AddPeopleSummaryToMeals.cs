using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MealPrepAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddPeopleSummaryToMeals : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PeopleCount",
                table: "Meals",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PeopleJson",
                table: "Meals",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TotalCalories",
                table: "Meals",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TotalMeals",
                table: "Meals",
                type: "INTEGER",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PeopleCount",
                table: "Meals");

            migrationBuilder.DropColumn(
                name: "PeopleJson",
                table: "Meals");

            migrationBuilder.DropColumn(
                name: "TotalCalories",
                table: "Meals");

            migrationBuilder.DropColumn(
                name: "TotalMeals",
                table: "Meals");
        }
    }
}
