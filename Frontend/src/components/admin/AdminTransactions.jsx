import React, { useState, useMemo } from 'react';

export default function AdminTransactions({ adminTransactions }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Extract unique service names for the service filter dropdown
  const uniqueServices = useMemo(() => {
    const services = new Set(adminTransactions.map(t => t.serviceName).filter(Boolean));
    return Array.from(services);
  }, [adminTransactions]);

  const filteredTransactions = useMemo(() => {
    let result = [...adminTransactions];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(t =>
        (t.transactionId && t.transactionId.toString().includes(q)) ||
        (t.username && t.username.toLowerCase().includes(q)) ||
        (t.userFullName && t.userFullName.toLowerCase().includes(q)) ||
        (t.serviceName && t.serviceName.toLowerCase().includes(q)) ||
        (t.cardLast4 && t.cardLast4.includes(q))
      );
    }

    // Filter by service
    if (serviceFilter !== 'all') {
      result = result.filter(t => t.serviceName === serviceFilter);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(t => (t.transactionStatus || 'success').toLowerCase() === statusFilter.toLowerCase());
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'amountDesc') return b.amount - a.amount;
      if (sortBy === 'amountAsc') return a.amount - b.amount;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return result;
  }, [adminTransactions, searchQuery, serviceFilter, statusFilter, sortBy]);

  const hasActiveFilters = searchQuery !== '' || serviceFilter !== 'all' || statusFilter !== 'all' || sortBy !== 'newest';

  const resetFilters = () => {
    setSearchQuery('');
    setServiceFilter('all');
    setStatusFilter('all');
    setSortBy('newest');
  };

  return (
    <div className="admin-tab-content">
      <div className="admin-header" style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '6px' }}>Payment & Subscription Ledger</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>Monitor payment transactions generated from subscribers activating premium Value-Added Services (VAS).</p>
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
              placeholder="🔍 Search ID, username, full name, service, card last 4..."
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

          {/* Service Name Filter */}
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              background: '#182533',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              color: serviceFilter !== 'all' ? 'var(--color-primary)' : 'var(--text-muted)',
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            <option value="all">💳 All Services</option>
            {uniqueServices.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Status Filter */}
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
            <option value="all">⚡ All Statuses</option>
            <option value="success">🟢 Success</option>
            <option value="failed">🔴 Failed</option>
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
            <option value="newest">📅 Date (Newest First)</option>
            <option value="oldest">📅 Date (Oldest First)</option>
            <option value="amountDesc">💵 Amount (High to Low)</option>
            <option value="amountAsc">💵 Amount (Low to High)</option>
          </select>
        </div>

        {/* Filter Stats & Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{filteredTransactions.length}</strong> / <strong>{adminTransactions.length}</strong> transactions
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

      <div className="admin-table-container" style={{ background: 'var(--bg-sidebar)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflowX: 'auto' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Transaction ID</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Username</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>User Full Name</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Service Subscribed</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Price</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Card Details</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Transaction Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No transaction records found matching your filter criteria.
                </td>
              </tr>
            ) : (
              filteredTransactions.map(t => {
                const statusStr = (t.transactionStatus || 'success').toUpperCase();
                const isSuccess = statusStr === 'SUCCESS';
                return (
                  <tr key={t.transactionId} style={{ borderBottom: '1px solid var(--border-light)' }} className="table-row-hover">
                    <td style={{ padding: '12px 20px', color: 'var(--text-muted)' }}>#{t.transactionId}</td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-main)' }}><strong>{t.username}</strong></td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-main)' }}>{t.userFullName}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span className="service-tag" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#a78bfa', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '500' }}>{t.serviceName}</span>
                    </td>
                    <td style={{ padding: '12px 20px', color: 'var(--color-accent)', fontSize: '0.95rem', fontWeight: '700' }}>${t.amount.toFixed(2)}</td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>💳 **** **** **** {t.cardLast4}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span className="status-tag active" style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', background: isSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: isSuccess ? 'var(--color-accent)' : 'var(--color-danger)' }}>{statusStr}</span>
                    </td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>{new Date(t.createdAt).toLocaleString('vi-VN')}</td>
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
