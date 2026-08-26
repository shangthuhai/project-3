import React from 'react';
import { useChat } from '../../context/ChatContext';
import { useLanguage } from '../../context/LanguageContext';
import styles from './GroupsTab.module.css';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

export default function GroupsTab() {
  const { t } = useLanguage();
  const {
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
    contacts,
    handleCreateGroup,
    handleDeleteGroup,
    loadGroupMembers,
    handleAddGroupMember,
    handleRemoveGroupMember,
    handleSendBulkMessage
  } = useChat();

  return (
    <div className="view-panel">
      <div className="view-header">
        <h1>{t('contact_groups')}</h1>
        <p>{t('groups_desc')}</p>
      </div>

      <div className={cx('groups-tab__container')}>
        <div className={cx('groups-tab__sidebar')}>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>{t('tab_groups')}</h3>
          <form onSubmit={handleCreateGroup} style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
            <input
              type="text"
              placeholder={t('group_name')}
              value={groupForm.name}
              onChange={(e) => setGroupForm({ name: e.target.value })}
              style={{ flex: 1, background: 'var(--bg-app)', border: '1px solid var(--border-light)', color: 'var(--text-main)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', outline: 'none' }}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>+</button>
          </form>

          <div className={cx('groups-tab__list')}>
            {groups.length === 0 ? (
              <div style={{ padding: '15px', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>{t('no_groups')}</div>
            ) : (
              groups.map(g => (
                <div
                  key={g.id}
                  className={cx('groups-tab__list-item', { 'groups-tab__list-item--active': selectedGroup?.id === g.id })}
                  onClick={() => {
                    setSelectedGroup(g);
                    loadGroupMembers(g.id);
                    setBulkResultsLog(null);
                  }}
                >
                  <span className={cx('groups-tab__list-name')}>👥 {g.name}</span>
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

        <div className={cx('groups-tab__details-pane')}>
          {selectedGroup ? (
            <>
              <div className={cx('groups-tab__pane-header')}>
                <h3 className={cx('groups-tab__pane-title')}>{t('members_in_group')}: {selectedGroup.name}</h3>
                <form onSubmit={handleAddGroupMember} style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={newGroupMemberId}
                    onChange={(e) => setNewGroupMemberId(e.target.value)}
                    style={{ background: 'var(--bg-app)', border: '1px solid var(--border-light)', color: 'var(--text-main)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', outline: 'none' }}
                    required
                  >
                    <option value="">-- {t('add_member_to_group')} --</option>
                    {contacts.map(c => {
                      const inGroup = groupMembers.some(m => m.id === c.id);
                      if (inGroup) return null;
                      return (
                        <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.contactNumber})</option>
                      );
                    })}
                  </select>
                  <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>{t('add_btn')}</button>
                </form>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>{t('members_in_group')} ({groupMembers.length})</h4>
                {groupMembers.length === 0 ? (
                  <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No members in group yet. Select a contact from the dropdown above to add!
                  </div>
                ) : (
                  <div className={cx('groups-tab__members-grid')}>
                    {groupMembers.map(m => (
                      <div key={m.id} className={cx('groups-tab__member-card')}>
                        <div className="group-member-info">
                          <h5 className={cx('groups-tab__member-name')}>{m.firstName} {m.lastName}</h5>
                          <p className={cx('groups-tab__member-phone')}>{m.contactNumber}</p>
                        </div>
                        <button
                          className="btn-icon-danger"
                          onClick={() => handleRemoveGroupMember(m.id)}
                          title={t('btn_delete')}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {groupMembers.length > 0 && (
                <div className={cx('groups-tab__bulk-box')}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '10px', color: 'var(--color-primary)' }}>{t('bulk_sms_title')}</h4>
                  <form onSubmit={handleSendBulkMessage} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <textarea
                      placeholder={t('message_body') + '...'}
                      value={bulkContent}
                      onChange={(e) => setBulkContent(e.target.value.substring(0, 120))}
                      rows={2}
                      required
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <label style={{ fontSize: '0.78rem' }}>Scheduled Time (Optional):</label>
                        <input
                          type="datetime-local"
                          value={bulkScheduleDate}
                          onChange={(e) => setBulkScheduleDate(e.target.value)}
                          style={{ background: 'var(--bg-app)', border: '1px solid var(--border-light)', color: 'var(--text-main)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.78rem' }}
                          min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                        />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Length: {bulkContent.length}/120
                      </span>
                      <button type="submit" className="btn btn-primary" style={{ marginLeft: 'auto', padding: '8px 20px' }}>
                        {t('send_bulk_btn')} 🚀
                      </button>
                    </div>
                  </form>

                  {bulkResultsLog && (
                    <div className={cx('groups-tab__bulk-log')}>
                      {bulkResultsLog}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>👥</div>
              <h3>No group selected</h3>
              <p>Please select a group from the left menu to manage members or send group messages.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
