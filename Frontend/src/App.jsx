import React, { useState, useEffect, useRef } from 'react';
import { HubConnectionBuilder } from '@microsoft/signalr';
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
  checkMobile,
  verify2Fa,
  toggle2Fa,
  togglePrivacy,
  getBlocklist,
  blockNumber,
  unblockNumber,
  getTemplates,
  createTemplate,
  deleteTemplate,
  getGroups,
  createGroup,
  deleteGroup,
  getGroupMembers,
  addGroupMember,
  removeGroupMember,
  sendBulkMessage,
  getAnalyticsStats,
  requestPaymentOtp,
  generateAiSms,
  loginAdmin,
  getAdminStats,
  getAdminUsers,
  updateUserStatus,
  updateUserQuota,
  getAdminTransactions,
  getAdminSmsLogs,
  createAdminTemplate,
  deleteAdminTemplate,
  chatWithAdminAi,
  reportTyping,
  getTypingStatus,
  getApiUrl
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
  const [contactIsTyping, setContactIsTyping] = useState(false);
  const lastTypingReportRef = useRef(0);
  const newMessageRef = useRef(null); // We don't necessarily need this, let's just keep lastTypingReportRef.
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
  const textareaRef = useRef(null);
  const connectionRef = useRef(null);
  const selectedContactRef = useRef(selectedContact);

  useEffect(() => {
    selectedContactRef.current = selectedContact;
  }, [selectedContact]);

  // Manage SignalR Connection lifecycle
  useEffect(() => {
    if (!loggedInUser) {
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
      return;
    }

    const token = loggedInUser.token;
    const hubUrl = getApiUrl().replace('/api', '/chatHub');

    const conn = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    conn.on("ReceiveMessage", (message) => {
      const active = selectedContactRef.current;
      if (active) {
        const isAiChat = active.contactNumber === "9999999999";
        const isAiMessage = message.senderId === 999;
        
        if (isAiChat && isAiMessage) {
          setChatMessages(prev => {
            if (prev.some(m => m.id === message.id)) return prev;
            return [...prev, message];
          });
        } else if (
          message.senderMobileNumber === active.contactNumber ||
          (message.senderId.toString() === active.id?.toString() && active.isFriend)
        ) {
          setChatMessages(prev => {
            if (prev.some(m => m.id === message.id)) return prev;
            return [...prev, message];
          });
        }
      }
      
      if (message.senderId === 999) {
        setAiMessages(prev => {
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    });

    conn.on("ReceiveTypingStatus", (senderMobileNumber) => {
      const active = selectedContactRef.current;
      if (active && active.contactNumber === senderMobileNumber) {
        setContactIsTyping(true);
      }
    });

    conn.start()
      .then(() => console.log("SignalR Connection Started Successfully."))
      .catch(err => console.error("SignalR Connection Failed: ", err));

    connectionRef.current = conn;

    return () => {
      conn.stop();
      connectionRef.current = null;
    };
  }, [loggedInUser]);

  // Inactivity timer for typing status
  useEffect(() => {
    if (contactIsTyping) {
      const timer = setTimeout(() => {
        setContactIsTyping(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [contactIsTyping]);

  // AI Assistant States
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState('polite');
  const [generatingAi, setGeneratingAi] = useState(false);

  // AI Floating Chat Bubble States
  const [aiPosition, setAiPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 150 });
  const [isAiBubbleOpen, setIsAiBubbleOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiNewMessage, setAiNewMessage] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const aiDragRef = useRef({ isDragging: false, startX: 0, startY: 0, posX: 0, posY: 0 });
  const aiMessagesEndRef = useRef(null);

  const [aiChatPosition, setAiChatPosition] = useState({
    x: window.innerWidth - 384,
    y: window.innerHeight - 576
  });
  const aiChatDragRef = useRef({ isDragging: false, startX: 0, startY: 0, posX: 0, posY: 0 });

  // 2FA Auth & Payments
  const [requires2Fa, setRequires2Fa] = useState(false);
  const [twoFaUsername, setTwoFaUsername] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [showPaymentOtpField, setShowPaymentOtpField] = useState(false);
  const [paymentOtpCode, setPaymentOtpCode] = useState('');

  // Scheduled SMS
  const [scheduleDate, setScheduleDate] = useState('');
  const [showScheduler, setShowScheduler] = useState(false);

  // SMS Templates
  const [templates, setTemplates] = useState([]);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templateForm, setTemplateForm] = useState({ title: '', body: '' });

  // Groups & Bulk SMS
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupForm, setGroupForm] = useState({ name: '' });
  const [newGroupMemberId, setNewGroupMemberId] = useState('');
  const [bulkContent, setBulkContent] = useState('');
  const [bulkScheduleDate, setBulkScheduleDate] = useState('');
  const [bulkResultsLog, setBulkResultsLog] = useState(null);

  // Analytics Stats
  const [analyticsStats, setAnalyticsStats] = useState(null);

  // Privacy & Blocklist
  const [blocklist, setBlocklist] = useState([]);
  const [blockNumberInput, setBlockNumberInput] = useState('');
  const [privacySettings, setPrivacySettings] = useState({ twoFactorEnabled: false, onlyReceiveFromFriends: false });

  // Admin State Hooks & Handlers
  const [adminTab, setAdminTab] = useState('overview'); // overview, users, logs, transactions, templates
  const [adminStats, setAdminStats] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminTransactions, setAdminTransactions] = useState([]);
  const [adminSmsLogs, setAdminSmsLogs] = useState({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 1 });
  const [smsLogsPage, setSmsLogsPage] = useState(1);
  const [adminTemplates, setAdminTemplates] = useState([]);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [selectedUserForQuota, setSelectedUserForQuota] = useState(null);
  const [newQuotaValue, setNewQuotaValue] = useState(5);
  const [adminTemplateForm, setAdminTemplateForm] = useState({ title: '', body: '' });

  // Admin AI Copilot States & Handlers
  const [isAdminChatOpen, setIsAdminChatOpen] = useState(false);
  const [adminChatWidth, setAdminChatWidth] = useState(420);
  const [adminChatMessages, setAdminChatMessages] = useState([
    { role: 'assistant', content: 'Xin chào! Tôi là Admin Copilot. Tôi có quyền truy cập vào thông số hệ thống thời gian thực của bạn. Bạn muốn tôi hỗ trợ phân tích dữ liệu hay soạn thảo mẫu tin nhắn SMS?' }
  ]);
  const [adminChatInput, setAdminChatInput] = useState('');
  const [isAdminChatLoading, setIsAdminChatLoading] = useState(false);
  const adminChatEndRef = useRef(null);

  const [adminAiPosition, setAdminAiPosition] = useState({
    x: window.innerWidth - 90,
    y: window.innerHeight - 90
  });
  const adminAiDragRef = useRef({ isDragging: false, startX: 0, startY: 0, posX: 0, posY: 0 });

  const startResizeAdminChat = (mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    const startWidth = adminChatWidth;
    const startX = mouseDownEvent.clientX;

    const doResize = (mouseMoveEvent) => {
      const newWidth = startWidth + (startX - mouseMoveEvent.clientX);
      if (newWidth >= 320 && newWidth <= window.innerWidth * 0.8) {
        setAdminChatWidth(newWidth);
      }
    };

    const stopResize = () => {
      window.removeEventListener('mousemove', doResize);
      window.removeEventListener('mouseup', stopResize);
    };

    window.addEventListener('mousemove', doResize);
    window.addEventListener('mouseup', stopResize);
  };

  useEffect(() => {
    adminChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [adminChatMessages, isAdminChatOpen]);

  const handleAdminChatSend = (e, customPrompt = '') => {
    if (e) e.preventDefault();

    const promptToSend = customPrompt || adminChatInput.trim();
    if (!promptToSend || isAdminChatLoading) return;

    setAdminChatInput('');
    setAdminChatMessages(prev => [...prev, { role: 'user', content: promptToSend }]);
    setIsAdminChatLoading(true);

    const formattedHistory = adminChatMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    chatWithAdminAi(promptToSend, formattedHistory)
      .then(res => {
        setAdminChatMessages(prev => [...prev, { role: 'assistant', content: res.content }]);
        setIsAdminChatLoading(false);
      })
      .catch(err => {
        const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra khi kết nối tới Admin Copilot.';
        triggerAlert('error', errorMsg);
        setIsAdminChatLoading(false);
      });
  };

  const loadAdminDashboardData = () => {
    if (!loggedInUser || !loggedInUser.isAdmin) return;

    if (adminTab === 'overview') {
      getAdminStats().then(setAdminStats).catch(() => triggerAlert('error', 'Cannot load dashboard stats.'));
    } else if (adminTab === 'users') {
      getAdminUsers().then(setAdminUsers).catch(() => triggerAlert('error', 'Cannot load users.'));
    } else if (adminTab === 'logs') {
      getAdminSmsLogs(smsLogsPage, 10).then(setAdminSmsLogs).catch(() => triggerAlert('error', 'Cannot load SMS logs.'));
    } else if (adminTab === 'transactions') {
      getAdminTransactions().then(setAdminTransactions).catch(() => triggerAlert('error', 'Cannot load transactions.'));
    } else if (adminTab === 'templates') {
      getTemplates().then(setAdminTemplates).catch(() => triggerAlert('error', 'Cannot load templates.'));
    }
  };

  useEffect(() => {
    if (loggedInUser && loggedInUser.isAdmin) {
      loadAdminDashboardData();
    }
  }, [adminTab, smsLogsPage]);

  const handleToggleUserStatus = (id, currentActive) => {
    const newActive = !currentActive;
    updateUserStatus(id, newActive)
      .then(res => {
        triggerAlert('success', res.message);
        getAdminUsers().then(setAdminUsers);
        if (adminTab === 'overview') {
          getAdminStats().then(setAdminStats);
        }
      })
      .catch(err => {
        const errorMsg = err.response?.data?.message || 'Failed to update user status.';
        triggerAlert('error', errorMsg);
      });
  };

  const handleSaveQuota = () => {
    if (!selectedUserForQuota) return;
    updateUserQuota(selectedUserForQuota.id, newQuotaValue)
      .then(res => {
        triggerAlert('success', res.message);
        setShowQuotaModal(false);
        setSelectedUserForQuota(null);
        getAdminUsers().then(setAdminUsers);
      })
      .catch(err => {
        const errorMsg = err.response?.data?.message || 'Failed to update quota.';
        triggerAlert('error', errorMsg);
      });
  };

  const handleCreateSystemTemplate = (e) => {
    e.preventDefault();
    if (!adminTemplateForm.title.trim() || !adminTemplateForm.body.trim()) return;

    createAdminTemplate(adminTemplateForm.title.trim(), adminTemplateForm.body.trim())
      .then(() => {
        triggerAlert('success', 'System template created successfully!');
        setAdminTemplateForm({ title: '', body: '' });
        getTemplates().then(setAdminTemplates);
      })
      .catch(err => {
        const errorMsg = err.response?.data?.message || 'Failed to create system template.';
        triggerAlert('error', errorMsg);
      });
  };

  const handleDeleteSystemTemplate = (id) => {
    if (!window.confirm("Are you sure you want to delete this system template?")) return;
    deleteAdminTemplate(id)
      .then(res => {
        triggerAlert('success', res.message || 'Template deleted successfully.');
        getTemplates().then(setAdminTemplates);
      })
      .catch(err => {
        const errorMsg = err.response?.data?.message || 'Failed to delete system template.';
        triggerAlert('error', errorMsg);
      });
  };

  // Initialize Captcha and load switcher users
  useEffect(() => {
    generateCaptcha();
    loadUsersList();

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setLoggedInUser(JSON.parse(savedUser));
    }
  }, []);

  // Listen to unauthorized event
  useEffect(() => {
    const handleUnauthorized = () => {
      setLoggedInUser(null);
      triggerAlert('error', 'Please log in to access this page.');
    };
    window.addEventListener('unauthorized', handleUnauthorized);
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
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

    if (loggedInUser.isAdmin) {
      loadAdminDashboardData();
      return;
    }

    // Fetch private dashboard state
    refreshDashboardData();

    // Reset selections
    setSelectedContact(null);
    setChatMessages([]);
    setSelectedServices([]);
  }, [loggedInUser]);

  // Load chat messages when selected contact is open
  useEffect(() => {
    if (!loggedInUser || !selectedContact) return;

    // Reset AI popover state when switching chats
    setShowAiAssistant(false);
    setAiPrompt('');
    setContactIsTyping(false);

    loadChatDetails();
  }, [loggedInUser, selectedContact]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Auto-resize chat textarea to fit content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newMessage, selectedContact]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load AI Chat Messages once when AI Chat Widget is opened
  useEffect(() => {
    if (!loggedInUser || !isAiBubbleOpen) return;

    getChatHistory(loggedInUser.id, '9999999999')
      .then(setAiMessages)
      .catch(() => { });
  }, [loggedInUser, isAiBubbleOpen]);

  useEffect(() => {
    aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  const handleAiSendMessage = (e) => {
    e.preventDefault();
    if (!aiNewMessage.trim() || isAiLoading) return;

    const messageText = aiNewMessage.trim();
    setAiNewMessage('');
    setIsAiLoading(true);

    sendMessage(loggedInUser.id, '9999999999', messageText)
      .then((sentMsg) => {
        setAiMessages(prev => [...prev, sentMsg]);
        getChatHistory(loggedInUser.id, '9999999999')
          .then(msgs => {
            setAiMessages(msgs);
            setIsAiLoading(false);
          })
          .catch(() => setIsAiLoading(false));
      })
      .catch((err) => {
        const errorMsg = err.response?.data?.message || 'Failed to send message to AI';
        triggerAlert('error', errorMsg);
        setIsAiLoading(false);
      });
  };

  const handleAiBubbleMouseDown = (e) => {
    if (e.button !== 0) return;
    aiDragRef.current.isDragging = false;
    aiDragRef.current.startX = e.clientX;
    aiDragRef.current.startY = e.clientY;
    aiDragRef.current.posX = aiPosition.x;
    aiDragRef.current.posY = aiPosition.y;

    document.addEventListener('mousemove', handleAiBubbleMouseMove);
    document.addEventListener('mouseup', handleAiBubbleMouseUp);
  };

  const handleAiBubbleMouseMove = (e) => {
    const dx = e.clientX - aiDragRef.current.startX;
    const dy = e.clientY - aiDragRef.current.startY;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      aiDragRef.current.isDragging = true;
    }

    let newX = aiDragRef.current.posX + dx;
    let newY = aiDragRef.current.posY + dy;

    newX = Math.max(10, Math.min(window.innerWidth - 70, newX));
    newY = Math.max(10, Math.min(window.innerHeight - 70, newY));

    setAiPosition({ x: newX, y: newY });
  };

  const handleAiBubbleMouseUp = (e) => {
    document.removeEventListener('mousemove', handleAiBubbleMouseMove);
    document.removeEventListener('mouseup', handleAiBubbleMouseUp);

    if (!aiDragRef.current.isDragging) {
      setIsAiBubbleOpen(prev => !prev);
    }
  };

  const handleAiChatMouseDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('.ai-mini-chat-close-btn')) return;

    aiChatDragRef.current.isDragging = false;
    aiChatDragRef.current.startX = e.clientX;
    aiChatDragRef.current.startY = e.clientY;
    aiChatDragRef.current.posX = aiChatPosition.x;
    aiChatDragRef.current.posY = aiChatPosition.y;

    document.addEventListener('mousemove', handleAiChatMouseMove);
    document.addEventListener('mouseup', handleAiChatMouseUp);
  };

  const handleAiChatMouseMove = (e) => {
    const dx = e.clientX - aiChatDragRef.current.startX;
    const dy = e.clientY - aiChatDragRef.current.startY;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      aiChatDragRef.current.isDragging = true;
    }

    let newX = aiChatDragRef.current.posX + dx;
    let newY = aiChatDragRef.current.posY + dy;

    newX = Math.max(10, Math.min(window.innerWidth - 370, newX));
    newY = Math.max(10, Math.min(window.innerHeight - 490, newY));

    setAiChatPosition({ x: newX, y: newY });
  };

  const handleAiChatMouseUp = () => {
    document.removeEventListener('mousemove', handleAiChatMouseMove);
    document.removeEventListener('mouseup', handleAiChatMouseUp);
  };

  const handleAdminAiBubbleMouseDown = (e) => {
    if (e.button !== 0) return;
    adminAiDragRef.current.isDragging = false;
    adminAiDragRef.current.startX = e.clientX;
    adminAiDragRef.current.startY = e.clientY;
    adminAiDragRef.current.posX = adminAiPosition.x;
    adminAiDragRef.current.posY = adminAiPosition.y;

    document.addEventListener('mousemove', handleAdminAiBubbleMouseMove);
    document.addEventListener('mouseup', handleAdminAiBubbleMouseUp);
  };

  const handleAdminAiBubbleMouseMove = (e) => {
    const dx = e.clientX - adminAiDragRef.current.startX;
    const dy = e.clientY - adminAiDragRef.current.startY;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      adminAiDragRef.current.isDragging = true;
    }

    let newX = adminAiDragRef.current.posX + dx;
    let newY = adminAiDragRef.current.posY + dy;

    newX = Math.max(10, Math.min(window.innerWidth - 70, newX));
    newY = Math.max(10, Math.min(window.innerHeight - 70, newY));

    setAdminAiPosition({ x: newX, y: newY });
  };

  const handleAdminAiBubbleMouseUp = (e) => {
    document.removeEventListener('mousemove', handleAdminAiBubbleMouseMove);
    document.removeEventListener('mouseup', handleAdminAiBubbleMouseUp);

    if (!adminAiDragRef.current.isDragging) {
      setIsAdminChatOpen(prev => !prev);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setAiPosition(prev => ({
        x: Math.max(10, Math.min(window.innerWidth - 70, prev.x)),
        y: Math.max(10, Math.min(window.innerHeight - 70, prev.y))
      }));
      setAiChatPosition(prev => ({
        x: Math.max(10, Math.min(window.innerWidth - 370, prev.x)),
        y: Math.max(10, Math.min(window.innerHeight - 490, prev.y))
      }));
      setAdminAiPosition(prev => ({
        x: Math.max(10, Math.min(window.innerWidth - 70, prev.x)),
        y: Math.max(10, Math.min(window.innerHeight - 70, prev.y))
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const refreshDashboardData = () => {
    getContacts(loggedInUser.id).then(setContacts).catch(() => { });
    getFriends(loggedInUser.id).then(setFriends).catch(() => { });
    getPendingRequests(loggedInUser.id).then(setPendingRequests).catch(() => { });
    getActivatedServices(loggedInUser.id)
      .then(data => setActivatedServices(data.map(s => s.serviceName)))
      .catch(() => { });
    setProfileForm(loggedInUser);

    // Load new entities
    loadTemplates();
    loadGroups();
    loadBlocklist();
    loadAnalyticsStats();
    setPrivacySettings({
      twoFactorEnabled: loggedInUser.twoFactorEnabled,
      onlyReceiveFromFriends: loggedInUser.onlyReceiveFromFriends
    });
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
      .catch(() => { });
  };

  const loadTypingStatus = () => {
    if (!loggedInUser || !selectedContact) return;
    getTypingStatus(selectedContact.contactNumber)
      .then(res => setContactIsTyping(res.isTyping))
      .catch(() => {});
  };

  const handleTyping = () => {
    if (!loggedInUser || !selectedContact || !connectionRef.current) return;
    const now = Date.now();
    if (now - lastTypingReportRef.current > 2000) {
      lastTypingReportRef.current = now;
      connectionRef.current.invoke("SendTyping", selectedContact.contactNumber).catch(() => {});
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();

    login(loginForm.username, loginForm.password)
      .then(res => {
        if (res.requires2Fa) {
          setRequires2Fa(true);
          setTwoFaUsername(res.username);
          triggerAlert('success', `Mã xác thực OTP đã được gửi giả lập tới email: ${res.email}. Vui lòng kiểm tra Console/Terminal backend để lấy mã.`);
        } else {
          // Standardize name for both regular users and admins
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
    e.preventDefault();
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

  // Helper Methods for Templates, Groups, Privacy, and Blocklist
  const loadTemplates = () => {
    getTemplates()
      .then(setTemplates)
      .catch(() => { });
  };

  const handleCreateTemplate = (e) => {
    e.preventDefault();
    if (!templateForm.title.trim() || !templateForm.body.trim()) return;
    createTemplate(templateForm.title, templateForm.body)
      .then(newTpl => {
        setTemplates([...templates, newTpl]);
        setTemplateForm({ title: '', body: '' });
        triggerAlert('success', 'Custom template created successfully.');
      })
      .catch(() => triggerAlert('error', 'Failed to create template.'));
  };

  const handleDeleteTemplate = (id) => {
    if (!window.confirm('Delete this template?')) return;
    deleteTemplate(id)
      .then(() => {
        setTemplates(templates.filter(t => t.id !== id));
        triggerAlert('success', 'Template deleted.');
      })
      .catch(() => triggerAlert('error', 'Failed to delete template.'));
  };

  const loadGroups = () => {
    getGroups()
      .then(setGroups)
      .catch(() => { });
  };

  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (!groupForm.name.trim()) return;
    createGroup(groupForm.name)
      .then(newGrp => {
        setGroups([...groups, newGrp]);
        setGroupForm({ name: '' });
        triggerAlert('success', 'Contact group created.');
      })
      .catch(() => triggerAlert('error', 'Failed to create group.'));
  };

  const handleDeleteGroup = (id, name) => {
    if (!window.confirm(`Delete group "${name}"? This removes members but doesn't delete contacts.`)) return;
    deleteGroup(id)
      .then(() => {
        setGroups(groups.filter(g => g.id !== id));
        if (selectedGroup?.id === id) {
          setSelectedGroup(null);
          setGroupMembers([]);
        }
        triggerAlert('success', 'Group deleted.');
      })
      .catch(() => triggerAlert('error', 'Failed to delete group.'));
  };

  const loadGroupMembers = (groupId) => {
    getGroupMembers(groupId)
      .then(setGroupMembers)
      .catch(() => { });
  };

  const handleAddGroupMember = (e) => {
    e.preventDefault();
    if (!selectedGroup || !newGroupMemberId) return;
    addGroupMember(selectedGroup.id, parseInt(newGroupMemberId))
      .then(res => {
        setGroupMembers([...groupMembers, res.contact]);
        setNewGroupMemberId('');
        triggerAlert('success', res.message);
      })
      .catch(err => triggerAlert('error', err.response?.data?.message || 'Failed to add member.'));
  };

  const handleRemoveGroupMember = (contactId) => {
    if (!selectedGroup) return;
    removeGroupMember(selectedGroup.id, contactId)
      .then(() => {
        setGroupMembers(groupMembers.filter(m => m.id !== contactId));
        triggerAlert('success', 'Member removed from group.');
      })
      .catch(() => triggerAlert('error', 'Failed to remove member.'));
  };

  const loadBlocklist = () => {
    getBlocklist()
      .then(setBlocklist)
      .catch(() => { });
  };

  const handleBlockNumber = (e) => {
    e.preventDefault();
    if (blockNumberInput.length !== 10) {
      triggerAlert('error', 'Phone number must be exactly 10 digits.');
      return;
    }
    blockNumber(blockNumberInput)
      .then(res => {
        setBlocklist([...blocklist, res.block]);
        setBlockNumberInput('');
        triggerAlert('success', res.message);
      })
      .catch(err => triggerAlert('error', err.response?.data?.message || 'Failed to block number.'));
  };

  const handleUnblockNumber = (id) => {
    unblockNumber(id)
      .then(res => {
        setBlocklist(blocklist.filter(b => b.id !== id));
        triggerAlert('success', res.message);
      })
      .catch(() => triggerAlert('error', 'Failed to unblock number.'));
  };

  const handleToggle2FaSetting = (enabled) => {
    toggle2Fa(enabled)
      .then(res => {
        setPrivacySettings(prev => ({ ...prev, twoFactorEnabled: enabled }));
        setLoggedInUser(prev => ({ ...prev, twoFactorEnabled: enabled }));
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        u.twoFactorEnabled = enabled;
        localStorage.setItem('user', JSON.stringify(u));
        triggerAlert('success', res.message);
      })
      .catch(() => triggerAlert('error', 'Failed to update 2FA setting.'));
  };

  const handleTogglePrivacySetting = (enabled) => {
    togglePrivacy(enabled)
      .then(res => {
        setPrivacySettings(prev => ({ ...prev, onlyReceiveFromFriends: enabled }));
        setLoggedInUser(prev => ({ ...prev, onlyReceiveFromFriends: enabled }));
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        u.onlyReceiveFromFriends = enabled;
        localStorage.setItem('user', JSON.stringify(u));
        triggerAlert('success', res.message);
      })
      .catch(() => triggerAlert('error', 'Failed to update privacy setting.'));
  };

  const loadAnalyticsStats = () => {
    getAnalyticsStats()
      .then(setAnalyticsStats)
      .catch(() => { });
  };

  const handleSendBulkMessage = (e) => {
    e.preventDefault();
    if (!selectedGroup || !bulkContent.trim()) return;

    setBulkResultsLog('Sending bulk messages, please wait...');

    sendBulkMessage(selectedGroup.id, bulkContent.trim(), bulkScheduleDate || null)
      .then(res => {
        setBulkContent('');
        setBulkScheduleDate('');
        let logStr = `Bulk Send Finished:\n` + res.details.join('\n');
        setBulkResultsLog(logStr);
        loadAnalyticsStats();
        triggerAlert('success', res.message);
      })
      .catch(err => {
        setBulkResultsLog(null);
        triggerAlert('error', err.response?.data?.message || 'Failed to send bulk messages.');
      });
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();

    // Captcha Validation
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
        loadUsersList(); // Update user switcher list
      })
      .catch(err => {
        const errorMsg = err.response?.data?.message || 'Registration failed.';
        triggerAlert('error', errorMsg);
        generateCaptcha();
      });
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setLoggedInUser(null);
    triggerAlert('success', 'You have been logged out.');
  };

  // Demo user switcher helper (instantly logs in as the selected switcher user)
  const handleDemoUserSwitch = (e) => {
    const userId = parseInt(e.target.value);
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

  // AI Assistant Generation Action
  const handleGenerateAiMessage = (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setGeneratingAi(true);
    generateAiSms(aiPrompt.trim(), aiTone)
      .then(res => {
        setNewMessage(res.content);
        setAiPrompt('');
        setShowAiAssistant(false);
      })
      .catch(err => {
        const errorMsg = err.response?.data?.message || 'Không thể tạo tin nhắn bằng AI.';
        triggerAlert('error', errorMsg);
      })
      .finally(() => {
        setGeneratingAi(false);
      });
  };

  // Message Sending Action
  const handleSendMessageSubmit = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || newMessage.length > 120) return;

    sendMessage(loggedInUser.id, selectedContact.contactNumber, newMessage.trim(), scheduleDate || null)
      .then(msg => {
        setChatMessages([...chatMessages, msg]);
        setNewMessage('');
        setScheduleDate('');
        setShowScheduler(false);
        getQuota(loggedInUser.id, selectedContact.contactNumber)
          .then(setRemainingQuota)
          .catch(() => { });
        loadAnalyticsStats();
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
    setShowPaymentOtpField(false);
    setPaymentOtpCode('');
    setShowPaymentModal(true);
  };

  // Submit sequential activations in a bundle payment
  const handlePaymentSubmit = (e) => {
    e.preventDefault();

    // If 2FA is enabled, and OTP is not showing yet, request OTP
    if (loggedInUser.twoFactorEnabled && !showPaymentOtpField) {
      requestPaymentOtp()
        .then(() => {
          setShowPaymentOtpField(true);
          setPaymentOtpCode('');
          triggerAlert('success', 'Bảo mật 2FA đang bật. Mã xác thực giao dịch OTP đã được gửi giả lập tới email của bạn. Vui lòng xem Console backend để lấy mã.');
        })
        .catch(err => {
          triggerAlert('error', err.response?.data?.message || 'Failed to request payment OTP.');
        });
      return;
    }

    // Trigger sequential activation API calls for each selected service
    const promises = selectedServices.map(serviceName =>
      activateService(loggedInUser.id, serviceName, paymentForm.cardNumber, paymentForm.expiryDate, paymentForm.cvv, paymentOtpCode)
    );

    Promise.all(promises)
      .then(() => {
        setActivatedServices([...activatedServices, ...selectedServices]);
        setSelectedServices([]);
        setShowPaymentModal(false);
        setShowPaymentOtpField(false);
        setPaymentOtpCode('');
        loadAnalyticsStats();
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
        if (f.mobileNumber === '9999999999') return;
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
        if (c.contactNumber === '9999999999') return;
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
              if (c.contactNumber === '9999999999') return null;
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
          <div key="landing-alert-banner" style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, width: '90%', maxWidth: '500px' }}>
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
                  if (select) {
                    login(select.username, select.password)
                      .then(user => {
                        localStorage.setItem('user', JSON.stringify(user));
                        setLoggedInUser(user);
                        triggerAlert('success', `Welcome back, ${user.name}!`);
                      })
                      .catch(() => {
                        triggerAlert('error', `Failed to log in as ${select.name}`);
                      });
                  }
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

  // ==================== ADMIN PORTAL RENDERING FUNCTIONS ====================
  const renderAdminOverview = () => {
    if (!adminStats) return <div className="admin-loading" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>📊 Loading system analytics...</div>;

    return (
      <div className="admin-tab-content">
        <div className="admin-header" style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '600', color: '#fff', marginBottom: '6px' }}>System Dashboard Overview</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>Monitor real-time system stats, registered users, gateways, and platform revenue.</p>
        </div>

        {/* Metric Cards Grid */}
        <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div className="admin-stat-card" style={{ background: 'var(--bg-sidebar)', padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="stat-icon" style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(36, 129, 204, 0.15)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>👥</div>
            <div className="stat-details" style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="stat-value" style={{ fontSize: '1.75rem', fontWeight: '700', color: '#fff', lineHeight: '1.2' }}>{adminStats.totalUsers}</span>
              <span className="stat-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Registered Users</span>
            </div>
          </div>

          <div className="admin-stat-card" style={{ background: 'var(--bg-sidebar)', padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="stat-icon" style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>💬</div>
            <div className="stat-details" style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="stat-value" style={{ fontSize: '1.75rem', fontWeight: '700', color: '#fff', lineHeight: '1.2' }}>{adminStats.totalMessages}</span>
              <span className="stat-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>SMS Sent (Standard)</span>
            </div>
          </div>

          <div className="admin-stat-card" style={{ background: 'var(--bg-sidebar)', padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="stat-icon" style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>💰</div>
            <div className="stat-details" style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="stat-value" style={{ fontSize: '1.75rem', fontWeight: '700', color: '#fff', lineHeight: '1.2' }}>${adminStats.totalRevenue.toFixed(2)}</span>
              <span className="stat-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Gross Revenue</span>
            </div>
          </div>

          <div className="admin-stat-card" style={{ background: 'var(--bg-sidebar)', padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="stat-icon" style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>🔔</div>
            <div className="stat-details" style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="stat-value" style={{ fontSize: '1.75rem', fontWeight: '700', color: '#fff', lineHeight: '1.2' }}>{adminStats.activeServicesCount}</span>
              <span className="stat-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Paid Subscriptions</span>
            </div>
          </div>

          <div className="admin-stat-card" style={{ background: 'var(--bg-sidebar)', padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="stat-icon" style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>🤖</div>
            <div className="stat-details" style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="stat-value" style={{ fontSize: '1.75rem', fontWeight: '700', color: '#fff', lineHeight: '1.2' }}>{adminStats.aiInteractionsCount}</span>
              <span className="stat-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>AI Assist Count</span>
            </div>
          </div>
        </div>

        {/* Message Status breakdown & Chart area */}
        <div className="admin-charts-section" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '30px' }}>
          <div className="admin-chart-card" style={{ flex: '1', minWidth: '300px', background: 'var(--bg-sidebar)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px', color: '#fff' }}>SMS Gateway Delivery Ratios</h3>
            <div className="delivery-status-bars" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="status-bar-item">
                <div className="status-header" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px', color: 'var(--text-main)' }}>
                  <span>Delivered / Sent</span>
                  <strong>{adminStats.deliveredCount} ({((adminStats.deliveredCount / (adminStats.totalMessages || 1)) * 100).toFixed(0)}%)</strong>
                </div>
                <div className="status-progress-track" style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div className="status-progress-bar success" style={{ height: '100%', background: 'var(--color-accent)', width: `${(adminStats.deliveredCount / (adminStats.totalMessages || 1)) * 100}%` }}></div>
                </div>
              </div>

              <div className="status-bar-item">
                <div className="status-header" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px', color: 'var(--text-main)' }}>
                  <span>Queued / Pending</span>
                  <strong>{adminStats.pendingCount} ({((adminStats.pendingCount / (adminStats.totalMessages || 1)) * 100).toFixed(0)}%)</strong>
                </div>
                <div className="status-progress-track" style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div className="status-progress-bar warning" style={{ height: '100%', background: 'var(--color-warning)', width: `${(adminStats.pendingCount / (adminStats.totalMessages || 1)) * 100}%` }}></div>
                </div>
              </div>

              <div className="status-bar-item">
                <div className="status-header" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px', color: 'var(--text-main)' }}>
                  <span>Failed / Flagged</span>
                  <strong>{adminStats.failedCount} ({((adminStats.failedCount / (adminStats.totalMessages || 1)) * 100).toFixed(0)}%)</strong>
                </div>
                <div className="status-progress-track" style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div className="status-progress-bar danger" style={{ height: '100%', background: 'var(--color-danger)', width: `${(adminStats.failedCount / (adminStats.totalMessages || 1)) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-chart-card flex-2" style={{ flex: '2', minWidth: '400px', background: 'var(--bg-sidebar)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px', color: '#fff' }}>Sms Traffic Load (Last 7 Days)</h3>
            <div className="admin-bar-chart" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '180px', paddingTop: '20px', paddingBottom: '10px' }}>
              {adminStats.dailyStats && adminStats.dailyStats.map((day, idx) => {
                const maxVal = Math.max(...adminStats.dailyStats.map(d => d.count), 1);
                const heightPct = (day.count / maxVal) * 100;
                const dateObj = new Date(day.date);
                const dayLabel = dateObj.getDate() + '/' + (dateObj.getMonth() + 1);

                return (
                  <div className="chart-bar-col" key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1', height: '100%' }}>
                    <div className="chart-bar-val" style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: '600', marginBottom: '6px' }}>{day.count}</div>
                    <div className="chart-bar-pillar-container" style={{ width: '24px', flex: '1', display: 'flex', alignItems: 'flex-end', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div className="chart-bar-pillar" style={{ width: '100%', background: 'linear-gradient(to top, var(--color-primary), var(--color-primary-hover))', height: `${heightPct}%`, borderRadius: '4px', transition: 'height 0.5s ease', boxShadow: '0 0 10px rgba(36, 129, 204, 0.3)' }}></div>
                    </div>
                    <div className="chart-bar-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>{dayLabel}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAdminUsers = () => {
    return (
      <div className="admin-tab-content">
        <div className="admin-header" style={{ marginBottom: '25px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '600', color: '#fff', marginBottom: '6px' }}>User Accounts Management</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>Block/unlock user accounts, verify verification records, and configure free message quotas.</p>
        </div>

        <div className="admin-table-container" style={{ background: 'var(--bg-sidebar)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Avatar</th>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Username</th>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Full Name</th>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Mobile</th>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Email</th>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>SMS Quota Left</th>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminUsers.map(user => {
                const quotaVal = user.quota?.freeMessagesLeft !== undefined ? user.quota.freeMessagesLeft : 5;
                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'var(--transition-fast)' }} className="table-row-hover">
                    <td style={{ padding: '12px 20px' }}>
                      <img src={user.profilePhoto} alt={user.name} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
                    </td>
                    <td style={{ padding: '12px 20px', color: '#fff' }}><strong>{user.username}</strong></td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-main)' }}>{user.name || 'N/A'}</td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-main)' }}><code>{user.mobileNumber}</code></td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{user.email}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span className="admin-badge-quota" style={{ background: 'rgba(36, 129, 204, 0.15)', color: 'var(--color-primary)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' }}>{quotaVal} SMS</span>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <span className={`status-tag ${user.isActive ? 'active' : 'inactive'}`} style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', background: user.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: user.isActive ? 'var(--color-accent)' : 'var(--color-danger)' }}>
                        {user.isActive ? 'ACTIVE' : 'LOCKED'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <div className="admin-actions-cell" style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            setSelectedUserForQuota(user);
                            setNewQuotaValue(quotaVal);
                            setShowQuotaModal(true);
                          }}
                          style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#1a2432', border: '1px solid rgba(255,255,255,0.06)' }}
                        >
                          ⚙️ Quota
                        </button>
                        <button
                          className={`btn ${user.isActive ? 'btn-danger' : 'btn-accent'}`}
                          onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                          style={{ padding: '6px 12px', fontSize: '0.78rem', minWidth: '75px', background: user.isActive ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)', border: '1px solid ' + (user.isActive ? 'var(--color-danger)' : 'var(--color-accent)'), color: user.isActive ? 'var(--color-danger)' : 'var(--color-accent)' }}
                        >
                          {user.isActive ? '🔒 Lock' : '🔓 Unlock'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderAdminSmsLogs = () => {
    return (
      <div className="admin-tab-content">
        <div className="admin-header" style={{ marginBottom: '25px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '600', color: '#fff', marginBottom: '6px' }}>System SMS Delivery Logs</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>Comprehensive database audit trail for all outbound text messages and gateway delivery status codes.</p>
        </div>

        <div className="admin-table-container" style={{ background: 'var(--bg-sidebar)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Log ID</th>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Sender</th>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Receiver No.</th>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', width: '30%' }}>Message Content</th>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Sent Time</th>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Type</th>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Gateway Code</th>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {!adminSmsLogs.items || adminSmsLogs.items.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Không tìm thấy nhật ký gửi SMS nào.
                  </td>
                </tr>
              ) : (
                adminSmsLogs.items.map(log => {
                  const statusClass = log.deliveryStatus === 'delivered' || log.deliveryStatus === 'sent' ? 'success' : log.deliveryStatus === 'failed' ? 'danger' : 'warning';
                  const statusBg = log.deliveryStatus === 'delivered' || log.deliveryStatus === 'sent' ? 'rgba(16, 185, 129, 0.15)' : log.deliveryStatus === 'failed' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)';
                  const statusColor = log.deliveryStatus === 'delivered' || log.deliveryStatus === 'sent' ? 'var(--color-accent)' : log.deliveryStatus === 'failed' ? 'var(--color-danger)' : 'var(--color-warning)';
                  return (
                    <tr key={log.logId} style={{ borderBottom: '1px solid var(--border-light)' }} className="table-row-hover">
                      <td style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>#{log.logId}</td>
                      <td style={{ padding: '12px 20px' }}>
                        <div className="sender-cell" style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong style={{ color: '#fff' }}>{log.senderUsername}</strong>
                          <span className="sender-cell-name" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{log.senderName}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 20px', color: 'var(--text-main)' }}><code>{log.receiverNumber}</code></td>
                      <td style={{ padding: '12px 20px', color: 'var(--text-main)', fontSize: '0.88rem', wordBreak: 'break-word', maxBreakWidth: '300px' }} title={log.content}>{log.content}</td>
                      <td style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>{new Date(log.sentTime).toLocaleString('vi-VN')}</td>
                      <td style={{ padding: '12px 20px' }}>
                        <span className={`type-tag ${log.isFreeFriendMsg ? 'friend' : 'non-friend'}`} style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '500', background: log.isFreeFriendMsg ? 'rgba(36, 129, 204, 0.12)' : 'rgba(255,255,255,0.05)', color: log.isFreeFriendMsg ? 'var(--color-primary)' : 'var(--text-muted)' }}>
                          {log.isFreeFriendMsg ? 'Friend' : 'Normal'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px' }}><code style={{ color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.08)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.82rem' }}>{log.gatewayStatusCode}</code></td>
                      <td style={{ padding: '12px 20px' }}>
                        <span className={`delivery-tag ${statusClass}`} style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', background: statusBg, color: statusColor }}>
                          {log.deliveryStatus.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {adminSmsLogs && adminSmsLogs.totalPages > 1 && (
          <div className="pagination-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '12px 20px', background: 'var(--bg-sidebar)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Hiển thị trang <strong>{adminSmsLogs.page}</strong> / <strong>{adminSmsLogs.totalPages}</strong> (Tổng cộng <strong>{adminSmsLogs.totalCount}</strong> bản ghi)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setSmsLogsPage(prev => Math.max(prev - 1, 1))}
                disabled={adminSmsLogs.page <= 1}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: adminSmsLogs.page <= 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.08)',
                  color: adminSmsLogs.page <= 1 ? 'var(--text-muted)' : '#fff',
                  border: '1px solid var(--border-light)',
                  cursor: adminSmsLogs.page <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
              >
                Trước
              </button>
              
              {/* Dynamic page numbers */}
              {Array.from({ length: adminSmsLogs.totalPages }, (_, idx) => idx + 1)
                .filter(p => Math.abs(p - adminSmsLogs.page) <= 2 || p === 1 || p === adminSmsLogs.totalPages)
                .map((p, idx, arr) => {
                  const elements = [];
                  if (idx > 0 && p - arr[idx - 1] > 1) {
                    elements.push(
                      <span key={`dots-${p}`} style={{ color: 'var(--text-muted)', alignSelf: 'center', padding: '0 4px' }}>...</span>
                    );
                  }
                  elements.push(
                    <button
                      key={p}
                      onClick={() => setSmsLogsPage(p)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: adminSmsLogs.page === p ? 'var(--color-primary, #2481cc)' : 'rgba(255,255,255,0.04)',
                        color: '#fff',
                        border: adminSmsLogs.page === p ? '1px solid var(--color-primary, #2481cc)' : '1px solid var(--border-light)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: adminSmsLogs.page === p ? '600' : '500',
                        transition: 'all 0.2s'
                      }}
                    >
                      {p}
                    </button>
                  );
                  return elements;
                })}

              <button
                onClick={() => setSmsLogsPage(prev => Math.min(prev + 1, adminSmsLogs.totalPages))}
                disabled={adminSmsLogs.page >= adminSmsLogs.totalPages}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: adminSmsLogs.page >= adminSmsLogs.totalPages ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.08)',
                  color: adminSmsLogs.page >= adminSmsLogs.totalPages ? 'var(--text-muted)' : '#fff',
                  border: '1px solid var(--border-light)',
                  cursor: adminSmsLogs.page >= adminSmsLogs.totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAdminTransactions = () => {
    return (
      <div className="admin-tab-content">
        <div className="admin-header" style={{ marginBottom: '25px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '600', color: '#fff', marginBottom: '6px' }}>Payment & Subscription Ledger</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>Monitor payment transactions generated from subscribers activating premium Value-Added Services (VAS).</p>
        </div>

        <div className="admin-table-container" style={{ background: 'var(--bg-sidebar)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Transaction ID</th>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Username</th>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>User Full Name</th>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Service Subscribed</th>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Price</th>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Card Details</th>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Transaction Date</th>
              </tr>
            </thead>
            <tbody>
              {adminTransactions.map(t => {
                return (
                  <tr key={t.transactionId} style={{ borderBottom: '1px solid var(--border-light)' }} className="table-row-hover">
                    <td style={{ padding: '12px 20px', color: 'var(--text-muted)' }}>#{t.transactionId}</td>
                    <td style={{ padding: '12px 20px', color: '#fff' }}><strong>{t.username}</strong></td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-main)' }}>{t.userFullName}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span className="service-tag" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#a78bfa', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '500' }}>{t.serviceName}</span>
                    </td>
                    <td style={{ padding: '12px 20px', color: 'var(--color-accent)', fontSize: '0.95rem', fontWeight: '700' }}>${t.amount.toFixed(2)}</td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>💳 **** **** **** {t.cardLast4}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span className="status-tag active" style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-accent)' }}>SUCCESS</span>
                    </td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>{new Date(t.createdAt).toLocaleString('vi-VN')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderAdminTemplates = () => {
    const systemTemplates = adminTemplates.filter(t => t.userId === null);

    return (
      <div className="admin-tab-content">
        <div className="admin-header" style={{ marginBottom: '25px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '600', color: '#fff', marginBottom: '6px' }}>System-Wide SMS Templates</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>Define default, structured templates for all platform users to quickly choose from when drafting SMS messages.</p>
        </div>

        {/* Add template form */}
        <div className="admin-template-create-card" style={{ background: 'var(--bg-sidebar)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', marginBottom: '30px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#fff', marginBottom: '16px' }}>Create New System Template</h3>
          <form onSubmit={handleCreateSystemTemplate} className="admin-template-form" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Template Title</label>
              <input
                type="text"
                placeholder="e.g. Happy New Year Greeting"
                value={adminTemplateForm.title}
                onChange={(e) => setAdminTemplateForm({ ...adminTemplateForm, title: e.target.value })}
                style={{ background: '#182533', border: '1px solid var(--border-light)', padding: '10px 12px', borderRadius: '8px', color: '#fff' }}
                required
              />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Template Body (supports {`{Name}`} auto-replacements)</label>
              <textarea
                rows="3"
                placeholder="e.g. Wishing you a wonderful birthday, {Name}! Hope your day is filled with joy."
                value={adminTemplateForm.body}
                onChange={(e) => setAdminTemplateForm({ ...adminTemplateForm, body: e.target.value })}
                style={{ background: '#182533', border: '1px solid var(--border-light)', padding: '10px 12px', borderRadius: '8px', color: '#fff', resize: 'vertical' }}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '10px 24px', fontSize: '0.88rem' }}>
              Create Template
            </button>
          </form>
        </div>

        {/* Templates List Table */}
        <div className="admin-table-container" style={{ background: 'var(--bg-sidebar)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', width: '15%' }}>Template ID</th>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', width: '25%' }}>Title</th>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', width: '45%' }}>Template Content (Body)</th>
                <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', width: '15%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {systemTemplates.map(t => {
                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border-light)' }} className="table-row-hover">
                    <td style={{ padding: '12px 20px', color: 'var(--text-muted)' }}>#{t.id}</td>
                    <td style={{ padding: '12px 20px', color: '#fff' }}><strong>{t.title}</strong></td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-main)', fontSize: '0.88rem' }}>{t.body}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDeleteSystemTemplate(t.id)}
                        style={{ padding: '6px 12px', fontSize: '0.78rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderAdminDashboard = () => {
    return (
      <div className="admin-container" style={{ display: 'flex', width: '100vw', height: '100vh', background: 'var(--bg-app)', color: 'var(--text-main)', overflow: 'hidden' }}>
        {/* Admin Alerts Banner */}
        {alert && (
          <div className="admin-alert-overlay" style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, width: '90%', maxWidth: '500px' }}>
            <div className={`custom-alert ${alert.type}`}>
              {alert.type === 'success' ? '✓' : '⚠'} {alert.message}
            </div>
          </div>
        )}

        {/* Sidebar */}
        <div className="admin-sidebar" style={{ width: '280px', minWidth: '280px', background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', height: '100%', zIndex: 100 }}>
          <div className="admin-sidebar-header" style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="admin-logo" style={{ fontSize: '2rem' }}>🛡️</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: '600' }}>Admin Workspace</h3>
              <span className="admin-role-badge" style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: '600', marginTop: '2px' }}>System Administrator</span>
            </div>
          </div>

          <div className="admin-sidebar-nav" style={{ flex: '1', padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
            <button
              className={`admin-nav-btn ${adminTab === 'overview' ? 'active' : ''}`}
              onClick={() => setAdminTab('overview')}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: adminTab === 'overview' ? 'rgba(36, 129, 204, 0.12)' : 'transparent', color: adminTab === 'overview' ? '#fff' : 'var(--text-muted)', fontSize: '0.92rem', fontWeight: '500', textAlign: 'left', transition: 'var(--transition-fast)' }}
            >
              📊 Dashboard
            </button>
            <button
              className={`admin-nav-btn ${adminTab === 'users' ? 'active' : ''}`}
              onClick={() => setAdminTab('users')}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: adminTab === 'users' ? 'rgba(36, 129, 204, 0.12)' : 'transparent', color: adminTab === 'users' ? '#fff' : 'var(--text-muted)', fontSize: '0.92rem', fontWeight: '500', textAlign: 'left', transition: 'var(--transition-fast)' }}
            >
              👥 User Accounts
            </button>
            <button
              className={`admin-nav-btn ${adminTab === 'logs' ? 'active' : ''}`}
              onClick={() => { setAdminTab('logs'); setSmsLogsPage(1); }}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: adminTab === 'logs' ? 'rgba(36, 129, 204, 0.12)' : 'transparent', color: adminTab === 'logs' ? '#fff' : 'var(--text-muted)', fontSize: '0.92rem', fontWeight: '500', textAlign: 'left', transition: 'var(--transition-fast)' }}
            >
              📜 SMS Logs
            </button>
            <button
              className={`admin-nav-btn ${adminTab === 'transactions' ? 'active' : ''}`}
              onClick={() => setAdminTab('transactions')}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: adminTab === 'transactions' ? 'rgba(36, 129, 204, 0.12)' : 'transparent', color: adminTab === 'transactions' ? '#fff' : 'var(--text-muted)', fontSize: '0.92rem', fontWeight: '500', textAlign: 'left', transition: 'var(--transition-fast)' }}
            >
              💳 Transactions
            </button>
            <button
              className={`admin-nav-btn ${adminTab === 'templates' ? 'active' : ''}`}
              onClick={() => setAdminTab('templates')}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: adminTab === 'templates' ? 'rgba(36, 129, 204, 0.12)' : 'transparent', color: adminTab === 'templates' ? '#fff' : 'var(--text-muted)', fontSize: '0.92rem', fontWeight: '500', textAlign: 'left', transition: 'var(--transition-fast)' }}
            >
              📋 System Templates
            </button>
          </div>

          <div className="admin-sidebar-footer" style={{ padding: '20px', borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="admin-info" style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: '600', color: '#fff' }}>{loggedInUser.fullName}</span>
              <span className="admin-subtext" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{loggedInUser.email}</span>
            </div>
            <button
              className="admin-logout-btn"
              onClick={handleLogout}
              style={{ width: '100%', padding: '10px', border: '1px solid var(--color-danger)', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'var(--transition-fast)' }}
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="admin-content" style={{ flex: '1', padding: '30px 40px', overflowY: 'auto', background: 'var(--bg-app)' }}>
          {adminTab === 'overview' && renderAdminOverview()}
          {adminTab === 'users' && renderAdminUsers()}
          {adminTab === 'logs' && renderAdminSmsLogs()}
          {adminTab === 'transactions' && renderAdminTransactions()}
          {adminTab === 'templates' && renderAdminTemplates()}
        </div>

        {/* Modal for User Quota editing */}
        {showQuotaModal && selectedUserForQuota && (
          <div className="admin-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="admin-modal" style={{ background: 'var(--bg-sidebar)', padding: '30px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', width: '90%', maxWidth: '400px', boxShadow: 'var(--shadow-lg)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#fff', marginBottom: '10px' }}>Edit User Quota</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>Adjust SMS limit for user <strong>{selectedUserForQuota.username}</strong></p>
              <div className="form-group" style={{ margin: '20px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Free SMS Messages Left</label>
                <input
                  type="number"
                  min="0"
                  value={newQuotaValue}
                  onChange={(e) => setNewQuotaValue(parseInt(e.target.value) || 0)}
                  style={{ width: '100%', padding: '10px', background: '#182533', border: '1px solid var(--border-light)', color: '#fff', borderRadius: '8px' }}
                />
              </div>
              <div className="admin-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={() => { setShowQuotaModal(false); setSelectedUserForQuota(null); }} style={{ padding: '8px 16px', background: '#1a2432', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSaveQuota} style={{ padding: '8px 16px' }}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Admin AI Copilot Button (FAB) */}
        {!isAdminChatOpen && (
          <button
            className="admin-ai-fab animate-glow"
            onMouseDown={handleAdminAiBubbleMouseDown}
            style={{
              position: 'fixed',
              left: `${adminAiPosition.x}px`,
              top: `${adminAiPosition.y}px`,
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary), #8b5cf6)',
              border: 'none',
              cursor: 'grab',
              boxShadow: '0 0 15px rgba(36, 129, 204, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              fontSize: '1.8rem',
              outline: 'none',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              userSelect: 'none'
            }}
            title="Open Admin AI Copilot"
          >
            🤖
          </button>
        )}

        {/* Admin AI Copilot Drawer */}
        <div
          className={`admin-ai-drawer ${isAdminChatOpen ? 'open' : ''}`}
          style={{
            position: 'fixed',
            top: 0,
            right: isAdminChatOpen ? 0 : `-${adminChatWidth + 20}px`,
            width: `${adminChatWidth}px`,
            height: '100vh',
            background: 'rgba(21, 31, 43, 0.8)',
            backdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.05s ease-out',
            overflow: 'hidden'
          }}
        >
          {/* Resize Handle */}
          <div
            onMouseDown={startResizeAdminChat}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '6px',
              height: '100%',
              cursor: 'col-resize',
              zIndex: 100000,
              background: 'transparent',
              transition: 'background 0.2s'
            }}
            className="drawer-resize-handle"
          />
          {/* Drawer Header */}
          <div style={{ padding: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyBetween: 'space-between', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.5rem' }}>🤖</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.05rem', fontWeight: '600' }}>Admin Copilot</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Online & Connected</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsAdminChatOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer', outline: 'none' }}
              className="drawer-close-btn"
            >
              ✕
            </button>
          </div>

          {/* Chat Messages */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }} className="admin-chat-scroll">
            {adminChatMessages.map((msg, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: msg.role === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                    background: msg.role === 'user' ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.05)',
                    color: '#fff',
                    fontSize: '0.9rem',
                    lineHeight: '1.4',
                    whiteSpace: 'pre-wrap',
                    border: msg.role === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  {msg.content}
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {msg.role === 'user' ? 'Bạn' : 'Copilot'}
                </span>
              </div>
            ))}
            {isAdminChatLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start', background: 'rgba(255, 255, 255, 0.03)', padding: '10px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="spinner-mini" style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Copilot đang phân tích dữ liệu...</span>
              </div>
            )}
            <div ref={adminChatEndRef} />
          </div>

          {/* Suggested Quick Prompt Chips */}
          <div style={{ padding: '0 20px 15px 20px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button
              onClick={(e) => handleAdminChatSend(e, 'Hãy báo cáo tỷ lệ gửi tin nhắn SMS thành công hiện tại.')}
              style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '6px 12px', fontSize: '0.78rem', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s', outline: 'none' }}
              className="suggestion-chip"
            >
              📊 Tỷ lệ SMS
            </button>
            <button
              onClick={(e) => handleAdminChatSend(e, 'Hãy thống kê nhanh các thông số tổng quan hệ thống.')}
              style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '6px 12px', fontSize: '0.78rem', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s', outline: 'none' }}
              className="suggestion-chip"
            >
              📉 Thống kê tổng quan
            </button>
            <button
              onClick={(e) => handleAdminChatSend(e, 'Soạn giúp tôi một mẫu tin nhắn SMS thông báo bảo trì hệ thống dài dưới 120 ký tự.')}
              style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '6px 12px', fontSize: '0.78rem', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s', outline: 'none' }}
              className="suggestion-chip"
            >
              🔧 Soạn SMS bảo trì
            </button>
          </div>

          {/* Drawer Input */}
          <form
            onSubmit={(e) => handleAdminChatSend(e)}
            style={{ padding: '15px 20px 20px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', gap: '10px', alignItems: 'center' }}
          >
            <input
              type="text"
              placeholder="Hỏi về doanh thu, stats hoặc nhờ soạn SMS..."
              value={adminChatInput}
              onChange={(e) => setAdminChatInput(e.target.value)}
              disabled={isAdminChatLoading}
              style={{ flex: 1, padding: '12px 16px', background: '#121c27', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
            />
            <button
              type="submit"
              disabled={isAdminChatLoading || !adminChatInput.trim()}
              style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--color-primary)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyCenter: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}
            >
              ➔
            </button>
          </form>
        </div>
      </div>
    );
  };

  // Private Authenticated Views
  if (loggedInUser.isAdmin) {
    return renderAdminDashboard();
  }

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
        <div className="sidebar-tabs" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', padding: '8px' }}>
          <button className={`tab-btn ${activeTab === 'chats' ? 'active' : ''}`} onClick={() => { setActiveTab('chats'); setSelectedContact(null); }}>
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
          <button className={`tab-btn ${activeTab === 'templates' ? 'active' : ''}`} onClick={() => { setActiveTab('templates'); loadTemplates(); }}>
            Templates
          </button>
          <button className={`tab-btn ${activeTab === 'groups' ? 'active' : ''}`} onClick={() => { setActiveTab('groups'); loadGroups(); setSelectedGroup(null); setGroupMembers([]); setBulkResultsLog(null); }}>
            Groups
          </button>
          <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => { setActiveTab('analytics'); loadAnalyticsStats(); }}>
            Stats
          </button>
          <button className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`} onClick={() => { setActiveTab('security'); loadBlocklist(); }}>
            Security
          </button>
          <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            Profile
          </button>
        </div>

        <div className="sidebar-list-container">
          {renderSidebarList()}
          {['requests', 'services', 'profile', 'templates', 'groups', 'analytics', 'security'].includes(activeTab) && (
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
          <div key="workspace-alert-banner" style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, width: '90%', maxWidth: '500px' }}>
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
                  const isPending = msg.scheduledAt && new Date(msg.scheduledAt) > new Date();
                  return (
                    <div key={msg.id} className={`message-bubble-row ${isSentByMe ? 'sent' : 'received'}`}>
                      <div className="message-bubble">
                        <span className="message-text">{msg.content}</span>
                        <span className="message-time">
                          {formattedTime}
                          {isPending && (
                            <span className="msg-scheduled-badge">⏰ Hẹn giờ: {new Date(msg.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              {contactIsTyping && (
                <div className="message-bubble-row received">
                  <div className="message-bubble typing-bubble">
                    <div className="typing-dots">
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                    </div>
                    <span className="typing-text">{selectedContact.name} đang nhập...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleSendMessageSubmit} style={{ position: 'relative' }}>
              {/* Composer Toolbar */}
              <div className="composer-tools-row">
                <button
                  type="button"
                  className={`composer-tool-btn ${showScheduler ? 'active' : ''}`}
                  onClick={() => {
                    setShowScheduler(!showScheduler);
                    setShowTemplatePicker(false);
                    setShowAiAssistant(false);
                  }}
                >
                  ⏰ Hẹn giờ {scheduleDate && '✓'}
                </button>
                <button
                  type="button"
                  className={`composer-tool-btn ${showTemplatePicker ? 'active' : ''}`}
                  onClick={() => {
                    setShowTemplatePicker(!showTemplatePicker);
                    setShowScheduler(false);
                    setShowAiAssistant(false);
                  }}
                >
                  📄 Mẫu tin nhắn
                </button>
                <button
                  type="button"
                  className={`composer-tool-btn ${showAiAssistant ? 'active' : ''}`}
                  onClick={() => {
                    setShowAiAssistant(!showAiAssistant);
                    setShowScheduler(false);
                    setShowTemplatePicker(false);
                  }}
                >
                  ✨ Trợ lý AI
                </button>
                {scheduleDate && (
                  <span style={{ fontSize: '0.75rem', color: '#fbbf24', marginLeft: 'auto' }}>
                    Hẹn giờ: {new Date(scheduleDate).toLocaleString()}
                  </span>
                )}
              </div>

              {/* Scheduler Popover */}
              {showScheduler && (
                <div className="scheduler-popover">
                  <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Chọn Ngày/Giờ Gửi:</label>
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button type="button" className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.72rem' }} onClick={() => { setScheduleDate(''); setShowScheduler(false); }}>
                      Xóa
                    </button>
                    <button type="button" className="btn btn-primary" style={{ padding: '2px 8px', fontSize: '0.72rem' }} onClick={() => setShowScheduler(false)}>
                      Xác nhận
                    </button>
                  </div>
                </div>
              )}

              {/* Template Picker Popover */}
              {showTemplatePicker && (
                <div className="template-quick-picker">
                  <div style={{ padding: '10px', fontWeight: 'bold', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Chọn tin nhắn mẫu</span>
                    <button type="button" style={{ background: 'none', border: 'none', color: '#ff5555', cursor: 'pointer' }} onClick={() => setShowTemplatePicker(false)}>✕</button>
                  </div>
                  {templates.length === 0 ? (
                    <div style={{ padding: '15px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Không có mẫu tin nhắn.</div>
                  ) : (
                    templates.map(tpl => (
                      <div
                        key={tpl.id}
                        className="template-picker-item"
                        onClick={() => {
                          let text = tpl.body.replace('{Name}', selectedContact.name);
                          setNewMessage(text.substring(0, 120));
                          setShowTemplatePicker(false);
                        }}
                      >
                        <h5>{tpl.title}</h5>
                        <p>{tpl.body}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* AI Assistant Popover */}
              {showAiAssistant && (
                <div className="ai-assistant-popover">
                  <div style={{ padding: '4px 0px 8px 0px', fontWeight: 'bold', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-main)' }}>✨ Trợ lý SMS AI</span>
                    <button type="button" style={{ background: 'none', border: 'none', color: '#ff5555', cursor: 'pointer', fontSize: '1rem' }} onClick={() => setShowAiAssistant(false)}>✕</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--text-muted)', textAlign: 'left', display: 'block' }}>Ý tưởng tin nhắn:</label>
                    <textarea
                      placeholder="VD: nhắc nợ bạn tiền ăn trưa lịch sự..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      disabled={generatingAi}
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    />

                    <label style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--text-muted)', textAlign: 'left', display: 'block' }}>Văn phong:</label>
                    <select
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value)}
                      disabled={generatingAi}
                      style={{ width: '100%' }}
                    >
                      <option value="polite">Lịch sự</option>
                      <option value="formal">Trang trọng</option>
                      <option value="funny">Hài hước</option>
                      <option value="intimate">Thân mật</option>
                    </select>

                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: '6px', fontSize: '0.8rem', marginTop: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', width: '100%' }}
                      onClick={handleGenerateAiMessage}
                      disabled={generatingAi || !aiPrompt.trim()}
                    >
                      {generatingAi ? (
                        <>
                          <span className="spinner-small"></span> Đang tạo...
                        </>
                      ) : (
                        'Tạo tin nhắn'
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="chat-input-row">
                <div className="chat-textarea-container">
                  <textarea
                    ref={textareaRef}
                    className="chat-textarea"
                    placeholder={
                      remainingQuota?.remaining === 0 && !remainingQuota?.isFriend
                        ? "SMS limit reached. Friend this user to chat."
                        : "Type an SMS message..."
                    }
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value.substring(0, 150));
                      handleTyping();
                    }}
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
                        onChange={() => { }} // handled by click of parent card
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

        {/* Templates Tab content */}
        {activeTab === 'templates' && (
          <div className="view-panel">
            <div className="view-header">
              <h1>Quản lý Tin nhắn mẫu</h1>
              <p>Tạo và quản lý các câu chúc, mẫu tin nhắn công việc hoặc lời nhắc tự động.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '25px' }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '20px', height: 'fit-content' }}>
                <h3 style={{ marginBottom: '15px', color: 'var(--color-primary)' }}>Tạo mẫu mới</h3>
                <form onSubmit={handleCreateTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div className="form-group">
                    <label>Tiêu đề mẫu</label>
                    <input
                      type="text"
                      placeholder="e.g. Lời chúc Sinh nhật"
                      value={templateForm.title}
                      onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Nội dung tin nhắn</label>
                    <textarea
                      placeholder="Sử dụng {Name} để tự điền tên người nhận."
                      value={templateForm.body}
                      onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value.substring(0, 120) })}
                      rows={4}
                      required
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Hạn mức: {templateForm.body.length}/120 ký tự.
                    </span>
                  </div>
                  <button type="submit" className="btn btn-primary">Lưu mẫu tin</button>
                </form>
              </div>

              <div className="templates-grid">
                {templates.length === 0 ? (
                  <div className="empty-list-message" style={{ gridColumn: '1/-1' }}>
                    Chưa có tin nhắn mẫu nào. Hãy tạo một mẫu ở form bên trái!
                  </div>
                ) : (
                  templates.map(tpl => (
                    <div key={tpl.id} className="template-card">
                      <div className="template-card-header">
                        <span className="template-card-title">{tpl.title}</span>
                        <span className={`template-badge ${tpl.userId ? 'custom' : 'system'}`}>
                          {tpl.userId ? 'Custom' : 'System'}
                        </span>
                      </div>
                      <div className="template-card-body">
                        {tpl.body}
                      </div>
                      <div className="template-card-actions">
                        {tpl.userId && (
                          <button
                            className="btn-icon-danger"
                            onClick={() => handleDeleteTemplate(tpl.id)}
                            title="Xóa mẫu tin"
                          >
                            🗑
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Groups Tab content */}
        {activeTab === 'groups' && (
          <div className="view-panel">
            <div className="view-header">
              <h1>Gửi tin nhắn hàng loạt theo nhóm</h1>
              <p>Tạo danh mục nhóm danh bạ và gửi tin nhắn hàng loạt chỉ với 1 click.</p>
            </div>

            <div className="groups-container">
              <div className="groups-sidebar">
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>Danh sách nhóm</h3>
                <form onSubmit={handleCreateGroup} style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                  <input
                    type="text"
                    placeholder="Tên nhóm mới"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm({ name: e.target.value })}
                    style={{ flex: 1, background: 'var(--bg-app)', border: '1px solid var(--border-light)', color: 'var(--text-main)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', outline: 'none' }}
                    required
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>+</button>
                </form>

                <div className="groups-list">
                  {groups.length === 0 ? (
                    <div style={{ padding: '15px', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>Chưa có nhóm nào.</div>
                  ) : (
                    groups.map(g => (
                      <div
                        key={g.id}
                        className={`group-list-item ${selectedGroup?.id === g.id ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedGroup(g);
                          loadGroupMembers(g.id);
                          setBulkResultsLog(null);
                        }}
                      >
                        <span className="group-list-name">👥 {g.name}</span>
                        <button
                          style={{ background: 'none', border: 'none', color: '#ff5555', cursor: 'pointer', fontSize: '0.8rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(g.id, g.name);
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="group-details-pane">
                {selectedGroup ? (
                  <>
                    <div className="group-pane-header">
                      <h3 className="group-pane-title">Chi tiết nhóm: {selectedGroup.name}</h3>
                      <form onSubmit={handleAddGroupMember} style={{ display: 'flex', gap: '8px' }}>
                        <select
                          value={newGroupMemberId}
                          onChange={(e) => setNewGroupMemberId(e.target.value)}
                          style={{ background: 'var(--bg-app)', border: '1px solid var(--border-light)', color: 'var(--text-main)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', outline: 'none' }}
                          required
                        >
                          <option value="">-- Thêm liên hệ vào nhóm --</option>
                          {contacts.map(c => {
                            const inGroup = groupMembers.some(m => m.id === c.id);
                            if (inGroup) return null;
                            return (
                              <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.contactNumber})</option>
                            );
                          })}
                        </select>
                        <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Thêm</button>
                      </form>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h4 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Thành viên nhóm ({groupMembers.length})</h4>
                      {groupMembers.length === 0 ? (
                        <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          Nhóm chưa có thành viên. Hãy chọn liên hệ từ danh sách trên để thêm!
                        </div>
                      ) : (
                        <div className="group-members-grid">
                          {groupMembers.map(m => (
                            <div key={m.id} className="group-member-card">
                              <div className="group-member-info">
                                <h5>{m.firstName} {m.lastName}</h5>
                                <p>{m.contactNumber}</p>
                              </div>
                              <button
                                className="btn-icon-danger"
                                onClick={() => handleRemoveGroupMember(m.id)}
                                title="Xóa khỏi nhóm"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {groupMembers.length > 0 && (
                      <div className="group-bulk-box">
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '10px', color: 'var(--color-primary)' }}>Soạn tin nhắn hàng loạt</h4>
                        <form onSubmit={handleSendBulkMessage} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <textarea
                            placeholder="Nhập nội dung gửi cho cả nhóm..."
                            value={bulkContent}
                            onChange={(e) => setBulkContent(e.target.value.substring(0, 120))}
                            rows={2}
                            required
                          />

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <label style={{ fontSize: '0.78rem' }}>Hẹn giờ gửi (Tùy chọn):</label>
                              <input
                                type="datetime-local"
                                value={bulkScheduleDate}
                                onChange={(e) => setBulkScheduleDate(e.target.value)}
                                style={{ background: 'var(--bg-app)', border: '1px solid var(--border-light)', color: 'var(--text-main)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.78rem' }}
                                min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                              />
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Đã viết: {bulkContent.length}/120
                            </span>
                            <button type="submit" className="btn btn-primary" style={{ marginLeft: 'auto', padding: '8px 20px' }}>
                              Gửi hàng loạt 🚀
                            </button>
                          </div>
                        </form>

                        {bulkResultsLog && (
                          <div className="bulk-results-log">
                            {bulkResultsLog}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '15px' }}>👥</div>
                    <h3>Chưa chọn nhóm</h3>
                    <p>Hãy chọn một nhóm ở menu bên trái để quản lý thành viên hoặc gửi tin nhắn nhóm.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab content */}
        {activeTab === 'analytics' && analyticsStats && (
          <div className="view-panel">
            <div className="view-header">
              <h1>Thống kê & Báo cáo trạng thái</h1>
              <p>Theo dõi hiệu suất gửi tin nhắn, tỷ lệ thành công và kiểm soát hạn mức quota của bạn.</p>
            </div>

            <div className="analytics-grid">
              <div className="analytics-card">
                <div className="analytics-card-icon sent">💬</div>
                <div className="analytics-card-content">
                  <h4>Tổng tin nhắn gửi</h4>
                  <p>{analyticsStats.totalSent}</p>
                </div>
              </div>
              <div className="analytics-card">
                <div className="analytics-card-icon success">✓</div>
                <div className="analytics-card-content">
                  <h4>Gửi Thành công</h4>
                  <p>{analyticsStats.deliveredCount}</p>
                </div>
              </div>
              <div className="analytics-card">
                <div className="analytics-card-icon failed">✗</div>
                <div className="analytics-card-content">
                  <h4>Gửi thất bại</h4>
                  <p>{analyticsStats.failedCount}</p>
                </div>
              </div>
              <div className="analytics-card">
                <div className="analytics-card-icon pending">⏰</div>
                <div className="analytics-card-content">
                  <h4>Chờ gửi (Hẹn giờ)</h4>
                  <p>{analyticsStats.pendingCount}</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '25px' }}>
              <div className="analytics-chart-panel">
                <h3 className="analytics-chart-title">Lưu lượng gửi tin nhắn (7 ngày qua)</h3>

                <div className="custom-chart-container">
                  {analyticsStats.dailyStats.map((item, idx) => {
                    const maxVal = Math.max(...analyticsStats.dailyStats.map(d => d.count), 1);
                    const heightPercent = Math.min((item.count / maxVal) * 100, 100);
                    const shortDate = item.date.substring(5);

                    return (
                      <div key={idx} className="chart-bar-column">
                        <div
                          className="chart-bar-body"
                          style={{ height: `${heightPercent}%` }}
                        >
                          <div className="chart-bar-tooltip">{item.count} SMS</div>
                        </div>
                        <div className="chart-axis-label">{shortDate}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="quota-gauge-card">
                <div className="quota-gauge-header">
                  <span>Hạn mức gửi tin miễn phí còn lại (Người lạ)</span>
                  <span style={{ fontWeight: 'bold' }}>{analyticsStats.freeLeft} / 5 tin</span>
                </div>
                <div className="quota-gauge-progress-bg">
                  <div
                    className={`quota-gauge-progress-fill ${analyticsStats.freeLeft <= 1 ? 'danger' : analyticsStats.freeLeft <= 3 ? 'warning' : ''}`}
                    style={{ width: `${(analyticsStats.freeLeft / 5) * 100}%` }}
                  />
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  * Hạn mức 5 tin nhắn miễn phí áp dụng khi gửi tin tới mỗi số điện thoại người lạ (chưa nằm trong danh sách bạn bè). Thêm họ làm bạn bè để được nhắn tin miễn phí vô hạn!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Security & Privacy Settings Tab */}
        {activeTab === 'security' && (
          <div className="view-panel">
            <div className="view-header">
              <h1>Cài đặt riêng tư & Bảo mật tài khoản</h1>
              <p>Cấu hình xác thực 2 lớp, tùy chọn chặn người lạ và quản lý danh sách đen.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '25px' }}>
              <div>
                <h3 className="settings-section-title">Bảo mật tài khoản</h3>

                <div className="privacy-toggle-card">
                  <div className="privacy-toggle-info">
                    <h4>Xác thực 2 lớp qua Email (2FA)</h4>
                    <p>Yêu cầu nhập mã OTP gửi về Email khi đăng nhập tài khoản hoặc mua dịch vụ VAS.</p>
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

                <h3 className="settings-section-title">Cài đặt Quyền riêng tư</h3>

                <div className="privacy-toggle-card">
                  <div className="privacy-toggle-info">
                    <h4>Chỉ nhận SMS từ Bạn bè</h4>
                    <p>Từ chối nhận tin nhắn từ những số lạ (người lạ không thể gửi 5 tin nhắn miễn phí cho bạn).</p>
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

              <div className="blocklist-container">
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '15px', color: 'var(--color-primary)' }}>
                  Danh sách chặn (Blocklist)
                </h3>

                <form onSubmit={handleBlockNumber} className="blocklist-input-group">
                  <input
                    type="text"
                    placeholder="Số điện thoại cần chặn (10 số)"
                    value={blockNumberInput}
                    onChange={(e) => setBlockNumberInput(e.target.value.replace(/\D/g, '').substring(0, 10))}
                    maxLength={10}
                    required
                  />
                  <button type="submit" className="btn btn-danger" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>Block</button>
                </form>

                <div className="block-items-list">
                  {blocklist.length === 0 ? (
                    <div style={{ padding: '15px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>Danh sách chặn trống.</div>
                  ) : (
                    blocklist.map(b => (
                      <div key={b.id} className="block-item">
                        <div>
                          <div className="block-item-number">🚫 {b.blockedNumber}</div>
                        </div>
                        <button
                          className="btn-icon-danger"
                          onClick={() => handleUnblockNumber(b.id)}
                          style={{ fontSize: '0.78rem' }}
                        >
                          Hủy chặn
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
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

              {showPaymentOtpField && (
                <div className="form-group" style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '12px', borderRadius: '4px', border: '1px dashed rgba(245, 158, 11, 0.3)' }}>
                  <label style={{ color: '#fbbf24', fontWeight: 'bold' }}>Nhập mã OTP Xác thực thanh toán</label>
                  <input
                    type="text"
                    placeholder="Nhập mã OTP 6 số"
                    value={paymentOtpCode}
                    onChange={(e) => setPaymentOtpCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                    maxLength={6}
                    required
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    * Vui lòng kiểm tra Console backend để lấy mã OTP giao dịch.
                  </span>
                </div>
              )}

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

      {/* AI Floating Chatbot Widget */}
      {!isAiBubbleOpen && (
        <div
          className="ai-floating-bubble"
          style={{ left: `${aiPosition.x}px`, top: `${aiPosition.y}px` }}
          onMouseDown={handleAiBubbleMouseDown}
        >
          🤖
        </div>
      )}

      {isAiBubbleOpen && (
        <div
          className="ai-mini-chat-window"
          style={{
            left: `${aiChatPosition.x}px`,
            top: `${aiChatPosition.y}px`,
            right: 'auto',
            bottom: 'auto'
          }}
        >
          <div className="ai-mini-chat-header" onMouseDown={handleAiChatMouseDown}>
            <h3>🤖 Trợ lý AI Chatbot</h3>
            <button className="ai-mini-chat-close-btn" onClick={() => setIsAiBubbleOpen(false)}>×</button>
          </div>

          <div className="ai-mini-chat-messages">
            {aiMessages.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.82rem', textAlign: 'center', marginTop: '20px' }}>
                Hỏi mình bất cứ điều gì nhé! 💬
              </div>
            ) : (
              aiMessages.map((msg, index) => {
                const isBot = msg.senderId === 999;
                return (
                  <div key={index} className={`ai-mini-msg ${isBot ? 'bot' : 'user'}`}>
                    {msg.content}
                  </div>
                );
              })
            )}
            {isAiLoading && (
              <div className="ai-mini-chat-loading">
                <div className="spinner-small"></div>
                <span>Trợ lý AI đang soạn câu trả lời...</span>
              </div>
            )}
            <div ref={aiMessagesEndRef} />
          </div>

          <form className="ai-mini-chat-input-area" onSubmit={handleAiSendMessage}>
            <input
              type="text"
              placeholder="Nhập câu hỏi..."
              value={aiNewMessage}
              onChange={(e) => setAiNewMessage(e.target.value)}
              disabled={isAiLoading}
            />
            <button type="submit" className="ai-mini-chat-send-btn" disabled={!aiNewMessage.trim() || isAiLoading}>
              ➡️
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
