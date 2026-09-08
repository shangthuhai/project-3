namespace Backend.Services
{
    public interface IS3StorageService
    {
        Task<string?> UploadBase64ImageAsync(string base64Data, string folder = "avatars");
    }
}
