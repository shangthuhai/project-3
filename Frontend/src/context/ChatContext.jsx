import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { HubConnectionBuilder } from '@microsoft/signalr';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import {
  getUser,
  updateUser,
  getContacts,
  addContact as apiAddContact,
  deleteContact as apiDeleteContact,
  getFriends,
  getPendingRequests,
  sendFriendRequest,
  respondFriendRequest,
  searchUsers,
  getChatHistory,
  getQuota,
  sendMessage as apiSendMessage,
  getActivatedServices,
  activateService as apiActivateService,
  toggle2Fa as apiToggle2Fa,
  togglePrivacy as apiTogglePrivacy,
  getBlocklist,
  blockNumber as apiBlockNumber,
  unblockNumber as apiUnblockNumber,
  unblockNumberByPhone as apiUnblockNumberByPhone,
  getTemplates,
  createTemplate as apiCreateTemplate,
  deleteTemplate as apiDeleteTemplate,
  getGroups,
  createGroup as apiCreateGroup,
  deleteGroup as apiDeleteGroup,
  getGroupMembers,
  addGroupMember as apiAddGroupMember,
  removeGroupMember as apiRemoveGroupMember,
  sendBulkMessage,
  getAnalyticsStats,
  requestPaymentOtp,
  generateAiSms,
  getConversations,
  getApiUrl
} from '../api';

const ChatContext = createContext(null);

export const getInitialAiChatPosition = () => {
  const btn = document.getElementById('ai-chatbot-icon-btn');
  const chatWidth = 360;
  const chatHeight = 480;
  const margin = 12;

  if (btn) {
    const rect = btn.getBoundingClientRect();
    if (window.innerWidth <= 1024) {
      let x = rect.left + rect.width / 2 - chatWidth / 2;
      let y = rect.top - chatHeight - margin;

      x = Math.max(margin, Math.min(window.innerWidth - chatWidth - margin, x));
      y = Math.max(margin, Math.min(window.innerHeight - chatHeight - margin, y));
      return { x, y };
    } else {
      let x = rect.right + margin;
      let y = rect.top;

      x = Math.max(margin, Math.min(window.innerWidth - chatWidth - margin, x));
      y = Math.max(margin, Math.min(window.innerHeight - chatHeight - margin, y));
      return { x, y };
    }
  }

  if (window.innerWidth <= 1024) {
    return {
      x: Math.max(12, Math.floor((window.innerWidth - chatWidth) / 2)),
      y: Math.max(12, window.innerHeight - chatHeight - 72)
    };
  }

  return {
    x: 82,
    y: Math.max(12, Math.min(window.innerHeight - chatHeight - 12, 216))
  };
};

export function ChatProvider({ children }) {
  const { loggedInUser, triggerAlert, updateLoggedInUserLocal } = useAuth();
  const { language, t } = useLanguage();

  // Navigation and generic tabs
  const [activeTab, setActiveTab] = useState('chats');

  // Sidebar collections
  const [contacts, setContacts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchPage, setSearchPage] = useState(1);
  const [hasMoreSearchResults, setHasMoreSearchResults] = useState(false);
  const [loadingMoreSearchResults, setLoadingMoreSearchResults] = useState(false);

  // Active Chat Session
  const [selectedContact, setSelectedContactInternal] = useState(null);

  const mergeAndSetConversations = (dbConvs, localConvs) => {
    const merged = [...dbConvs];
    localConvs.forEach(lc => {
      if (!merged.some(dc => dc.contactNumber === lc.contactNumber)) {
        merged.push({
          userId: lc.userId,
          name: lc.name,
          contactNumber: lc.contactNumber,
          avatar: lc.avatar,
          isFriend: lc.isFriend,
          lastMessageContent: lc.lastMessageContent || null,
          lastMessageTime: lc.lastMessageTime || null
        });
      }
    });
    setConversations(merged);
  };

  const setSelectedContact = (contact) => {
    setSelectedContactInternal(contact);
    if (contact && contact.contactNumber && contact.contactNumber !== '9999999999' && loggedInUser) {
      try {
        const localChats = JSON.parse(localStorage.getItem(`local_chats_${loggedInUser.id}`) || '[]');
        const isAlreadyInLocal = localChats.some(c => c.contactNumber === contact.contactNumber);
        const inConversationsList = conversations.some(c => c.contactNumber === contact.contactNumber && c.lastMessageTime);

        if (!isAlreadyInLocal && !inConversationsList) {
          const newLocalChat = {
            userId: contact.id || contact.userId,
            name: contact.name,
            contactNumber: contact.contactNumber,
            avatar: contact.avatar || contact.profilePhoto,
            isFriend: contact.isFriend,
            lastMessageContent: contact.lastMessageContent,
            lastMessageTime: contact.lastMessageTime
          };
          const updatedLocalChats = [...localChats, newLocalChat];
          localStorage.setItem(`local_chats_${loggedInUser.id}`, JSON.stringify(updatedLocalChats));
          mergeAndSetConversations(conversations, updatedLocalChats);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const [chatMessages, setChatMessages] = useState([]);
  const [contactIsTyping, setContactIsTyping] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [remainingQuota, setRemainingQuota] = useState(null);

  // Scheduled & templates
  const [scheduleDate, setScheduleDate] = useState('');
  const [showScheduler, setShowScheduler] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templateForm, setTemplateForm] = useState({ title: '', body: '' });

  // Groups & Bulk
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupForm, setGroupForm] = useState({ name: '' });
  const [newGroupMemberId, setNewGroupMemberId] = useState('');
  const [bulkContent, setBulkContent] = useState('');
  const [bulkScheduleDate, setBulkScheduleDate] = useState('');
  const [bulkResultsLog, setBulkResultsLog] = useState(null);

  // Services
  const [activatedServices, setActivatedServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);

  // Modals & Form states
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [contactForm, setContactForm] = useState({ firstName: '', lastName: '', contactNumber: '' });
  const [requestForm, setRequestForm] = useState({ email: '' });
  const [paymentForm, setPaymentForm] = useState({ cardNumber: '', expiryDate: '', cvv: '' });
  const [profileForm, setProfileForm] = useState({});
  const [showPaymentOtpField, setShowPaymentOtpField] = useState(false);
  const [paymentOtpCode, setPaymentOtpCode] = useState('');

  // Privacy & Blocklist
  const [blocklist, setBlocklist] = useState([]);
  const [blockNumberInput, setBlockNumberInput] = useState('');
  const [privacySettings, setPrivacySettings] = useState({ twoFactorEnabled: false, onlyReceiveFromFriends: false });

  // Analytics
  const [analyticsStats, setAnalyticsStats] = useState(null);

  // AI SMS Helper states
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState('polite');
  const [generatingAi, setGeneratingAi] = useState(false);

  const [aiPosition, setAiPosition] = useState(() => {
    const bubbleSize = 56;
    if (window.innerWidth <= 1024) {
      // Mobile/Tablet responsive bottom bar: center of bottom bar (left sidebar is at the bottom)
      const barHeight = 60;
      const x = Math.floor((window.innerWidth - bubbleSize) / 2);
      const y = window.innerHeight - barHeight + Math.floor((barHeight - bubbleSize) / 2);
      return { x, y };
    }
    // Desktop vertical sidebar: center of left sidebar (70px wide)
    const sidebarWidth = 70;
    const x = Math.floor((sidebarWidth - bubbleSize) / 2);
    const y = Math.floor((window.innerHeight - bubbleSize) / 2);
    return { x, y };
  });
  const [isAiBubbleOpen, setIsAiBubbleOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiNewMessage, setAiNewMessage] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiChatPosition, setAiChatPosition] = useState(getInitialAiChatPosition);

  // Refs for tracking active values inside async events / timeouts
  const connectionRef = useRef(null);
  const selectedContactRef = useRef(selectedContact);
  const lastTypingReportRef = useRef(0);
  const messagesEndRef = useRef(null);
  const chatMessagesAreaRef = useRef(null);
  const textareaRef = useRef(null);
  const searchListRef = useRef(null);
  const aiMessagesEndRef = useRef(null);

  // Chat message pagination
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);

  useEffect(() => {
    selectedContactRef.current = selectedContact;
  }, [selectedContact]);

  // Load backend private details when loggedInUser becomes available
  const refreshDashboardData = () => {
    if (!loggedInUser) return;
    getUser(loggedInUser.id)
      .then(freshUser => {
        updateLoggedInUserLocal(freshUser);
        setProfileForm(freshUser);
      })
      .catch(() => setProfileForm(loggedInUser));

    getContacts(loggedInUser.id).then(setContacts).catch(() => { });
    getFriends(loggedInUser.id).then(setFriends).catch(() => { });
    loadConversations();
    getPendingRequests(loggedInUser.id).then(setPendingRequests).catch(() => { });
    getActivatedServices(loggedInUser.id)
      .then(data => setActivatedServices(data.map(s => s.serviceName)))
      .catch(() => { });

    loadTemplates();
    loadGroups();
    loadBlocklist();
    loadAnalyticsStats();
    setPrivacySettings({
      twoFactorEnabled: loggedInUser.twoFactorEnabled,
      onlyReceiveFromFriends: loggedInUser.onlyReceiveFromFriends
    });
  };

  const loadConversations = () => {
    if (!loggedInUser) return;
    getConversations()
      .then(dbConvs => {
        let localChats = [];
        try {
          localChats = JSON.parse(localStorage.getItem(`local_chats_${loggedInUser.id}`) || '[]');
        } catch (e) {}
        
        // Clean up local chats that are now returned in dbConvs
        const filteredLocalChats = localChats.filter(lc => 
          !dbConvs.some(dc => dc.contactNumber === lc.contactNumber)
        );
        try {
          localStorage.setItem(`local_chats_${loggedInUser.id}`, JSON.stringify(filteredLocalChats));
        } catch (e) {}

        mergeAndSetConversations(dbConvs, filteredLocalChats);
      })
      .catch(() => { });
  };

  const loadTemplates = () => {
    getTemplates()
      .then(setTemplates)
      .catch(() => { });
  };

  const loadGroups = () => {
    getGroups()
      .then(setGroups)
      .catch(() => { });
  };

  const loadBlocklist = () => {
    getBlocklist()
      .then(setBlocklist)
      .catch(() => { });
  };

  const loadAnalyticsStats = () => {
    getAnalyticsStats()
      .then(setAnalyticsStats)
      .catch(() => { });
  };

  // SignalR setup
  useEffect(() => {
    if (!loggedInUser) {
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
      return;
    }

    if (loggedInUser.isAdmin) return; // Admin has separate AI copilot connection in their own views if needed

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
      loadConversations();
    });

    conn.on("ReceiveTypingStatus", (senderMobileNumber) => {
      const active = selectedContactRef.current;
      if (active && active.contactNumber === senderMobileNumber) {
        setContactIsTyping(true);
      }
    });

    conn.on("ReceiveBlockStatus", (data) => {
      const active = selectedContactRef.current;
      if (active && (active.contactNumber === data.blockerNumber || active.contactNumber === data.blockedNumber)) {
        loadChatDetails();
      }
      loadBlocklist();
    });

    conn.start()
      .then(() => console.log("SignalR Connection Started Successfully."))
      .catch(err => console.error("SignalR Connection Failed: ", err));

    connectionRef.current = conn;

    // Load initial data
    refreshDashboardData();

    return () => {
      conn.stop();
      connectionRef.current = null;
    };
  }, [loggedInUser?.id]);

  // Typing status inactivity timeout
  useEffect(() => {
    if (contactIsTyping) {
      const timer = setTimeout(() => {
        setContactIsTyping(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [contactIsTyping]);

  // Reset chat/AI helper state when switching selected contact
  const loadChatDetails = () => {
    if (!loggedInUser || !selectedContact) return;
    setHasMoreMessages(true);
    setLoadingMoreMessages(false);
    getChatHistory(loggedInUser.id, selectedContact.contactNumber, null, 20)
      .then(msgs => {
        let filtered = msgs;
        try {
          const deletedChats = JSON.parse(localStorage.getItem(`deleted_chats_${loggedInUser.id}`) || '{}');
          const deleteTimeStr = deletedChats[selectedContact.contactNumber];
          if (deleteTimeStr) {
            const deleteTime = new Date(deleteTimeStr);
            filtered = msgs.filter(m => new Date(m.sentTime) > deleteTime);
          }
        } catch (e) {
          console.error(e);
        }
        setChatMessages(filtered);
        if (msgs.length < 20) {
          setHasMoreMessages(false);
        }
      })
      .catch(() => triggerAlert('error', 'Failed to load chat history'));

    getQuota(loggedInUser.id, selectedContact.contactNumber)
      .then(setRemainingQuota)
      .catch(() => triggerAlert('error', 'Failed to fetch message quota'));
  };

  useEffect(() => {
    if (!loggedInUser || !selectedContact) return;
    setShowAiAssistant(false);
    setAiPrompt('');
    setContactIsTyping(false);
    loadChatDetails();
  }, [selectedContact]);

  // Debounced search results
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchPage(1);
      setHasMoreSearchResults(false);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      setSearchPage(1);
      setLoadingMoreSearchResults(true);
      searchUsers(searchQuery.trim(), 1, 10)
        .then(res => {
          setSearchResults(res.items);
          setHasMoreSearchResults(res.items.length < res.totalCount);
          setLoadingMoreSearchResults(false);
        })
        .catch(() => {
          setLoadingMoreSearchResults(false);
        });
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const loadMoreSearchResults = () => {
    if (loadingMoreSearchResults || !hasMoreSearchResults) return;
    setLoadingMoreSearchResults(true);
    const nextPage = searchPage + 1;

    searchUsers(searchQuery.trim(), nextPage, 10)
      .then(res => {
        setSearchResults(prev => [...prev, ...res.items]);
        setSearchPage(nextPage);
        setHasMoreSearchResults(searchResults.length + res.items.length < res.totalCount);
        setLoadingMoreSearchResults(false);
      })
      .catch(() => {
        setLoadingMoreSearchResults(false);
      });
  };

  const handleSearchScroll = (e) => {
    const container = e.target;
    if (
      container.scrollHeight - container.scrollTop - container.clientHeight < 20 &&
      hasMoreSearchResults &&
      !loadingMoreSearchResults
    ) {
      loadMoreSearchResults();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchPage(1);
    setHasMoreSearchResults(false);
  };

  const handleTyping = () => {
    if (!loggedInUser || !selectedContact || !connectionRef.current) return;
    const now = Date.now();
    if (now - lastTypingReportRef.current > 2000) {
      lastTypingReportRef.current = now;
      connectionRef.current.invoke("SendTyping", selectedContact.contactNumber).catch(() => { });
    }
  };

  // User details & profile submission
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    if (!loggedInUser) return;

    if (!profileForm.name || !profileForm.name.trim()) {
      triggerAlert('error', language === 'vi' ? 'Vui lòng nhập Họ và Tên.' : 'Full Name is required.');
      return;
    }

    // Sanitize empty string date values to null so ASP.NET Core JSON deserializer won't fail with 400
    const sanitizedDob = profileForm.dob && String(profileForm.dob).trim() !== '' ? profileForm.dob : null;

    const payload = {
      ...profileForm,
      id: loggedInUser.id,
      dob: sanitizedDob
    };

    updateUser(loggedInUser.id, payload)
      .then(updated => {
        updateLoggedInUserLocal(updated);
        setProfileForm(updated);
        triggerAlert('success', t('profile_saved_success'));
      })
      .catch(err => {
        let errorMsg = (language === 'vi' ? 'Không thể cập nhật hồ sơ.' : 'Failed to update profile.');
        if (err.response?.data?.message) {
          errorMsg = err.response.data.message;
        } else if (err.response?.data?.errors) {
          const firstKey = Object.keys(err.response.data.errors)[0];
          if (firstKey && err.response.data.errors[firstKey]?.length > 0) {
            errorMsg = err.response.data.errors[firstKey][0];
          }
        }
        triggerAlert('error', errorMsg);
      });
  };

  // Contacts
  const handleAddContactSubmit = (e) => {
    e.preventDefault();
    const payload = {
      userId: loggedInUser.id,
      firstName: contactForm.firstName,
      lastName: contactForm.lastName,
      contactNumber: contactForm.contactNumber
    };

    apiAddContact(payload)
      .then(newContact => {
        setContacts(prev => [...prev, newContact]);
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
    apiDeleteContact(id)
      .then(() => {
        setContacts(prev => prev.filter(c => c.id !== id));
        triggerAlert('success', 'Contact deleted.');
        if (selectedContact && contacts.find(c => c.id === id)?.contactNumber === selectedContact.contactNumber) {
          setSelectedContact(null);
        }
      })
      .catch(() => triggerAlert('error', 'Failed to delete contact.'));
  };

  // Message sending
  const handleSendMessageSubmit = (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || newMessage.length > 120) return;

    apiSendMessage(loggedInUser.id, selectedContact.contactNumber, newMessage.trim(), scheduleDate || null)
      .then(msg => {
        setChatMessages(prev => [...prev, msg]);
        setNewMessage('');
        setScheduleDate('');
        setShowScheduler(false);
        getQuota(loggedInUser.id, selectedContact.contactNumber)
          .then(setRemainingQuota)
          .catch(() => { });
        loadAnalyticsStats();
        loadConversations();
      })
      .catch(err => {
        const errorMsg = err.response?.data?.message || 'Failed to send message.';
        triggerAlert('error', errorMsg);
      });
  };

  // AI Message generation for text field
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

  // Templates
  const handleCreateTemplate = (e) => {
    e.preventDefault();
    if (!templateForm.title.trim() || !templateForm.body.trim()) return;
    apiCreateTemplate(templateForm.title, templateForm.body)
      .then(newTpl => {
        setTemplates(prev => [...prev, newTpl]);
        setTemplateForm({ title: '', body: '' });
        triggerAlert('success', 'Custom template created successfully.');
      })
      .catch(() => triggerAlert('error', 'Failed to create template.'));
  };

  const handleDeleteTemplate = (id) => {
    if (!window.confirm('Delete this template?')) return;
    apiDeleteTemplate(id)
      .then(() => {
        setTemplates(prev => prev.filter(t => t.id !== id));
        triggerAlert('success', 'Template deleted.');
      })
      .catch(() => triggerAlert('error', 'Failed to delete template.'));
  };

  // Friend requests
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
        setPendingRequests(prev => prev.filter(r => r.connectionId !== connectionId));
        if (accept) {
          getFriends(loggedInUser.id).then(setFriends);
        }
        triggerAlert('success', res.message);
      })
      .catch(() => triggerAlert('error', 'Failed to respond to request.'));
  };

  // Services activation & Payment
  const handleServiceCheck = (serviceName) => {
    if (selectedServices.includes(serviceName)) {
      setSelectedServices(prev => prev.filter(s => s !== serviceName));
    } else {
      setSelectedServices(prev => [...prev, serviceName]);
    }
  };

  const handlePaymentCheckoutClick = () => {
    if (selectedServices.length === 0) return;
    setPaymentForm({ cardNumber: '', expiryDate: '', cvv: '' });
    setShowPaymentOtpField(false);
    setPaymentOtpCode('');
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();

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

    const promises = selectedServices.map(serviceName =>
      apiActivateService(loggedInUser.id, serviceName, paymentForm.cardNumber, paymentForm.expiryDate, paymentForm.cvv, paymentOtpCode)
    );

    Promise.all(promises)
      .then(() => {
        setActivatedServices(prev => [...prev, ...selectedServices]);
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

  // Group operations
  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (!groupForm.name.trim()) return;
    apiCreateGroup(groupForm.name)
      .then(newGrp => {
        setGroups(prev => [...prev, newGrp]);
        setGroupForm({ name: '' });
        triggerAlert('success', 'Contact group created.');
      })
      .catch(() => triggerAlert('error', 'Failed to create group.'));
  };

  const handleDeleteGroup = (id, name) => {
    if (!window.confirm(`Delete group "${name}"? This removes members but doesn't delete contacts.`)) return;
    apiDeleteGroup(id)
      .then(() => {
        setGroups(prev => prev.filter(g => g.id !== id));
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

  const handleAddGroupMember = (payloadOrEvent) => {
    let payload = null;
    if (payloadOrEvent && typeof payloadOrEvent.preventDefault === 'function') {
      payloadOrEvent.preventDefault();
      if (!newGroupMemberId) return;
      if (typeof newGroupMemberId === 'string' && newGroupMemberId.startsWith('friend_')) {
        payload = { friendUserId: parseInt(newGroupMemberId.replace('friend_', '')) };
      } else if (typeof newGroupMemberId === 'string' && newGroupMemberId.startsWith('contact_')) {
        payload = { contactId: parseInt(newGroupMemberId.replace('contact_', '')) };
      } else {
        payload = { contactId: parseInt(newGroupMemberId) };
      }
    } else {
      payload = payloadOrEvent;
    }

    if (!selectedGroup || !payload) return Promise.reject(new Error('No group selected or invalid payload.'));

    return apiAddGroupMember(selectedGroup.id, payload)
      .then(res => {
        if (res.contact) {
          setGroupMembers(prev => {
            if (prev.some(m => m.id === res.contact.id)) return prev;
            return [...prev, res.contact];
          });
          setContacts(prev => {
            if (prev.some(c => c.id === res.contact.id)) return prev;
            return [...prev, res.contact];
          });
        }
        setNewGroupMemberId('');
        triggerAlert('success', res.message);
        return res;
      })
      .catch(err => {
        triggerAlert('error', err.response?.data?.message || 'Failed to add member.');
      });
  };

  const handleRemoveGroupMember = (contactId) => {
    if (!selectedGroup) return;
    apiRemoveGroupMember(selectedGroup.id, contactId)
      .then(() => {
        setGroupMembers(prev => prev.filter(m => m.id !== contactId));
        triggerAlert('success', 'Member removed from group.');
      })
      .catch(() => triggerAlert('error', 'Failed to remove member.'));
  };

  const handleSendBulkMessage = (e) => {
    e.preventDefault();
    if (!selectedGroup || !bulkContent.trim()) return;

    setBulkResultsLog('Processing bulk message send...');

    let scheduledUtcString = null;
    if (bulkScheduleDate) {
      const dt = new Date(bulkScheduleDate);
      if (!isNaN(dt.getTime())) {
        scheduledUtcString = dt.toISOString();
      }
    }

    sendBulkMessage(selectedGroup.id, bulkContent.trim(), scheduledUtcString)
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

  // Block & privacy settings
  const handleBlockNumber = (e) => {
    e.preventDefault();
    if (blockNumberInput.length !== 10) {
      triggerAlert('error', 'Phone number must be exactly 10 digits.');
      return;
    }
    apiBlockNumber(blockNumberInput)
      .then(res => {
        setBlocklist(prev => [...prev, res.block]);
        setBlockNumberInput('');
        triggerAlert('success', res.message);
        loadBlocklist();
        if (selectedContactRef.current) {
          loadChatDetails();
        }
      })
      .catch(err => triggerAlert('error', err.response?.data?.message || 'Failed to block number.'));
  };

  const handleUnblockNumber = (idOrNumber) => {
    const isPhoneNumber = typeof idOrNumber === 'string' && idOrNumber.length === 10 && !isNaN(idOrNumber);
    const apiCall = isPhoneNumber ? apiUnblockNumberByPhone(idOrNumber) : apiUnblockNumber(idOrNumber);

    apiCall
      .then(res => {
        setBlocklist(prev => prev.filter(b => b.id !== idOrNumber && b.blockedNumber !== idOrNumber));
        triggerAlert('success', res.message);
        loadBlocklist();
        if (selectedContactRef.current) {
          loadChatDetails();
        }
      })
      .catch(() => triggerAlert('error', 'Failed to unblock number.'));
  };

  const handleToggle2FaSetting = (enabled) => {
    apiToggle2Fa(enabled)
      .then(res => {
        setPrivacySettings(prev => ({ ...prev, twoFactorEnabled: enabled }));
        updateLoggedInUserLocal({ twoFactorEnabled: enabled });
        triggerAlert('success', res.message);
      })
      .catch(() => triggerAlert('error', 'Failed to update 2FA setting.'));
  };

  const handleTogglePrivacySetting = (enabled) => {
    apiTogglePrivacy(enabled)
      .then(res => {
        setPrivacySettings(prev => ({ ...prev, onlyReceiveFromFriends: enabled }));
        updateLoggedInUserLocal({ onlyReceiveFromFriends: enabled });
        triggerAlert('success', res.message);
      })
      .catch(() => triggerAlert('error', 'Failed to update privacy setting.'));
  };

  // Load User AI messages on demand
  useEffect(() => {
    if (!loggedInUser || !isAiBubbleOpen) return;
    getChatHistory(loggedInUser.id, '9999999999')
      .then(setAiMessages)
      .catch(() => { });
  }, [loggedInUser, isAiBubbleOpen]);

  const handleAiSendMessage = (e) => {
    e.preventDefault();
    if (!aiNewMessage.trim() || isAiLoading) return;

    const messageText = aiNewMessage.trim();
    setAiNewMessage('');
    setIsAiLoading(true);

    apiSendMessage(loggedInUser.id, '9999999999', messageText)
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

  return (
    <ChatContext.Provider value={{
      activeTab,
      setActiveTab,
      contacts,
      setContacts,
      friends,
      setFriends,
      conversations,
      setConversations,
      pendingRequests,
      setPendingRequests,
      searchQuery,
      setSearchQuery,
      searchResults,
      setSearchResults,
      searchPage,
      setSearchPage,
      hasMoreSearchResults,
      loadingMoreSearchResults,
      selectedContact,
      setSelectedContact,
      chatMessages,
      setChatMessages,
      contactIsTyping,
      newMessage,
      setNewMessage,
      remainingQuota,
      scheduleDate,
      setScheduleDate,
      showScheduler,
      setShowScheduler,
      templates,
      showTemplatePicker,
      setShowTemplatePicker,
      templateForm,
      setTemplateForm,
      groups,
      selectedGroup,
      setSelectedGroup,
      groupMembers,
      setGroupMembers,
      groupForm,
      setGroupForm,
      newGroupMemberId,
      setNewGroupMemberId,
      bulkContent,
      setBulkContent,
      bulkScheduleDate,
      setBulkScheduleDate,
      bulkResultsLog,
      setBulkResultsLog,
      activatedServices,
      selectedServices,
      setSelectedServices,
      showAddContactModal,
      setShowAddContactModal,
      showPaymentModal,
      setShowPaymentModal,
      contactForm,
      setContactForm,
      requestForm,
      setRequestForm,
      paymentForm,
      setPaymentForm,
      profileForm,
      setProfileForm,
      showPaymentOtpField,
      setShowPaymentOtpField,
      paymentOtpCode,
      setPaymentOtpCode,
      blocklist,
      setBlocklist,
      blockNumberInput,
      setBlockNumberInput,
      privacySettings,
      analyticsStats,
      showAiAssistant,
      setShowAiAssistant,
      aiPrompt,
      setAiPrompt,
      aiTone,
      setAiTone,
      generatingAi,
      aiPosition,
      setAiPosition,
      isAiBubbleOpen,
      setIsAiBubbleOpen,
      aiMessages,
      setAiMessages,
      aiNewMessage,
      setAiNewMessage,
      isAiLoading,
      aiChatPosition,
      setAiChatPosition,
      hasMoreMessages,
      setHasMoreMessages,
      loadingMoreMessages,
      setLoadingMoreMessages,

      // Refs
      messagesEndRef,
      chatMessagesAreaRef,
      textareaRef,
      searchListRef,
      aiMessagesEndRef,

      // Operations
      refreshDashboardData,
      loadConversations,
      loadTemplates,
      loadGroups,
      loadBlocklist,
      loadAnalyticsStats,
      loadChatDetails,
      loadMoreSearchResults,
      handleSearchScroll,
      clearSearch,
      handleTyping,
      handleProfileSubmit,
      handleAddContactSubmit,
      handleDeleteContact,
      handleSendMessageSubmit,
      handleGenerateAiMessage,
      handleCreateTemplate,
      handleDeleteTemplate,
      handleSendRequestSubmit,
      handleRespondRequest,
      handleServiceCheck,
      handlePaymentCheckoutClick,
      handlePaymentSubmit,
      handleCreateGroup,
      handleDeleteGroup,
      loadGroupMembers,
      handleAddGroupMember,
      handleRemoveGroupMember,
      handleSendBulkMessage,
      handleBlockNumber,
      handleUnblockNumber,
      handleToggle2FaSetting,
      handleTogglePrivacySetting,
      handleAiSendMessage
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
