import React from 'react';
import { useChat } from '../../context/ChatContext';

export default function GroupsTab() {
  const {
    groups,
    selectedGroup,
    setSelectedGroup,
    groupMembers,
    setGroupMembers,
    groupForm,
    setGroupForm,
    newGroupMemberId,
    setNewGroupMemberId,
    bulkContent,
    setBulkContent,
    bulkScheduleDate,
    setBulkScheduleDate,
    bulkResultsLog,
    setBulkResultsLog,
    contacts,
    handleCreateGroup,
    handleDeleteGroup,
    loadGroupMembers,
    handleAddGroupMember,
    handleRemoveGroupMember,
    handleSendBulkMessage
  } = useChat();

  return (
    <div className="view-panel">
      <div className="view-header">
        <h1>Gửi tin nhắn hàng loạt theo nhóm</h1>
        <p>Tạo danh mục nhóm danh bạ và gửi tin nhắn hàng loạt chỉ với 1 click.</p>
      </div>

      <div className="groups-container">
        <div className="groups-sidebar">
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>Danh sách nhóm</h3>
          <form onSubmit={handleCreateGroup} style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
            <input
              type="text"
              placeholder="Tên nhóm mới"
              value={groupForm.name}
              onChange={(e) => setGroupForm({ name: e.target.value })}
              style={{ flex: 1, background: 'var(--bg-app)', border: '1px solid var(--border-light)', color: 'var(--text-main)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', outline: 'none' }}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>+</button>
          </form>

          <div className="groups-list">
            {groups.length === 0 ? (
              <div style={{ padding: '15px', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>Chưa có nhóm nào.</div>
            ) : (
              groups.map(g => (
                <div
                  key={g.id}
                  className={`group-list-item ${selectedGroup?.id === g.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedGroup(g);
                    loadGroupMembers(g.id);
                    setBulkResultsLog(null);
                  }}
                >
                  <span className="group-list-name">👥 {g.name}</span>
                  <button
                    style={{ background: 'none', border: 'none', color: '#ff5555', cursor: 'pointer', fontSize: '0.8rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGroup(g.id, g.name);
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="group-details-pane">
          {selectedGroup ? (
            <>
              <div className="group-pane-header">
                <h3 className="group-pane-title">Chi tiết nhóm: {selectedGroup.name}</h3>
                <form onSubmit={handleAddGroupMember} style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={newGroupMemberId}
                    onChange={(e) => setNewGroupMemberId(e.target.value)}
                    style={{ background: 'var(--bg-app)', border: '1px solid var(--border-light)', color: 'var(--text-main)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', outline: 'none' }}
                    required
                  >
                    <option value="">-- Thêm liên hệ vào nhóm --</option>
                    {contacts.map(c => {
                      const inGroup = groupMembers.some(m => m.id === c.id);
                      if (inGroup) return null;
                      return (
                        <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.contactNumber})</option>
                      );
                    })}
                  </select>
                  <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Thêm</button>
                </form>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Thành viên nhóm ({groupMembers.length})</h4>
                {groupMembers.length === 0 ? (
                  <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Nhóm chưa có thành viên. Hãy chọn liên hệ từ danh sách trên để thêm!
                  </div>
                ) : (
                  <div className="group-members-grid">
                    {groupMembers.map(m => (
                      <div key={m.id} className="group-member-card">
                        <div className="group-member-info">
                          <h5>{m.firstName} {m.lastName}</h5>
                          <p>{m.contactNumber}</p>
                        </div>
                        <button
                          className="btn-icon-danger"
                          onClick={() => handleRemoveGroupMember(m.id)}
                          title="Xóa khỏi nhóm"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {groupMembers.length > 0 && (
                <div className="group-bulk-box">
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '10px', color: 'var(--color-primary)' }}>Soạn tin nhắn hàng loạt</h4>
                  <form onSubmit={handleSendBulkMessage} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <textarea
                      placeholder="Nhập nội dung gửi cho cả nhóm..."
                      value={bulkContent}
                      onChange={(e) => setBulkContent(e.target.value.substring(0, 120))}
                      rows={2}
                      required
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <label style={{ fontSize: '0.78rem' }}>Hẹn giờ gửi (Tùy chọn):</label>
                        <input
                          type="datetime-local"
                          value={bulkScheduleDate}
                          onChange={(e) => setBulkScheduleDate(e.target.value)}
                          style={{ background: 'var(--bg-app)', border: '1px solid var(--border-light)', color: 'var(--text-main)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.78rem' }}
                          min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                        />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Đã viết: {bulkContent.length}/120
                      </span>
                      <button type="submit" className="btn btn-primary" style={{ marginLeft: 'auto', padding: '8px 20px' }}>
                        Gửi hàng loạt 🚀
                      </button>
                    </div>
                  </form>

                  {bulkResultsLog && (
                    <div className="bulk-results-log">
                      {bulkResultsLog}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>👥</div>
              <h3>Chưa chọn nhóm</h3>
              <p>Hãy chọn một nhóm ở menu bên trái để quản lý thành viên hoặc gửi tin nhắn nhóm.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
