using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);
var databaseFile = Environment.GetEnvironmentVariable("SMSCHAT_DB") ?? "smschat-v2.db";

// Add DB context
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite($"Data Source={databaseFile}"));

// Register background scheduled message processor
builder.Services.AddHostedService<Backend.Services.SMSBackgroundService>();

// Register AI Service
builder.Services.AddHttpClient<Backend.Services.IAiService, Backend.Services.AiService>();

// Register Telegram Service
builder.Services.AddHttpClient<Backend.Services.ITelegramService, Backend.Services.TelegramService>();

// Register Email Service for OTP
builder.Services.AddScoped<Backend.Services.IEmailService, Backend.Services.EmailService>();

// Configure JWT Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = "smschat",
        ValidAudience = "smschat",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("SuperSecretSecureKey123456789012345"))
    };
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/chatHub"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.SetIsOriginAllowed(origin => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddSignalR();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Ensure database is created and seeded
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var databasePath = Path.Combine(builder.Environment.ContentRootPath, databaseFile);
    if (File.Exists(databasePath) && !HasCurrentSchema(dbContext))
    {
        dbContext.Database.CloseConnection();
        File.Delete(databasePath);
    }
    dbContext.Database.EnsureCreated();
}

app.UseCors("AllowReact");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<Backend.Hubs.ChatHub>("/chatHub");

app.Run();

static bool HasCurrentSchema(AppDbContext dbContext)
{
    var connection = dbContext.Database.GetDbConnection();
    try
    {
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name IN ('User_Quotas', 'SMS_Logs')";
        return Convert.ToInt32(command.ExecuteScalar()) == 2;
    }
    catch (Exception)
    {
        return false;
    }
    finally
    {
        connection.Close();
    }
}
