namespace MealPrepAPI.Models
{
    public class Meal
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? CreatedBy { get; set; }
        public string FoodsJson { get; set; }
        public string GroupsJson { get; set; }
        public bool IsShared { get; set; }
        public string? Notes { get; set; }
        public string? PeopleJson { get; set; }
        public int? PeopleCount { get; set; }
        public int? TotalMeals { get; set; }
        public double? TotalCalories { get; set; }
    }
}
