import React from 'react';
import { MessageSquare, Check, X, Clock, BarChart3 } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useLanguage } from '../../context/LanguageContext';
import styles from './AnalyticsTab.module.css';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

export default function AnalyticsTab() {
  const { analyticsStats } = useChat();
  const { language, t } = useLanguage();

  if (!analyticsStats) {
    return (
      <div className="view-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <BarChart3 size={20} />
        <span>{language === 'en' ? 'Loading analytics statistics...' : 'Đang tải thống kê dữ liệu...'}</span>
      </div>
    );
  }

  return (
    <div className="view-panel">
      <div className="view-header">
        <h1>{t('analytics_dashboard')}</h1>
        <p>{t('analytics_desc')}</p>
      </div>

      <div className={cx('analytics__grid')}>
        <div className={cx('analytics__card')}>
          <div className={cx('analytics__card-icon', 'analytics__card-icon--sent')}><MessageSquare size={18} /></div>
          <div className={cx('analytics__card-content')}>
            <h4 className={cx('analytics__card-label')}>{language === 'en' ? 'Total Sent' : 'Tổng tin nhắn gửi'}</h4>
            <p className={cx('analytics__card-value')}>{analyticsStats.totalSent}</p>
          </div>
        </div>
        <div className={cx('analytics__card')}>
          <div className={cx('analytics__card-icon', 'analytics__card-icon--success')}><Check size={18} /></div>
          <div className={cx('analytics__card-content')}>
            <h4 className={cx('analytics__card-label')}>{language === 'en' ? 'Delivered' : 'Gửi Thành công'}</h4>
            <p className={cx('analytics__card-value')}>{analyticsStats.deliveredCount}</p>
          </div>
        </div>
        <div className={cx('analytics__card')}>
          <div className={cx('analytics__card-icon', 'analytics__card-icon--failed')}><X size={18} /></div>
          <div className={cx('analytics__card-content')}>
            <h4 className={cx('analytics__card-label')}>{language === 'en' ? 'Failed' : 'Gửi thất bại'}</h4>
            <p className={cx('analytics__card-value')}>{analyticsStats.failedCount}</p>
          </div>
        </div>
        <div className={cx('analytics__card')}>
          <div className={cx('analytics__card-icon', 'analytics__card-icon--pending')}><Clock size={18} /></div>
          <div className={cx('analytics__card-content')}>
            <h4 className={cx('analytics__card-label')}>{language === 'en' ? 'Pending' : 'Chờ gửi (Hẹn giờ)'}</h4>
            <p className={cx('analytics__card-value')}>{analyticsStats.pendingCount}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '25px' }}>
        <div className={cx('analytics__chart-panel')}>
          <h3 className={cx('analytics__chart-title')}>
            {language === 'en' ? 'Message Volume (Last 7 Days)' : 'Lưu lượng gửi tin nhắn (7 ngày qua)'}
          </h3>

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
            <span>{language === 'en' ? 'Remaining Free SMS Quota (Strangers)' : 'Hạn mức gửi tin miễn phí còn lại (Người lạ)'}</span>
            <span style={{ fontWeight: 'bold' }}>{analyticsStats.freeLeft} / 5 {language === 'en' ? 'SMS' : 'tin'}</span>
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
            {language === 'en' 
              ? '* A limit of 5 free messages applies when sending messages to each stranger\'s number (not in your friend list). Add them as a friend to get unlimited free chat!'
              : '* Hạn mức 5 tin nhắn miễn phí áp dụng khi gửi tin tới mỗi số điện thoại người lạ (chưa nằm trong danh sách bạn bè). Thêm họ làm bạn bè để được nhắn tin miễn phí vô hạn!'}
          </p>
        </div>
      </div>
    </div>
  );
}
