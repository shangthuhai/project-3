import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import Pagination from './Pagination';
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';

export default function AdminUsers({
  adminUsers = { items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 1 },
  usersPage = 1,
  setUsersPage = () => {},
  usersSearch = '',
  setUsersSearch = () => {},
  usersStatus = 'all',
  setUsersStatus = () => {},
  usersQuota = 'all',
  setUsersQuota = () => {},
  usersSortBy = 'newest',
  setUsersSortBy = () => {},
  setSelectedUserForQuota,
  setNewQuotaValue,
  setShowQuotaModal,
  handleToggleUserStatus
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const usersList = adminUsers.items || [];
  const totalCount = adminUsers.totalCount || 0;
  const totalPages = adminUsers.totalPages || 1;
  const pageSize = adminUsers.pageSize || 10;

  const hasActiveFilters = usersSearch !== '' || usersStatus !== 'all' || usersQuota !== 'all' || usersSortBy !== 'newest';

  const resetFilters = () => {
    setUsersSearch('');
    setUsersStatus('all');
    setUsersQuota('all');
    setUsersSortBy('newest');
    setUsersPage(1);
  };

  const userColumns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Tài khoản', accessor: 'username' },
    { header: 'Họ và tên', accessor: item => item.fullName || '—' },
    { header: 'Số điện thoại', accessor: item => item.phoneNumber || item.phone || '—' },
    { header: 'Email', accessor: item => item.email || '—' },
    { header: 'Trạng thái', accessor: item => item.isLocked ? 'Đã khóa' : 'Hoạt động' },
    { header: 'SMS Khuyến mãi', accessor: item => item.freeSmsQuota ?? 0 },
    { header: 'Ngày tạo', accessor: item => item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '—' }
  ];

  const handleExportCSV = () => {
    exportToCSV(`Bao_Cao_Nguoi_Dung_${new Date().toISOString().slice(0,10)}`, userColumns, usersList);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const summary = [
      usersSearch ? `Từ khóa: "${usersSearch}"` : null,
      usersStatus !== 'all' ? `Trạng thái: ${usersStatus}` : null,
      usersQuota !== 'all' ? `Quota: ${usersQuota}` : null
    ].filter(Boolean).join(' | ') || 'Tất cả người dùng';

    exportToPDF('BÁO CÁO DANH SÁCH NGƯỜI DÙNG', userColumns, usersList, summary);
    setShowExportMenu(false);
  };

  return (
    <div className="admin-tab-content">
      <div className="admin-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '6px' }}>User Accounts Management</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>Block/unlock user accounts, verify verification records, and configure free message quotas.</p>
        </div>

        {/* Export Report Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="btn btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: '500',
              cursor: 'pointer',
              background: 'var(--bg-sidebar)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-main)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
          >
            <Download size={16} /> Xuất Báo Cáo
          </button>

          {showExportMenu && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 6px)',
              background: 'var(--bg-sidebar)',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              padding: '6px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              zIndex: 100,
              minWidth: '180px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <button
                onClick={handleExportCSV}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-main)',
                  fontSize: '0.86rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <FileSpreadsheet size={15} style={{ color: '#10b981' }} /> Xuất Excel / CSV
              </button>
              <button
                onClick={handleExportPDF}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-main)',
                  fontSize: '0.86rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <FileText size={15} style={{ color: '#ef4444' }} /> Xuất PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Controls Bar */}
      <div className="admin-filter-bar" style={{
        background: 'var(--bg-sidebar)',
        padding: '16px 20px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-light)',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', flex: '1', minWidth: '300px' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
            <input
              type="text"
              placeholder="Search username, name, mobile, email..."
              value={usersSearch}
              onChange={(e) => {
                setUsersSearch(e.target.value);
                setUsersPage(1);
              }}
              style={{
                width: '100%',
                padding: '9px 12px',
                paddingRight: usersSearch ? '32px' : '12px',
                background: 'var(--bg-app)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                fontSize: '0.88rem',
                outline: 'none'
              }}
            />
            {usersSearch && (
              <button
                onClick={() => {
                  setUsersSearch('');
                  setUsersPage(1);
                }}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Account Status Filter */}
          <select
            value={usersStatus}
            onChange={(e) => {
              setUsersStatus(e.target.value);
              setUsersPage(1);
            }}
            style={{
              padding: '9px 12px',
              background: 'var(--bg-app)',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              color: usersStatus !== 'all' ? 'var(--color-primary)' : 'var(--text-muted)',
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="locked">Locked Only</option>
          </select>

          {/* Quota Filter */}
          <select
            value={usersQuota}
            onChange={(e) => {
              setUsersQuota(e.target.value);
              setUsersPage(1);
            }}
            style={{
              padding: '9px 12px',
              background: 'var(--bg-app)',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              color: usersQuota !== 'all' ? 'var(--color-primary)' : 'var(--text-muted)',
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Quota Levels</option>
            <option value="hasQuota">Has SMS Quota</option>
            <option value="zeroQuota">Zero SMS Quota</option>
          </select>

          {/* Sort Select */}
          <select
            value={usersSortBy}
            onChange={(e) => {
              setUsersSortBy(e.target.value);
              setUsersPage(1);
            }}
            style={{
              padding: '9px 12px',
              background: 'var(--bg-app)',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="username">Username (A-Z)</option>
            <option value="quotaDesc">Quota (High to Low)</option>
            <option value="quotaAsc">Quota (Low to High)</option>
          </select>
        </div>

        {/* Filter Stats & Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Total <strong>{totalCount}</strong> users
          </span>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              style={{
                padding: '6px 12px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid var(--color-danger)',
                color: 'var(--color-danger)',
                borderRadius: '6px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              🔄 Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
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
            {usersList.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No users found matching your filter criteria.
                </td>
              </tr>
            ) : (
              usersList.map(user => {
                const targetUserId = user.userId || user.id;
                const name = user.profile?.fullName || user.name || 'N/A';
                const photo = user.profile?.profilePhoto || user.profilePhoto || 'https://via.placeholder.com/38';
                const quotaVal = user.quota?.freeMessagesLeft !== undefined ? user.quota.freeMessagesLeft : 5;
                return (
                  <tr key={targetUserId} style={{ borderBottom: '1px solid var(--border-light)', transition: 'var(--transition-fast)' }} className="table-row-hover">
                    <td style={{ padding: '12px 20px' }}>
                      <img src={photo} alt={name} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
                    </td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-main)' }}><strong>{user.username}</strong></td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-main)' }}>{name}</td>
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
                            setSelectedUserForQuota({ ...user, id: targetUserId });
                            setNewQuotaValue(quotaVal);
                            setShowQuotaModal(true);
                          }}
                          style={{ padding: '6px 12px', fontSize: '0.78rem', background: 'var(--bg-app)', color: 'var(--text-main)', border: '1px solid var(--border-light)' }}
                        >
                          ⚙️ Quota
                        </button>
                        <button
                          className={`btn ${user.isActive ? 'btn-danger' : 'btn-accent'}`}
                          onClick={() => handleToggleUserStatus(targetUserId, user.isActive)}
                          style={{ padding: '6px 12px', fontSize: '0.78rem', minWidth: '75px', background: user.isActive ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)', border: '1px solid ' + (user.isActive ? 'var(--color-danger)' : 'var(--color-accent)'), color: user.isActive ? 'var(--color-danger)' : 'var(--color-accent)' }}
                        >
                          {user.isActive ? '🔒 Lock' : '🔓 Unlock'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <Pagination
        page={usersPage}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={setUsersPage}
      />
    </div>
  );
}
