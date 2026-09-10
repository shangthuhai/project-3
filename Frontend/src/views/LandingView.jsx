import React, { useState, useEffect } from 'react';
import { MessageSquare, Zap, Newspaper, Sun, Sparkles, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import CustomSelect from '../components/common/CustomSelect';
import OtpInput from '../components/common/OtpInput';
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
    emailValidation,
    emailOtpCode,
    setEmailOtpCode,
    sendingOtp,
    otpSent,
    otpTimer,
    handleSendRegisterOtp,
    forgotForm,
    setForgotForm,
    sendingForgotOtp,
    forgotOtpSent,
    forgotOtpTimer,
    handleSendForgotPasswordOtp,
    handleResetPasswordSubmit,
    captchaCode,
    captchaInput,
    setCaptchaInput,
    generateCaptcha,
    requires2Fa,
    setRequires2Fa,
    otpInput,
    setOtpInput,
    handleLoginSubmit,
    handleGoogleSignIn,
    handle2FaVerifySubmit,
    handleRegisterSubmit,
    handleDemoUserSwitch
  } = useAuth();

  const [submittedRegister, setSubmittedRegister] = useState(false);
  const [submittedLogin, setSubmittedLogin] = useState(false);
  const [touched, setTouched] = useState({});

  useEffect(() => {
    setSubmittedRegister(false);
    setSubmittedLogin(false);
    setTouched({});
  }, [authMode]);

  const touchField = (fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  };

  // Real-time instant field status calculators
  const getNameStatus = () => {
    const name = registerForm.name?.trim();
    if (!name) return { type: 'checking', msg: t('optional_name_hint') };
    return { type: 'success', msg: t('name_valid') };
  };

  const getEmailStatus = () => {
    if (!submittedRegister && !touched.email) return null;
    const email = registerForm.email?.trim();
    if (!email) return { type: 'error', msg: t('err_email_required') };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { type: 'error', msg: t('err_email_invalid') };
    if (emailValidation.checking) return { type: 'checking', msg: t('checking_availability') };
    if (emailValidation.available === false) return { type: 'error', msg: t('email_taken') };
    if (emailValidation.available === true) return { type: 'success', msg: t('email_available') };
    return null;
  };

  const getOtpStatus = () => {
    if (!submittedRegister && !touched.emailOtpCode) return null;
    const otp = emailOtpCode?.trim();
    if (!otp) return { type: 'error', msg: t('err_otp_required') };
    if (otp.length < 6) return { type: 'error', msg: `${t('err_otp_required')} (${otp.length}/6)` };
    return { type: 'success', msg: t('otp_valid') };
  };

  const getMobileStatus = () => {
    if (!submittedRegister && !touched.mobileNumber) return null;
    const mob = registerForm.mobileNumber?.trim();
    if (!mob) return { type: 'error', msg: t('err_mobile_required') };
    if (mob.length < 10) return { type: 'error', msg: `${t('mobile_invalid')} (${mob.length}/10)` };
    if (mobileValidation.checking) return { type: 'checking', msg: t('checking_availability') };
    if (mobileValidation.available === false) return { type: 'error', msg: t('mobile_taken') };
    if (mobileValidation.available === true) return { type: 'success', msg: t('mobile_available') };
    return null;
  };

  const getUsernameStatus = () => {
    if (!submittedRegister && !touched.username) return null;
    const user = registerForm.username?.trim();
    if (!user) return { type: 'error', msg: t('err_username_required') };
    if (user.length < 3) return { type: 'error', msg: language === 'vi' ? 'Tên đăng nhập phải từ 3 ký tự trở lên.' : 'Username must be at least 3 characters.' };
    if (usernameValidation.checking) return { type: 'checking', msg: t('checking_availability') };
    if (usernameValidation.available === false) return { type: 'error', msg: t('username_taken') };
    if (usernameValidation.available === true) return { type: 'success', msg: t('username_available') };
    return null;
  };

  const getPasswordStatus = () => {
    if (!submittedRegister && !touched.password) return null;
    const pass = registerForm.password;
    if (!pass) return { type: 'error', msg: t('err_password_required') };
    if (pass.length < 6) return { type: 'error', msg: language === 'vi' ? `Mật khẩu tối thiểu 6 ký tự (${pass.length}/6).` : `Password must be at least 6 characters (${pass.length}/6).` };
    return { type: 'success', msg: t('password_valid') };
  };

  const getConfirmPasswordStatus = () => {
    if (!submittedRegister && !touched.confirmPassword) return null;
    const confirm = registerForm.confirmPassword;
    if (!confirm) return { type: 'error', msg: t('err_confirm_password_required') };
    if (confirm !== registerForm.password) return { type: 'error', msg: t('err_password_mismatch') };
    return { type: 'success', msg: t('password_match') };
  };

  const getCaptchaStatus = () => {
    if (!submittedRegister && !touched.captchaInput) return null;
    const code = captchaInput?.trim();
    if (!code) return { type: 'error', msg: t('err_captcha_required') };
    if (code.toLowerCase() !== captchaCode.toLowerCase()) return { type: 'error', msg: t('err_captcha_invalid') };
    return { type: 'success', msg: t('captcha_valid') };
  };

  const getLoginUsernameStatus = () => {
    if (!submittedLogin && !touched.loginUsername) return null;
    if (!loginForm.username?.trim()) return { type: 'error', msg: t('err_username_required') };
    return null;
  };

  const getLoginPasswordStatus = () => {
    if (!submittedLogin && !touched.loginPassword) return null;
    if (!loginForm.password) return { type: 'error', msg: t('err_password_required') };
    return null;
  };

  const renderValidationMessage = (status) => {
    if (!status || !status.msg) return null;
    return (
      <span className={cx('landing__validation', status.type === 'success' ? 'landing__validation--success' : status.type === 'error' ? 'landing__validation--error' : 'landing__validation--checking')}>
        {status.type === 'success' && <span style={{ marginRight: '4px' }}>✓</span>}
        {status.type === 'error' && <span style={{ marginRight: '4px' }}>✗</span>}
        {status.type === 'checking' && <span style={{ marginRight: '4px' }}>⏳</span>}
        <span>{status.msg}</span>
      </span>
    );
  };

  const onRegisterFormSubmit = (e) => {
    e.preventDefault();
    setSubmittedRegister(true);
    handleRegisterSubmit(e);
  };

  const onLoginFormSubmit = (e) => {
    e.preventDefault();
    setSubmittedLogin(true);
    handleLoginSubmit(e);
  };

  const nameStatus = getNameStatus();
  const emailStatus = getEmailStatus();
  const otpStatus = getOtpStatus();
  const mobileStatus = getMobileStatus();
  const usernameStatus = getUsernameStatus();
  const passwordStatus = getPasswordStatus();
  const confirmPasswordStatus = getConfirmPasswordStatus();
  const captchaStatus = getCaptchaStatus();
  const loginUserStatus = getLoginUsernameStatus();
  const loginPassStatus = getLoginPasswordStatus();

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
            <div className={cx('landing__feature-icon')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={24} />
            </div>
            <div className={cx('landing__feature-text')}>
              <h3 className={cx('landing__feature-title')}>{t('feat_chat_title')}</h3>
              <p className={cx('landing__feature-description')}>{t('feat_chat_desc')}</p>
            </div>
          </div>

          <div className={cx('landing__feature-item')}>
            <div className={cx('landing__feature-icon')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={24} />
            </div>
            <div className={cx('landing__feature-text')}>
              <h3 className={cx('landing__feature-title')}>{t('feat_sms_title')}</h3>
              <p className={cx('landing__feature-description')}>{t('feat_sms_desc')}</p>
            </div>
          </div>

          <div className={cx('landing__feature-item')}>
            <div className={cx('landing__feature-icon')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Newspaper size={24} />
            </div>
            <div className={cx('landing__feature-text')}>
              <h3 className={cx('landing__feature-title')}>{t('feat_paid_title')}</h3>
              <p className={cx('landing__feature-description')}>{t('feat_paid_desc')}</p>
            </div>
          </div>
        </div>
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
              {theme === 'light' ? <Sun size={16} /> : theme === 'glass' ? <Sparkles size={16} /> : <Moon size={16} />}
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
              <OtpInput
                value={otpInput}
                onChange={setOtpInput}
                label={t('otp_code')}
                placeholder="XXXXXX"
                variant="github"
                autoFocus
              />
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
          <div className={cx('landing__auth-card')}>
            <h2 className={cx('landing__auth-title')}>{t('login')}</h2>
            <form onSubmit={onLoginFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }} noValidate>
              <div className="form-group">
                <label>{t('username')}</label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={loginForm.username}
                  onChange={(e) => { setLoginForm({ ...loginForm, username: e.target.value }); touchField('loginUsername'); }}
                  onBlur={() => touchField('loginUsername')}
                  className={loginUserStatus?.type === 'error' ? 'input-error' : loginUserStatus?.type === 'success' ? 'input-success' : ''}
                />
                {renderValidationMessage(loginUserStatus)}
              </div>

              <div className="form-group">
                <label>{t('password')}</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={loginForm.password}
                  onChange={(e) => { setLoginForm({ ...loginForm, password: e.target.value }); touchField('loginPassword'); }}
                  onBlur={() => touchField('loginPassword')}
                  className={loginPassStatus?.type === 'error' ? 'input-error' : loginPassStatus?.type === 'success' ? 'input-success' : ''}
                />
                {renderValidationMessage(loginPassStatus)}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setAuthMode('forgot_password')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary)',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      padding: 0,
                      fontWeight: 500
                    }}
                  >
                    {t('forgot_password')}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '10px', padding: '12px' }}>
                {t('login')}
              </button>
              <div className={cx('landing__auth-divider')}>{t('or_continue_with')}</div>
              <button type="button" className={cx('landing__google-btn')} onClick={handleGoogleSignIn}>
                <span className={cx('landing__google-mark')}>G</span>
                {t('continue_with_google')}
              </button>
            </form>
          </div>
        ) : authMode === 'forgot_password' ? (
          <div className={cx('landing__auth-card')} style={{ maxWidth: '440px' }}>
            <h2 className={cx('landing__auth-title')}>{t('forgot_password_title')}</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
              {t('forgot_password_desc')}
            </p>
            <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} noValidate>
              {/* Email Input with Send OTP */}
              <div className="form-group">
                <label>{t('email')} *</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="email"
                    placeholder="e.g. john@example.com"
                    value={forgotForm.email}
                    onChange={(e) => setForgotForm({ ...forgotForm, email: e.target.value })}
                    style={{ flex: 1, minWidth: 0 }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleSendForgotPasswordOtp}
                    disabled={sendingForgotOtp || forgotOtpTimer > 0 || !forgotForm.email}
                    style={{ fontSize: '0.75rem', padding: '0 10px', whiteSpace: 'nowrap' }}
                  >
                    {sendingForgotOtp ? '...' : forgotOtpTimer > 0 ? `${forgotOtpTimer}s` : t('send_otp')}
                  </button>
                </div>
              </div>

              {/* OTP Input */}
              <div className="form-group">
                <OtpInput
                  value={forgotForm.otpCode}
                  onChange={(val) => setForgotForm({ ...forgotForm, otpCode: val })}
                  label={`${t('email_otp_code')} *`}
                  placeholder="XXXXXX"
                  variant="github"
                />
              </div>

              {/* New Password */}
              <div className="form-group">
                <label>{t('new_password')} *</label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={forgotForm.newPassword}
                  onChange={(e) => setForgotForm({ ...forgotForm, newPassword: e.target.value })}
                />
              </div>

              {/* Confirm New Password */}
              <div className="form-group">
                <label>{t('confirm_new_password')} *</label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={forgotForm.confirmNewPassword}
                  onChange={(e) => setForgotForm({ ...forgotForm, confirmNewPassword: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '10px', padding: '12px', width: '100%', fontWeight: 600 }}>
                {t('reset_password_btn')}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setAuthMode('login')}
                style={{ width: '100%' }}
              >
                {t('back_to_login')}
              </button>
            </form>
          </div>
        ) : (
          <div className={cx('landing__auth-card')} style={{ maxWidth: '480px' }}>
            <h2 className={cx('landing__auth-title')} style={{ marginBottom: '15px' }}>{t('create_account')}</h2>
            
            {/* Google Registration at Top */}
            <button type="button" className={cx('landing__google-btn')} onClick={handleGoogleSignIn} style={{ minHeight: '40px', marginBottom: '12px' }}>
              <span className={cx('landing__google-mark')}>G</span>
              {t('continue_with_google')}
            </button>
            <div className={cx('landing__auth-divider')} style={{ marginBottom: '15px' }}>{t('or_continue_with')}</div>

            <form onSubmit={onRegisterFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0px' }} noValidate>
              <div className={cx('landing__register-fields')}>
                {/* 1. Họ và tên */}
                <div className="form-group">
                  <label>{t('fullname')} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>({language === 'vi' ? 'Không bắt buộc' : 'Optional'})</span></label>
                  <input
                    type="text"
                    placeholder={language === 'vi' ? 'Ví dụ: Nguyễn Văn A (Không bắt buộc)' : 'e.g. John Doe (Optional)'}
                    value={registerForm.name || ''}
                    onChange={(e) => { setRegisterForm({ ...registerForm, name: e.target.value }); touchField('name'); }}
                    onBlur={() => touchField('name')}
                    className={nameStatus?.type === 'success' ? 'input-success' : ''}
                  />
                  {renderValidationMessage(nameStatus)}
                </div>

                {/* 2. Email */}
                <div className="form-group">
                  <label>{t('email')} *</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="email"
                      placeholder="e.g. john@example.com"
                      value={registerForm.email}
                      onChange={(e) => { setRegisterForm({ ...registerForm, email: e.target.value }); touchField('email'); }}
                      onBlur={() => touchField('email')}
                      style={{ flex: 1, minWidth: 0 }}
                      className={emailStatus?.type === 'error' ? 'input-error' : emailStatus?.type === 'success' ? 'input-success' : ''}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleSendRegisterOtp}
                      disabled={sendingOtp || otpTimer > 0 || emailValidation.available === false || !registerForm.email}
                      style={{ fontSize: '0.75rem', padding: '0 10px', whiteSpace: 'nowrap' }}
                    >
                      {sendingOtp ? '...' : otpTimer > 0 ? `${otpTimer}s` : t('send_otp')}
                    </button>
                  </div>
                  {renderValidationMessage(emailStatus)}
                </div>

                {/* 3. Mã OTP */}
                <div className="form-group">
                  <OtpInput
                    value={emailOtpCode}
                    onChange={(val) => { setEmailOtpCode(val); touchField('emailOtpCode'); }}
                    label={`${t('email_otp_code')} *`}
                    placeholder="XXXXXX"
                    variant="github"
                  />
                  {renderValidationMessage(otpStatus)}
                </div>

                {/* 4. Số điện thoại */}
                <div className="form-group">
                  <label>{t('mobile_number')} *</label>
                  <input
                    type="text"
                    placeholder="e.g. 0912345678"
                    value={registerForm.mobileNumber}
                    onChange={(e) => { setRegisterForm({ ...registerForm, mobileNumber: e.target.value.replace(/\D/g, '').substring(0, 10) }); touchField('mobileNumber'); }}
                    onBlur={() => touchField('mobileNumber')}
                    maxLength={10}
                    className={mobileStatus?.type === 'error' ? 'input-error' : mobileStatus?.type === 'success' ? 'input-success' : ''}
                  />
                  {renderValidationMessage(mobileStatus)}
                </div>

                {/* 5. Tên đăng nhập */}
                <div className="form-group">
                  <label>{t('username')} *</label>
                  <input
                    type="text"
                    placeholder="Create username"
                    value={registerForm.username}
                    onChange={(e) => { setRegisterForm({ ...registerForm, username: e.target.value.toLowerCase().replace(/\s/g, '') }); touchField('username'); }}
                    onBlur={() => touchField('username')}
                    className={usernameStatus?.type === 'error' ? 'input-error' : usernameStatus?.type === 'success' ? 'input-success' : ''}
                  />
                  {renderValidationMessage(usernameStatus)}
                </div>

                {/* 6. Mật khẩu */}
                <div className="form-group">
                  <label>{t('password')} *</label>
                  <input
                    type="password"
                    placeholder="Password"
                    value={registerForm.password}
                    onChange={(e) => { setRegisterForm({ ...registerForm, password: e.target.value }); touchField('password'); }}
                    onBlur={() => touchField('password')}
                    className={passwordStatus?.type === 'error' ? 'input-error' : passwordStatus?.type === 'success' ? 'input-success' : ''}
                  />
                  {renderValidationMessage(passwordStatus)}
                </div>

                {/* 7. Nhập lại mật khẩu */}
                <div className="form-group">
                  <label>{t('confirm_password')} *</label>
                  <input
                    type="password"
                    placeholder="Confirm"
                    value={registerForm.confirmPassword}
                    onChange={(e) => { setRegisterForm({ ...registerForm, confirmPassword: e.target.value }); touchField('confirmPassword'); }}
                    onBlur={() => touchField('confirmPassword')}
                    className={confirmPasswordStatus?.type === 'error' ? 'input-error' : confirmPasswordStatus?.type === 'success' ? 'input-success' : ''}
                  />
                  {renderValidationMessage(confirmPasswordStatus)}
                </div>

                {/* 8. Mã Captcha */}
                <div className="form-group">
                  <label>{t('verification_code')} *</label>
                  <div className={cx('landing__captcha-container')}>
                    <div className={cx('landing__captcha-image')} style={{ padding: '0 6px', fontSize: '0.85rem' }}>{captchaCode}</div>
                    <button type="button" className={cx('landing__captcha-refresh')} onClick={generateCaptcha} title="Refresh Captcha">
                      ↻
                    </button>
                    <input
                      type="text"
                      placeholder={t('enter_code')}
                      value={captchaInput}
                      onChange={(e) => { setCaptchaInput(e.target.value.trim()); touchField('captchaInput'); }}
                      onBlur={() => touchField('captchaInput')}
                      style={{ flex: 1, padding: '6px' }}
                      className={captchaStatus?.type === 'error' ? 'input-error' : captchaStatus?.type === 'success' ? 'input-success' : ''}
                    />
                  </div>
                  {renderValidationMessage(captchaStatus)}
                </div>

                {/* Register Submit Button */}
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ marginTop: '8px', padding: '12px', width: '100%', fontWeight: 600 }}
                >
                  {t('create_account')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Mobile/Tablet actions moved below the auth card */}
        <div className={cx('landing__mobile-actions')}>
          <div className={cx('landing__mobile-register')}>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              {authMode === 'login' ? t("dont_have_account") : t("already_registered")}
            </span>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', marginLeft: '10px' }}
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
            >
              {authMode === 'login' ? t('signup') : t('login')}
            </button>
          </div>

          <div className={cx('landing__mobile-utils')}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                className={cx('landing__lang-btn', { 'landing__lang-btn--active': language === 'en' })}
                onClick={() => setLanguage('en')}
                style={{ background: language === 'en' ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                EN
              </button>
              <button
                type="button"
                className={cx('landing__lang-btn', { 'landing__lang-btn--active': language === 'vi' })}
                onClick={() => setLanguage('vi')}
                style={{ background: language === 'vi' ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer' }}
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
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Change Theme"
              >
                {theme === 'light' ? <Sun size={16} /> : theme === 'glass' ? <Sparkles size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
