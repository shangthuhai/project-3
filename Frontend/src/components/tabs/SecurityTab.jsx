import React from 'react';
import { useChat } from '../../context/ChatContext';

export default function SecurityTab() {
  const {
    privacySettings,
    blocklist,
    blockNumberInput,
    setBlockNumberInput,
    handleBlockNumber,
    handleUnblockNumber,
    handleToggle2FaSetting,
    handleTogglePrivacySetting
  } = useChat();

  return (
    <div className="view-panel">
      <div className="view-header">
        <h1>Cài đặt riêng tư & Bảo mật tài khoản</h1>
        <p>Cấu hình xác thực 2 lớp, tùy chọn chặn người lạ và quản lý danh sách đen.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '25px' }}>
        <div>
          <h3 className="settings-section-title">Bảo mật tài khoản</h3>

          <div className="privacy-toggle-card">
            <div className="privacy-toggle-info">
              <h4>Xác thực 2 lớp qua Email (2FA)</h4>
              <p>Yêu cầu nhập mã OTP gửi về Email khi đăng nhập tài khoản hoặc mua dịch vụ VAS.</p>
            </div>
            <div>
              <input
                type="checkbox"
                className="checklist-checkbox"
                checked={privacySettings.twoFactorEnabled}
                onChange={(e) => handleToggle2FaSetting(e.target.checked)}
                style={{ width: '22px', height: '22px' }}
              />
            </div>
          </div>

          <h3 className="settings-section-title">Cài đặt Quyền riêng tư</h3>

          <div className="privacy-toggle-card">
            <div className="privacy-toggle-info">
              <h4>Chỉ nhận SMS từ Bạn bè</h4>
              <p>Từ chối nhận tin nhắn từ những số lạ (người lạ không thể gửi 5 tin nhắn miễn phí cho bạn).</p>
            </div>
            <div>
              <input
                type="checkbox"
                className="checklist-checkbox"
                checked={privacySettings.onlyReceiveFromFriends}
                onChange={(e) => handleTogglePrivacySetting(e.target.checked)}
                style={{ width: '22px', height: '22px' }}
              />
            </div>
          </div>
        </div>

        <div className="blocklist-container">
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '15px', color: 'var(--color-primary)' }}>
            Danh sách chặn (Blocklist)
          </h3>

          <form onSubmit={handleBlockNumber} className="blocklist-input-group">
            <input
              type="text"
              placeholder="Số điện thoại cần chặn (10 số)"
              value={blockNumberInput}
              onChange={(e) => setBlockNumberInput(e.target.value.replace(/\D/g, '').substring(0, 10))}
              maxLength={10}
              required
            />
            <button type="submit" className="btn btn-danger" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>Block</button>
          </form>

          <div className="block-items-list">
            {blocklist.length === 0 ? (
              <div style={{ padding: '15px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>Danh sách chặn trống.</div>
            ) : (
              blocklist.map(b => (
                <div key={b.id} className="block-item">
                  <div>
                    <div className="block-item-number">🚫 {b.blockedNumber}</div>
                  </div>
                  <button
                    className="btn-icon-danger"
                    onClick={() => handleUnblockNumber(b.id)}
                    style={{ fontSize: '0.78rem' }}
                  >
                    Hủy chặn
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
