using Microsoft.AspNetCore.Mvc;
using MealPrepApi.Models;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace MealPrepApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ContactController : ControllerBase
    {
        private readonly IConfiguration _config;

        public ContactController(IConfiguration config)
        {
            _config = config;
        }

        [HttpPost]
        public async Task<IActionResult> SendMessage([FromBody] ContactFormModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest("Invalid input");

            var isMealPrep = model.Source?.ToLower() == "mealprep";

            // Sender email (eg. contact@blakealvarez.com)
            var fromEmail = isMealPrep ? _config["MealPrepEmailUser"] : _config["DefaultEmailUser"];

            // SMTP login credentials
            var smtpUsername = _config["SmtpUsername"]; 
            var smtpPassword = _config["SmtpPassword"]; 

            var toEmail = _config["EmailTo"]; // where the message is sent to

            var emailBody = $"Name: {model.Name}\nEmail: {model.Email}\nMessage:\n{model.Message}";

            var message = new MimeMessage();
            message.From.Add(MailboxAddress.Parse(fromEmail)); // Sender email (eg. contact@blakealvarez.com)
            message.To.Add(MailboxAddress.Parse(toEmail));
            message.Subject = "New Contact Form Submission";
            message.Body = new TextPart("plain") { Text = emailBody };

            using var client = new SmtpClient();
            await client.ConnectAsync(_config["SmtpHost"], int.Parse(_config["SmtpPort"]), SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(smtpUsername, smtpPassword); // This is your real SMTP2GO login
            await client.SendAsync(message);
            await client.DisconnectAsync(true);


            return Ok("Message sent");
        }
    }
}
