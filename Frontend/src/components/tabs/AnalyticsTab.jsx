import React from 'react';
import { useChat } from '../../context/ChatContext';
import styles from './AnalyticsTab.module.css';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

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

      <div className={cx('analytics__grid')}>
        <div className={cx('analytics__card')}>
          <div className={cx('analytics__card-icon', 'analytics__card-icon--sent')}>💬</div>
          <div className={cx('analytics__card-content')}>
            <h4 className={cx('analytics__card-label')}>Tổng tin nhắn gửi</h4>
            <p className={cx('analytics__card-value')}>{analyticsStats.totalSent}</p>
          </div>
        </div>
        <div className={cx('analytics__card')}>
          <div className={cx('analytics__card-icon', 'analytics__card-icon--success')}>✓</div>
          <div className={cx('analytics__card-content')}>
            <h4 className={cx('analytics__card-label')}>Gửi Thành công</h4>
            <p className={cx('analytics__card-value')}>{analyticsStats.deliveredCount}</p>
          </div>
        </div>
        <div className={cx('analytics__card')}>
          <div className={cx('analytics__card-icon', 'analytics__card-icon--failed')}>✗</div>
          <div className={cx('analytics__card-content')}>
            <h4 className={cx('analytics__card-label')}>Gửi thất bại</h4>
            <p className={cx('analytics__card-value')}>{analyticsStats.failedCount}</p>
          </div>
        </div>
        <div className={cx('analytics__card')}>
          <div className={cx('analytics__card-icon', 'analytics__card-icon--pending')}>⏰</div>
          <div className={cx('analytics__card-content')}>
            <h4 className={cx('analytics__card-label')}>Chờ gửi (Hẹn giờ)</h4>
            <p className={cx('analytics__card-value')}>{analyticsStats.pendingCount}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '25px' }}>
        <div className={cx('analytics__chart-panel')}>
          <h3 className={cx('analytics__chart-title')}>Lưu lượng gửi tin nhắn (7 ngày qua)</h3>

          <div className={cx('analytics__chart-container')}>
            {analyticsStats.dailyStats.map((item, idx) => {
              const maxVal = Math.max(...analyticsStats.dailyStats.map(d => d.count), 1);
              const heightPercent = Math.min((item.count / maxVal) * 100, 100);
              const shortDate = item.date.substring(5);

              return (
                <div key={idx} className={cx('analytics__chart-bar-column')}>
                  <div
                    className={cx('analytics__chart-bar')}
                    style={{ height: `${heightPercent}%` }}
                  >
                    <div className={cx('analytics__chart-bar-tooltip')}>{item.count} SMS</div>
                  </div>
                  <div className={cx('analytics__chart-axis-label')}>{shortDate}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={cx('analytics__quota-card')}>
          <div className={cx('analytics__quota-header')}>
            <span>Hạn mức gửi tin miễn phí còn lại (Người lạ)</span>
            <span style={{ fontWeight: 'bold' }}>{analyticsStats.freeLeft} / 5 tin</span>
          </div>
          <div className={cx('analytics__quota-progress-bg')}>
            <div
              className={cx('analytics__quota-progress-fill', {
                'analytics__quota-progress-fill--danger': analyticsStats.freeLeft <= 1,
                'analytics__quota-progress-fill--warning': analyticsStats.freeLeft > 1 && analyticsStats.freeLeft <= 3
              })}
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
