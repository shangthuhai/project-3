using System.Threading.Tasks;

namespace Backend.Services
{
    public interface IRegisterOtpService
    {
        string GenerateOtp(string email);
        bool ValidateOtp(string email, string code);
    }
}
