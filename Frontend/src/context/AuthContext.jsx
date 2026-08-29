import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import {
  login,
  register,
  getUsers,
  checkUsername,
  checkMobile,
  verify2Fa,
  toggle2Fa as apiToggle2Fa,
  togglePrivacy as apiTogglePrivacy
} from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '', password: '', confirmPassword: '', email: '', mobileNumber: '', name: ''
  });

  const [usernameValidation, setUsernameValidation] = useState({ checking: false, available: null, message: '' });
  const [mobileValidation, setMobileValidation] = useState({ checking: false, available: null, message: '' });

  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');

  const [requires2Fa, setRequires2Fa] = useState(false);
  const [twoFaUsername, setTwoFaUsername] = useState('');
  const [otpInput, setOtpInput] = useState('');

  const [alert, setAlert] = useState(null);

  const triggerAlert = (type, message) => {
    const messageString = typeof message === 'object' && message !== null
      ? (message.message || JSON.stringify(message))
      : String(message || '');
    setAlert({ type, message: messageString });
    setTimeout(() => setAlert(null), 5000);
  };

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setCaptchaInput('');
  };

  const loadUsersList = () => {
    getUsers()
      .then(setUsers)
      .catch(() => { });
  };

  useEffect(() => {
    generateCaptcha();
    loadUsersList();
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setLoggedInUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    generateCaptcha();
  }, [authMode]);

  // Listen to unauthorized event
  useEffect(() => {
    const handleUnauthorized = () => {
      setLoggedInUser(null);
      triggerAlert('error', 'Please log in to access this page.');
    };
    window.addEventListener('unauthorized', handleUnauthorized);
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, []);

  // Real-time username check (debounced)
  useEffect(() => {
    if (!registerForm.username) {
      setUsernameValidation({ checking: false, available: null, message: '' });
      return;
    }

    const timeoutId = setTimeout(() => {
      setUsernameValidation({ checking: true, available: null, message: 'Checking availability...' });
      checkUsername(registerForm.username)
        .then(res => {
          if (res.available) {
            setUsernameValidation({ checking: false, available: true, message: 'Username is available!' });
          } else {
            setUsernameValidation({ checking: false, available: false, message: 'Username is already taken.' });
          }
        })
        .catch(() => {
          setUsernameValidation({ checking: false, available: null, message: '' });
        });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [registerForm.username]);

  // Real-time mobile number check
  useEffect(() => {
    const mobile = registerForm.mobileNumber;
    if (!mobile) {
      setMobileValidation({ checking: false, available: null, message: '' });
      return;
    }
    if (mobile.length !== 10) {
      setMobileValidation({ checking: false, available: null, message: 'Mobile must be exactly 10 digits.' });
      return;
    }

    setMobileValidation({ checking: true, available: null, message: 'Checking mobile number...' });
    checkMobile(mobile)
      .then(res => {
        if (res.available) {
          setMobileValidation({ checking: false, available: true, message: 'Mobile number is available!' });
        } else {
          setMobileValidation({ checking: false, available: false, message: 'THIS MOBILE NUMBER had been registered already' });
        }
      })
      .catch(() => {
        setMobileValidation({ checking: false, available: null, message: '' });
      });
  }, [registerForm.mobileNumber]);

  const handleLoginSubmit = (e) => {
    if (e) e.preventDefault();
    login(loginForm.username, loginForm.password)
      .then(res => {
        if (res.requires2Fa) {
          setRequires2Fa(true);
          setTwoFaUsername(res.username);
          triggerAlert('success', `Mã xác thực OTP đã được gửi giả lập tới email: ${res.email}. Vui lòng kiểm tra Console/Terminal backend để lấy mã.`);
        } else {
          const userPayload = {
            ...res,
            name: res.name || res.fullName || res.username
          };
          localStorage.setItem('user', JSON.stringify(userPayload));
          setLoggedInUser(userPayload);
          triggerAlert('success', `Welcome back, ${userPayload.name}!`);
          setLoginForm({ username: '', password: '' });
        }
      })
      .catch(err => {
        const errorMsg = err.response?.data?.message || 'Login failed.';
        triggerAlert('error', errorMsg);
      });
  };

  const handle2FaVerifySubmit = (e) => {
    if (e) e.preventDefault();
    verify2Fa(twoFaUsername, otpInput)
      .then(user => {
        localStorage.setItem('user', JSON.stringify(user));
        setLoggedInUser(user);
        setRequires2Fa(false);
        setOtpInput('');
        triggerAlert('success', `Logged in successfully as ${user.name}!`);
      })
      .catch(err => {
        const errorMsg = err.response?.data?.message || 'Invalid or expired OTP.';
        triggerAlert('error', errorMsg);
      });
  };

  const handleRegisterSubmit = (e) => {
    if (e) e.preventDefault();
    if (captchaInput.toLowerCase() !== captchaCode.toLowerCase()) {
      triggerAlert('error', 'Verification code is incorrect.');
      generateCaptcha();
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      triggerAlert('error', 'Passwords do not match.');
      return;
    }

    if (usernameValidation.available === false) {
      triggerAlert('error', 'Username is already taken.');
      return;
    }

    if (mobileValidation.available === false) {
      triggerAlert('error', 'THIS MOBILE NUMBER had been registered already');
      return;
    }

    register(registerForm)
      .then(user => {
        triggerAlert('success', 'Registration successful! You can now log in.');
        setAuthMode('login');
        setLoginForm({ username: registerForm.username, password: '' });
        setRegisterForm({ username: '', password: '', confirmPassword: '', email: '', mobileNumber: '', name: '' });
        loadUsersList();
      })
      .catch(err => {
        const errorMsg = err.response?.data?.message || 'Registration failed.';
        triggerAlert('error', errorMsg);
        generateCaptcha();
      });
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('user');
    setLoggedInUser(null);
    triggerAlert('success', 'You have been logged out.');
    setShowLogoutConfirm(false);
  };

  const handleDemoUserSwitch = (userId) => {
    const selected = users.find(u => u.id === userId);
    if (selected) {
      login(selected.username, selected.password)
        .then(user => {
          localStorage.setItem('user', JSON.stringify(user));
          setLoggedInUser(user);
          triggerAlert('success', `Switched context to ${user.name}`);
        })
        .catch(() => {
          triggerAlert('error', `Failed to switch context to ${selected.name}`);
        });
    }
  };

  const updateLoggedInUserLocal = (updates) => {
    setLoggedInUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const LogoutConfirmModal = () => {
    const { t } = useLanguage();
    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(14, 22, 33, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 100000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
        onClick={() => setShowLogoutConfirm(false)}
      >
        <div 
          className="modal-content"
          style={{
            maxWidth: '380px',
            textAlign: 'center',
            padding: '30px',
            animation: 'modalSlide 0.25s cubic-bezier(0.1, 0.8, 0.3, 1)',
            background: 'var(--bg-sidebar)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontSize: '3rem', margin: '10px 0 5px 0' }}>
            🚪
          </div>
          <div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)' }}>
              {t('logout_confirm_title')}
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              {t('logout_confirm_msg')}
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '10px' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowLogoutConfirm(false)}
              style={{ flex: 1 }}
            >
              {t('btn_cancel')}
            </button>
            <button 
              className="btn btn-danger" 
              onClick={confirmLogout}
              style={{ flex: 1 }}
            >
              {t('logout')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AuthContext.Provider value={{
      users,
      loggedInUser,
      setLoggedInUser,
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
      twoFaUsername,
      otpInput,
      setOtpInput,
      alert,
      triggerAlert,
      handleLoginSubmit,
      handle2FaVerifySubmit,
      handleRegisterSubmit,
      handleLogout,
      handleDemoUserSwitch,
      updateLoggedInUserLocal,
      loadUsersList
    }}>
      {children}
      {showLogoutConfirm && <LogoutConfirmModal />}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
