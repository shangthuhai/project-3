import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import styles from './SettingsTab.module.css';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

export default function SettingsTab() {
  const { language, setLanguage, t } = useLanguage();
  const { triggerAlert } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const [selectedLang, setSelectedLang] = useState(language);
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [notifications, setNotifications] = useState(true);
  const [autoDelete, setAutoDelete] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setLanguage(selectedLang);
    setTheme(selectedTheme);
    if (triggerAlert) {
      triggerAlert('success', t('settings_saved'));
    }
  };

  return (
    <div className="view-panel">
      <div className="view-header">
        <h1>{t('settings_title')}</h1>
        <p>{t('settings_desc')}</p>
      </div>

      <form onSubmit={handleSave} className={cx('settings__container')}>
        {/* Active Settings Section */}
        <div className={cx('settings__card')}>
          <h3 className={cx('settings__card-title')}>{t('settings_title')}</h3>
          
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label htmlFor="language-select">{t('select_language')}</label>
            <select
              id="language-select"
              className={cx('settings__select')}
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
            >
              <option value="en">English (US)</option>
              <option value="vi">Tiếng Việt (VN)</option>
            </select>
          </div>

          <div className={cx('settings__item')} style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <div className={cx('settings__item-info')}>
              <h4 className={cx('settings__item-label')}>{t('theme_mode')}</h4>
              <p className={cx('settings__item-desc')}>{t('theme_mode_desc')}</p>
            </div>
            <select
              className={cx('settings__select')}
              value={selectedTheme}
              onChange={(e) => {
                setSelectedTheme(e.target.value);
                setTheme(e.target.value);
              }}
            >
              <option value="dark">{t('theme_dark')}</option>
              <option value="light">{t('theme_light')}</option>
              <option value="glass">{t('theme_glass')}</option>
            </select>
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

        <div className={cx('settings__actions')}>
          <button type="submit" className="btn btn-primary">
            {t('save_settings')}
          </button>
        </div>
      </form>
    </div>
  );
}
