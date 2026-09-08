import React, { useState } from 'react';

export default function AdminModeration({
  keywords = [],
  moderationLogs = [],
  onCreateKeyword,
  onToggleKeyword,
  onDeleteKeyword,
  onRefreshLogs
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newCategory, setNewCategory] = useState('Sensitive');
  const [newAction, setNewAction] = useState('flag');
  const [activeSubTab, setActiveSubTab] = useState('rules'); // rules | logs

  const handleSubmitKeyword = (e) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    onCreateKeyword(newKeyword.trim(), newCategory, newAction);
    setNewKeyword('');
    setShowAddModal(false);
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'block': return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', text: '⛔ BLOCK' };
      case 'delay': return { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', text: '⏱️ DELAY' };
      default: return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', text: '🏷️ FLAG & AI' };
    }
  };

  const getSpamBadge = (status) => {
    switch (status) {
      case 'suspected_spam':
        return <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>⚠️ REPETITIVE SPAM</span>;
      case 'sensitive_flagged':
        return <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>🏷️ SENSITIVE KEYWORD</span>;
      case 'blocked':
        return <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>⛔ BLOCKED</span>;
      case 'delayed':
        return <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7' }}>⏱️ DELAYED</span>;
      default:
        return <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', background: 'rgba(156, 163, 175, 0.2)', color: '#9ca3af' }}>NORMAL</span>;
    }
  };

  return (
    <div className="admin-tab-content">
      {/* Header */}
      <div className="admin-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '6px' }}>
            🛡️ AI & Keyword Content Moderation
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Quản lý bộ lọc từ khóa nhạy cảm, thiết lập hành vi tự động và kiểm duyệt tin nhắn bị AI gắn nhãn.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '10px 18px',
              background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}
          >
            ➕ Thêm Từ Khóa
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-light)', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveSubTab('rules')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'rules' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeSubTab === 'rules' ? 'var(--color-primary)' : 'var(--text-muted)',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          📋 Quy Tắc Từ Khóa ({keywords.length})
        </button>
        <button
          onClick={() => { setActiveSubTab('logs'); onRefreshLogs && onRefreshLogs(); }}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'logs' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeSubTab === 'logs' ? 'var(--color-primary)' : 'var(--text-muted)',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          🚨 Nhật Ký Kiểm Duyệt AI ({moderationLogs.length})
        </button>
      </div>

      {/* TAB 1: KEYWORD RULES */}
      {activeSubTab === 'rules' && (
        <div className="admin-table-container" style={{ background: 'var(--bg-sidebar)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '14px 20px', fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Từ Khóa</th>
                <th style={{ padding: '14px 20px', fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Danh Mục</th>
                <th style={{ padding: '14px 20px', fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hành Động Tự Động</th>
                <th style={{ padding: '14px 20px', fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Trạng Thái</th>
                <th style={{ padding: '14px 20px', fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {keywords.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có quy tắc từ khóa nào. Nhấn "Thêm Từ Khóa" để bắt đầu.</td>
                </tr>
              ) : (
                keywords.map((k) => {
                  const actStyle = getActionColor(k.action);
                  return (
                    <tr key={k.ruleId} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '14px 20px', color: 'var(--text-main)', fontWeight: '600' }}>
                        <code>{k.keyword}</code>
                      </td>
                      <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>{k.category}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: '600', background: actStyle.bg, color: actStyle.color }}>
                          {actStyle.text}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', background: k.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: k.isActive ? '#10b981' : '#ef4444' }}>
                          {k.isActive ? 'HOẠT ĐỘNG' : 'TẮT'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => onToggleKeyword(k.ruleId)}
                            style={{ padding: '5px 10px', fontSize: '0.78rem', background: 'var(--bg-app)', border: '1px solid var(--border-light)', color: 'var(--text-main)', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            {k.isActive ? '⏸️ Tắt' : '▶️ Bật'}
                          </button>
                          <button
                            onClick={() => onDeleteKeyword(k.ruleId)}
                            style={{ padding: '5px 10px', fontSize: '0.78rem', background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            🗑️ Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: MODERATION LOGS */}
      {activeSubTab === 'logs' && (
        <div className="admin-table-container" style={{ background: 'var(--bg-sidebar)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '14px 20px', fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>ID</th>
                <th style={{ padding: '14px 20px', fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Người Gửi</th>
                <th style={{ padding: '14px 20px', fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nội Dung Tin Nhắn</th>
                <th style={{ padding: '14px 20px', fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Đánh Nhãn Spam</th>
                <th style={{ padding: '14px 20px', fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Lý Do & AI Phân Tích</th>
                <th style={{ padding: '14px 20px', fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Thời Gian</th>
              </tr>
            </thead>
            <tbody>
              {moderationLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có tin nhắn vi phạm hoặc bị can thiệp bởi AI.</td>
                </tr>
              ) : (
                moderationLogs.map((log) => (
                  <tr key={log.messageId} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>#{log.messageId}</td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-main)' }}><strong>{log.senderUsername}</strong></td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-main)', maxWidth: '280px', wordBreak: 'break-word' }}>
                      {log.content}
                    </td>
                    <td style={{ padding: '14px 20px' }}>{getSpamBadge(log.spamStatus)}</td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                      {log.moderationReason || 'Được xử lý tự động'}
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {new Date(log.sentAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE KEYWORD MODAL */}
      {showAddModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#182533', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-light)', width: '90%', maxWidth: '450px' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '16px' }}>Thêm Quy Tắc Từ Khóa Mới</h3>
            <form onSubmit={handleSubmitKeyword}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Từ Khóa Cần Lọc</label>
                <input
                  type="text"
                  placeholder="Ví dụ: lừa đảo, cờ bạc, khuyến mãi..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-app)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Phân Loại</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-app)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)' }}
                >
                  <option value="Sensitive">Sensitive (Nhạy cảm)</option>
                  <option value="Spam">Spam (Tin rác / Quảng cáo)</option>
                  <option value="Scam">Scam (Lừa đảo / Độc hại)</option>
                  <option value="Abuse">Abuse (Xúc phạm / Đe dọa)</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Hành Động Khi Phát Hiện</label>
                <select
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-app)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)' }}
                >
                  <option value="flag">🏷️ Flag & AI Analysis (Đánh nhãn & Nhờ AI phân tích)</option>
                  <option value="block">⛔ Block Immediately (Chặn gửi ngay lập tức)</option>
                  <option value="delay">⏱️ Delay Sending (Tạm hoãn 5 phút)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--border-light)', color: 'var(--text-muted)', borderRadius: '6px', cursor: 'pointer' }}>Hủy</button>
                <button type="submit" style={{ padding: '8px 16px', background: 'var(--color-primary)', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Thêm Mới</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
