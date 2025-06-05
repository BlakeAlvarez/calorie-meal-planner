using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MealPrepApi.Models;
using System.Text;
using System.Text.Json;

namespace MealPrepApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FoodController : ControllerBase
    {
        private readonly string _apiKey;
        private static readonly HttpClient _httpClient = new HttpClient();

        public FoodController(IConfiguration config)
        {
            _apiKey = config["USDA:ApiKey"];
        }

        [HttpGet("ping")]
        public IActionResult Ping()
        {
            return Ok("This API works!");
        }

        [EnableRateLimiting("SearchPolicy")]
        [HttpPost("SearchFoodUSDA")]
        public async Task<IActionResult> SearchFoodUSDA([FromBody] USDARequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Query))
                return BadRequest("Search query is required.");

            var requestBody = new
            {
                query = request.Query,
                dataType = request.DataType,
                pageSize = request.PageSize,
                pageNumber = request.PageNumber
            };

            var jsonContent = new StringContent(
                JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json"
            );

            var url = $"https://api.nal.usda.gov/fdc/v1/foods/search?api_key={_apiKey}";

            // Console.Write(url);

            try
            {
                var response = await _httpClient.PostAsync(url, jsonContent);
                response.EnsureSuccessStatusCode();

                var json = await response.Content.ReadAsStringAsync();
                return Content(json, "application/json");
            }
            catch (HttpRequestException ex)
            {
                return StatusCode(500, $"Error calling USDA API: {ex.Message}");
            }
        }


        // used to get food details for a specific item
        [EnableRateLimiting("SearchPolicy")]
        [HttpGet("food/{fdcId}")]
        public async Task<IActionResult> GetFoodDetails(long fdcId)
        {
            var url = $"https://api.nal.usda.gov/fdc/v1/food/{fdcId}?api_key={_apiKey}";

            // Console.Write(url);

            try
            {
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var json = await response.Content.ReadAsStringAsync();
                return Content(json, "application/json");
            }
            catch (HttpRequestException ex)
            {
                return StatusCode(500, $"Error retrieving food details from USDA API: {ex.Message}");
            }
        }

        

    }
}
