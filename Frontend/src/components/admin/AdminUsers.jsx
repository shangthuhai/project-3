import React, { useState, useMemo } from 'react';

export default function AdminUsers({
  adminUsers,
  setSelectedUserForQuota,
  setNewQuotaValue,
  setShowQuotaModal,
  handleToggleUserStatus
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [quotaFilter, setQuotaFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const filteredUsers = useMemo(() => {
    let result = [...adminUsers];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(u =>
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.mobileNumber && u.mobileNumber.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
      );
    }

    // Filter by account status
    if (statusFilter === 'active') {
      result = result.filter(u => u.isActive);
    } else if (statusFilter === 'locked') {
      result = result.filter(u => !u.isActive);
    }

    // Filter by SMS quota
    if (quotaFilter === 'hasQuota') {
      result = result.filter(u => (u.quota?.freeMessagesLeft ?? 5) > 0);
    } else if (quotaFilter === 'zeroQuota') {
      result = result.filter(u => (u.quota?.freeMessagesLeft ?? 5) === 0);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'oldest') return a.id - b.id;
      if (sortBy === 'username') return a.username.localeCompare(b.username);
      if (sortBy === 'quotaDesc') {
        const qA = a.quota?.freeMessagesLeft ?? 5;
        const qB = b.quota?.freeMessagesLeft ?? 5;
        return qB - qA;
      }
      if (sortBy === 'quotaAsc') {
        const qA = a.quota?.freeMessagesLeft ?? 5;
        const qB = b.quota?.freeMessagesLeft ?? 5;
        return qA - qB;
      }
      return b.id - a.id;
    });

    return result;
  }, [adminUsers, searchQuery, statusFilter, quotaFilter, sortBy]);

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all' || quotaFilter !== 'all' || sortBy !== 'newest';

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setQuotaFilter('all');
    setSortBy('newest');
  };

  return (
    <div className="admin-tab-content">
      <div className="admin-header" style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '6px' }}>User Accounts Management</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>Block/unlock user accounts, verify verification records, and configure free message quotas.</p>
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
          <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
            <input
              type="text"
              placeholder="Search username, name, mobile, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                paddingRight: searchQuery ? '32px' : '12px',
                background: 'var(--bg-app)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                fontSize: '0.88rem',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
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

          {/* Account Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              background: '#182533',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              color: statusFilter !== 'all' ? 'var(--color-primary)' : 'var(--text-muted)',
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="locked">Locked Only</option>
          </select>

          {/* Quota Filter */}
          <select
            value={quotaFilter}
            onChange={(e) => setQuotaFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              background: '#182533',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              color: quotaFilter !== 'all' ? 'var(--color-primary)' : 'var(--text-muted)',
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Quota Levels</option>
            <option value="hasQuota">Has SMS Quota</option>
            <option value="zeroQuota">Zero SMS Quota</option>
          </select>

          {/* Sort Select */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '9px 12px',
              background: '#182533',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="username">Username (A-Z)</option>
            <option value="quotaDesc">Quota (High to Low)</option>
            <option value="quotaAsc">Quota (Low to High)</option>
          </select>
        </div>

        {/* Filter Stats & Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{filteredUsers.length}</strong> / <strong>{adminUsers.length}</strong> users
          </span>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
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

      {/* Table */}
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
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No users found matching your filter criteria.
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => {
                const quotaVal = user.quota?.freeMessagesLeft !== undefined ? user.quota.freeMessagesLeft : 5;
                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'var(--transition-fast)' }} className="table-row-hover">
                    <td style={{ padding: '12px 20px' }}>
                      <img src={user.profilePhoto || 'https://via.placeholder.com/38'} alt={user.name} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
                    </td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-main)' }}><strong>{user.username}</strong></td>
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
                          style={{ padding: '6px 12px', fontSize: '0.78rem', background: 'var(--bg-app)', color: 'var(--text-main)', border: '1px solid var(--border-light)' }}
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
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
