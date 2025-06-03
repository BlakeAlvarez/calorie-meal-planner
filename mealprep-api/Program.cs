using MealPrepApi.Data;
using Microsoft.EntityFrameworkCore;
using System.Threading.RateLimiting;

DotNetEnv.Env.Load("/home/blake/projects/calorie-meal-planner/mealprep-api/.env");

var builder = WebApplication.CreateBuilder(args);



// load user secrets in dev
if (builder.Environment.IsDevelopment())
{
    builder.Configuration.AddUserSecrets<Program>();
}

Console.WriteLine("Loaded DB path: " + Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection"));



// CORS policies
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });

    options.AddPolicy("AllowAll", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// === Kestrel: Dev ports only ===
if (builder.Environment.IsDevelopment())
{
    builder.WebHost.ConfigureKestrel(server =>
    {
        server.ListenAnyIP(5000);
        server.ListenAnyIP(7002);
    });
}

// === Services ===
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// === Rate Limiting ===
builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("SearchPolicy", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "anon",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromSeconds(10),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 2
            }));

    options.RejectionStatusCode = 429;
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.Headers["Retry-After"] = "10";
        await context.HttpContext.Response.WriteAsync("Rate limit exceeded. Try again in 10 seconds.", token);
    };
});

var app = builder.Build();


if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseCors("AllowAll");
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseCors("AllowFrontend");
    app.UseHttpsRedirection();  // https in prod
}

app.UseRouting();
app.UseAuthorization();
app.UseRateLimiter();
app.MapControllers();

app.Run();