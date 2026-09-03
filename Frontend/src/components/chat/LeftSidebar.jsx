import React, { useState, useEffect, useRef } from 'react';
import { Settings, Briefcase, Users, Shield, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useLanguage } from '../../context/LanguageContext';
import styles from './LeftSidebar.module.css';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

export default function LeftSidebar() {
  const { t } = useLanguage();
  const { loggedInUser, handleLogout } = useAuth();
  const {
    activeTab,
    setActiveTab,
    setSelectedContact,
    loadTemplates,
    loadGroups,
    loadBlocklist,
    setSelectedGroup,
    setGroupMembers,
    setBulkResultsLog,
    isAiBubbleOpen,
    setIsAiBubbleOpen
  } = useChat();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const gearRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        gearRef.current &&
        !gearRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAvatarClick = () => {
    setActiveTab('profile');
    setDropdownOpen(false);
  };

  const handleChatClick = () => {
    setActiveTab('chats');
    setSelectedContact(null);
    setDropdownOpen(false);
  };

  const handleFriendsClick = () => {
    setActiveTab('friends');
    setSelectedContact(null);
    setDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setDropdownOpen(prev => !prev);
  };

  const handleDropdownItemClick = (tab) => {
    setActiveTab(tab);
    setDropdownOpen(false);

    // Call necessary loaders just like original Sidebar tab buttons
    if (tab === 'templates') {
      loadTemplates();
    } else if (tab === 'groups') {
      loadGroups();
      setSelectedGroup(null);
      setGroupMembers([]);
      setBulkResultsLog(null);
    } else if (tab === 'security') {
      loadBlocklist();
    }
  };

  // Determine if settings category is active
  const isSettingsActive = ['services', 'groups', 'security', 'templates', 'settings'].includes(activeTab);

  return (
    <div className={cx('left-sidebar')}>
      {/* Top Section - Avatar, Chat, Settings, Theme */}
      <div className={cx('left-sidebar__top')}>
        <div
          className={cx('left-sidebar__avatar-wrapper', { 'left-sidebar__avatar-wrapper--active': activeTab === 'profile' })}
          onClick={handleAvatarClick}
          title={t('tab_profile')}
        >
          <img
            src={loggedInUser?.profilePhoto || 'https://via.placeholder.com/48'}
            alt={loggedInUser?.name || 'User Profile'}
            className={cx('left-sidebar__avatar')}
          />
        </div>

        {/* Chat Icon */}
        <button
          className={cx('left-sidebar__btn', { 'left-sidebar__btn--active': activeTab === 'chats' })}
          onClick={handleChatClick}
          title={t('tab_chats')}
        >
          <svg className={cx('left-sidebar__icon')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>

        {/* Friends Icon */}
        <button
          className={cx('left-sidebar__btn', { 'left-sidebar__btn--active': activeTab === 'friends' })}
          onClick={handleFriendsClick}
          title={t('tab_friends') || 'Friends'}
        >
          <svg className={cx('left-sidebar__icon')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </button>

        {/* AI Chatbot Icon */}
        <button
          className={cx('left-sidebar__btn', { 'left-sidebar__btn--active': isAiBubbleOpen })}
          onClick={() => setIsAiBubbleOpen(prev => !prev)}
          title={t('ai_chatbot_title') || 'AI Chatbot'}
        >
          <svg className={cx('left-sidebar__icon')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <circle cx="8.5" cy="15.5" r="1.25" fill="currentColor" />
            <circle cx="15.5" cy="15.5" r="1.25" fill="currentColor" />
            <path d="M12 2v5" />
            <circle cx="12" cy="2" r="1" fill="currentColor" />
            <path d="M7 11V8a5 5 0 0 1 10 0v3" />
          </svg>
        </button>

        {/* Settings Gear Icon */}
        <div style={{ position: 'relative' }}>
          <button
            ref={gearRef}
            className={cx('left-sidebar__btn', { 'left-sidebar__btn--active': isSettingsActive })}
            onClick={toggleDropdown}
            title={t('tab_settings')}
          >
            <svg className={cx('left-sidebar__icon', { 'left-sidebar__icon--spin': dropdownOpen })} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div ref={dropdownRef} className={cx('left-sidebar__dropdown')}>
              <button
                className={cx('left-sidebar__dropdown-item', { 'left-sidebar__dropdown-item--active': activeTab === 'settings' })}
                onClick={() => handleDropdownItemClick('settings')}
              >
                <Settings size={18} />
                <span>{t('tab_settings')}</span>
              </button>
              <button
                className={cx('left-sidebar__dropdown-item', { 'left-sidebar__dropdown-item--active': activeTab === 'services' })}
                onClick={() => handleDropdownItemClick('services')}
              >
                <Briefcase size={18} />
                <span>{t('tab_services')}</span>
              </button>
              <button
                className={cx('left-sidebar__dropdown-item', { 'left-sidebar__dropdown-item--active': activeTab === 'groups' })}
                onClick={() => handleDropdownItemClick('groups')}
              >
                <Users size={18} />
                <span>{t('tab_groups')}</span>
              </button>
              <button
                className={cx('left-sidebar__dropdown-item', { 'left-sidebar__dropdown-item--active': activeTab === 'security' })}
                onClick={() => handleDropdownItemClick('security')}
              >
                <Shield size={18} />
                <span>{t('tab_security')}</span>
              </button>
              <button
                className={cx('left-sidebar__dropdown-item', { 'left-sidebar__dropdown-item--active': activeTab === 'templates' })}
                onClick={() => handleDropdownItemClick('templates')}
              >
                <FileText size={18} />
                <span>{t('tab_templates')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
