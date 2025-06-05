using Microsoft.AspNetCore.Mvc;
using MealPrepApi.Data;
using MealPrepApi.Models;
using Microsoft.EntityFrameworkCore;

namespace MealPrepApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MealsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MealsController(AppDbContext context)
        {
            _context = context;
        }

        // POST /api/meals
        [HttpPost]
        public async Task<IActionResult> CreateMeal([FromBody] Meal meal)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.Meals.Add(meal);
            await _context.SaveChangesAsync();
            return Ok(meal);
        }

        // GET /api/meals/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetMeal(int id)
        {
            var meal = await _context.Meals.FindAsync(id);
            if (meal == null) return NotFound();
            return Ok(meal);
        }

        // GET /api/meals
        [HttpGet]
        public async Task<IActionResult> GetAllMeals()
        {
            var meals = await _context.Meals.OrderByDescending(m => m.CreatedAt).ToListAsync();
            return Ok(meals);
        }
    }
}
