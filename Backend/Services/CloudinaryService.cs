using System;
using System.Threading.Tasks;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Backend.Services
{
    public class CloudinaryService : ICloudinaryService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<CloudinaryService> _logger;

        public CloudinaryService(IConfiguration configuration, ILogger<CloudinaryService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<string?> UploadBase64ImageAsync(string base64Data, string folder = "avatars")
        {
            if (string.IsNullOrWhiteSpace(base64Data))
                return null;

            // If it's already an HTTP/HTTPS URL, return as-is
            if (base64Data.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
                base64Data.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            {
                return base64Data;
            }

            var cloudSection = _configuration.GetSection("Cloudinary");
            var cloudName = cloudSection["CloudName"];
            var apiKey = cloudSection["ApiKey"];
            var apiSecret = cloudSection["ApiSecret"];

            // Fallback: If Cloudinary keys are not filled yet, return base64 Data URL as-is
            if (string.IsNullOrWhiteSpace(cloudName) ||
                string.IsNullOrWhiteSpace(apiKey) ||
                string.IsNullOrWhiteSpace(apiSecret) ||
                cloudName.Contains("YOUR_CLOUD_NAME"))
            {
                _logger.LogWarning("Cloudinary credentials are not configured in appsettings.json. Returning original base64 data.");
                return base64Data;
            }

            try
            {
                var account = new Account(cloudName, apiKey, apiSecret);
                var cloudinary = new Cloudinary(account);
                cloudinary.Api.Secure = true;

                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(Guid.NewGuid().ToString(), base64Data),
                    Folder = folder,
                    Transformation = new Transformation().Quality("auto").FetchFormat("auto")
                };

                var uploadResult = await cloudinary.UploadAsync(uploadParams);

                if (uploadResult.StatusCode == System.Net.HttpStatusCode.OK && uploadResult.SecureUrl != null)
                {
                    var secureUrl = uploadResult.SecureUrl.AbsoluteUri;
                    _logger.LogInformation("Successfully uploaded image to Cloudinary: {Url}", secureUrl);
                    return secureUrl;
                }

                _logger.LogError("Cloudinary upload failed: {Error}", uploadResult.Error?.Message);
                return base64Data;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception occurred during Cloudinary upload.");
                return base64Data;
            }
        }
    }
}
