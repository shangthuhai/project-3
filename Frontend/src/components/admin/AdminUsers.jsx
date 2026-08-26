import React from 'react';

export default function AdminUsers({
  adminUsers,
  setSelectedUserForQuota,
  setNewQuotaValue,
  setShowQuotaModal,
  handleToggleUserStatus
}) {
  return (
    <div className="admin-tab-content">
      <div className="admin-header" style={{ marginBottom: '25px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '600', color: '#fff', marginBottom: '6px' }}>User Accounts Management</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>Block/unlock user accounts, verify verification records, and configure free message quotas.</p>
      </div>

      <div className="admin-table-container" style={{ background: 'var(--bg-sidebar)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflowX: 'auto' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Avatar</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Username</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Full Name</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Mobile</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Email</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>SMS Quota Left</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {adminUsers.map(user => {
              const quotaVal = user.quota?.freeMessagesLeft !== undefined ? user.quota.freeMessagesLeft : 5;
              return (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'var(--transition-fast)' }} className="table-row-hover">
                  <td style={{ padding: '12px 20px' }}>
                    <img src={user.profilePhoto || 'https://via.placeholder.com/38'} alt={user.name} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
                  </td>
                  <td style={{ padding: '12px 20px', color: '#fff' }}><strong>{user.username}</strong></td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-main)' }}>{user.name || 'N/A'}</td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-main)' }}><code>{user.mobileNumber}</code></td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{user.email}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <span className="admin-badge-quota" style={{ background: 'rgba(36, 129, 204, 0.15)', color: 'var(--color-primary)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' }}>{quotaVal} SMS</span>
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <span className={`status-tag ${user.isActive ? 'active' : 'inactive'}`} style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', background: user.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: user.isActive ? 'var(--color-accent)' : 'var(--color-danger)' }}>
                      {user.isActive ? 'ACTIVE' : 'LOCKED'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <div className="admin-actions-cell" style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setSelectedUserForQuota(user);
                          setNewQuotaValue(quotaVal);
                          setShowQuotaModal(true);
                        }}
                        style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#1a2432', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        ⚙️ Quota
                      </button>
                      <button
                        className={`btn ${user.isActive ? 'btn-danger' : 'btn-accent'}`}
                        onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                        style={{ padding: '6px 12px', fontSize: '0.78rem', minWidth: '75px', background: user.isActive ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)', border: '1px solid ' + (user.isActive ? 'var(--color-danger)' : 'var(--color-accent)'), color: user.isActive ? 'var(--color-danger)' : 'var(--color-accent)' }}
                      >
                        {user.isActive ? '🔒 Lock' : '🔓 Unlock'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
