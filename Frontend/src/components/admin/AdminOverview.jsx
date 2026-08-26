import React from 'react';

export default function AdminOverview({ adminStats }) {
  if (!adminStats) {
    return (
      <div className="admin-loading" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        📊 Loading system analytics...
      </div>
    );
  }

  return (
    <div className="admin-tab-content">
      <div className="admin-header" style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '600', color: '#fff', marginBottom: '6px' }}>System Dashboard Overview</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>Monitor real-time system stats, registered users, gateways, and platform revenue.</p>
      </div>

      {/* Metric Cards Grid */}
      <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="admin-stat-card" style={{ background: 'var(--bg-sidebar)', padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="stat-icon" style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(36, 129, 204, 0.15)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>👥</div>
          <div className="stat-details" style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="stat-value" style={{ fontSize: '1.75rem', fontWeight: '700', color: '#fff', lineHeight: '1.2' }}>{adminStats.totalUsers}</span>
            <span className="stat-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Registered Users</span>
          </div>
        </div>

        <div className="admin-stat-card" style={{ background: 'var(--bg-sidebar)', padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="stat-icon" style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>💬</div>
          <div className="stat-details" style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="stat-value" style={{ fontSize: '1.75rem', fontWeight: '700', color: '#fff', lineHeight: '1.2' }}>{adminStats.totalMessages}</span>
            <span className="stat-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>SMS Sent (Standard)</span>
          </div>
        </div>

        <div className="admin-stat-card" style={{ background: 'var(--bg-sidebar)', padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="stat-icon" style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>💰</div>
          <div className="stat-details" style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="stat-value" style={{ fontSize: '1.75rem', fontWeight: '700', color: '#fff', lineHeight: '1.2' }}>${adminStats.totalRevenue.toFixed(2)}</span>
            <span className="stat-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Gross Revenue</span>
          </div>
        </div>

        <div className="admin-stat-card" style={{ background: 'var(--bg-sidebar)', padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="stat-icon" style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>🔔</div>
          <div className="stat-details" style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="stat-value" style={{ fontSize: '1.75rem', fontWeight: '700', color: '#fff', lineHeight: '1.2' }}>{adminStats.activeServicesCount}</span>
            <span className="stat-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Paid Subscriptions</span>
          </div>
        </div>

        <div className="admin-stat-card" style={{ background: 'var(--bg-sidebar)', padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="stat-icon" style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>🤖</div>
          <div className="stat-details" style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="stat-value" style={{ fontSize: '1.75rem', fontWeight: '700', color: '#fff', lineHeight: '1.2' }}>{adminStats.aiInteractionsCount}</span>
            <span className="stat-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>AI Assist Count</span>
          </div>
        </div>
      </div>

      {/* Message Status breakdown & Chart area */}
      <div className="admin-charts-section" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '30px' }}>
        <div className="admin-chart-card" style={{ flex: '1', minWidth: '300px', background: 'var(--bg-sidebar)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px', color: '#fff' }}>SMS Gateway Delivery Ratios</h3>
          <div className="delivery-status-bars" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="status-bar-item">
              <div className="status-header" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px', color: 'var(--text-main)' }}>
                <span>Delivered / Sent</span>
                <strong>{adminStats.deliveredCount} ({((adminStats.deliveredCount / (adminStats.totalMessages || 1)) * 100).toFixed(0)}%)</strong>
              </div>
              <div className="status-progress-track" style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div className="status-progress-bar success" style={{ height: '100%', background: 'var(--color-accent)', width: `${(adminStats.deliveredCount / (adminStats.totalMessages || 1)) * 100}%` }}></div>
              </div>
            </div>

            <div className="status-bar-item">
              <div className="status-header" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px', color: 'var(--text-main)' }}>
                <span>Queued / Pending</span>
                <strong>{adminStats.pendingCount} ({((adminStats.pendingCount / (adminStats.totalMessages || 1)) * 100).toFixed(0)}%)</strong>
              </div>
              <div className="status-progress-track" style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div className="status-progress-bar warning" style={{ height: '100%', background: 'var(--color-warning)', width: `${(adminStats.pendingCount / (adminStats.totalMessages || 1)) * 100}%` }}></div>
              </div>
            </div>

            <div className="status-bar-item">
              <div className="status-header" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px', color: 'var(--text-main)' }}>
                <span>Failed / Flagged</span>
                <strong>{adminStats.failedCount} ({((adminStats.failedCount / (adminStats.totalMessages || 1)) * 100).toFixed(0)}%)</strong>
              </div>
              <div className="status-progress-track" style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div className="status-progress-bar danger" style={{ height: '100%', background: 'var(--color-danger)', width: `${(adminStats.failedCount / (adminStats.totalMessages || 1)) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-chart-card flex-2" style={{ flex: '2', minWidth: '400px', background: 'var(--bg-sidebar)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px', color: '#fff' }}>Sms Traffic Load (Last 7 Days)</h3>
          <div className="admin-bar-chart" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '180px', paddingTop: '20px', paddingBottom: '10px' }}>
            {adminStats.dailyStats && adminStats.dailyStats.map((day, idx) => {
              const maxVal = Math.max(...adminStats.dailyStats.map(d => d.count), 1);
              const heightPct = (day.count / maxVal) * 100;
              const dateObj = new Date(day.date);
              const dayLabel = dateObj.getDate() + '/' + (dateObj.getMonth() + 1);

              return (
                <div className="chart-bar-col" key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1', height: '100%' }}>
                  <div className="chart-bar-val" style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: '600', marginBottom: '6px' }}>{day.count}</div>
                  <div className="chart-bar-pillar-container" style={{ width: '24px', flex: '1', display: 'flex', alignItems: 'flex-end', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div className="chart-bar-pillar" style={{ width: '100%', background: 'linear-gradient(to top, var(--color-primary), var(--color-primary-hover))', height: `${heightPct}%`, borderRadius: '4px', transition: 'height 0.5s ease', boxShadow: '0 0 10px rgba(36, 129, 204, 0.3)' }}></div>
                  </div>
                  <div className="chart-bar-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>{dayLabel}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
