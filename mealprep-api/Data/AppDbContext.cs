using MealPrepAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace MealPrepAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<Meal> Meals { get; set; }
    }
}
