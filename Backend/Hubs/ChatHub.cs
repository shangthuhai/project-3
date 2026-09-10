using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using System.Threading.Tasks;

namespace Backend.Hubs
{
    public class ChatHub : Hub
    {
        private readonly AppDbContext _context;

        public ChatHub(AppDbContext context)
        {
            _context = context;
        }

        // Chuyển tiếp trạng thái gõ phím từ người gửi sang người nhận qua SignalR
        public async Task SendTyping(string receiverMobileNumber)
        {
            var senderUserIdStr = Context.UserIdentifier;
            if (string.IsNullOrEmpty(senderUserIdStr) || !int.TryParse(senderUserIdStr, out var senderUserId))
                return;

            var receiverUser = await _context.Users.FirstOrDefaultAsync(u => u.MobileNumber == receiverMobileNumber);
            if (receiverUser == null) return;

            var senderUser = await _context.Users.FindAsync(senderUserId);
            if (senderUser == null) return;

            // Gửi sự kiện soạn thảo đến UserId người nhận, kèm số điện thoại người gửi
            await Clients.User(receiverUser.UserId.ToString()).SendAsync("ReceiveTypingStatus", senderUser.MobileNumber);
        }
    }
}
