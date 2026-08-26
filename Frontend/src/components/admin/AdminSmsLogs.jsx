import React from 'react';

export default function AdminSmsLogs({ adminSmsLogs, setSmsLogsPage }) {
  return (
    <div className="admin-tab-content">
      <div className="admin-header" style={{ marginBottom: '25px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '600', color: '#fff', marginBottom: '6px' }}>System SMS Delivery Logs</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>Comprehensive database audit trail for all outbound text messages and gateway delivery status codes.</p>
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
                        <strong style={{ color: '#fff' }}>{log.senderUsername}</strong>
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
      {adminSmsLogs && adminSmsLogs.totalPages > 1 && (
        <div className="pagination-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '12px 20px', background: 'var(--bg-sidebar)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Hiển thị trang <strong>{adminSmsLogs.page}</strong> / <strong>{adminSmsLogs.totalPages}</strong> (Tổng cộng <strong>{adminSmsLogs.totalCount}</strong> bản ghi)
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setSmsLogsPage(prev => Math.max(prev - 1, 1))}
              disabled={adminSmsLogs.page <= 1}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: adminSmsLogs.page <= 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.08)',
                color: adminSmsLogs.page <= 1 ? 'var(--text-muted)' : '#fff',
                border: '1px solid var(--border-light)',
                cursor: adminSmsLogs.page <= 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              Trước
            </button>
            
            {/* Dynamic page numbers */}
            {Array.from({ length: adminSmsLogs.totalPages }, (_, idx) => idx + 1)
              .filter(p => Math.abs(p - adminSmsLogs.page) <= 2 || p === 1 || p === adminSmsLogs.totalPages)
              .map((p, idx, arr) => {
                const elements = [];
                if (idx > 0 && p - arr[idx - 1] > 1) {
                  elements.push(
                    <span key={`dots-${p}`} style={{ color: 'var(--text-muted)', alignSelf: 'center', padding: '0 4px' }}>...</span>
                  );
                }
                elements.push(
                  <button
                    key={p}
                    onClick={() => setSmsLogsPage(p)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      background: adminSmsLogs.page === p ? 'var(--color-primary, #2481cc)' : 'rgba(255,255,255,0.04)',
                      color: '#fff',
                      border: adminSmsLogs.page === p ? '1px solid var(--color-primary, #2481cc)' : '1px solid var(--border-light)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: adminSmsLogs.page === p ? '600' : '500',
                      transition: 'all 0.2s'
                    }}
                  >
                    {p}
                  </button>
                );
                return elements;
              })}

            <button
              onClick={() => setSmsLogsPage(prev => Math.min(prev + 1, adminSmsLogs.totalPages))}
              disabled={adminSmsLogs.page >= adminSmsLogs.totalPages}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: adminSmsLogs.page >= adminSmsLogs.totalPages ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.08)',
                color: adminSmsLogs.page >= adminSmsLogs.totalPages ? 'var(--text-muted)' : '#fff',
                border: '1px solid var(--border-light)',
                cursor: adminSmsLogs.page >= adminSmsLogs.totalPages ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
