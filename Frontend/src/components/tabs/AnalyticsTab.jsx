import React from 'react';
import { useChat } from '../../context/ChatContext';

export default function AnalyticsTab() {
  const { analyticsStats } = useChat();

  if (!analyticsStats) {
    return (
      <div className="view-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        📊 Loading analytics statistics...
      </div>
    );
  }

  return (
    <div className="view-panel">
      <div className="view-header">
        <h1>Thống kê & Báo cáo trạng thái</h1>
        <p>Theo dõi hiệu suất gửi tin nhắn, tỷ lệ thành công và kiểm soát hạn mức quota của bạn.</p>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="analytics-card-icon sent">💬</div>
          <div className="analytics-card-content">
            <h4>Tổng tin nhắn gửi</h4>
            <p>{analyticsStats.totalSent}</p>
          </div>
        </div>
        <div className="analytics-card">
          <div className="analytics-card-icon success">✓</div>
          <div className="analytics-card-content">
            <h4>Gửi Thành công</h4>
            <p>{analyticsStats.deliveredCount}</p>
          </div>
        </div>
        <div className="analytics-card">
          <div className="analytics-card-icon failed">✗</div>
          <div className="analytics-card-content">
            <h4>Gửi thất bại</h4>
            <p>{analyticsStats.failedCount}</p>
          </div>
        </div>
        <div className="analytics-card">
          <div className="analytics-card-icon pending">⏰</div>
          <div className="analytics-card-content">
            <h4>Chờ gửi (Hẹn giờ)</h4>
            <p>{analyticsStats.pendingCount}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '25px' }}>
        <div className="analytics-chart-panel">
          <h3 className="analytics-chart-title">Lưu lượng gửi tin nhắn (7 ngày qua)</h3>

          <div className="custom-chart-container">
            {analyticsStats.dailyStats.map((item, idx) => {
              const maxVal = Math.max(...analyticsStats.dailyStats.map(d => d.count), 1);
              const heightPercent = Math.min((item.count / maxVal) * 100, 100);
              const shortDate = item.date.substring(5);

              return (
                <div key={idx} className="chart-bar-column">
                  <div
                    className="chart-bar-body"
                    style={{ height: `${heightPercent}%` }}
                  >
                    <div className="chart-bar-tooltip">{item.count} SMS</div>
                  </div>
                  <div className="chart-axis-label">{shortDate}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="quota-gauge-card">
          <div className="quota-gauge-header">
            <span>Hạn mức gửi tin miễn phí còn lại (Người lạ)</span>
            <span style={{ fontWeight: 'bold' }}>{analyticsStats.freeLeft} / 5 tin</span>
          </div>
          <div className="quota-gauge-progress-bg">
            <div
              className={`quota-gauge-progress-fill ${analyticsStats.freeLeft <= 1 ? 'danger' : analyticsStats.freeLeft <= 3 ? 'warning' : ''}`}
              style={{ width: `${(analyticsStats.freeLeft / 5) * 100}%` }}
            />
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            * Hạn mức 5 tin nhắn miễn phí áp dụng khi gửi tin tới mỗi số điện thoại người lạ (chưa nằm trong danh sách bạn bè). Thêm họ làm bạn bè để được nhắn tin miễn phí vô hạn!
          </p>
        </div>
      </div>
    </div>
  );
}
