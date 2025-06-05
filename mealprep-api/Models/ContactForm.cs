using System.ComponentModel.DataAnnotations;

namespace MealPrepApi.Models
{
    public class ContactFormModel
    {
        [Required] public string Name { get; set; }
        [Required, EmailAddress] public string Email { get; set; }
        [Required] public string Message { get; set; }
        [Required] public string Source { get; set; }
    }
}