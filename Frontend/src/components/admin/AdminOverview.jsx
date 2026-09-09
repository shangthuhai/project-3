import React, { useState } from 'react';

export default function AdminOverview({ adminStats, onSeedData, onCreateFriends, onCreateStrangers }) {
  const [seeding, setSeeding] = useState(false);
  const [creatingFriends, setCreatingFriends] = useState(false);
  const [creatingStrangers, setCreatingStrangers] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');

  if (!adminStats) {
    return (
      <div className="admin-loading" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        📊 Loading system analytics...
      </div>
    );
  }

  const handleRunSeeder = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn khởi tạo dữ liệu mẫu 15 ngày liên tiếp (~7.500 - 15.000 bản ghi)?')) return;
    setSeeding(true);
    setSeedMsg('');
    try {
      if (onSeedData) {
        const res = await onSeedData();
        setSeedMsg(`✅ ${res.message || 'Đã tạo xong dữ liệu mẫu!'}`);
      }
    } catch (err) {
      setSeedMsg('❌ Không thể khởi tạo dữ liệu mẫu.');
    } finally {
      setSeeding(false);
    }
  };

  const handleCreateFriends = async () => {
    setCreatingFriends(true);
    setSeedMsg('');
    try {
      if (onCreateFriends) {
        const res = await onCreateFriends();
        setSeedMsg(`✅ ${res.message || 'Đã tạo 5 tài khoản và tự động kết bạn!'}`);
      }
    } catch (err) {
      setSeedMsg('❌ Không thể tạo tài khoản bạn bè.');
    } finally {
      setCreatingFriends(false);
    }
  };

  const handleCreateStrangers = async () => {
    setCreatingStrangers(true);
    setSeedMsg('');
    try {
      if (onCreateStrangers) {
        const res = await onCreateStrangers();
        setSeedMsg(`✅ ${res.message || 'Đã tạo 5 tài khoản người lạ!'}`);
      }
    } catch (err) {
      setSeedMsg('❌ Không thể tạo tài khoản người lạ.');
    } finally {
      setCreatingStrangers(false);
    }
  };

  return (
    <div className="admin-tab-content">
      {/* Header & Quick Action Bar */}
      <div className="admin-header" style={{ marginBottom: '24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '6px' }}>
            System Dashboard Overview (15 Days Analytics)
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Theo dõi thống kê thời gian thực, lưu lượng tin nhắn 15 ngày liên tiếp, tỷ lệ kiểm duyệt AI và doanh thu.
          </p>
        </div>

        <div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end' }}>
            <button
              onClick={handleCreateFriends}
              disabled={creatingFriends}
              style={{
                padding: '10px 16px',
                background: creatingFriends ? '#4b5563' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: creatingFriends ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {creatingFriends ? '⏳ Đang tạo...' : '👥+ Tạo 5 User Tự Động Kết Bạn'}
            </button>

            <button
              onClick={handleCreateStrangers}
              disabled={creatingStrangers}
              style={{
                padding: '10px 16px',
                background: creatingStrangers ? '#4b5563' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: creatingStrangers ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {creatingStrangers ? '⏳ Đang tạo...' : '👤+ Tạo 5 User Người Lạ (Chưa Kết Bạn)'}
            </button>

            <button
              onClick={handleRunSeeder}
              disabled={seeding}
              style={{
                padding: '10px 20px',
                background: seeding ? '#4b5563' : 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: seeding ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {seeding ? '⏳ Đang khởi tạo...' : '🚀 Khởi Tạo Dữ Liệu SMS 15 Ngày'}
            </button>
          </div>
          {seedMsg && <div style={{ fontSize: '0.85rem', color: '#10b981', marginTop: '6px', textAlign: 'right' }}>{seedMsg}</div>}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="admin-stat-card" style={{ background: 'var(--bg-sidebar)', padding: '20px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="stat-icon" style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(36, 129, 204, 0.15)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>👥</div>
          <div className="stat-details">
            <span className="stat-value" style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)' }}>{adminStats.totalUsers}</span>
            <span className="stat-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Registered Users</span>
          </div>
        </div>

        <div className="admin-stat-card" style={{ background: 'var(--bg-sidebar)', padding: '20px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="stat-icon" style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>💬</div>
          <div className="stat-details">
            <span className="stat-value" style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)' }}>{adminStats.totalMessages}</span>
            <span className="stat-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SMS Sent (Total)</span>
          </div>
        </div>

        <div className="admin-stat-card" style={{ background: 'var(--bg-sidebar)', padding: '20px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="stat-icon" style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>💰</div>
          <div className="stat-details">
            <span className="stat-value" style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)' }}>${(adminStats.totalRevenue || 0).toFixed(2)}</span>
            <span className="stat-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Gross Revenue</span>
          </div>
        </div>

        <div className="admin-stat-card" style={{ background: 'var(--bg-sidebar)', padding: '20px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="stat-icon" style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>⚠️</div>
          <div className="stat-details">
            <span className="stat-value" style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)' }}>{adminStats.totalSpamDetected || 0}</span>
            <span className="stat-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Repetitive Spam</span>
          </div>
        </div>

        <div className="admin-stat-card" style={{ background: 'var(--bg-sidebar)', padding: '20px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="stat-icon" style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🏷️</div>
          <div className="stat-details">
            <span className="stat-value" style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)' }}>{adminStats.totalKeywordFlags || 0}</span>
            <span className="stat-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Keyword Flags</span>
          </div>
        </div>
      </div>

      {/* Message Status breakdown & 15-Day Timeline Chart */}
      <div className="admin-charts-section" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '30px' }}>
        {/* Delivery Ratio */}
        <div className="admin-chart-card" style={{ flex: '1', minWidth: '280px', background: 'var(--bg-sidebar)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px', color: 'var(--text-main)' }}>SMS Gateway Delivery Ratios</h3>
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
                <span>Failed / Blocked</span>
                <strong>{adminStats.failedCount} ({((adminStats.failedCount / (adminStats.totalMessages || 1)) * 100).toFixed(0)}%)</strong>
              </div>
              <div className="status-progress-track" style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div className="status-progress-bar danger" style={{ height: '100%', background: 'var(--color-danger)', width: `${(adminStats.failedCount / (adminStats.totalMessages || 1)) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* 15-Day Chart */}
        <div className="admin-chart-card flex-2" style={{ flex: '2', minWidth: '400px', background: 'var(--bg-sidebar)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-main)' }}>SMS Traffic & Spam Load (15 Days Timeline)</h3>
            <div style={{ fontSize: '0.78rem', display: 'flex', gap: '12px' }}>
              <span style={{ color: 'var(--color-primary)' }}>■ Normal SMS</span>
              <span style={{ color: '#ef4444' }}>■ Spam/Flagged</span>
            </div>
          </div>

          <div className="admin-bar-chart" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '200px', paddingTop: '20px', paddingBottom: '10px', gap: '6px' }}>
            {adminStats.dailyStats && adminStats.dailyStats.map((day, idx) => {
              const maxVal = Math.max(...adminStats.dailyStats.map(d => d.count), 1);
              const heightPct = (day.count / maxVal) * 100;
              const dateObj = new Date(day.date);
              const dayLabel = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;

              return (
                <div className="chart-bar-col" key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1', height: '100%' }}>
                  <div className="chart-bar-val" style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: '600', marginBottom: '4px' }}>{day.count}</div>
                  <div className="chart-bar-pillar-container" style={{ width: '100%', flex: '1', display: 'flex', alignItems: 'flex-end', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div className="chart-bar-pillar" style={{ width: '100%', background: 'linear-gradient(to top, #3b82f6, #60a5fa)', height: `${heightPct}%`, borderRadius: '4px', transition: 'height 0.5s ease', boxShadow: '0 0 8px rgba(59, 130, 246, 0.3)' }}></div>
                  </div>
                  <div className="chart-bar-label" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>{dayLabel}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
