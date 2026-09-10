using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;

var builder = WebApplication.CreateBuilder(args);
var firebaseCredentialsPath = builder.Configuration["Firebase:CredentialsPath"]
    ?? Environment.GetEnvironmentVariable("FIREBASE_CREDENTIALS_PATH")
    ?? Path.Combine(builder.Environment.ContentRootPath, "firebase-service-account.json");
if (!string.IsNullOrWhiteSpace(firebaseCredentialsPath) && File.Exists(firebaseCredentialsPath))
{
    FirebaseApp.Create(new AppOptions
    {
        Credential = GoogleCredential.FromFile(firebaseCredentialsPath)
    });
}
var databaseFile = Environment.GetEnvironmentVariable("SMSCHAT_DB") ?? "smschat-v2.db";

// Add DB context
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection") ?? $"Data Source={databaseFile}"));

// Register background scheduled message processor
builder.Services.AddHostedService<Backend.Services.SMSBackgroundService>();

// Register AI Service
builder.Services.AddHttpClient<Backend.Services.IAiService, Backend.Services.AiService>();

// Register Telegram Service
builder.Services.AddHttpClient<Backend.Services.ITelegramService, Backend.Services.TelegramService>();

// Register Email Service for OTP
builder.Services.AddScoped<Backend.Services.IEmailService, Backend.Services.EmailService>();

// Register Register OTP Service
builder.Services.AddSingleton<Backend.Services.IRegisterOtpService, Backend.Services.RegisterOtpService>();

// Register Forgot Password OTP Service
builder.Services.AddSingleton<Backend.Services.IForgotPasswordOtpService, Backend.Services.ForgotPasswordOtpService>();


// Register S3 Storage Service
builder.Services.AddScoped<Backend.Services.IS3StorageService, Backend.Services.S3StorageService>();

// Register Cloudinary Service
builder.Services.AddScoped<Backend.Services.ICloudinaryService, Backend.Services.CloudinaryService>();

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

    try
    {
        dbContext.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS ""Keyword_Rules"" (
                ""rule_id"" INTEGER NOT NULL CONSTRAINT ""PK_Keyword_Rules"" PRIMARY KEY AUTOINCREMENT,
                ""keyword"" TEXT NOT NULL,
                ""category"" TEXT NULL,
                ""action"" TEXT NULL,
                ""is_active"" INTEGER NOT NULL DEFAULT 1,
                ""created_at"" TEXT NOT NULL
            );
        ");

        try { dbContext.Database.ExecuteSqlRaw(@"ALTER TABLE ""Messages"" ADD COLUMN ""spam_status"" TEXT DEFAULT 'normal';"); } catch {}
        try { dbContext.Database.ExecuteSqlRaw(@"ALTER TABLE ""Messages"" ADD COLUMN ""moderation_reason"" TEXT NULL;"); } catch {}
        try { dbContext.Database.ExecuteSqlRaw(@"ALTER TABLE ""Messages"" ADD COLUMN ""delay_until"" TEXT NULL;"); } catch {}
        try { dbContext.Database.ExecuteSqlRaw(@"ALTER TABLE ""Messages"" ADD COLUMN ""is_approved"" INTEGER NULL;"); } catch {}

        if (!dbContext.KeywordRules.Any())
        {
            dbContext.KeywordRules.AddRange(
                new Backend.Models.KeywordRule { Keyword = "lừa đảo", Category = "Scam", Action = "block", IsActive = true, CreatedAt = DateTime.UtcNow },
                new Backend.Models.KeywordRule { Keyword = "cờ bạc", Category = "Scam", Action = "block", IsActive = true, CreatedAt = DateTime.UtcNow },
                new Backend.Models.KeywordRule { Keyword = "nợ", Category = "Sensitive", Action = "flag", IsActive = true, CreatedAt = DateTime.UtcNow },
                new Backend.Models.KeywordRule { Keyword = "khuyến mãi khủng", Category = "Spam", Action = "flag", IsActive = true, CreatedAt = DateTime.UtcNow },
                new Backend.Models.KeywordRule { Keyword = "chuyển tiền gấp", Category = "Scam", Action = "delay", IsActive = true, CreatedAt = DateTime.UtcNow }
            );
            dbContext.SaveChanges();
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"DB Migration warning: {ex.Message}");
    }
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
