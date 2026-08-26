import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AlertBanner() {
  const { alert } = useAuth();

  if (!alert) return null;

  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: '20px', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        zIndex: 99999, 
        width: '90%', 
        maxWidth: '500px' 
      }}
    >
      <div className={`custom-alert ${alert.type}`}>
        {alert.type === 'success' ? '✓' : '⚠'} {alert.message}
      </div>
    </div>
  );
}
