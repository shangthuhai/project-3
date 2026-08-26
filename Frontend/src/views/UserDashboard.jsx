import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import Sidebar from '../components/chat/Sidebar';
import ChatWindow from '../components/chat/ChatWindow';
import UserAiChat from '../components/chat/UserAiChat';
import RequestsTab from '../components/tabs/RequestsTab';
import ServicesTab from '../components/tabs/ServicesTab';
import ProfileTab from '../components/tabs/ProfileTab';
import TemplatesTab from '../components/tabs/TemplatesTab';
import GroupsTab from '../components/tabs/GroupsTab';
import AnalyticsTab from '../components/tabs/AnalyticsTab';
import SecurityTab from '../components/tabs/SecurityTab';

export default function UserDashboard() {
  const { loggedInUser } = useAuth();
  const {
    activeTab,
    selectedContact,
    showAddContactModal,
    setShowAddContactModal,
    showPaymentModal,
    setShowPaymentModal,
    contactForm,
    setContactForm,
    handleAddContactSubmit,
    paymentForm,
    setPaymentForm,
    showPaymentOtpField,
    paymentOtpCode,
    setPaymentOtpCode,
    handlePaymentSubmit,
    selectedServices
  } = useChat();

  const getServicePrice = (name) => {
    const prices = { 'Joke': 2.99, 'Current Affairs': 4.99, 'Sports': 3.99, 'News': 4.99 };
    return prices[name] || 0;
  };

  const getTotalSelectedPrice = () => {
    return selectedServices.reduce((sum, service) => sum + getServicePrice(service), 0).toFixed(2);
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Panel Content Router */}
      <div className="main-workspace">
        {/* Private Views */}
        {activeTab === 'chats' && selectedContact ? (
          /* CHAT AREA VIEW */
          <ChatWindow />
        ) : activeTab === 'chats' ? (
          <div className="workspace-placeholder">
            <div className="placeholder-icon">💬</div>
            <h3>Welcome to SMS Chat System</h3>
            <p>Select a chat from the sidebar or go to the Contacts tab to start a new thread.</p>
          </div>
        ) : null}

        {activeTab === 'requests' && <RequestsTab />}
        {activeTab === 'services' && <ServicesTab />}
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'templates' && <TemplatesTab />}
        {activeTab === 'groups' && <GroupsTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'security' && <SecurityTab />}
      </div>

      {/* Add Contact Modal Dialog */}
      {showAddContactModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create New Contact</h3>
              <button className="close-btn" onClick={() => setShowAddContactModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={contactForm.firstName}
                    onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={contactForm.lastName}
                    onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Mobile Number (10 digits)</label>
                <input
                  type="text"
                  placeholder="e.g. 0944444444"
                  value={contactForm.contactNumber}
                  onChange={(e) => setContactForm({ ...contactForm, contactNumber: e.target.value.replace(/\D/g, '').substring(0, 10) })}
                  maxLength={10}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddContactModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Premium Service Credit Card Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Subscribe to premium services</h3>
              <button className="close-btn" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>

            {/* Interactive Credit Card Mockup */}
            <div className="card-mockup-wrapper">
              <div className="credit-card-mockup">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="card-chip"></div>
                  <span style={{ fontSize: '0.8rem', fontStyle: 'italic', fontWeight: 'bold' }}>CREDIT CARD</span>
                </div>

                <div className="card-number-display">
                  {paymentForm.cardNumber
                    ? paymentForm.cardNumber.replace(/(\d{4})/g, '$1 ').trim()
                    : '•••• •••• •••• ••••'}
                </div>

                <div className="card-bottom-row">
                  <div className="card-holder-display">
                    <span>Card Holder</span>
                    <span>{loggedInUser?.name || 'USER NAME'}</span>
                  </div>
                  <div className="card-expiry-display">
                    <span>Expires</span>
                    <span>{paymentForm.expiryDate || 'MM/YY'}</span>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', textAlign: 'center', color: 'var(--color-primary-hover)' }}>
                Billed Amount: ${getTotalSelectedPrice()}
              </div>

              {showPaymentOtpField && (
                <div className="form-group" style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '12px', borderRadius: '4px', border: '1px dashed rgba(245, 158, 11, 0.3)' }}>
                  <label style={{ color: '#fbbf24', fontWeight: 'bold' }}>Nhập mã OTP Xác thực thanh toán</label>
                  <input
                    type="text"
                    placeholder="Nhập mã OTP 6 số"
                    value={paymentOtpCode}
                    onChange={(e) => setPaymentOtpCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                    maxLength={6}
                    required
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    * Vui lòng kiểm tra Console backend để lấy mã OTP giao dịch.
                  </span>
                </div>
              )}

              <div className="form-group">
                <label>Credit Card Number</label>
                <input
                  type="text"
                  placeholder="16 digits (e.g. 1234567812345678)"
                  value={paymentForm.cardNumber}
                  onChange={(e) => setPaymentForm({ ...paymentForm, cardNumber: e.target.value.replace(/\D/g, '').substring(0, 16) })}
                  maxLength={16}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Expiry Date (MM/YY)</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={paymentForm.expiryDate}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length > 2) {
                        val = val.substring(0, 2) + '/' + val.substring(2, 4);
                      }
                      setPaymentForm({ ...paymentForm, expiryDate: val });
                    }}
                    maxLength={5}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>CVV (3 digits)</label>
                  <input
                    type="password"
                    placeholder="•••"
                    value={paymentForm.cvv}
                    onChange={(e) => setPaymentForm({ ...paymentForm, cvv: e.target.value.replace(/\D/g, '').substring(0, 3) })}
                    maxLength={3}
                    required
                  />
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                Charges will be billed to your credit card immediately.
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Pay & Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Floating Chatbot Widget */}
      <UserAiChat />
    </div>
  );
}
