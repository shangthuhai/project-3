import React from 'react';
import { useChat } from '../../context/ChatContext';
import { useLanguage } from '../../context/LanguageContext';
import styles from './ServicesTab.module.css';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

export default function ServicesTab() {
  const { t } = useLanguage();
  const {
    activatedServices,
    selectedServices,
    handleServiceCheck,
    handlePaymentCheckoutClick
  } = useChat();

  const getServicePrice = (name) => {
    const prices = { 'Joke': 2.99, 'Current Affairs': 4.99, 'Sports': 3.99, 'News': 4.99 };
    return prices[name] || 0;
  };

  const getTotalSelectedPrice = () => {
    return selectedServices.reduce((sum, service) => sum + getServicePrice(service), 0).toFixed(2);
  };

  return (
    <div className="view-panel">
      <div className="view-header">
        <h1>{t('premium_services')}</h1>
        <p>{t('services_desc')}</p>
      </div>

      <div className={cx('services__checklist-container')}>
        <h3 style={{ marginBottom: '15px', color: 'var(--color-primary-hover)' }}>{t('premium_services')}</h3>

        {[
          { key: 'Joke', name: t('jokes_service'), desc: t('jokes_desc'), price: 2.99 },
          { key: 'Current Affairs', name: t('current_affairs_service'), desc: t('current_affairs_desc'), price: 4.99 },
          { key: 'Sports', name: t('sports_service'), desc: t('sports_desc'), price: 3.99 },
          { key: 'News', name: t('news_service'), desc: t('news_desc'), price: 4.99 }
        ].map(service => {
          const isActive = activatedServices.includes(service.key);
          const isChecked = selectedServices.includes(service.key);

          return (
            <div
              key={service.key}
              className={cx('services__checklist-item', {
                'services__checklist-item--subscribed': isActive,
                'services__checklist-item--selected': !isActive && isChecked
              })}
              onClick={() => !isActive && handleServiceCheck(service.key)}
            >
              {!isActive ? (
                <input
                  type="checkbox"
                  className={cx('services__checklist-checkbox')}
                  checked={isChecked}
                  onChange={() => { }} // handled by click of parent card
                />
              ) : (
                <span style={{ color: 'var(--color-accent)', fontWeight: 'bold', fontSize: '1.2rem', width: '20px', textAlign: 'center' }}>✓</span>
              )}

              <div className={cx('services__checklist-details')}>
                <h4>
                  {service.name} 
                  {isActive && <span className={cx('services__status-tag')} style={{ fontSize: '0.65rem', marginLeft: '5px' }}>{t('activated')}</span>}
                </h4>
                <p>{service.desc}</p>
              </div>

              <div className={cx('services__checklist-price')}>
                ${service.price} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/{t('price_per_month')}</span>
              </div>
            </div>
          );
        })}

        {/* Shopping Billing summary */}
        {!selectedServices.length && !activatedServices.length === 4 ? (
          <div style={{ marginTop: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Check any service above to proceed with billing.
          </div>
        ) : null}

        {selectedServices.length > 0 && (
          <div className={cx('services__billing-card')}>
            <div className={cx('services__billing-total')}>
              <h3>Total: ${getTotalSelectedPrice()}</h3>
              <p>{selectedServices.length} premium services selected</p>
            </div>
            <button className="btn btn-primary" onClick={handlePaymentCheckoutClick}>
              {t('pay_and_activate')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
