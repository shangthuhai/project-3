using System.Threading.Tasks;

namespace Backend.Services
{
    public interface ICloudinaryService
    {
        Task<string?> UploadBase64ImageAsync(string base64Data, string folder = "avatars");
    }
}
