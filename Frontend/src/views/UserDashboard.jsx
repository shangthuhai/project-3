import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useLanguage } from '../context/LanguageContext';
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
import SettingsTab from '../components/tabs/SettingsTab';
import styles from './UserDashboard.module.css';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

export default function UserDashboard() {
  const { t } = useLanguage();
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
          <div className={cx('dashboard__placeholder')}>
            <div className={cx('dashboard__placeholder-icon')}>💬</div>
            <h3>{t('welcome_message')}</h3>
            <p>{t('select_chat_placeholder')}</p>
          </div>
        ) : null}

        {activeTab === 'requests' && <RequestsTab />}
        {activeTab === 'services' && <ServicesTab />}
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'templates' && <TemplatesTab />}
        {activeTab === 'groups' && <GroupsTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>

      {/* Add Contact Modal Dialog */}
      {showAddContactModal && (
        <div className={cx('dashboard__modal-overlay')}>
          <div className={cx('dashboard__modal-content')}>
            <div className={cx('dashboard__modal-header')}>
              <h3>{t('create_new_contact')}</h3>
              <button className={cx('dashboard__modal-close-btn')} onClick={() => setShowAddContactModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('first_name')}</label>
                  <input
                    type="text"
                    placeholder={t('first_name')}
                    value={contactForm.firstName}
                    onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t('last_name')}</label>
                  <input
                    type="text"
                    placeholder={t('last_name')}
                    value={contactForm.lastName}
                    onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>{t('mobile_number_label')}</label>
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
                  {t('btn_cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t('btn_save_contact')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Premium Service Credit Card Payment Modal */}
      {showPaymentModal && (
        <div className={cx('dashboard__modal-overlay')}>
          <div className={cx('dashboard__modal-content')}>
            <div className={cx('dashboard__modal-header')}>
              <h3>{t('subscribe_premium')}</h3>
              <button className={cx('dashboard__modal-close-btn')} onClick={() => setShowPaymentModal(false)}>×</button>
            </div>

            {/* Interactive Credit Card Mockup */}
            <div className={cx('dashboard__card-mockup-wrapper')}>
              <div className={cx('dashboard__credit-card-mockup')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className={cx('dashboard__card-chip')}></div>
                  <span style={{ fontSize: '0.8rem', fontStyle: 'italic', fontWeight: 'bold' }}>{t('credit_card')}</span>
                </div>

                <div className={cx('dashboard__card-number')}>
                  {paymentForm.cardNumber
                    ? paymentForm.cardNumber.replace(/(\d{4})/g, '$1 ').trim()
                    : '•••• •••• •••• ••••'}
                </div>

                <div className={cx('dashboard__card-bottom-row')}>
                  <div className={cx('dashboard__card-holder')}>
                    <span>{t('card_holder')}</span>
                    <span>{loggedInUser?.name || 'USER NAME'}</span>
                  </div>
                  <div className={cx('dashboard__card-expiry')}>
                    <span>{t('expires')}</span>
                    <span>{paymentForm.expiryDate || 'MM/YY'}</span>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', textAlign: 'center', color: 'var(--color-primary-hover)' }}>
                {t('billed_amount')}: ${getTotalSelectedPrice()}
              </div>

              {showPaymentOtpField && (
                <div className="form-group" style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '12px', borderRadius: '4px', border: '1px dashed rgba(245, 158, 11, 0.3)' }}>
                  <label style={{ color: '#fbbf24', fontWeight: 'bold' }}>{t('enter_otp_payment')}</label>
                  <input
                    type="text"
                    placeholder={t('enter_6_digit_otp')}
                    value={paymentOtpCode}
                    onChange={(e) => setPaymentOtpCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                    maxLength={6}
                    required
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    {t('check_console')}
                  </span>
                </div>
              )}

              <div className="form-group">
                <label>{t('card_number')}</label>
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
                  <label>{t('card_expiry')}</label>
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
                  <label>{t('cvv')}</label>
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
                {t('payment_notice')}
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>
                  {t('btn_cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t('pay_and_activate')}
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
