import React from 'react';
import { useChat } from '../../context/ChatContext';

export default function ServicesTab() {
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
        <h1>Premium SMS Services</h1>
        <p>Select multiple daily services to activate via a single credit card transaction.</p>
      </div>

      <div className="service-checklist-container">
        <h3 style={{ marginBottom: '15px', color: 'var(--color-primary-hover)' }}>Available Services</h3>

        {[
          { name: 'Joke', desc: 'Get a funny joke delivered daily. Keep smiling!', price: 2.99 },
          { name: 'Current Affairs', desc: 'Stay updated with global affairs and political news.', price: 4.99 },
          { name: 'Sports', desc: 'Live scores, football highlights, and sports bulletins.', price: 3.99 },
          { name: 'News', desc: 'Breaking news alerts and standard global reports.', price: 4.99 }
        ].map(service => {
          const isActive = activatedServices.includes(service.name);
          const isChecked = selectedServices.includes(service.name);

          return (
            <div
              key={service.name}
              className={`service-checklist-item ${isActive ? 'active-subscribed' : isChecked ? 'selected' : ''}`}
              onClick={() => !isActive && handleServiceCheck(service.name)}
            >
              {!isActive ? (
                <input
                  type="checkbox"
                  className="checklist-checkbox"
                  checked={isChecked}
                  onChange={() => { }} // handled by click of parent card
                />
              ) : (
                <span style={{ color: 'var(--color-accent)', fontWeight: 'bold', fontSize: '1.2rem', width: '20px', textAlign: 'center' }}>✓</span>
              )}

              <div className="checklist-details">
                <h4>{service.name} {isActive && <span className="service-status-tag" style={{ fontSize: '0.65rem', marginLeft: '5px' }}>Activated</span>}</h4>
                <p>{service.desc}</p>
              </div>

              <div className="checklist-price">
                ${service.price} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/mo</span>
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
          <div className="billing-summary-card">
            <div className="billing-total">
              <h3>Total: ${getTotalSelectedPrice()}</h3>
              <p>{selectedServices.length} premium services selected</p>
            </div>
            <button className="btn btn-primary" onClick={handlePaymentCheckoutClick}>
              Pay & Activate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
