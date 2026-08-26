import React from 'react';
import { useChat } from '../../context/ChatContext';
import { useLanguage } from '../../context/LanguageContext';
import styles from './SecurityTab.module.css';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

export default function SecurityTab() {
  const { t } = useLanguage();
  const {
    privacySettings,
    blocklist,
    blockNumberInput,
    setBlockNumberInput,
    handleBlockNumber,
    handleUnblockNumber,
    handleToggle2FaSetting,
    handleTogglePrivacySetting
  } = useChat();

  return (
    <div className="view-panel">
      <div className="view-header">
        <h1>{t('security_settings')}</h1>
        <p>{t('security_desc')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '25px' }}>
        <div>
          <h3 className={cx('security-tab__section-title')}>{t('two_factor_auth')}</h3>

          <div className={cx('security-tab__toggle-card')}>
            <div className={cx('security-tab__toggle-info')}>
              <h4 className={cx('security-tab__toggle-title')}>{t('two_factor_auth')}</h4>
              <p className={cx('security-tab__toggle-description')}>{t('two_factor_toggle_desc')}</p>
            </div>
            <div>
              <input
                type="checkbox"
                className="checklist-checkbox"
                checked={privacySettings.twoFactorEnabled}
                onChange={(e) => handleToggle2FaSetting(e.target.checked)}
                style={{ width: '22px', height: '22px' }}
              />
            </div>
          </div>

          <h3 className={cx('security-tab__section-title')}>{t('sms_privacy')}</h3>

          <div className={cx('security-tab__toggle-card')}>
            <div className={cx('security-tab__toggle-info')}>
              <h4 className={cx('security-tab__toggle-title')}>{t('sms_privacy')}</h4>
              <p className={cx('security-tab__toggle-description')}>{t('sms_privacy_toggle_desc')}</p>
            </div>
            <div>
              <input
                type="checkbox"
                className="checklist-checkbox"
                checked={privacySettings.onlyReceiveFromFriends}
                onChange={(e) => handleTogglePrivacySetting(e.target.checked)}
                style={{ width: '22px', height: '22px' }}
              />
            </div>
          </div>
        </div>

        <div className={cx('security-tab__blocklist-container')}>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '15px', color: 'var(--color-primary)' }}>
            {t('blocklist_title')}
          </h3>

          <form onSubmit={handleBlockNumber} className={cx('security-tab__blocklist-input-group')}>
            <input
              type="text"
              placeholder={t('enter_block_number')}
              value={blockNumberInput}
              onChange={(e) => setBlockNumberInput(e.target.value.replace(/\D/g, '').substring(0, 10))}
              maxLength={10}
              className={cx('security-tab__blocklist-input')}
              required
            />
            <button type="submit" className="btn btn-danger" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>{t('btn_block')}</button>
          </form>

          <div className={cx('security-tab__block-items-list')}>
            {blocklist.length === 0 ? (
              <div style={{ padding: '15px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>{t('blocklist_empty')}</div>
            ) : (
              blocklist.map(b => (
                <div key={b.id} className={cx('security-tab__block-item')}>
                  <div>
                    <div className={cx('security-tab__block-item-number')}>🚫 {b.blockedNumber}</div>
                  </div>
                  <button
                    className="btn-icon-danger"
                    onClick={() => handleUnblockNumber(b.id)}
                    style={{ fontSize: '0.78rem' }}
                  >
                    {t('unblock')}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
