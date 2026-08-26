import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function LandingView() {
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
    <div className="landing-page">
      {/* Left Column: Website info */}
      <div className="landing-left">
        <div className="landing-hero">
          <h1>Online SMS Hub</h1>
          <p>
            Connect with friends, manage your contacts, and receive automated updates on Jokes, Sports, and News directly to your mobile.
          </p>
        </div>

        <div className="features-list">
          <div className="feature-item">
            <div className="feature-icon">💬</div>
            <div className="feature-text">
              <h3>Chat and Message friends</h3>
              <p>Send unlimited free messages to any registered user in your friend list.</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon">⚡</div>
            <div className="feature-text">
              <h3>SMS to Non-Friends</h3>
              <p>Allowing 5 free SMS messages per phone number to connect instantly with unregistered users.</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon">📰</div>
            <div className="feature-text">
              <h3>Paid SMS Services</h3>
              <p>Activate premium daily updates for Sports scores, News alerts, Current affairs, or Jokes.</p>
            </div>
          </div>
        </div>

        {/* Quick Demo Swapper widget for easy evaluation */}
        {users.length > 0 && (
          <div className="user-switcher-container" style={{ width: 'fit-content', marginTop: '30px' }}>
            <div className="user-switcher-info">
              <span className="user-switcher-label">Demo Quick Log In</span>
              <select
                className="user-select"
                defaultValue=""
                onChange={(e) => handleDemoUserSwitch(parseInt(e.target.value))}
              >
                <option value="" disabled>Select pre-seeded account...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.username})</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Auth forms */}
      <div className="landing-right">
        <div className="landing-header">
          <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            {authMode === 'login' ? "Don't have an account?" : "Already registered?"}
          </span>
          <button
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
          >
            {authMode === 'login' ? 'Sign Up' : 'Log In'}
          </button>
        </div>

        {requires2Fa ? (
          /* 2FA CODE FORM */
          <div className="auth-card">
            <h2>Xác thực 2 lớp (2FA)</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
              Vui lòng nhập mã OTP 6 số đã được gửi tới email của bạn.
            </p>
            <form onSubmit={handle2FaVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="form-group">
                <label>Mã OTP</label>
                <input
                  type="text"
                  placeholder="Nhập 6 số (e.g. 123456)"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').substring(0, 6))}
                  maxLength={6}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '12px' }}>
                Xác minh & Đăng nhập
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setRequires2Fa(false);
                  setOtpInput('');
                }}
              >
                Quay lại đăng nhập
              </button>
            </form>
          </div>
        ) : authMode === 'login' ? (
          /* LOGIN CARD */
          <div className="auth-card">
            <h2>Account Login</h2>
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '10px', padding: '12px' }}>
                Log In
              </button>
            </form>
          </div>
        ) : (
          /* REGISTRATION CARD */
          <div className="auth-card" style={{ maxWidth: '480px' }}>
            <h2>Create Account</h2>
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email ID</label>
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
                <label>Username</label>
                <input
                  type="text"
                  placeholder="Create username"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                  required
                />
                {usernameValidation.message && (
                  <span className={`validation-info ${usernameValidation.available === true ? 'success' : usernameValidation.available === false ? 'error' : 'checking'}`}>
                    {usernameValidation.available === true && <span style={{ marginRight: '4px' }}>✓</span>}
                    {usernameValidation.available === false && <span style={{ marginRight: '4px' }}>✗</span>}
                    <span>{usernameValidation.message}</span>
                  </span>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    placeholder="Password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
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
                <label>Mobile Number (10 digits)</label>
                <input
                  type="text"
                  placeholder="e.g. 0912345678"
                  value={registerForm.mobileNumber}
                  onChange={(e) => setRegisterForm({ ...registerForm, mobileNumber: e.target.value.replace(/\D/g, '').substring(0, 10) })}
                  maxLength={10}
                  required
                />
                {mobileValidation.message && (
                  <span className={`validation-info ${mobileValidation.available === true ? 'success' : mobileValidation.available === false ? 'error' : 'checking'}`}>
                    {mobileValidation.available === true && <span style={{ marginRight: '4px' }}>✓</span>}
                    {mobileValidation.available === false && <span style={{ marginRight: '4px' }}>✗</span>}
                    <span>{mobileValidation.message}</span>
                  </span>
                )}
              </div>

              {/* Captcha/Verification Code widget */}
              <div className="form-group">
                <label>Verification Code</label>
                <div className="captcha-container">
                  <div className="captcha-image-mockup">{captchaCode}</div>
                  <button type="button" className="captcha-refresh-btn" onClick={generateCaptcha}>
                    ↻
                  </button>
                  <input
                    type="text"
                    placeholder="Enter code"
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
                Create Account
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
