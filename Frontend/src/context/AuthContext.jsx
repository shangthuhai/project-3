import React, { createContext, useContext, useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { useLanguage } from './LanguageContext';
import { firebaseAuth, googleProvider, isFirebaseConfigured } from '../firebase';
import {
  login,
  register,
  getUsers,
  checkUsername,
  checkMobile,
  checkEmail,
  sendRegisterOtp,
  sendForgotPasswordOtp,
  resetPassword,
  verify2Fa,
  loginWithGoogle,
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
  const [emailValidation, setEmailValidation] = useState({ checking: false, available: null, message: '' });

  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // Forgot Password State
  const [forgotForm, setForgotForm] = useState({
    email: '',
    otpCode: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [sendingForgotOtp, setSendingForgotOtp] = useState(false);
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotOtpTimer, setForgotOtpTimer] = useState(0);


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

  // OTP Countdown Timer effect
  useEffect(() => {
    let timer;
    if (otpTimer > 0) {
      timer = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpTimer]);

  // Forgot Password OTP Countdown Timer effect
  useEffect(() => {
    let timer;
    if (forgotOtpTimer > 0) {
      timer = setInterval(() => {
        setForgotOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [forgotOtpTimer]);

  const handleSendForgotPasswordOtp = () => {
    const email = forgotForm.email?.trim();
    if (!email || !email.includes('@')) {
      triggerAlert('error', 'Vui lòng nhập địa chỉ Email hợp lệ trước khi gửi mã OTP.');
      return;
    }

    setSendingForgotOtp(true);
    sendForgotPasswordOtp(email)
      .then(() => {
        setSendingForgotOtp(false);
        setForgotOtpSent(true);
        setForgotOtpTimer(60);
        triggerAlert('success', `Mã OTP khôi phục mật khẩu đã được gửi tới email: ${email}. Vui lòng kiểm tra hộp thư hoặc Console/Terminal backend để lấy mã.`);
      })
      .catch((err) => {
        setSendingForgotOtp(false);
        const errorMsg = err.response?.data?.message || 'Không thể gửi mã OTP. Vui lòng thử lại.';
        triggerAlert('error', errorMsg);
      });
  };

  const handleResetPasswordSubmit = (e) => {
    if (e) e.preventDefault();

    if (!forgotForm.email?.trim()) {
      triggerAlert('error', 'Vui lòng nhập địa chỉ Email.');
      return;
    }
    if (!forgotForm.otpCode?.trim() || forgotForm.otpCode.trim().length !== 6) {
      triggerAlert('error', 'Vui lòng nhập đủ 6 chữ số mã OTP đã gửi qua Email.');
      return;
    }
    if (!forgotForm.newPassword) {
      triggerAlert('error', 'Vui lòng nhập Mật khẩu mới.');
      return;
    }
    if (forgotForm.newPassword.length < 6) {
      triggerAlert('error', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (!forgotForm.confirmNewPassword) {
      triggerAlert('error', 'Vui lòng xác nhận lại Mật khẩu mới.');
      return;
    }
    if (forgotForm.newPassword !== forgotForm.confirmNewPassword) {
      triggerAlert('error', 'Mật khẩu mới và xác nhận mật khẩu không trùng khớp.');
      return;
    }

    resetPassword({
      email: forgotForm.email.trim(),
      otpCode: forgotForm.otpCode.trim(),
      newPassword: forgotForm.newPassword,
      confirmNewPassword: forgotForm.confirmNewPassword
    })
      .then((res) => {
        triggerAlert('success', res.message || 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.');
        setAuthMode('login');
        setLoginForm({ username: forgotForm.email.trim(), password: '' });
        setForgotForm({ email: '', otpCode: '', newPassword: '', confirmNewPassword: '' });
        setForgotOtpSent(false);
        setForgotOtpTimer(0);
      })
      .catch((err) => {
        const errorMsg = err.response?.data?.message || 'Đặt lại mật khẩu thất bại.';
        triggerAlert('error', errorMsg);
      });
  };


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

  // Real-time email check (debounced)
  useEffect(() => {
    const email = registerForm.email?.trim();
    if (!email || !email.includes('@')) {
      setEmailValidation({ checking: false, available: null, message: '' });
      return;
    }

    const timeoutId = setTimeout(() => {
      setEmailValidation({ checking: true, available: null, message: 'Checking email availability...' });
      checkEmail(email)
        .then(res => {
          if (res.available) {
            setEmailValidation({ checking: false, available: true, message: 'Email is available!' });
          } else {
            setEmailValidation({ checking: false, available: false, message: 'Email is already registered.' });
          }
        })
        .catch(() => {
          setEmailValidation({ checking: false, available: null, message: '' });
        });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [registerForm.email]);

  const handleSendRegisterOtp = () => {
    const email = registerForm.email?.trim();
    if (!email || !email.includes('@')) {
      triggerAlert('error', 'Vui lòng nhập Email hợp lệ trước khi gửi mã OTP.');
      return;
    }

    if (emailValidation.available === false) {
      triggerAlert('error', 'Email này đã được đăng ký tài khoản.');
      return;
    }

    setSendingOtp(true);
    sendRegisterOtp(email)
      .then(() => {
        setSendingOtp(false);
        setOtpSent(true);
        setOtpTimer(60);
        triggerAlert('success', `Mã OTP xác thực đã được gửi tới email: ${email}. Vui lòng kiểm tra hộp thư hoặc Console/Terminal backend để lấy mã.`);
      })
      .catch((err) => {
        setSendingOtp(false);
        const errorMsg = err.response?.data?.message || 'Không thể gửi mã OTP. Vui lòng thử lại.';
        triggerAlert('error', errorMsg);
      });
  };


  const handleLoginSubmit = (e) => {
    if (e) e.preventDefault();
    if (!loginForm.username?.trim()) {
      triggerAlert('error', 'Vui lòng nhập Tên đăng nhập.');
      return;
    }
    if (!loginForm.password) {
      triggerAlert('error', 'Vui lòng nhập Mật khẩu.');
      return;
    }

    login(loginForm.username.trim(), loginForm.password)
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

  const handleGoogleSignIn = () => {
    if (!isFirebaseConfigured || !firebaseAuth) {
      triggerAlert('error', 'Google sign-in is not configured. Add the Firebase VITE_* variables first.');
      return;
    }

    signInWithPopup(firebaseAuth, googleProvider)
      .then(async ({ user }) => {
        const idToken = await user.getIdToken();
        const result = await loginWithGoogle(idToken);
        const userPayload = { ...result, name: result.name || result.fullName || result.username };
        localStorage.setItem('user', JSON.stringify(userPayload));
        setLoggedInUser(userPayload);
        triggerAlert('success', `Welcome, ${userPayload.name}!`);
      })
      .catch(err => {
        const errorMsg = err.response?.data?.message || err.message || 'Google sign-in failed.';
        triggerAlert('error', errorMsg);
      });
  };

  const handle2FaVerifySubmit = (e) => {
    if (e) e.preventDefault();
    if (!otpInput || otpInput.trim().length !== 6) {
      triggerAlert('error', 'Vui lòng nhập đủ 6 chữ số mã xác thực OTP.');
      return;
    }

    verify2Fa(twoFaUsername, otpInput.trim())
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

    // Comprehensive Field Validation (Full Name is optional, auto-generated if empty)
    if (!registerForm.email?.trim()) {
      triggerAlert('error', 'Vui lòng nhập địa chỉ Email.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email.trim())) {
      triggerAlert('error', 'Địa chỉ Email không đúng định dạng.');
      return;
    }

    if (emailValidation.available === false) {
      triggerAlert('error', 'Email này đã được đăng ký tài khoản.');
      return;
    }

    if (!emailOtpCode || emailOtpCode.trim().length !== 6) {
      triggerAlert('error', 'Vui lòng nhập đủ 6 chữ số mã OTP đã gửi qua Email.');
      return;
    }

    if (!registerForm.mobileNumber?.trim() || registerForm.mobileNumber.length !== 10) {
      triggerAlert('error', 'Vui lòng nhập đúng 10 chữ số điện thoại.');
      return;
    }

    if (mobileValidation.available === false) {
      triggerAlert('error', 'Số điện thoại này đã được đăng ký.');
      return;
    }

    if (!registerForm.username?.trim()) {
      triggerAlert('error', 'Vui lòng nhập Tên đăng nhập.');
      return;
    }

    if (usernameValidation.available === false) {
      triggerAlert('error', 'Tên đăng nhập này đã được sử dụng.');
      return;
    }

    if (!registerForm.password) {
      triggerAlert('error', 'Vui lòng nhập Mật khẩu.');
      return;
    }

    if (!registerForm.confirmPassword) {
      triggerAlert('error', 'Vui lòng nhập lại Mật khẩu xác nhận.');
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      triggerAlert('error', 'Mật khẩu xác nhận không trùng khớp với Mật khẩu.');
      return;
    }

    if (!captchaInput?.trim()) {
      triggerAlert('error', 'Vui lòng nhập Mã xác nhận Captcha.');
      return;
    }

    if (captchaInput.toLowerCase() !== captchaCode.toLowerCase()) {
      triggerAlert('error', 'Mã Captcha không chính xác, vui lòng thử lại.');
      generateCaptcha();
      return;
    }

    // Auto-generate random name if name is left blank
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const finalName = registerForm.name?.trim() || `User_${registerForm.username?.trim() || randomSuffix}`;

    register({
      ...registerForm,
      name: finalName,
      username: registerForm.username.trim(),
      email: registerForm.email.trim(),
      mobileNumber: registerForm.mobileNumber.trim(),
      emailOtpCode: emailOtpCode.trim()
    })
      .then(user => {
        triggerAlert('success', 'Registration successful! You can now log in.');
        setAuthMode('login');
        setLoginForm({ username: registerForm.username, password: '' });
        setRegisterForm({ username: '', password: '', confirmPassword: '', email: '', mobileNumber: '', name: '' });
        setEmailOtpCode('');
        setOtpSent(false);
        setOtpTimer(0);
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
      const token = updates?.token || prev.token;
      const updated = { ...prev, ...updates, token };
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
          <div style={{ margin: '10px 0 5px 0', display: 'flex', justifyContent: 'center', opacity: 0.85 }}>
            <LogOut size={48} color="var(--color-danger)" />
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
      twoFaUsername,
      otpInput,
      setOtpInput,
      alert,
      setAlert,
      triggerAlert,
      handleLoginSubmit,
      handleGoogleSignIn,
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
