namespace MealPrepApi.Models
{
    public class USDARequest
    {
        public string Query { get; set; }
        public string[] DataType { get; set; } = new[] { "Foundation", "SR Legacy" };
        public int PageSize { get; set; } = 50;
        public int PageNumber { get; set; } = 1;
    }
}