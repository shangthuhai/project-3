import React from 'react';

export default function AdminTransactions({ adminTransactions }) {
  return (
    <div className="admin-tab-content">
      <div className="admin-header" style={{ marginBottom: '25px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '600', color: '#fff', marginBottom: '6px' }}>Payment & Subscription Ledger</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>Monitor payment transactions generated from subscribers activating premium Value-Added Services (VAS).</p>
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
            {adminTransactions.map(t => {
              return (
                <tr key={t.transactionId} style={{ borderBottom: '1px solid var(--border-light)' }} className="table-row-hover">
                  <td style={{ padding: '12px 20px', color: 'var(--text-muted)' }}>#{t.transactionId}</td>
                  <td style={{ padding: '12px 20px', color: '#fff' }}><strong>{t.username}</strong></td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-main)' }}>{t.userFullName}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <span className="service-tag" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#a78bfa', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '500' }}>{t.serviceName}</span>
                  </td>
                  <td style={{ padding: '12px 20px', color: 'var(--color-accent)', fontSize: '0.95rem', fontWeight: '700' }}>${t.amount.toFixed(2)}</td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>💳 **** **** **** {t.cardLast4}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <span className="status-tag active" style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-accent)' }}>SUCCESS</span>
                  </td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>{new Date(t.createdAt).toLocaleString('vi-VN')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
