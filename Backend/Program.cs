using Microsoft.EntityFrameworkCore;
using Backend.Data;

var builder = WebApplication.CreateBuilder(args);
var databaseFile = Environment.GetEnvironmentVariable("SMSCHAT_DB") ?? "smschat.db";

// Add services to the container.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite($"Data Source={databaseFile}"));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Recreate databases from the old SQL schema because EnsureCreated does not migrate tables.
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var databasePath = Path.GetFullPath(Path.Combine(builder.Environment.ContentRootPath, databaseFile));
    if (File.Exists(databasePath) && !HasCurrentUserSchema(dbContext))
    {
        dbContext.Database.CloseConnection();
        File.Delete(databasePath);
    }
    dbContext.Database.EnsureCreated();
}

app.UseCors("AllowReact");

app.UseAuthorization();

app.MapControllers();

app.Run();

static bool HasCurrentUserSchema(AppDbContext dbContext)
{
    try
    {
        var connection = dbContext.Database.GetDbConnection();
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = "PRAGMA table_info('Users')";
        using (var reader = command.ExecuteReader())
        {
            while (reader.Read())
            {
                if (string.Equals(reader.GetString(1), "Id", StringComparison.OrdinalIgnoreCase))
                {
                    reader.Close();
                    connection.Close();
                    return true;
                }
            }
        }
        connection.Close();
    }
    catch (Exception)
    {
        return false;
    }

    return false;
}

