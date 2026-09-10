using System;
using System.Collections.Concurrent;

namespace Backend.Services
{
    public class RegisterOtpService : IRegisterOtpService
    {
        private class OtpInfo
        {
            public string Code { get; set; } = string.Empty;
            public DateTime ExpiryTime { get; set; }
        }

        private readonly ConcurrentDictionary<string, OtpInfo> _otpStore = new(StringComparer.OrdinalIgnoreCase);

        public string GenerateOtp(string email)
        {
            if (string.IsNullOrWhiteSpace(email)) return string.Empty;
            var normalizedEmail = email.Trim().ToLowerInvariant();

            var code = Random.Shared.Next(100000, 999999).ToString();
            var info = new OtpInfo
            {
                Code = code,
                ExpiryTime = DateTime.UtcNow.AddMinutes(5)
            };

            _otpStore[normalizedEmail] = info;
            return code;
        }

        public bool ValidateOtp(string email, string code)
        {
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(code)) return false;
            var normalizedEmail = email.Trim().ToLowerInvariant();

            if (_otpStore.TryGetValue(normalizedEmail, out var info))
            {
                if (info.ExpiryTime > DateTime.UtcNow && string.Equals(info.Code, code.Trim(), StringComparison.OrdinalIgnoreCase))
                {
                    _otpStore.TryRemove(normalizedEmail, out _);
                    return true;
                }
            }

            return false;
        }
    }
}
