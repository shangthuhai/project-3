import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import styles from './Sidebar.module.css';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

export default function Sidebar() {
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const {
    loggedInUser,
    users,
    handleDemoUserSwitch,
    handleLogout
  } = useAuth();

  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    searchResults,
    loadingMoreSearchResults,
    selectedContact,
    setSelectedContact,
    conversations,
    friends,
    loadTemplates,
    loadGroups,
    loadBlocklist,
    clearSearch,
    handleSearchScroll,
    searchListRef,
    setSelectedGroup,
    setGroupMembers,
    setBulkResultsLog
  } = useChat();

  const startChat = (contactName, contactNumber, isFriend) => {
    setSelectedContact({ name: contactName, contactNumber, isFriend });
    setActiveTab('chats');
  };

  const formatMessageTime = (timeStr) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderSearchResultsList = () => {
    if (loadingMoreSearchResults && searchResults.length === 0) {
      return <div className={cx('sidebar__empty-list-message')}>{t('searching')}</div>;
    }

    if (searchResults.length === 0) {
      return <div className={cx('sidebar__empty-list-message')}>{t('no_matching_users')}</div>;
    }

    return (
      <div 
        ref={searchListRef}
        onScroll={handleSearchScroll}
        style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
      >
        {searchResults.map(user => {
          let statusText = '';
          let badgeClass = 'non-friend';
          if (user.friendshipStatus === 'accepted') {
            statusText = t('status_friend');
            badgeClass = 'friend';
          } else if (user.friendshipStatus === 'pending_sent') {
            statusText = t('status_sent');
            badgeClass = 'pending-sent';
          } else if (user.friendshipStatus === 'pending_received') {
            statusText = t('status_received');
            badgeClass = 'pending-received';
          }

          return (
            <div
              key={user.id}
              className={cx('sidebar__list-item')}
              onClick={() => startChat(user.name || user.username, user.mobileNumber, user.friendshipStatus === 'accepted')}
              style={{ cursor: 'pointer' }}
            >
              <img src={user.profilePhoto || 'https://via.placeholder.com/40'} alt={user.username} className={cx('sidebar__item-avatar')} />
              <div className={cx('sidebar__item-details')}>
                <div className={cx('sidebar__item-row')}>
                  <span className={cx('sidebar__item-name')}>{user.name || user.username}</span>
                  <span className={cx('sidebar__item-meta')}>{user.mobileNumber}</span>
                </div>
                <div className={cx('sidebar__item-row')}>
                  <span className={cx('sidebar__item-subtext')}>{user.email}</span>
                  {statusText && (
                    <span className={cx('sidebar__item-status-badge', `sidebar__item-status-badge--${badgeClass}`)}>
                      {statusText}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {loadingMoreSearchResults && (
          <div style={{ textAlign: 'center', padding: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {t('loading_more')}
          </div>
        )}
      </div>
    );
  };

  const renderSidebarList = () => {
    if (activeTab === 'chats') {
      const chatItems = [];

      conversations.forEach(conv => {
        if (conv.contactNumber === '9999999999') return;
        chatItems.push({
          id: conv.userId ? conv.userId : `conv_${conv.contactNumber}`,
          name: conv.name,
          contactNumber: conv.contactNumber,
          avatar: conv.avatar,
          isFriend: conv.isFriend,
          subtext: conv.lastMessageContent,
          lastMessageTime: conv.lastMessageTime
        });
      });

      friends.forEach(f => {
        if (f.mobileNumber === '9999999999') return;
        const alreadyAdded = chatItems.some(i => i.contactNumber === f.mobileNumber);
        if (!alreadyAdded) {
          chatItems.push({
            id: f.id,
            name: f.name,
            contactNumber: f.mobileNumber,
            avatar: f.profilePhoto,
            isFriend: true,
            subtext: t('friend_no_msg'),
            lastMessageTime: null
          });
        }
      });



      if (chatItems.length === 0) {
        return <div className={cx('sidebar__empty-list-message')}>{t('no_active_chats')}</div>;
      }

      chatItems.sort((a, b) => {
        if (a.lastMessageTime && b.lastMessageTime) {
          return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
        }
        if (a.lastMessageTime) return -1;
        if (b.lastMessageTime) return 1;
        return a.name.localeCompare(b.name);
      });

      return chatItems.map(item => (
        <div
          key={item.contactNumber}
          className={cx('sidebar__list-item', { 'sidebar__list-item--selected': selectedContact?.contactNumber === item.contactNumber })}
          onClick={() => setSelectedContact(item)}
        >
          <img src={item.avatar} alt={item.name} className={cx('sidebar__item-avatar')} />
          <div className={cx('sidebar__item-details')}>
            <div className={cx('sidebar__item-row')}>
              <span className={cx('sidebar__item-name')}>{item.name}</span>
              <span className={cx('sidebar__item-meta')}>
                {item.lastMessageTime ? formatMessageTime(item.lastMessageTime) : item.contactNumber}
              </span>
            </div>
            <div className={cx('sidebar__item-row')}>
              <span className={cx('sidebar__item-subtext')} title={item.subtext}>{item.subtext}</span>
              <span className={cx('sidebar__item-meta')} style={{ fontSize: '0.7rem' }}>
                {item.lastMessageTime ? item.contactNumber : (
                  <span className={cx('sidebar__item-status-badge', item.isFriend ? 'sidebar__item-status-badge--friend' : 'sidebar__item-status-badge--non-friend')}>
                    {item.isFriend ? t('free_badge') : t('free_limit_badge')}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      ));
    }



    return null;
  };

  return (
    <div className={cx('sidebar')}>
      <div className={cx('sidebar__header')}>
        <div className={cx('sidebar__title-area')}>
          <div className={cx('sidebar__logo')}>💬</div>
          <h2 className={cx('sidebar__title-text')}>{t('sms_workspace')}</h2>
        </div>

        {/* Switcher Context is kept for easy pair programming/evaluation */}
        {users.length > 0 && loggedInUser && (
          <div className={cx('sidebar__user-switcher')}>
            <img src={loggedInUser.profilePhoto} alt={loggedInUser.name} className={cx('sidebar__user-avatar')} />
            <div className={cx('sidebar__user-info')}>
              <span className={cx('sidebar__user-label')}>{t('logged_in_as')}</span>
              <select 
                className={cx('sidebar__user-select')} 
                value={loggedInUser.id} 
                onChange={(e) => handleDemoUserSwitch(parseInt(e.target.value))}
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.mobileNumber})</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Search bar for friends/users */}
      <div className={cx('sidebar__search-container')}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cx('sidebar__search-input')}
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className={cx('sidebar__search-clear-btn')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className={cx('sidebar__list-container')}>
        {searchQuery ? renderSearchResultsList() : renderSidebarList()}
        {['services', 'profile', 'templates', 'groups', 'security', 'settings'].includes(activeTab) && !searchQuery && (
          <div className={cx('sidebar__empty-list-message')} style={{ opacity: 0.7 }}>
            {t('content_open')}
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className={cx('sidebar__mobile-bottom-nav')}>
        <button 
          type="button" 
          className={cx('sidebar__mobile-nav-btn')}
          onClick={() => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'glass' : 'light')}
        >
          <span className={cx('sidebar__mobile-nav-icon')}>
            {theme === 'light' ? '☀️' : theme === 'glass' ? '✨' : '🌙'}
          </span>
          <span className={cx('sidebar__mobile-nav-text')}>{t('theme')}</span>
        </button>

        <button 
          type="button" 
          className={cx('sidebar__mobile-nav-btn', { 'sidebar__mobile-nav-btn--active': activeTab === 'settings' })}
          onClick={() => setActiveTab('settings')}
        >
          <span className={cx('sidebar__mobile-nav-icon')}>⚙️</span>
          <span className={cx('sidebar__mobile-nav-text')}>{t('tab_settings')}</span>
        </button>

        <button 
          type="button" 
          className={cx('sidebar__mobile-nav-btn', 'sidebar__mobile-nav-btn--logout')}
          onClick={handleLogout}
        >
          <span className={cx('sidebar__mobile-nav-icon')}>🚪</span>
          <span className={cx('sidebar__mobile-nav-text')}>{t('logout')}</span>
        </button>
      </div>
    </div>
  );
}
