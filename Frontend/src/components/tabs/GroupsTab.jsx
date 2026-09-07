import React, { useState } from 'react';
import { Users, Send, UserPlus, PhoneCall, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useLanguage } from '../../context/LanguageContext';
import CustomSelect from '../common/CustomSelect';
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
    friends,
    handleCreateGroup,
    handleDeleteGroup,
    loadGroupMembers,
    handleAddGroupMember,
    handleRemoveGroupMember,
    handleSendBulkMessage
  } = useChat();

  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Collect candidate users/contacts not yet in group
  const candidateFriends = (friends || [])
    .filter(f => !groupMembers.some(m => m.contactNumber === f.mobileNumber))
    .map(f => ({
      id: `friend_${f.id}`,
      type: 'friend',
      name: f.name || f.username,
      phone: f.mobileNumber,
      payload: { friendUserId: f.id }
    }));

  const candidateContacts = (contacts || [])
    .filter(c => !groupMembers.some(m => m.id === c.id || m.contactNumber === c.contactNumber))
    .map(c => ({
      id: `contact_${c.id}`,
      type: 'contact',
      name: `${c.firstName} ${c.lastName}`.trim(),
      phone: c.contactNumber,
      payload: { contactId: c.id }
    }));

  // Merge unique by phone number
  const uniqueCandidatesMap = new Map();
  [...candidateFriends, ...candidateContacts].forEach(c => {
    if (!uniqueCandidatesMap.has(c.phone)) {
      uniqueCandidatesMap.set(c.phone, c);
    }
  });
  const allCandidates = Array.from(uniqueCandidatesMap.values());

  const query = memberSearchQuery.toLowerCase().trim();
  let filteredCandidates = query ? allCandidates.filter(c => {
    return c.name.toLowerCase().includes(query) || c.phone.toLowerCase().includes(query);
  }) : [];

  const isDirectPhone = query.length === 10 && !isNaN(query) && !groupMembers.some(m => m.contactNumber === query);
  const directPhoneAlreadyInCandidates = filteredCandidates.some(c => c.phone === query);

  const getMinDateTime = () => {
    const now = new Date(Date.now() + 60000);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handlePresetSchedule = (minutes) => {
    const dt = new Date(Date.now() + minutes * 60000);
    const year = dt.getFullYear();
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    const hours = String(dt.getHours()).padStart(2, '0');
    const mins = String(dt.getMinutes()).padStart(2, '0');
    setBulkScheduleDate(`${year}-${month}-${day}T${hours}:${mins}`);
  };

  return (
    <div className="view-panel">
      <div className="view-header">
        <h1>{t('contact_groups')}</h1>
        <p>{t('groups_desc')}</p>
      </div>

      <div className={cx('groups-tab__container', { 'groups-tab__container--has-selected': !!selectedGroup })}>
        {/* Left Pane: Groups List */}
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
                  <span className={cx('groups-tab__list-name')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={16} />
                    <span>{g.name}</span>
                  </span>
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

        {/* Right Pane: Selected Group Details & Bulk Actions */}
        <div className={cx('groups-tab__details-pane')}>
          {selectedGroup ? (
            <>
              <button
                type="button"
                className={cx('groups-tab__back-btn')}
                onClick={() => {
                  setSelectedGroup(null);
                  setGroupMembers([]);
                  setBulkResultsLog(null);
                }}
              >
                ← {t('back_to_list')}
              </button>

              {/* Add Member Search Section */}
              <div className={cx('groups-tab__pane-header')} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
                <h3 className={cx('groups-tab__pane-title')}>
                  {t('members_in_group')}: <span style={{ color: 'var(--color-primary)' }}>{selectedGroup.name}</span>
                </h3>

                {/* Search Bar */}
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                  <input
                    type="text"
                    placeholder={t('search_member_placeholder')}
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'var(--bg-app)',
                      border: '1px solid var(--border-light)',
                      color: 'var(--text-main)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '0.82rem',
                      outline: 'none'
                    }}
                  />
                  {memberSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setMemberSearchQuery('')}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Search Results / Candidate Items with Add Button */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto', paddingRight: '2px' }}>
                  {isDirectPhone && !directPhoneAlreadyInCandidates && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-app)', border: '1px solid var(--color-primary)', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <PhoneCall size={18} style={{ color: 'var(--color-primary)' }} />
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>Add Phone Number</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{query}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ padding: '5px 14px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => {
                          handleAddGroupMember({ firstName: 'Contact', contactNumber: query })
                            ?.then(() => setMemberSearchQuery(''))
                            ?.catch(() => {});
                        }}
                      >
                        <UserPlus size={13} />
                        <span>{t('add_btn')}</span>
                      </button>
                    </div>
                  )}

                  {filteredCandidates.length > 0 ? (
                    filteredCandidates.slice(0, 10).map(c => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-app)', border: '1px solid var(--border-light)', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(24, 144, 255, 0.15)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                            {c.name[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{c.name}</span>
                              <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: c.type === 'friend' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(156, 39, 176, 0.15)', color: c.type === 'friend' ? '#4caf50' : '#ab47bc' }}>
                                {c.type === 'friend' ? 'Friend' : 'Contact'}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.phone}</div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ padding: '5px 14px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => {
                            handleAddGroupMember(c.payload)
                              ?.then(() => setMemberSearchQuery(''))
                              ?.catch(() => {});
                          }}
                        >
                          <UserPlus size={13} />
                          <span>{t('add_btn')}</span>
                        </button>
                      </div>
                    ))
                  ) : !isDirectPhone ? (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
                      {query ? 'No matching contacts found.' : 'Type a name or phone number above to search and add members.'}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Group Members List */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: '10px' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>{t('members_in_group')} ({groupMembers.length})</h4>
                {groupMembers.length === 0 ? (
                  <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '30px 10px' }}>
                    <div style={{ marginBottom: '10px', opacity: 0.4, display: 'flex', justifyContent: 'center' }}>
                      <UserPlus size={40} />
                    </div>
                    No members in group yet. Use the search box above to find and add members!
                  </div>
                ) : (
                  <div className={cx('groups-tab__members-grid')}>
                    {groupMembers.map(m => (
                      <div key={m.id} className={cx('groups-tab__member-card')}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className={cx('groups-tab__member-avatar')}>
                            {m.firstName ? m.firstName[0].toUpperCase() : '?'}
                          </div>
                          <div className="group-member-info">
                            <h5 className={cx('groups-tab__member-name')}>{m.firstName} {m.lastName}</h5>
                            <p className={cx('groups-tab__member-phone')}>{m.contactNumber}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          style={{
                            background: 'rgba(255, 85, 85, 0.12)',
                            border: '1px solid rgba(255, 85, 85, 0.25)',
                            color: '#ff5555',
                            borderRadius: '50%',
                            width: '26px',
                            height: '26px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            flexShrink: 0
                          }}
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

              {/* Bulk Messaging Box with Scheduled Sending */}
              {groupMembers.length > 0 && (
                <div className={cx('groups-tab__bulk-box')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ fontSize: '0.9rem', margin: 0, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Send size={16} />
                      <span>{t('bulk_sms_title')}</span>
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {groupMembers.length} recipients
                    </span>
                  </div>

                  <form onSubmit={handleSendBulkMessage} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <textarea
                      placeholder={t('message_body') + '...'}
                      value={bulkContent}
                      onChange={(e) => setBulkContent(e.target.value.substring(0, 120))}
                      rows={2}
                      style={{
                        background: 'var(--bg-app)',
                        border: '1px solid var(--border-light)',
                        color: 'var(--text-main)',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        resize: 'vertical',
                        outline: 'none'
                      }}
                      required
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', background: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '260px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <Clock size={16} style={{ color: bulkScheduleDate ? 'var(--color-primary)' : 'var(--text-muted)' }} />
                          <label style={{ fontSize: '0.78rem', whiteSpace: 'nowrap', fontWeight: '600' }}>{t('schedule_time_optional')}:</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="datetime-local"
                              value={bulkScheduleDate}
                              onChange={(e) => setBulkScheduleDate(e.target.value)}
                              onClick={(e) => { try { e.target.showPicker?.(); } catch(err){} }}
                              className={cx('groups-tab__datetime-input')}
                              style={{
                                background: 'var(--bg-app)',
                                border: bulkScheduleDate ? '1px solid var(--color-primary)' : '1px solid var(--border-light)',
                                color: 'var(--text-main)',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                outline: 'none',
                                cursor: 'pointer'
                              }}
                              min={getMinDateTime()}
                            />
                            {bulkScheduleDate && (
                              <button
                                type="button"
                                onClick={() => setBulkScheduleDate('')}
                                style={{ background: 'none', border: 'none', color: '#ff5555', cursor: 'pointer', fontSize: '0.8rem', padding: '2px 4px' }}
                                title="Clear schedule time"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Quick Presets */}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Quick schedule:</span>
                          <button
                            type="button"
                            onClick={() => handlePresetSchedule(15)}
                            style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '0.72rem', cursor: 'pointer' }}
                          >
                            +15m
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePresetSchedule(60)}
                            style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '0.72rem', cursor: 'pointer' }}
                          >
                            +1h
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePresetSchedule(1440)}
                            style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '0.72rem', cursor: 'pointer' }}
                          >
                            Tomorrow (+24h)
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
                        <span style={{ fontSize: '0.75rem', color: bulkContent.length > 100 ? '#ffaa00' : 'var(--text-muted)' }}>
                          Length: {bulkContent.length}/120
                        </span>

                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={!bulkContent.trim()}
                          style={{ padding: '8px 20px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          {bulkScheduleDate ? <Calendar size={15} /> : <Send size={15} />}
                          <span>{bulkScheduleDate ? t('schedule_sms') : t('send_bulk_btn')}</span>
                        </button>
                      </div>
                    </div>

                    {bulkScheduleDate && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '-4px' }}>
                        <CheckCircle2 size={13} />
                        <span>{t('schedule_notice')}</span>
                      </div>
                    )}
                  </form>

                  {bulkResultsLog && (
                    <div className={cx('groups-tab__bulk-log')} style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.8rem', marginTop: '10px' }}>
                      {bulkResultsLog}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ marginBottom: '15px', opacity: 0.5, display: 'flex', justifyContent: 'center' }}>
                <Users size={56} />
              </div>
              <h3>No group selected</h3>
              <p>Please select a group from the left menu to manage members or send group messages.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
