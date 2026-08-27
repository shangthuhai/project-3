import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import styles from './LandingView.module.css';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

export default function LandingView() {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const {
    users,
    authMode,
    setAuthMode,
    loginForm,
    setLoginForm,
    registerForm,
    setRegisterForm,
    usernameValidation,
    mobileValidation,
    captchaCode,
    captchaInput,
    setCaptchaInput,
    generateCaptcha,
    requires2Fa,
    setRequires2Fa,
    otpInput,
    setOtpInput,
    handleLoginSubmit,
    handle2FaVerifySubmit,
    handleRegisterSubmit,
    handleDemoUserSwitch
  } = useAuth();

  return (
    <div className={cx('landing')}>
      {/* Left Column: Website info */}
      <div className={cx('landing__left')}>
        <div className={cx('landing__hero')}>
          <h1 className={cx('landing__hero-title')}>{t('hero_title')}</h1>
          <p className={cx('landing__hero-description')}>
            {t('hero_desc')}
          </p>
        </div>

        <div className={cx('landing__features')}>
          <div className={cx('landing__feature-item')}>
            <div className={cx('landing__feature-icon')}>💬</div>
            <div className={cx('landing__feature-text')}>
              <h3 className={cx('landing__feature-title')}>{t('feat_chat_title')}</h3>
              <p className={cx('landing__feature-description')}>{t('feat_chat_desc')}</p>
            </div>
          </div>

          <div className={cx('landing__feature-item')}>
            <div className={cx('landing__feature-icon')}>⚡</div>
            <div className={cx('landing__feature-text')}>
              <h3 className={cx('landing__feature-title')}>{t('feat_sms_title')}</h3>
              <p className={cx('landing__feature-description')}>{t('feat_sms_desc')}</p>
            </div>
          </div>

          <div className={cx('landing__feature-item')}>
            <div className={cx('landing__feature-icon')}>📰</div>
            <div className={cx('landing__feature-text')}>
              <h3 className={cx('landing__feature-title')}>{t('feat_paid_title')}</h3>
              <p className={cx('landing__feature-description')}>{t('feat_paid_desc')}</p>
            </div>
          </div>
        </div>

        {/* Quick Demo Swapper widget for easy evaluation */}
        {users.length > 0 && (
          <div className={cx('landing__user-switcher')} style={{ width: 'fit-content', marginTop: '30px' }}>
            <div className={cx('landing__user-switcher-info')}>
              <span className={cx('landing__user-switcher-label')}>{t('demo_login')}</span>
              <select
                className={cx('landing__user-select')}
                defaultValue=""
                onChange={(e) => handleDemoUserSwitch(parseInt(e.target.value))}
              >
                <option value="" disabled>{t('select_preseed')}</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.username})</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Auth forms */}
      <div className={cx('landing__right')}>
        <div className={cx('landing__header')}>
          {/* Language & Theme Switcher */}
          <div style={{ display: 'flex', gap: '8px', marginRight: 'auto', alignItems: 'center' }}>
            <button 
              type="button" 
              className={cx('landing__lang-btn', { 'landing__lang-btn--active': language === 'en' })}
              onClick={() => setLanguage('en')}
              style={{ background: language === 'en' ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer' }}
            >
              EN
            </button>
            <button 
              type="button" 
              className={cx('landing__lang-btn', { 'landing__lang-btn--active': language === 'vi' })}
              onClick={() => setLanguage('vi')}
              style={{ background: language === 'vi' ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer' }}
            >
              VI
            </button>
            
            <button 
              type="button" 
              className={cx('landing__theme-btn')}
              onClick={() => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'glass' : 'light')}
              style={{ 
                background: 'rgba(255,255,255,0.08)', 
                color: 'var(--text-main)', 
                border: 'none', 
                borderRadius: '4px', 
                padding: '4px 8px', 
                fontSize: '0.75rem', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Change Theme"
            >
              {theme === 'light' ? '☀️' : theme === 'glass' ? '✨' : '🌙'}
            </button>
          </div>

          <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            {authMode === 'login' ? t("dont_have_account") : t("already_registered")}
          </span>
          <button
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
          >
            {authMode === 'login' ? t('signup') : t('login')}
          </button>
        </div>

        {requires2Fa ? (
          /* 2FA CODE FORM */
          <div className={cx('landing__auth-card')}>
            <h2 className={cx('landing__auth-title')}>{t('two_factor_title')}</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
              {t('two_factor_desc')}
            </p>
            <form onSubmit={handle2FaVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="form-group">
                <label>{t('otp_code')}</label>
                <input
                  type="text"
                  placeholder={t('enter_otp')}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').substring(0, 6))}
                  maxLength={6}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '12px' }}>
                {t('verify_and_login')}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setRequires2Fa(false);
                  setOtpInput('');
                }}
              >
                {t('back_to_login')}
              </button>
            </form>
          </div>
        ) : authMode === 'login' ? (
          /* LOGIN CARD */
          <div className={cx('landing__auth-card')}>
            <h2 className={cx('landing__auth-title')}>{t('login')}</h2>
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="form-group">
                <label>{t('username')}</label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('password')}</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '10px', padding: '12px' }}>
                {t('login')}
              </button>
            </form>
          </div>
        ) : (
          /* REGISTRATION CARD */
          <div className={cx('landing__auth-card')} style={{ maxWidth: '480px' }}>
            <h2 className={cx('landing__auth-title')}>{t('create_account')}</h2>
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('fullname')}</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t('email')}</label>
                  <input
                    type="email"
                    placeholder="e.g. john@example.com"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t('username')}</label>
                <input
                  type="text"
                  placeholder="Create username"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                  required
                />
                {usernameValidation.message && (
                  <span className={cx('landing__validation', usernameValidation.available === true ? 'landing__validation--success' : usernameValidation.available === false ? 'landing__validation--error' : 'landing__validation--checking')}>
                    {usernameValidation.available === true && <span style={{ marginRight: '4px' }}>✓</span>}
                    {usernameValidation.available === false && <span style={{ marginRight: '4px' }}>✗</span>}
                    <span>{usernameValidation.message === 'Checking availability...' ? t('checking_availability') : usernameValidation.available === true ? t('username_available') : t('username_taken')}</span>
                  </span>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('password')}</label>
                  <input
                    type="password"
                    placeholder="Password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t('confirm_password')}</label>
                  <input
                    type="password"
                    placeholder="Confirm"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t('mobile_number')}</label>
                <input
                  type="text"
                  placeholder="e.g. 0912345678"
                  value={registerForm.mobileNumber}
                  onChange={(e) => setRegisterForm({ ...registerForm, mobileNumber: e.target.value.replace(/\D/g, '').substring(0, 10) })}
                  maxLength={10}
                  required
                />
                {mobileValidation.message && (
                  <span className={cx('landing__validation', mobileValidation.available === true ? 'landing__validation--success' : mobileValidation.available === false ? 'landing__validation--error' : 'landing__validation--checking')}>
                    {mobileValidation.available === true && <span style={{ marginRight: '4px' }}>✓</span>}
                    {mobileValidation.available === false && <span style={{ marginRight: '4px' }}>✗</span>}
                    <span>{mobileValidation.message === 'Checking availability...' ? t('checking_availability') : mobileValidation.available === true ? t('username_available') : t('username_taken')}</span>
                  </span>
                )}
              </div>

              {/* Captcha/Verification Code widget */}
              <div className="form-group">
                <label>{t('verification_code')}</label>
                <div className={cx('landing__captcha-container')}>
                  <div className={cx('landing__captcha-image')}>{captchaCode}</div>
                  <button type="button" className={cx('landing__captcha-refresh')} onClick={generateCaptcha}>
                    ↻
                  </button>
                  <input
                    type="text"
                    placeholder={t('enter_code')}
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value.trim())}
                    style={{ flex: 1, padding: '8px' }}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ marginTop: '10px', padding: '12px' }}
                disabled={
                  usernameValidation.available !== true ||
                  mobileValidation.available !== true ||
                  !captchaInput ||
                  registerForm.password !== registerForm.confirmPassword
                }
              >
                {t('create_account')}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
