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
    handleToggle2FaSetting,
    handleTogglePrivacySetting
  } = useChat();

  return (
    <div className="view-panel">
      <div className="view-header">
        <h1>{t('security_settings')}</h1>
        <p>{t('security_desc')}</p>
      </div>

      <div style={{ maxWidth: '600px' }}>
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
      </div>
    </div>
  );
}
