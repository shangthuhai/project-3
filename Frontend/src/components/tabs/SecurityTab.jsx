import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { changePassword } from '../../api';
import styles from './SecurityTab.module.css';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

export default function SecurityTab() {
  const { t } = useLanguage();
  const { triggerAlert } = useAuth();
  const {
    privacySettings,
    handleToggle2FaSetting,
    handleTogglePrivacySetting
  } = useChat();

  const [changePassForm, setChangePassForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [updatingPass, setUpdatingPass] = useState(false);

  const handleChangePasswordSubmit = (e) => {
    e.preventDefault();

    if (!changePassForm.oldPassword) {
      triggerAlert('error', t('err_old_password_required') || 'Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (!changePassForm.newPassword) {
      triggerAlert('error', t('err_password_required') || 'Vui lòng nhập mật khẩu mới.');
      return;
    }
    if (changePassForm.newPassword.length < 6) {
      triggerAlert('error', t('err_new_password_min') || 'Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (!changePassForm.confirmNewPassword) {
      triggerAlert('error', t('err_confirm_password_required') || 'Vui lòng xác nhận mật khẩu mới.');
      return;
    }
    if (changePassForm.newPassword !== changePassForm.confirmNewPassword) {
      triggerAlert('error', t('err_password_mismatch') || 'Mật khẩu mới và xác nhận mật khẩu không trùng khớp.');
      return;
    }
    if (changePassForm.oldPassword === changePassForm.newPassword) {
      triggerAlert('error', t('err_new_password_same') || 'Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      return;
    }

    setUpdatingPass(true);
    changePassword({
      oldPassword: changePassForm.oldPassword,
      newPassword: changePassForm.newPassword,
      confirmNewPassword: changePassForm.confirmNewPassword
    })
      .then((res) => {
        setUpdatingPass(false);
        triggerAlert('success', res.message || t('password_changed_success') || 'Cập nhật mật khẩu mới thành công!');
        setChangePassForm({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
      })
      .catch((err) => {
        setUpdatingPass(false);
        const errorMsg = err.response?.data?.message || 'Đổi mật khẩu thất bại.';
        triggerAlert('error', errorMsg);
      });
  };

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

          <h3 className={cx('security-tab__section-title')}>{t('change_password_title')}</h3>

          <div className={cx('security-tab__toggle-card')} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '15px' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {t('change_password_desc')}
            </p>
            <form onSubmit={handleChangePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {t('current_password')} *
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={changePassForm.oldPassword}
                  onChange={(e) => setChangePassForm({ ...changePassForm, oldPassword: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {t('new_password')} *
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={changePassForm.newPassword}
                  onChange={(e) => setChangePassForm({ ...changePassForm, newPassword: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {t('confirm_new_password')} *
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={changePassForm.confirmNewPassword}
                  onChange={(e) => setChangePassForm({ ...changePassForm, confirmNewPassword: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={updatingPass}
                style={{ marginTop: '5px', padding: '10px 16px', alignSelf: 'flex-start' }}
              >
                {updatingPass ? '...' : t('update_password_btn')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

