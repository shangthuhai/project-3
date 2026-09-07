using System.Threading.Tasks;

namespace Backend.Services
{
    public interface ITelegramService
    {
        Task<bool> SendMessageAsync(string message);
    }
}
