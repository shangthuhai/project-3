import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useChat } from '../../context/ChatContext';
import CustomSelect from '../common/CustomSelect';
import styles from './SettingsTab.module.css';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

export default function SettingsTab() {
  const { language, setLanguage, t } = useLanguage();
  const { handleLogout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { setActiveTab } = useChat();
  
  const [notifications, setNotifications] = useState(true);
  const [autoDelete, setAutoDelete] = useState(false);

  const languageOptions = [
    { value: 'en', label: 'English (US)' },
    { value: 'vi', label: 'Tiếng Việt (VN)' }
  ];

  const themeOptions = [
    { value: 'dark', label: t('theme_dark') },
    { value: 'light', label: t('theme_light') },
    { value: 'glass', label: t('theme_glass') }
  ];

  return (
    <div className="view-panel">
      <div className="view-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button 
            type="button" 
            className="mobile-back-btn" 
            onClick={() => setActiveTab('chats')}
            title={language === 'en' ? 'Back' : 'Quay lại'}
          >
            ←
          </button>
          <div>
            <h1>{t('settings_title')}</h1>
            <p>{t('settings_desc')}</p>
          </div>
        </div>
      </div>

      <div className={cx('settings__container')}>
        {/* Active Settings Section */}
        <div className={cx('settings__card')}>
          <h3 className={cx('settings__card-title')}>{t('settings_title')}</h3>
          
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label htmlFor="language-select">{t('select_language')}</label>
            <CustomSelect
              id="language-select"
              options={languageOptions}
              value={language}
              onChange={setLanguage}
            />
          </div>

          <div className={cx('settings__item')} style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <div className={cx('settings__item-info')}>
              <h4 className={cx('settings__item-label')}>{t('theme_mode')}</h4>
              <p className={cx('settings__item-desc')}>{t('theme_mode_desc')}</p>
            </div>
            <CustomSelect
              options={themeOptions}
              value={theme}
              onChange={setTheme}
            />
          </div>
        </div>

        {/* Future / Disabled Settings Section */}
        <div className={cx('settings__card', 'settings__card--future')}>
          <h3 className={cx('settings__card-title')}>{t('future_settings')}</h3>
          
          <div className={cx('settings__item')}>
            <div className={cx('settings__item-info')}>
              <h4 className={cx('settings__item-label')}>{t('push_notifications')}</h4>
              <p className={cx('settings__item-desc')}>{t('push_notifications_desc')}</p>
            </div>
            <div className={cx('settings__toggle-wrapper')}>
              <input
                type="checkbox"
                id="notifications-toggle"
                className={cx('settings__toggle-checkbox')}
                checked={notifications}
                onChange={() => setNotifications(!notifications)}
                disabled
              />
              <label htmlFor="notifications-toggle" className={cx('settings__toggle-label')}></label>
            </div>
          </div>

          <div className={cx('settings__item')}>
            <div className={cx('settings__item-info')}>
              <h4 className={cx('settings__item-label')}>{t('auto_delete')}</h4>
              <p className={cx('settings__item-desc')}>{t('auto_delete_desc')}</p>
            </div>
            <div className={cx('settings__toggle-wrapper')}>
              <input
                type="checkbox"
                id="auto-delete-toggle"
                className={cx('settings__toggle-checkbox')}
                checked={autoDelete}
                onChange={() => setAutoDelete(!autoDelete)}
                disabled
              />
              <label htmlFor="auto-delete-toggle" className={cx('settings__toggle-label')}></label>
            </div>
          </div>
        </div>

        {/* Account / Session Settings */}
        <div className={cx('settings__card')}>
          <h3 className={cx('settings__card-title')}>{t('logout_confirm_title')}</h3>
          <div className={cx('settings__item')} style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <div className={cx('settings__item-info')}>
              <h4 className={cx('settings__item-label')}>{t('logout')}</h4>
              <p className={cx('settings__item-desc')}>{t('logout_confirm_msg')}</p>
            </div>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <LogOut size={18} />
              <span>{t('logout')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
