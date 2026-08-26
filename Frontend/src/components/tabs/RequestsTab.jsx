import React from 'react';
import { useChat } from '../../context/ChatContext';
import styles from './RequestsTab.module.css';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

export default function RequestsTab() {
  const {
    pendingRequests,
    requestForm,
    setRequestForm,
    handleSendRequestSubmit,
    handleRespondRequest
  } = useChat();

  return (
    <div className="view-panel">
      <div className="view-header">
        <h1>Friend Requests</h1>
        <p>Add friends by email to unlock unlimited free SMS messaging.</p>
      </div>

      <div className={cx('requests-tab__grid')}>
        <div className={cx('requests-tab__card')} style={{ height: 'fit-content' }}>
          <h3 style={{ marginBottom: '15px', color: 'var(--color-primary-hover)' }}>Send Friend Request</h3>
          <form onSubmit={handleSendRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="form-group">
              <label>Friend's Email Address</label>
              <input
                type="email"
                placeholder="e.g. bob@example.com"
                value={requestForm.email}
                onChange={(e) => setRequestForm({ email: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">Send Request</button>
          </form>
        </div>

        <div className={cx('requests-tab__card')}>
          <h3 style={{ marginBottom: '15px', color: 'var(--color-primary-hover)' }}>
            Pending Requests ({pendingRequests.length})
          </h3>
          {pendingRequests.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No pending incoming friend requests.</p>
          ) : (
            pendingRequests.map(req => (
              <div key={req.connectionId} className={cx('requests-tab__item')}>
                <img src={req.senderPhoto || 'https://via.placeholder.com/40'} alt={req.senderName} className={cx('requests-tab__avatar')} />
                <div className={cx('requests-tab__info')}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{req.senderName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.senderEmail} ({req.senderMobile})</div>
                </div>
                <div className={cx('requests-tab__actions')}>
                  <button className={cx('requests-tab__btn', 'requests-tab__btn--accept')} onClick={() => handleRespondRequest(req.connectionId, true)}>
                    Accept
                  </button>
                  <button className={cx('requests-tab__btn', 'requests-tab__btn--reject')} onClick={() => handleRespondRequest(req.connectionId, false)}>
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
