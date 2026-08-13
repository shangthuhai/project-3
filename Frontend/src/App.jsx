import React, { useState, useEffect, useRef } from 'react';
import {
  getUsers,
  getUser,
  updateUser,
  getContacts,
  addContact,
  deleteContact,
  getFriends,
  getPendingRequests,
  sendFriendRequest,
  respondFriendRequest,
  getChatHistory,
  getQuota,
  sendMessage,
  getActivatedServices,
  activateService,
  login,
  register,
  checkUsername,
  checkMobile
} from './api';

export default function App() {
  // Authentication & Session
  const [users, setUsers] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState(null); // Authenticated User profile
  const [authMode, setAuthMode] = useState('login'); // login | register
  
  // Public Forms States
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '', password: '', confirmPassword: '', email: '', mobileNumber: '', name: ''
  });
  
  // Real-time Validations States
  const [usernameValidation, setUsernameValidation] = useState({ checking: false, available: null, message: '' });
  const [mobileValidation, setMobileValidation] = useState({ checking: false, available: null, message: '' });
  
  // Captcha State
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');

  // Dashboard Context State
  const [activeTab, setActiveTab] = useState('chats'); // chats, contacts, requests, services, profile
  const [contacts, setContacts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  
  // Active Chat Session
  const [selectedContact, setSelectedContact] = useState(null); // { name, contactNumber, isFriend }
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [remainingQuota, setRemainingQuota] = useState(null); // { isFriend, remaining, limit, sentCount }
  
  // Premium Services
  const [activatedServices, setActivatedServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]); // List of service names checked for activation
  
  // Modals state
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Dashboard Modal Forms
  const [contactForm, setContactForm] = useState({ firstName: '', lastName: '', contactNumber: '' });
  const [requestForm, setRequestForm] = useState({ email: '' });
  const [paymentForm, setPaymentForm] = useState({ cardNumber: '', expiryDate: '', cvv: '' });
  const [profileForm, setProfileForm] = useState({});
  
  // Global Alerts/Notifications
  const [alert, setAlert] = useState(null); // { type: 'success'|'error', message: '' }
  
  // Refs
  const messagesEndRef = useRef(null);

  // Initialize Captcha and load switcher users
  useEffect(() => {
    generateCaptcha();
    loadUsersList();
  }, []);

  // Generate Captcha whenever switching auth mode
  useEffect(() => {
    generateCaptcha();
  }, [authMode]);

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

  // Load backend private details when loggedInUser becomes available
  useEffect(() => {
    if (!loggedInUser) return;
    
    // Fetch private dashboard state
    refreshDashboardData();
    
    // Reset selections
    setSelectedContact(null);
    setChatMessages([]);
    setSelectedServices([]);
  }, [loggedInUser]);

  // Poll chat messages if selected contact is open
  useEffect(() => {
    if (!loggedInUser || !selectedContact) return;

    loadChatDetails();
    
    const interval = setInterval(() => {
      loadChatMessagesOnly();
    }, 3000);

    return () => clearInterval(interval);
  }, [loggedInUser, selectedContact]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const triggerAlert = (type, message) => {
    setAlert({ type, message });
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
      .catch(() => {});
  };

  const refreshDashboardData = () => {
    getContacts(loggedInUser.id).then(setContacts).catch(() => {});
    getFriends(loggedInUser.id).then(setFriends).catch(() => {});
    getPendingRequests(loggedInUser.id).then(setPendingRequests).catch(() => {});
    getActivatedServices(loggedInUser.id)
      .then(data => setActivatedServices(data.map(s => s.serviceName)))
      .catch(() => {});
    setProfileForm(loggedInUser);
  };

  const loadChatDetails = () => {
    getChatHistory(loggedInUser.id, selectedContact.contactNumber)
      .then(setChatMessages)
      .catch(() => triggerAlert('error', 'Failed to load chat history'));

    getQuota(loggedInUser.id, selectedContact.contactNumber)
      .then(setRemainingQuota)
      .catch(() => triggerAlert('error', 'Failed to fetch message quota'));
  };

  const loadChatMessagesOnly = () => {
    if (!loggedInUser || !selectedContact) return;
    getChatHistory(loggedInUser.id, selectedContact.contactNumber)
      .then(setChatMessages)
      .catch(() => {});
  };

  // Auth Submissions
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    login(loginForm.username, loginForm.password)
      .then(user => {
        setActiveTab('chats');
        setSelectedContact(null);
        setLoggedInUser(user);
        triggerAlert('success', `Welcome back, ${user.name}!`);
        setLoginForm({ username: '', password: '' });
      })
      .catch(err => {
        const errorMsg = err.response?.data?.message || 'Login failed.';
        triggerAlert('error', errorMsg);
      });
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    
    // Captcha Validation
    if (captchaInput !== captchaCode) {
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
        triggerAlert('success', 'Account created successfully. Opening chat workspace...');
        setAuthMode('login');
        setActiveTab('chats');
        setSelectedContact(null);
        setLoggedInUser(user);
        setRegisterForm({ username: '', password: '', confirmPassword: '', email: '', mobileNumber: '', name: '' });
        setCaptchaInput('');
        loadUsersList(); // Update user switcher list
      })
      .catch(err => {
        const errorMsg = err.response?.data?.message || 'Registration failed.';
        triggerAlert('error', errorMsg);
        generateCaptcha();
      });
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    triggerAlert('success', 'You have been logged out.');
  };

  // Demo user switcher helper (instantly logs in as the selected switcher user)
  const handleDemoUserSwitch = (e) => {
    const userId = parseInt(e.target.value);
    const selected = users.find(u => u.id === userId);
    if (selected) {
      setLoggedInUser(selected);
      triggerAlert('success', `Switched context to ${selected.name}`);
    }
  };

  // Contacts Actions
  const handleAddContactSubmit = (e) => {
    e.preventDefault();
    const payload = {
      userId: loggedInUser.id,
      firstName: contactForm.firstName,
      lastName: contactForm.lastName,
      contactNumber: contactForm.contactNumber
    };

    addContact(payload)
      .then(newContact => {
        setContacts([...contacts, newContact]);
        setContactForm({ firstName: '', lastName: '', contactNumber: '' });
        setShowAddContactModal(false);
        triggerAlert('success', `Added contact ${newContact.firstName} successfully.`);
      })
      .catch(err => {
        const errorMsg = err.response?.data?.message || 'Failed to add contact.';
        triggerAlert('error', errorMsg);
      });
  };

  const handleDeleteContact = (id, name) => {
    if (!window.confirm(`Are you sure you want to delete contact ${name}?`)) return;
    deleteContact(id)
      .then(() => {
        setContacts(contacts.filter(c => c.id !== id));
        triggerAlert('success', 'Contact deleted.');
        if (selectedContact && contacts.find(c => c.id === id)?.contactNumber === selectedContact.contactNumber) {
          setSelectedContact(null);
        }
      })
      .catch(() => triggerAlert('error', 'Failed to delete contact.'));
  };

  // Friend Request Actions
  const handleSendRequestSubmit = (e) => {
    e.preventDefault();
    sendFriendRequest(loggedInUser.id, requestForm.email)
      .then(res => {
        setRequestForm({ email: '' });
        triggerAlert('success', res.message);
      })
      .catch(err => {
        const errorMsg = err.response?.data?.message || 'Failed to send request.';
        triggerAlert('error', errorMsg);
      });
  };

  const handleRespondRequest = (connectionId, accept) => {
    respondFriendRequest(connectionId, accept)
      .then(res => {
        setPendingRequests(pendingRequests.filter(r => r.connectionId !== connectionId));
        if (accept) {
          getFriends(loggedInUser.id).then(setFriends);
        }
        triggerAlert('success', res.message);
      })
      .catch(() => triggerAlert('error', 'Failed to respond to request.'));
  };

  // Message Sending Action
  const handleSendMessageSubmit = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || newMessage.length > 120) return;

    sendMessage(loggedInUser.id, selectedContact.contactNumber, newMessage.trim())
      .then(msg => {
        setChatMessages([...chatMessages, msg]);
        setNewMessage('');
        getQuota(loggedInUser.id, selectedContact.contactNumber).then(setRemainingQuota);
      })
      .catch(err => {
        const errorMsg = err.response?.data?.message || 'Failed to send message.';
        triggerAlert('error', errorMsg);
      });
  };

  // Premium Services checklist toggling
  const handleServiceCheck = (serviceName) => {
    if (selectedServices.includes(serviceName)) {
      setSelectedServices(selectedServices.filter(s => s !== serviceName));
    } else {
      setSelectedServices([...selectedServices, serviceName]);
    }
  };

  const handlePaymentCheckoutClick = () => {
    if (selectedServices.length === 0) return;
    setPaymentForm({ cardNumber: '', expiryDate: '', cvv: '' });
    setShowPaymentModal(true);
  };

  // Submit sequential activations in a bundle payment
  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    
    // Trigger sequential activation API calls for each selected service
    const promises = selectedServices.map(serviceName => 
      activateService(loggedInUser.id, serviceName, paymentForm.cardNumber, paymentForm.expiryDate, paymentForm.cvv)
    );

    Promise.all(promises)
      .then(() => {
        setActivatedServices([...activatedServices, ...selectedServices]);
        setSelectedServices([]);
        setShowPaymentModal(false);
        triggerAlert('success', 'Selected premium services activated successfully!');
      })
      .catch(err => {
        const errorMsg = err.response?.data?.message || 'Payment processing failed.';
        triggerAlert('error', errorMsg);
      });
  };

  // Profile Update Actions
  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileForm({ ...profileForm, [name]: value });
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileForm({ ...profileForm, profilePhoto: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateUser(loggedInUser.id, profileForm)
      .then(updated => {
        setLoggedInUser(updated);
        getUsers().then(setUsers);
        triggerAlert('success', 'Profile updated successfully.');
      })
      .catch(() => triggerAlert('error', 'Failed to update profile.'));
  };

  // Start chat helper
  const startChat = (contactName, contactNumber, isFriend) => {
    setSelectedContact({ name: contactName, contactNumber, isFriend });
    setActiveTab('chats');
  };

  const getCharCounterClass = () => {
    const count = newMessage.length;
    if (count > 120) return 'char-counter danger';
    if (count > 100) return 'char-counter warning';
    return 'char-counter safe';
  };

  // Pricing helper
  const getServicePrice = (name) => {
    const prices = { 'Joke': 2.99, 'Current Affairs': 4.99, 'Sports': 3.99, 'News': 4.99 };
    return prices[name] || 0;
  };

  const getTotalSelectedPrice = () => {
    return selectedServices.reduce((sum, service) => sum + getServicePrice(service), 0).toFixed(2);
  };

  // Render Sidebar Content list
  const renderSidebarList = () => {
    if (activeTab === 'chats') {
      const chatItems = [];

      // Add Friends
      friends.forEach(f => {
        chatItems.push({
          id: f.id,
          name: f.name,
          contactNumber: f.mobileNumber,
          avatar: f.profilePhoto,
          isFriend: true,
          subtext: 'Friend'
        });
      });

      // Add Contacts (Not friends)
      contacts.forEach(c => {
        const alreadyAdded = chatItems.some(i => i.contactNumber === c.contactNumber);
        if (!alreadyAdded) {
          chatItems.push({
            id: `c_${c.id}`,
            name: `${c.firstName} ${c.lastName}`,
            contactNumber: c.contactNumber,
            avatar: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%237f91a4"/><text x="50%" y="50%" font-family="sans-serif" font-weight="bold" font-size="40" fill="white" text-anchor="middle" dominant-baseline="central">${c.firstName ? c.firstName[0] : ''}${c.lastName ? c.lastName[0] : ''}</text></svg>`,
            isFriend: false,
            subtext: 'Contact (Non-friend)'
          });
        }
      });

      if (chatItems.length === 0) {
        return <div className="empty-list-message">No active chats. Add contacts to begin messaging.</div>;
      }

      return chatItems.map(item => (
        <div 
          key={item.contactNumber} 
          className={`sidebar-list-item ${selectedContact?.contactNumber === item.contactNumber ? 'selected' : ''}`}
          onClick={() => setSelectedContact(item)}
        >
          <img src={item.avatar} alt={item.name} className="item-avatar" />
          <div className="item-details">
            <div className="item-row">
              <span className="item-name">{item.name}</span>
              <span className="item-meta">{item.contactNumber}</span>
            </div>
            <div className="item-row">
              <span className="item-subtext">{item.subtext}</span>
              <span className={`item-status-badge ${item.isFriend ? 'friend' : 'non-friend'}`}>
                {item.isFriend ? 'Free' : 'Free 5/5'}
              </span>
            </div>
          </div>
        </div>
      ));
    }

    if (activeTab === 'contacts') {
      return (
        <>
          <button className="add-contact-trigger-btn" onClick={() => setShowAddContactModal(true)}>
            <span>+</span> Add New Contact
          </button>
          
          {contacts.length === 0 ? (
            <div className="empty-list-message">Your contact list is empty.</div>
          ) : (
            contacts.map(c => {
              const isFriend = friends.some(f => f.mobileNumber === c.contactNumber);
              return (
                <div key={c.id} className="sidebar-list-item">
                  <div className="item-avatar" style={{
                    width: '44px', height: '44px', borderRadius: '50%', background: '#3b5998', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                  }}>
                    {c.firstName ? c.firstName[0] : ''}{c.lastName ? c.lastName[0] : ''}
                  </div>
                  <div className="item-details">
                    <div className="item-row">
                      <span className="item-name">{c.firstName} {c.lastName}</span>
                      <button 
                        className="btn-danger" 
                        style={{ padding: '2px 8px', fontSize: '0.75rem', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteContact(c.id, `${c.firstName} ${c.lastName}`);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                    <div className="item-row">
                      <span className="item-subtext">{c.contactNumber}</span>
                      <button 
                        className="btn-primary" 
                        style={{ padding: '2px 8px', fontSize: '0.75rem', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                        onClick={() => startChat(`${c.firstName} ${c.lastName}`, c.contactNumber, isFriend)}
                      >
                        Chat
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </>
      );
    }

    return null;
  };

  // ==================== RENDERING VIEW ROUTER ====================
  
  // Public Landing / Authenticating View
  if (!loggedInUser) {
    return (
      <div className="landing-page">
        {/* Alerts Banner */}
        {alert && (
          <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, width: '90%', maxWidth: '500px' }}>
            <div className={`custom-alert ${alert.type}`}>
              {alert.type === 'success' ? '✓' : '⚠'} {alert.message}
            </div>
          </div>
        )}

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
                <select className="user-select" defaultValue="" onChange={(e) => {
                  const select = users.find(u => u.id === parseInt(e.target.value));
                  if (select) setLoggedInUser(select);
                }}>
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

          {authMode === 'login' ? (
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
                      {usernameValidation.available === true ? '✓ ' : usernameValidation.available === false ? '✗ ' : ''}
                      {usernameValidation.message}
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
                      {mobileValidation.available === true ? '✓ ' : mobileValidation.available === false ? '✗ ' : ''}
                      {mobileValidation.message}
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
                  disabled={!registerForm.username || !registerForm.password || !registerForm.confirmPassword || !registerForm.email || !registerForm.mobileNumber || !registerForm.name || !captchaInput || registerForm.password !== registerForm.confirmPassword}
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

  // Private Authenticated Views
  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="app-title-area" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="app-logo">💬</div>
              <h2>SMS Workspace</h2>
            </div>
            
            {/* Real Logout button */}
            <button className="header-logout-btn" onClick={handleLogout}>Log Out</button>
          </div>
          
          {/* Switcher Context is kept for easy pair programming/evaluation */}
          <div className="user-switcher-container">
            <img src={loggedInUser.profilePhoto} alt={loggedInUser.name} className="user-switcher-avatar" />
            <div className="user-switcher-info">
              <span className="user-switcher-label">Logged In As</span>
              <select className="user-select" value={loggedInUser.id} onChange={handleDemoUserSwitch}>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.mobileNumber})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="sidebar-tabs">
          <button className={`tab-btn ${activeTab === 'chats' ? 'active' : ''}`} onClick={() => setActiveTab('chats')}>
            Chats
          </button>
          <button className={`tab-btn ${activeTab === 'contacts' ? 'active' : ''}`} onClick={() => setActiveTab('contacts')}>
            Contacts
          </button>
          <button className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
            Requests {pendingRequests.length > 0 && <span className="badge">{pendingRequests.length}</span>}
          </button>
          <button className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`} onClick={() => setActiveTab('services')}>
            Services
          </button>
          <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            Profile
          </button>
        </div>

        <div className="sidebar-list-container">
          {renderSidebarList()}
          {['requests', 'services', 'profile'].includes(activeTab) && (
            <div className="empty-list-message" style={{ opacity: 0.7 }}>
              Content is open in the main panel.
            </div>
          )}
        </div>
      </div>

      {/* Main Panel Content Router */}
      <div className="main-workspace">
        {/* Global Notification Banner */}
        {alert && (
          <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, width: '90%', maxWidth: '500px' }}>
            <div className={`custom-alert ${alert.type}`}>
              {alert.type === 'success' ? '✓' : '⚠'} {alert.message}
            </div>
          </div>
        )}

        {/* Private Views */}
        {activeTab === 'chats' && selectedContact ? (
          /* CHAT AREA VIEW */
          <>
            <div className="chat-header">
              <div className="chat-header-user">
                <img 
                  src={selectedContact.avatar || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%237f91a4"/><text x="50%" y="50%" font-family="sans-serif" font-weight="bold" font-size="40" fill="white" text-anchor="middle" dominant-baseline="central">${selectedContact.name[0]}</text></svg>`} 
                  alt={selectedContact.name} 
                  className="item-avatar"
                  style={{ width: '38px', height: '38px' }}
                />
                <div className="chat-header-info">
                  <h3>{selectedContact.name}</h3>
                  <p>{selectedContact.contactNumber} • {remainingQuota?.isFriend ? 'Friend (Unlimited SMS)' : 'Non-friend (5 Free Messages Limit)'}</p>
                </div>
              </div>
            </div>

            {remainingQuota && !remainingQuota.isFriend && (
              <div className="chat-quota-banner">
                <span>
                  <strong>SMS Quota:</strong> {remainingQuota.remaining} of {remainingQuota.limit} free messages left for this number.
                </span>
                <button onClick={() => {
                  setActiveTab('requests');
                  setRequestForm({ email: '' });
                }}>
                  Send Friend Request for Unlimited
                </button>
              </div>
            )}

            <div className="chat-messages-area">
              {chatMessages.length === 0 ? (
                <div style={{ margin: 'auto', textAlign: 'center', opacity: 0.3, fontSize: '0.9rem' }}>
                  No messages yet. Say hello!
                </div>
              ) : (
                chatMessages.map(msg => {
                  const isSentByMe = msg.senderId === loggedInUser.id;
                  const date = new Date(msg.sentTime);
                  const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={msg.id} className={`message-bubble-row ${isSentByMe ? 'sent' : 'received'}`}>
                      <div className="message-bubble">
                        <span className="message-text">{msg.content}</span>
                        <span className="message-time">{formattedTime}</span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleSendMessageSubmit}>
              <div className="chat-input-row">
                <div className="chat-textarea-container">
                  <textarea 
                    className="chat-textarea" 
                    placeholder={
                      remainingQuota?.remaining === 0 && !remainingQuota?.isFriend 
                      ? "SMS limit reached. Friend this user to chat." 
                      : "Type an SMS message..."
                    }
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value.substring(0, 150))}
                    disabled={remainingQuota?.remaining === 0 && !remainingQuota?.isFriend}
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessageSubmit(e);
                      }
                    }}
                  />
                  <div className="chat-input-controls">
                    <span className={getCharCounterClass()}>
                      {newMessage.length}/120
                    </span>
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="send-msg-btn"
                  disabled={!newMessage.trim() || newMessage.length > 120 || (remainingQuota?.remaining === 0 && !remainingQuota?.isFriend)}
                >
                  ➤
                </button>
              </div>
            </form>
          </>
        ) : activeTab === 'chats' ? (
          <div className="workspace-placeholder">
            <div className="placeholder-icon">💬</div>
            <h3>Welcome to SMS Chat System</h3>
            <p>Select a chat from the sidebar or go to the Contacts tab to start a new thread.</p>
          </div>
        ) : null}

        {/* Requests view */}
        {activeTab === 'requests' && (
          <div className="view-panel">
            <div className="view-header">
              <h1>Friend Requests</h1>
              <p>Add friends by email to unlock unlimited free SMS messaging.</p>
            </div>
            
            <div className="requests-grid">
              <div className="pending-requests-card" style={{ height: 'fit-content' }}>
                <h3 style={{ marginBottom: '15px', color: 'var(--color-primary-hover)' }}>Send Friend Request</h3>
                <form onSubmit={handleSendRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div className="form-group">
                    <label>Friend's Email Address</label>
                    <input 
                      type="email" 
                      placeholder="e.g. bob@example.com" 
                      value={requestForm.email}
                      onChange={(e) => setRequestForm({ email: e.target.value })}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">Send Request</button>
                </form>
              </div>

              <div className="pending-requests-card">
                <h3 style={{ marginBottom: '15px', color: 'var(--color-primary-hover)' }}>
                  Pending Requests ({pendingRequests.length})
                </h3>
                {pendingRequests.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No pending incoming friend requests.</p>
                ) : (
                  pendingRequests.map(req => (
                    <div key={req.connectionId} className="pending-request-item">
                      <img src={req.senderPhoto} alt={req.senderName} />
                      <div className="pending-request-info">
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{req.senderName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.senderEmail} ({req.senderMobile})</div>
                      </div>
                      <div className="pending-request-actions">
                        <button className="request-btn accept" onClick={() => handleRespondRequest(req.connectionId, true)}>
                          Accept
                        </button>
                        <button className="request-btn reject" onClick={() => handleRespondRequest(req.connectionId, false)}>
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Services checklist view with bundled credit card payment */}
        {activeTab === 'services' && (
          <div className="view-panel">
            <div className="view-header">
              <h1>Premium SMS Services</h1>
              <p>Select multiple daily services to activate via a single credit card transaction.</p>
            </div>

            <div className="service-checklist-container">
              <h3 style={{ marginBottom: '15px', color: 'var(--color-primary-hover)' }}>Available Services</h3>
              
              {[
                { name: 'Joke', desc: 'Get a funny joke delivered daily. Keep smiling!', price: 2.99 },
                { name: 'Current Affairs', desc: 'Stay updated with global affairs and political news.', price: 4.99 },
                { name: 'Sports', desc: 'Live scores, football highlights, and sports bulletins.', price: 3.99 },
                { name: 'News', desc: 'Breaking news alerts and standard global reports.', price: 4.99 }
              ].map(service => {
                const isActive = activatedServices.includes(service.name);
                const isChecked = selectedServices.includes(service.name);
                
                return (
                  <div 
                    key={service.name} 
                    className={`service-checklist-item ${isActive ? 'active-subscribed' : isChecked ? 'selected' : ''}`}
                    onClick={() => !isActive && handleServiceCheck(service.name)}
                  >
                    {!isActive ? (
                      <input 
                        type="checkbox" 
                        className="checklist-checkbox" 
                        checked={isChecked}
                        onChange={() => {}} // handled by click of parent card
                      />
                    ) : (
                      <span style={{ color: 'var(--color-accent)', fontWeight: 'bold', fontSize: '1.2rem', width: '20px', textAlign: 'center' }}>✓</span>
                    )}
                    
                    <div className="checklist-details">
                      <h4>{service.name} {isActive && <span className="service-status-tag" style={{ fontSize: '0.65rem', marginLeft: '5px' }}>Activated</span>}</h4>
                      <p>{service.desc}</p>
                    </div>

                    <div className="checklist-price">
                      ${service.price} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/mo</span>
                    </div>
                  </div>
                );
              })}

              {/* Shopping Billing summary */}
              {!selectedServices.length && !activatedServices.length === 4 ? (
                <div style={{ marginTop: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Check any service above to proceed with billing.
                </div>
              ) : null}

              {selectedServices.length > 0 && (
                <div className="billing-summary-card">
                  <div className="billing-total">
                    <h3>Total: ${getTotalSelectedPrice()}</h3>
                    <p>{selectedServices.length} premium services selected</p>
                  </div>
                  <button className="btn btn-primary" onClick={handlePaymentCheckoutClick}>
                    Pay & Activate
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile Tab content */}
        {activeTab === 'profile' && loggedInUser && (
          <div className="view-panel">
            <div className="view-header">
              <h1>Edit Profile</h1>
              <p>Customize your personal and professional profile details.</p>
            </div>

            <form onSubmit={handleProfileSubmit} className="profile-grid">
              <div className="profile-avatar-column">
                <img 
                  src={profileForm.profilePhoto || loggedInUser.profilePhoto} 
                  alt="Profile" 
                  className="profile-avatar-large" 
                />
                <label className="avatar-upload-label">
                  Choose New Photo
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
                </label>
              </div>

              <div className="profile-details-column">
                <div className="profile-section-card">
                  <h3>Personal Details</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input 
                        type="text" 
                        name="name" 
                        value={profileForm.name || ''} 
                        onChange={handleProfileFormChange} 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Gender</label>
                      <select name="gender" value={profileForm.gender || ''} onChange={handleProfileFormChange}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Date of Birth</label>
                      <input 
                        type="date" 
                        name="dob" 
                        value={profileForm.dob ? profileForm.dob.split('T')[0] : ''} 
                        onChange={handleProfileFormChange} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Marital Status</label>
                      <select name="maritalStatus" value={profileForm.maritalStatus || ''} onChange={handleProfileFormChange}>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label>Address</label>
                    <input 
                      type="text" 
                      name="address" 
                      value={profileForm.address || ''} 
                      onChange={handleProfileFormChange} 
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Hobbies</label>
                      <input 
                        type="text" 
                        name="hobbies" 
                        value={profileForm.hobbies || ''} 
                        onChange={handleProfileFormChange} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Sports</label>
                      <input 
                        type="text" 
                        name="sports" 
                        value={profileForm.sports || ''} 
                        onChange={handleProfileFormChange} 
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Likes</label>
                      <input 
                        type="text" 
                        name="likes" 
                        value={profileForm.likes || ''} 
                        onChange={handleProfileFormChange} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Dislikes</label>
                      <input 
                        type="text" 
                        name="dislikes" 
                        value={profileForm.dislikes || ''} 
                        onChange={handleProfileFormChange} 
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Preferred Cuisines</label>
                    <input 
                      type="text" 
                      name="cuisines" 
                      value={profileForm.cuisines || ''} 
                      onChange={handleProfileFormChange} 
                    />
                  </div>
                </div>

                <div className="profile-section-card">
                  <h3>Professional Details</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Qualification</label>
                      <input 
                        type="text" 
                        name="qualification" 
                        value={profileForm.qualification || ''} 
                        onChange={handleProfileFormChange} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Work Status</label>
                      <select name="workStatus" value={profileForm.workStatus || ''} onChange={handleProfileFormChange}>
                        <option value="Employed">Employed</option>
                        <option value="Student">Student</option>
                        <option value="Unemployed">Unemployed</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>School Name</label>
                      <input 
                        type="text" 
                        name="school" 
                        value={profileForm.school || ''} 
                        onChange={handleProfileFormChange} 
                      />
                    </div>
                    <div className="form-group">
                      <label>College Name</label>
                      <input 
                        type="text" 
                        name="college" 
                        value={profileForm.college || ''} 
                        onChange={handleProfileFormChange} 
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Company / Organization</label>
                      <input 
                        type="text" 
                        name="organization" 
                        value={profileForm.organization || ''} 
                        onChange={handleProfileFormChange} 
                        disabled={profileForm.workStatus === 'Student'}
                      />
                    </div>
                    <div className="form-group">
                      <label>Designation</label>
                      <input 
                        type="text" 
                        name="designation" 
                        value={profileForm.designation || ''} 
                        onChange={handleProfileFormChange} 
                        disabled={profileForm.workStatus === 'Student'}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setProfileForm(loggedInUser)}>
                    Reset Changes
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Profile
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Add Contact Modal Dialog */}
      {showAddContactModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create New Contact</h3>
              <button className="close-btn" onClick={() => setShowAddContactModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input 
                    type="text" 
                    placeholder="First Name" 
                    value={contactForm.firstName}
                    onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input 
                    type="text" 
                    placeholder="Last Name" 
                    value={contactForm.lastName}
                    onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
                    required 
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Mobile Number (10 digits)</label>
                <input 
                  type="text" 
                  placeholder="e.g. 0944444444" 
                  value={contactForm.contactNumber}
                  onChange={(e) => setContactForm({ ...contactForm, contactNumber: e.target.value.replace(/\D/g, '').substring(0, 10) })}
                  maxLength={10}
                  required 
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddContactModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Premium Service Credit Card Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Subscribe to premium services</h3>
              <button className="close-btn" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>
            
            {/* Interactive Credit Card Mockup */}
            <div className="card-mockup-wrapper">
              <div className="credit-card-mockup">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="card-chip"></div>
                  <span style={{ fontSize: '0.8rem', fontStyle: 'italic', fontWeight: 'bold' }}>CREDIT CARD</span>
                </div>
                
                <div className="card-number-display">
                  {paymentForm.cardNumber 
                    ? paymentForm.cardNumber.replace(/(\d{4})/g, '$1 ').trim()
                    : '•••• •••• •••• ••••'}
                </div>
                
                <div className="card-bottom-row">
                  <div className="card-holder-display">
                    <span>Card Holder</span>
                    <span>{loggedInUser?.name || 'USER NAME'}</span>
                  </div>
                  <div className="card-expiry-display">
                    <span>Expires</span>
                    <span>{paymentForm.expiryDate || 'MM/YY'}</span>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', textAlign: 'center', color: 'var(--color-primary-hover)' }}>
                Billed Amount: ${getTotalSelectedPrice()}
              </div>

              <div className="form-group">
                <label>Credit Card Number</label>
                <input 
                  type="text" 
                  placeholder="16 digits (e.g. 1234567812345678)" 
                  value={paymentForm.cardNumber}
                  onChange={(e) => setPaymentForm({ ...paymentForm, cardNumber: e.target.value.replace(/\D/g, '').substring(0, 16) })}
                  maxLength={16}
                  required 
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Expiry Date (MM/YY)</label>
                  <input 
                    type="text" 
                    placeholder="MM/YY" 
                    value={paymentForm.expiryDate}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length > 2) {
                        val = val.substring(0, 2) + '/' + val.substring(2, 4);
                      }
                      setPaymentForm({ ...paymentForm, expiryDate: val });
                    }}
                    maxLength={5}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>CVV (3 digits)</label>
                  <input 
                    type="password" 
                    placeholder="•••" 
                    value={paymentForm.cvv}
                    onChange={(e) => setPaymentForm({ ...paymentForm, cvv: e.target.value.replace(/\D/g, '').substring(0, 3) })}
                    maxLength={3}
                    required 
                  />
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                Charges will be billed to your credit card immediately.
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Pay & Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
