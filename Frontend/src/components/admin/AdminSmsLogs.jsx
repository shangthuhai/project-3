import React from 'react';
import Pagination from './Pagination';

export default function AdminSmsLogs({
  adminSmsLogs,
  setSmsLogsPage,
  smsLogsSearch = '',
  setSmsLogsSearch = () => {},
  smsLogsStatus = 'all',
  setSmsLogsStatus = () => {},
  smsLogsType = 'all',
  setSmsLogsType = () => {}
}) {
  const hasActiveFilters = smsLogsSearch !== '' || smsLogsStatus !== 'all' || smsLogsType !== 'all';

  const handleResetFilters = () => {
    setSmsLogsSearch('');
    setSmsLogsStatus('all');
    setSmsLogsType('all');
    setSmsLogsPage(1);
  };

  return (
    <div className="admin-tab-content">
      <div className="admin-header" style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '6px' }}>System SMS Delivery Logs</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>Comprehensive database audit trail for all outbound text messages and gateway delivery status codes.</p>
      </div>

      {/* Filter and Search Controls Bar */}
      <div className="admin-filter-bar" style={{
        background: 'var(--bg-sidebar)',
        padding: '16px 20px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-light)',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', flex: '1', minWidth: '300px' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
            <input
              type="text"
              placeholder="🔍 Search log ID, sender, receiver, content, gateway code..."
              value={smsLogsSearch}
              onChange={(e) => {
                setSmsLogsSearch(e.target.value);
                setSmsLogsPage(1);
              }}
              style={{
                width: '100%',
                padding: '9px 12px',
                paddingRight: smsLogsSearch ? '32px' : '12px',
                background: 'var(--bg-app)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                fontSize: '0.88rem',
                outline: 'none'
              }}
            />
            {smsLogsSearch && (
              <button
                onClick={() => {
                  setSmsLogsSearch('');
                  setSmsLogsPage(1);
                }}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Delivery Status Filter */}
          <select
            value={smsLogsStatus}
            onChange={(e) => {
              setSmsLogsStatus(e.target.value);
              setSmsLogsPage(1);
            }}
            style={{
              padding: '9px 12px',
              background: '#182533',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              color: smsLogsStatus !== 'all' ? 'var(--color-primary)' : 'var(--text-muted)',
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            <option value="all">⚡ All Delivery Statuses</option>
            <option value="delivered">🟢 Delivered / Sent</option>
            <option value="failed">🔴 Failed</option>
            <option value="pending">🟡 Pending</option>
          </select>

          {/* SMS Type Filter */}
          <select
            value={smsLogsType}
            onChange={(e) => {
              setSmsLogsType(e.target.value);
              setSmsLogsPage(1);
            }}
            style={{
              padding: '9px 12px',
              background: '#182533',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              color: smsLogsType !== 'all' ? 'var(--color-primary)' : 'var(--text-muted)',
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            <option value="all">✉️ All Message Types</option>
            <option value="friend">👥 Friend Free SMS</option>
            <option value="normal">🌐 Normal SMS</option>
          </select>
        </div>

        {/* Filter Stats & Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Total logs found: <strong>{adminSmsLogs.totalCount || 0}</strong>
          </span>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              style={{
                padding: '6px 12px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid var(--color-danger)',
                color: 'var(--color-danger)',
                borderRadius: '6px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              🔄 Reset Filters
            </button>
          )}
        </div>
      </div>

      <div className="admin-table-container" style={{ background: 'var(--bg-sidebar)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflowX: 'auto' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Log ID</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Sender</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Receiver No.</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', width: '30%' }}>Message Content</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Sent Time</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Type</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Gateway Code</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {!adminSmsLogs.items || adminSmsLogs.items.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Không tìm thấy nhật ký gửi SMS nào.
                </td>
              </tr>
            ) : (
              adminSmsLogs.items.map(log => {
                const statusClass = log.deliveryStatus === 'delivered' || log.deliveryStatus === 'sent' ? 'success' : log.deliveryStatus === 'failed' ? 'danger' : 'warning';
                const statusBg = log.deliveryStatus === 'delivered' || log.deliveryStatus === 'sent' ? 'rgba(16, 185, 129, 0.15)' : log.deliveryStatus === 'failed' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)';
                const statusColor = log.deliveryStatus === 'delivered' || log.deliveryStatus === 'sent' ? 'var(--color-accent)' : log.deliveryStatus === 'failed' ? 'var(--color-danger)' : 'var(--color-warning)';
                return (
                  <tr key={log.logId} style={{ borderBottom: '1px solid var(--border-light)' }} className="table-row-hover">
                    <td style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>#{log.logId}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <div className="sender-cell" style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ color: 'var(--text-main)' }}>{log.senderUsername}</strong>
                        <span className="sender-cell-name" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{log.senderName}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-main)' }}><code>{log.receiverNumber}</code></td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-main)', fontSize: '0.88rem', wordBreak: 'break-word', maxWidth: '300px' }} title={log.content}>{log.content}</td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>{new Date(log.sentTime).toLocaleString('vi-VN')}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span className={`type-tag ${log.isFreeFriendMsg ? 'friend' : 'non-friend'}`} style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '500', background: log.isFreeFriendMsg ? 'rgba(36, 129, 204, 0.12)' : 'rgba(255,255,255,0.05)', color: log.isFreeFriendMsg ? 'var(--color-primary)' : 'var(--text-muted)' }}>
                        {log.isFreeFriendMsg ? 'Friend' : 'Normal'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px' }}><code style={{ color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.08)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.82rem' }}>{log.gatewayStatusCode}</code></td>
                    <td style={{ padding: '12px 20px' }}>
                      <span className={`delivery-tag ${statusClass}`} style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', background: statusBg, color: statusColor }}>
                        {log.deliveryStatus.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <Pagination
        page={adminSmsLogs.page}
        totalPages={adminSmsLogs.totalPages}
        totalCount={adminSmsLogs.totalCount}
        pageSize={adminSmsLogs.pageSize || 10}
        onPageChange={setSmsLogsPage}
      />
    </div>
  );
}
