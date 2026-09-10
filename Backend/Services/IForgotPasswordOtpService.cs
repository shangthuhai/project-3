namespace Backend.Services
{
    public interface IForgotPasswordOtpService
    {
        string GenerateOtp(string email);
        bool ValidateOtp(string email, string code);
    }
}
