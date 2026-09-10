using System;
using System.IO;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Amazon;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Backend.Services
{
    public class S3StorageService : IS3StorageService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<S3StorageService> _logger;

        public S3StorageService(IConfiguration configuration, ILogger<S3StorageService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<string?> UploadBase64ImageAsync(string base64Data, string folder = "avatars")
        {
            if (string.IsNullOrWhiteSpace(base64Data))
                return null;

            // If it's already an HTTP URL (e.g., https://... or http://...), no need to re-upload
            if (base64Data.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
                base64Data.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            {
                return base64Data;
            }

            var awsSection = _configuration.GetSection("AWS");
            var accessKey = awsSection["AccessKey"];
            var secretKey = awsSection["SecretKey"];
            var regionName = awsSection["Region"] ?? "ap-southeast-1";
            var bucketName = awsSection["BucketName"];

            // Fallback: If AWS credentials are not configured yet, return base64 Data URL as is
            if (string.IsNullOrWhiteSpace(accessKey) || string.IsNullOrWhiteSpace(secretKey) || string.IsNullOrWhiteSpace(bucketName) || accessKey.Contains("YOUR_ACCESS_KEY"))
            {
                _logger.LogWarning("AWS S3 is not configured in appsettings.json. Returning original data.");
                return base64Data;
            }

            try
            {
                // Extract file extension and raw base64 string
                var extension = ".png";
                var rawBase64 = base64Data;

                var match = Regex.Match(base64Data, @"^data:image\/(?<type>[a-zA-Z0-9\+\.\-]+);base64,(?<data>.+)$");
                if (match.Success)
                {
                    var imageType = match.Groups["type"].Value.ToLower();
                    extension = imageType switch
                    {
                        "jpeg" or "jpg" => ".jpg",
                        "png" => ".png",
                        "webp" => ".webp",
                        "gif" => ".gif",
                        "svg+xml" => ".svg",
                        _ => $".{imageType}"
                    };
                    rawBase64 = match.Groups["data"].Value;
                }

                byte[] imageBytes = Convert.FromBase64String(rawBase64);

                var region = RegionEndpoint.GetBySystemName(regionName);
                using var s3Client = new AmazonS3Client(accessKey, secretKey, region);

                var key = $"{folder.Trim('/')}/{Guid.NewGuid()}{extension}";

                using var stream = new MemoryStream(imageBytes);

                var putRequest = new PutObjectRequest
                {
                    BucketName = bucketName,
                    Key = key,
                    InputStream = stream,
                    ContentType = GetContentType(extension)
                };

                await s3Client.PutObjectAsync(putRequest);

                // Construct public S3 URL
                var publicUrl = $"https://{bucketName}.s3.{regionName}.amazonaws.com/{key}";
                _logger.LogInformation("Successfully uploaded image to AWS S3: {Url}", publicUrl);

                return publicUrl;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to upload image to AWS S3.");
                // Return original base64Data on failure so user experience doesn't break
                return base64Data;
            }
        }

        private static string GetContentType(string extension)
        {
            return extension.ToLower() switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".webp" => "image/webp",
                ".gif" => "image/gif",
                ".svg" => "image/svg+xml",
                _ => "application/octet-stream"
            };
        }
    }
}
