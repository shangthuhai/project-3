import React, { useState, useEffect } from 'react';
import { Shield, BarChart3, Users, FileText, CreditCard, FileCode, LogOut, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminOverview from '../components/admin/AdminOverview';
import AdminUsers from '../components/admin/AdminUsers';
import AdminSmsLogs from '../components/admin/AdminSmsLogs';
import AdminTransactions from '../components/admin/AdminTransactions';
import AdminTemplates from '../components/admin/AdminTemplates';
import AdminAiCopilot from '../components/admin/AdminAiCopilot';
import AdminModeration from '../components/admin/AdminModeration';
import {
  getAdminStats,
  getAdminUsers,
  getAdminSmsLogs,
  getAdminTransactions,
  getAdminTemplates,
  updateUserStatus,
  updateUserQuota,
  createAdminTemplate,
  deleteAdminTemplate,
  getAdminKeywords,
  createAdminKeyword,
  toggleAdminKeyword,
  deleteAdminKeyword,
  getAdminModerationLogs,
  seed15DaysData,
  createFriendUsers,
  createStrangerUsers
} from '../api';

export default function AdminDashboard() {
  const { loggedInUser, handleLogout, triggerAlert } = useAuth();

  const [adminTab, setAdminTab] = useState('overview');
  const [adminStats, setAdminStats] = useState(null);

  // Users tab pagination & filter state
  const [adminUsers, setAdminUsers] = useState({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 1 });
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersStatus, setUsersStatus] = useState('all');
  const [usersQuota, setUsersQuota] = useState('all');
  const [usersSortBy, setUsersSortBy] = useState('newest');

  // Transactions tab pagination & filter state
  const [adminTransactions, setAdminTransactions] = useState({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 1, uniqueServices: [] });
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsSearch, setTransactionsSearch] = useState('');
  const [transactionsService, setTransactionsService] = useState('all');
  const [transactionsStatus, setTransactionsStatus] = useState('all');
  const [transactionsSortBy, setTransactionsSortBy] = useState('newest');

  // SMS Logs tab pagination & filter state
  const [adminSmsLogs, setAdminSmsLogs] = useState({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 1 });
  const [smsLogsPage, setSmsLogsPage] = useState(1);
  const [smsLogsSearch, setSmsLogsSearch] = useState('');
  const [smsLogsStatus, setSmsLogsStatus] = useState('all');
  const [smsLogsType, setSmsLogsType] = useState('all');

  // AI Moderation tab pagination & filter state
  const [adminKeywords, setAdminKeywords] = useState({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 1 });
  const [keywordsPage, setKeywordsPage] = useState(1);
  const [keywordsSearch, setKeywordsSearch] = useState('');

  const [adminModerationLogs, setAdminModerationLogs] = useState({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 1 });
  const [moderationLogsPage, setModerationLogsPage] = useState(1);
  const [moderationLogsSearch, setModerationLogsSearch] = useState('');
  const [moderationLogsStatus, setModerationLogsStatus] = useState('all');

  // System Templates tab pagination & filter state
  const [adminTemplates, setAdminTemplates] = useState({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 1 });
  const [templatesPage, setTemplatesPage] = useState(1);
  const [templatesSearch, setTemplatesSearch] = useState('');
  const [templatesSortBy, setTemplatesSortBy] = useState('newest');

  // Quota Modal Form
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [selectedUserForQuota, setSelectedUserForQuota] = useState(null);
  const [newQuotaValue, setNewQuotaValue] = useState(5);

  // Template Form
  const [adminTemplateForm, setAdminTemplateForm] = useState({ title: '', body: '' });

  const fetchUsers = () => {
    getAdminUsers(usersPage, 10, usersSearch, usersStatus, usersQuota, usersSortBy)
      .then(setAdminUsers)
      .catch(() => triggerAlert('error', 'Cannot load users.'));
  };

  const fetchTransactions = () => {
    getAdminTransactions(transactionsPage, 10, transactionsSearch, transactionsService, transactionsStatus, transactionsSortBy)
      .then(setAdminTransactions)
      .catch(() => triggerAlert('error', 'Cannot load transactions.'));
  };

  const fetchSmsLogs = () => {
    getAdminSmsLogs(smsLogsPage, 10, smsLogsSearch, smsLogsStatus, smsLogsType)
      .then(setAdminSmsLogs)
      .catch(() => triggerAlert('error', 'Cannot load SMS logs.'));
  };

  const fetchKeywords = () => {
    getAdminKeywords(keywordsPage, 10, keywordsSearch)
      .then(setAdminKeywords)
      .catch(() => triggerAlert('error', 'Cannot load keywords.'));
  };

  const fetchModerationLogs = () => {
    getAdminModerationLogs(moderationLogsPage, 10, moderationLogsSearch, moderationLogsStatus)
      .then(setAdminModerationLogs)
      .catch(() => triggerAlert('error', 'Cannot load moderation logs.'));
  };

  const fetchTemplates = () => {
    getAdminTemplates(templatesPage, 10, templatesSearch, templatesSortBy)
      .then(setAdminTemplates)
      .catch(() => triggerAlert('error', 'Cannot load templates.'));
  };

  useEffect(() => {
    if (!loggedInUser || !loggedInUser.isAdmin) return;

    if (adminTab === 'overview') {
      getAdminStats()
        .then(setAdminStats)
        .catch(() => triggerAlert('error', 'Cannot load dashboard stats.'));
    } else if (adminTab === 'users') {
      fetchUsers();
    } else if (adminTab === 'transactions') {
      fetchTransactions();
    } else if (adminTab === 'logs') {
      fetchSmsLogs();
    } else if (adminTab === 'moderation') {
      fetchKeywords();
      fetchModerationLogs();
    } else if (adminTab === 'templates') {
      fetchTemplates();
    }
  }, [
    loggedInUser,
    adminTab,
    usersPage, usersSearch, usersStatus, usersQuota, usersSortBy,
    transactionsPage, transactionsSearch, transactionsService, transactionsStatus, transactionsSortBy,
    smsLogsPage, smsLogsSearch, smsLogsStatus, smsLogsType,
    keywordsPage, keywordsSearch,
    moderationLogsPage, moderationLogsSearch, moderationLogsStatus,
    templatesPage, templatesSearch, templatesSortBy
  ]);

  const handleToggleUserStatus = (id, currentActive) => {
    const newActive = !currentActive;
    updateUserStatus(id, newActive)
      .then(res => {
        triggerAlert('success', res.message);
        fetchUsers();
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
        fetchUsers();
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
        fetchTemplates();
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
        fetchTemplates();
      })
      .catch(err => {
        const errorMsg = err.response?.data?.message || 'Failed to delete system template.';
        triggerAlert('error', errorMsg);
      });
  };

  const handleCreateKeyword = (keyword, category, action) => {
    createAdminKeyword(keyword, category, action)
      .then(res => {
        triggerAlert('success', res.message);
        fetchKeywords();
      })
      .catch(err => {
        triggerAlert('error', err.response?.data?.message || 'Failed to add keyword rule.');
      });
  };

  const handleToggleKeyword = (id) => {
    toggleAdminKeyword(id)
      .then(res => {
        triggerAlert('success', res.message);
        fetchKeywords();
      })
      .catch(err => {
        triggerAlert('error', err.response?.data?.message || 'Failed to toggle keyword rule.');
      });
  };

  const handleDeleteKeyword = (id) => {
    if (!window.confirm('Are you sure you want to delete this keyword rule?')) return;
    deleteAdminKeyword(id)
      .then(res => {
        triggerAlert('success', res.message);
        fetchKeywords();
      })
      .catch(err => {
        triggerAlert('error', err.response?.data?.message || 'Failed to delete keyword rule.');
      });
  };

  const handleSeed15DaysData = async () => {
    try {
      const res = await seed15DaysData();
      triggerAlert('success', res.message);
      getAdminStats().then(setAdminStats);
      return res;
    } catch (err) {
      triggerAlert('error', err.response?.data?.message || 'Failed to seed sample data.');
      throw err;
    }
  };

  const handleCreateFriendUsers = async () => {
    try {
      const res = await createFriendUsers();
      triggerAlert('success', res.message);
      getAdminStats().then(setAdminStats);
      if (adminTab === 'users') {
        fetchUsers();
      }
      return res;
    } catch (err) {
      triggerAlert('error', err.response?.data?.message || 'Failed to create friend users.');
      throw err;
    }
  };

  const handleCreateStrangerUsers = async () => {
    try {
      const res = await createStrangerUsers();
      triggerAlert('success', res.message);
      getAdminStats().then(setAdminStats);
      if (adminTab === 'users') {
        fetchUsers();
      }
      return res;
    } catch (err) {
      triggerAlert('error', err.response?.data?.message || 'Failed to create stranger users.');
      throw err;
    }
  };

  return (
    <div className="admin-container" style={{ display: 'flex', width: '100vw', height: '100vh', background: 'var(--bg-app)', color: 'var(--text-main)', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div className="admin-sidebar" style={{ width: '280px', minWidth: '280px', background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', height: '100%', zIndex: 100 }}>
        <div className="admin-sidebar-header" style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="admin-logo" style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center' }}>
            <Shield size={28} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: '600' }}>Admin Workspace</h3>
            <span className="admin-role-badge" style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: '600', marginTop: '2px' }}>System Administrator</span>
          </div>
        </div>

        <div className="admin-sidebar-nav" style={{ flex: '1', padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
          <button
            className={`admin-nav-btn ${adminTab === 'overview' ? 'active' : ''}`}
            onClick={() => setAdminTab('overview')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: adminTab === 'overview' ? 'rgba(36, 129, 204, 0.12)' : 'transparent', color: adminTab === 'overview' ? 'var(--color-primary)' : 'var(--text-muted)', fontSize: '0.92rem', fontWeight: '600', textAlign: 'left', transition: 'var(--transition-fast)' }}
          >
            <BarChart3 size={18} />
            <span>Dashboard</span>
          </button>
          <button
            className={`admin-nav-btn ${adminTab === 'moderation' ? 'active' : ''}`}
            onClick={() => setAdminTab('moderation')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: adminTab === 'moderation' ? 'rgba(36, 129, 204, 0.12)' : 'transparent', color: adminTab === 'moderation' ? 'var(--color-primary)' : 'var(--text-muted)', fontSize: '0.92rem', fontWeight: '600', textAlign: 'left', transition: 'var(--transition-fast)' }}
          >
            <ShieldAlert size={18} />
            <span>AI Moderation</span>
          </button>
          <button
            className={`admin-nav-btn ${adminTab === 'users' ? 'active' : ''}`}
            onClick={() => setAdminTab('users')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: adminTab === 'users' ? 'rgba(36, 129, 204, 0.12)' : 'transparent', color: adminTab === 'users' ? 'var(--color-primary)' : 'var(--text-muted)', fontSize: '0.92rem', fontWeight: '600', textAlign: 'left', transition: 'var(--transition-fast)' }}
          >
            <Users size={18} />
            <span>User Accounts</span>
          </button>
          <button
            className={`admin-nav-btn ${adminTab === 'logs' ? 'active' : ''}`}
            onClick={() => { setAdminTab('logs'); setSmsLogsPage(1); }}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: adminTab === 'logs' ? 'rgba(36, 129, 204, 0.12)' : 'transparent', color: adminTab === 'logs' ? 'var(--color-primary)' : 'var(--text-muted)', fontSize: '0.92rem', fontWeight: '600', textAlign: 'left', transition: 'var(--transition-fast)' }}
          >
            <FileText size={18} />
            <span>SMS Logs</span>
          </button>
          <button
            className={`admin-nav-btn ${adminTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setAdminTab('transactions')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: adminTab === 'transactions' ? 'rgba(36, 129, 204, 0.12)' : 'transparent', color: adminTab === 'transactions' ? 'var(--color-primary)' : 'var(--text-muted)', fontSize: '0.92rem', fontWeight: '600', textAlign: 'left', transition: 'var(--transition-fast)' }}
          >
            <CreditCard size={18} />
            <span>Transactions</span>
          </button>
          <button
            className={`admin-nav-btn ${adminTab === 'templates' ? 'active' : ''}`}
            onClick={() => setAdminTab('templates')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: adminTab === 'templates' ? 'rgba(36, 129, 204, 0.12)' : 'transparent', color: adminTab === 'templates' ? 'var(--color-primary)' : 'var(--text-muted)', fontSize: '0.92rem', fontWeight: '600', textAlign: 'left', transition: 'var(--transition-fast)' }}
          >
            <FileCode size={18} />
            <span>System Templates</span>
          </button>
        </div>

        <div className="admin-sidebar-footer" style={{ padding: '20px', borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="admin-info" style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-main)' }}>{loggedInUser.fullName || loggedInUser.name}</span>
            <span className="admin-subtext" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{loggedInUser.email}</span>
          </div>
          <button
            className="admin-logout-btn"
            onClick={handleLogout}
            style={{ width: '100%', padding: '10px', border: '1px solid var(--color-danger)', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'var(--transition-fast)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="admin-content" style={{ flex: '1', padding: '30px 40px', overflowY: 'auto', background: 'var(--bg-app)' }}>
        {adminTab === 'overview' && (
          <AdminOverview
            adminStats={adminStats}
            onSeedData={handleSeed15DaysData}
            onCreateFriends={handleCreateFriendUsers}
            onCreateStrangers={handleCreateStrangerUsers}
          />
        )}
        {adminTab === 'moderation' && (
          <AdminModeration
            keywords={adminKeywords}
            keywordsPage={keywordsPage}
            setKeywordsPage={setKeywordsPage}
            keywordsSearch={keywordsSearch}
            setKeywordsSearch={setKeywordsSearch}
            moderationLogs={adminModerationLogs}
            moderationLogsPage={moderationLogsPage}
            setModerationLogsPage={setModerationLogsPage}
            moderationLogsSearch={moderationLogsSearch}
            setModerationLogsSearch={setModerationLogsSearch}
            moderationLogsStatus={moderationLogsStatus}
            setModerationLogsStatus={setModerationLogsStatus}
            onCreateKeyword={handleCreateKeyword}
            onToggleKeyword={handleToggleKeyword}
            onDeleteKeyword={handleDeleteKeyword}
          />
        )}
        {adminTab === 'users' && (
          <AdminUsers
            adminUsers={adminUsers}
            usersPage={usersPage}
            setUsersPage={setUsersPage}
            usersSearch={usersSearch}
            setUsersSearch={setUsersSearch}
            usersStatus={usersStatus}
            setUsersStatus={setUsersStatus}
            usersQuota={usersQuota}
            setUsersQuota={setUsersQuota}
            usersSortBy={usersSortBy}
            setUsersSortBy={setUsersSortBy}
            setSelectedUserForQuota={setSelectedUserForQuota}
            setNewQuotaValue={setNewQuotaValue}
            setShowQuotaModal={setShowQuotaModal}
            handleToggleUserStatus={handleToggleUserStatus}
          />
        )}
        {adminTab === 'logs' && (
          <AdminSmsLogs
            adminSmsLogs={adminSmsLogs}
            setSmsLogsPage={setSmsLogsPage}
            smsLogsSearch={smsLogsSearch}
            setSmsLogsSearch={setSmsLogsSearch}
            smsLogsStatus={smsLogsStatus}
            setSmsLogsStatus={setSmsLogsStatus}
            smsLogsType={smsLogsType}
            setSmsLogsType={setSmsLogsType}
          />
        )}
        {adminTab === 'transactions' && (
          <AdminTransactions
            adminTransactions={adminTransactions}
            transactionsPage={transactionsPage}
            setTransactionsPage={setTransactionsPage}
            transactionsSearch={transactionsSearch}
            setTransactionsSearch={setTransactionsSearch}
            transactionsService={transactionsService}
            setTransactionsService={setTransactionsService}
            transactionsStatus={transactionsStatus}
            setTransactionsStatus={setTransactionsStatus}
            transactionsSortBy={transactionsSortBy}
            setTransactionsSortBy={setTransactionsSortBy}
          />
        )}
        {adminTab === 'templates' && (
          <AdminTemplates
            adminTemplates={adminTemplates}
            templatesPage={templatesPage}
            setTemplatesPage={setTemplatesPage}
            templatesSearch={templatesSearch}
            setTemplatesSearch={setTemplatesSearch}
            templatesSortBy={templatesSortBy}
            setTemplatesSortBy={setTemplatesSortBy}
            adminTemplateForm={adminTemplateForm}
            setAdminTemplateForm={setAdminTemplateForm}
            handleCreateSystemTemplate={handleCreateSystemTemplate}
            handleDeleteSystemTemplate={handleDeleteSystemTemplate}
          />
        )}
      </div>

      {/* Modal for User Quota editing */}
      {showQuotaModal && selectedUserForQuota && (
        <div className="admin-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="admin-modal" style={{ background: 'var(--bg-sidebar)', padding: '30px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', width: '90%', maxWidth: '400px', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '10px' }}>Edit User Quota</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>Adjust SMS limit for user <strong>{selectedUserForQuota.username}</strong></p>
            <div className="form-group" style={{ margin: '20px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Free SMS Messages Left</label>
              <input
                type="number"
                min="0"
                value={newQuotaValue}
                onChange={(e) => setNewQuotaValue(parseInt(e.target.value) || 0)}
                style={{ width: '100%', padding: '10px', background: 'var(--bg-app)', border: '1px solid var(--border-light)', color: 'var(--text-main)', borderRadius: '8px' }}
              />
            </div>
            <div className="admin-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => { setShowQuotaModal(false); setSelectedUserForQuota(null); }} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveQuota} style={{ padding: '8px 16px' }}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin AI Copilot */}
      <AdminAiCopilot triggerAlert={triggerAlert} />
    </div>
  );
}
