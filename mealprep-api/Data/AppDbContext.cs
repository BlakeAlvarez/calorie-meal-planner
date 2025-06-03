using MealPrepApi.Models;
using Microsoft.EntityFrameworkCore;

namespace MealPrepApi.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<Meal> Meals { get; set; }
    }
}
