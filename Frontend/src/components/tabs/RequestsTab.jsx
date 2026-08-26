import React from 'react';
import { useChat } from '../../context/ChatContext';

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

      <div className="requests-grid">
        <div className="pending-requests-card" style={{ height: 'fit-content' }}>
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

        <div className="pending-requests-card">
          <h3 style={{ marginBottom: '15px', color: 'var(--color-primary-hover)' }}>
            Pending Requests ({pendingRequests.length})
          </h3>
          {pendingRequests.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No pending incoming friend requests.</p>
          ) : (
            pendingRequests.map(req => (
              <div key={req.connectionId} className="pending-request-item">
                <img src={req.senderPhoto || 'https://via.placeholder.com/40'} alt={req.senderName} />
                <div className="pending-request-info">
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{req.senderName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.senderEmail} ({req.senderMobile})</div>
                </div>
                <div className="pending-request-actions">
                  <button className="request-btn accept" onClick={() => handleRespondRequest(req.connectionId, true)}>
                    Accept
                  </button>
                  <button className="request-btn reject" onClick={() => handleRespondRequest(req.connectionId, false)}>
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
