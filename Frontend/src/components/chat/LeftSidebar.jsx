import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  User,
  Database,
  Globe,
  Palette,
  HelpCircle,
  LogOut,
  ChevronRight,
  Check,
  Briefcase,
  Users,
  Shield,
  FileText,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import styles from './LeftSidebar.module.css';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

export default function LeftSidebar() {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
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
  const [activeSubmenu, setActiveSubmenu] = useState(null); // 'language' | 'theme' | 'data' | 'support' | null

  const wrapperRef = useRef(null);
  const closeTimerRef = useRef(null);
  const submenuTimerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setDropdownOpen(false);
        setActiveSubmenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmenuEnter = (name) => {
    if (submenuTimerRef.current) clearTimeout(submenuTimerRef.current);
    setActiveSubmenu(name);
  };

  const handleSubmenuLeave = () => {
    submenuTimerRef.current = setTimeout(() => {
      setActiveSubmenu(null);
    }, 200);
  };

  const handleAvatarClick = () => {
    setActiveTab('profile');
    setDropdownOpen(false);
    setActiveSubmenu(null);
  };

  const handleChatClick = () => {
    setActiveTab('chats');
    setSelectedContact(null);
    setDropdownOpen(false);
    setActiveSubmenu(null);
  };

  const handleFriendsClick = () => {
    setActiveTab('friends');
    setSelectedContact(null);
    setDropdownOpen(false);
    setActiveSubmenu(null);
  };

  const toggleDropdown = () => {
    setDropdownOpen(prev => !prev);
    if (dropdownOpen) setActiveSubmenu(null);
  };

  const handleDropdownItemClick = (tab) => {
    setActiveTab(tab);
    setDropdownOpen(false);
    setActiveSubmenu(null);

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

  const isSettingsActive = ['services', 'groups', 'security', 'templates', 'settings'].includes(activeTab);

  return (
    <div className={cx('left-sidebar')}>
      {/* Top Section - Avatar, Chat, Friends, AI Chatbot */}
      <div className={cx('left-sidebar__top')}>
        <div
          className={cx('left-sidebar__avatar-wrapper', { 'left-sidebar__avatar-wrapper--active': activeTab === 'profile' })}
          onClick={handleAvatarClick}
          title={t('account_info')}
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
      </div>

      {/* Bottom Section - Settings Gear Icon & Click Dropdown */}
      <div className={cx('left-sidebar__bottom')}>
        <div
          ref={wrapperRef}
          className={cx('left-sidebar__gear-wrapper')}
        >
          <button
            className={cx('left-sidebar__btn', { 'left-sidebar__btn--active': isSettingsActive || dropdownOpen })}
            onClick={toggleDropdown}
            title={t('tab_settings')}
          >
            <svg className={cx('left-sidebar__icon', { 'left-sidebar__icon--spin': dropdownOpen })} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Settings Popup Menu */}
          {dropdownOpen && (
            <div className={cx('left-sidebar__dropdown')}>
              {/* 1. Thông tin tài khoản */}
              <button
                className={cx('left-sidebar__dropdown-item', { 'left-sidebar__dropdown-item--active': activeTab === 'profile' })}
                onClick={handleAvatarClick}
                onMouseEnter={() => handleSubmenuEnter(null)}
              >
                <div className={cx('left-sidebar__item-left')}>
                  <User size={18} />
                  <span>{t('account_info')}</span>
                </div>
              </button>

              {/* 2. Ngôn ngữ > */}
              <div
                className={cx('left-sidebar__dropdown-item', 'left-sidebar__dropdown-item--has-sub', { 'left-sidebar__dropdown-item--hovered': activeSubmenu === 'language' })}
                onMouseEnter={() => handleSubmenuEnter('language')}
                onMouseLeave={handleSubmenuLeave}
              >
                <div className={cx('left-sidebar__item-left')}>
                  <Globe size={18} />
                  <span>{t('language_label')}</span>
                </div>
                <ChevronRight size={16} className={cx('left-sidebar__chevron')} />

                {/* Submenu: Ngôn ngữ */}
                {activeSubmenu === 'language' && (
                  <div className={cx('left-sidebar__submenu')} onMouseEnter={() => handleSubmenuEnter('language')} onMouseLeave={handleSubmenuLeave}>
                    <button
                      className={cx('left-sidebar__submenu-item', { 'left-sidebar__submenu-item--active': language === 'vi' })}
                      onClick={() => setLanguage('vi')}
                    >
                      <span className={cx('left-sidebar__flag')}>🇻🇳</span>
                      <span style={{ flex: 1 }}>Tiếng Việt</span>
                      {language === 'vi' && <Check size={16} className={cx('left-sidebar__check-icon')} />}
                    </button>
                    <button
                      className={cx('left-sidebar__submenu-item', { 'left-sidebar__submenu-item--active': language === 'en' })}
                      onClick={() => setLanguage('en')}
                    >
                      <span className={cx('left-sidebar__flag')}>🇺🇸</span>
                      <span style={{ flex: 1 }}>English</span>
                      {language === 'en' && <Check size={16} className={cx('left-sidebar__check-icon')} />}
                    </button>
                  </div>
                )}
              </div>

              {/* 3. Giao diện > */}
              <div
                className={cx('left-sidebar__dropdown-item', 'left-sidebar__dropdown-item--has-sub', { 'left-sidebar__dropdown-item--hovered': activeSubmenu === 'theme' })}
                onMouseEnter={() => handleSubmenuEnter('theme')}
                onMouseLeave={handleSubmenuLeave}
              >
                <div className={cx('left-sidebar__item-left')}>
                  <Palette size={18} />
                  <span>{t('theme')}</span>
                </div>
                <ChevronRight size={16} className={cx('left-sidebar__chevron')} />

                {/* Submenu: Giao diện */}
                {activeSubmenu === 'theme' && (
                  <div className={cx('left-sidebar__submenu')} onMouseEnter={() => handleSubmenuEnter('theme')} onMouseLeave={handleSubmenuLeave}>
                    <button
                      className={cx('left-sidebar__submenu-item', { 'left-sidebar__submenu-item--active': theme === 'dark' })}
                      onClick={() => setTheme('dark')}
                    >
                      <Moon size={16} />
                      <span style={{ flex: 1 }}>Giao diện Tối</span>
                      {theme === 'dark' && <Check size={16} className={cx('left-sidebar__check-icon')} />}
                    </button>
                    <button
                      className={cx('left-sidebar__submenu-item', { 'left-sidebar__submenu-item--active': theme === 'light' })}
                      onClick={() => setTheme('light')}
                    >
                      <Sun size={16} />
                      <span style={{ flex: 1 }}>Giao diện Sáng</span>
                      {theme === 'light' && <Check size={16} className={cx('left-sidebar__check-icon')} />}
                    </button>
                    <button
                      className={cx('left-sidebar__submenu-item', { 'left-sidebar__submenu-item--active': theme === 'glass' })}
                      onClick={() => setTheme('glass')}
                    >
                      <Sparkles size={16} />
                      <span style={{ flex: 1 }}>Kính mờ (Glass)</span>
                      {theme === 'glass' && <Check size={16} className={cx('left-sidebar__check-icon')} />}
                    </button>
                  </div>
                )}
              </div>

              {/* 4. Hỗ trợ > */}
              <div
                className={cx('left-sidebar__dropdown-item', 'left-sidebar__dropdown-item--has-sub', { 'left-sidebar__dropdown-item--hovered': activeSubmenu === 'support' })}
                onMouseEnter={() => handleSubmenuEnter('support')}
                onMouseLeave={handleSubmenuLeave}
              >
                <div className={cx('left-sidebar__item-left')}>
                  <HelpCircle size={18} />
                  <span>{t('support_label')}</span>
                </div>
                <ChevronRight size={16} className={cx('left-sidebar__chevron')} />

                {/* Submenu: Hỗ trợ */}
                {activeSubmenu === 'support' && (
                  <div className={cx('left-sidebar__submenu')} onMouseEnter={() => handleSubmenuEnter('support')} onMouseLeave={handleSubmenuLeave}>
                    <button className={cx('left-sidebar__submenu-item')} onClick={() => handleDropdownItemClick('security')}>
                      <Shield size={16} />
                      <span>{t('tab_security')}</span>
                    </button>
                    <button className={cx('left-sidebar__submenu-item')} onClick={() => handleDropdownItemClick('settings')}>
                      <HelpCircle size={16} />
                      <span>Trợ giúp & Báo lỗi</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 5. Xem thêm > (Dữ liệu / More) */}
              <div
                className={cx('left-sidebar__dropdown-item', 'left-sidebar__dropdown-item--has-sub', { 'left-sidebar__dropdown-item--hovered': activeSubmenu === 'more' })}
                onMouseEnter={() => handleSubmenuEnter('more')}
                onMouseLeave={handleSubmenuLeave}
              >
                <div className={cx('left-sidebar__item-left')}>
                  <Database size={18} />
                  <span>{t('more_options') || 'Xem thêm'}</span>
                </div>
                <ChevronRight size={16} className={cx('left-sidebar__chevron')} />

                {/* Submenu: Xem thêm (Dữ liệu) */}
                {activeSubmenu === 'more' && (
                  <div className={cx('left-sidebar__submenu')} onMouseEnter={() => handleSubmenuEnter('more')} onMouseLeave={handleSubmenuLeave}>
                    <button className={cx('left-sidebar__submenu-item')} onClick={() => handleDropdownItemClick('services')}>
                      <Briefcase size={16} />
                      <span>{t('tab_services')}</span>
                    </button>
                    <button className={cx('left-sidebar__submenu-item')} onClick={() => handleDropdownItemClick('groups')}>
                      <Users size={16} />
                      <span>{t('tab_groups')}</span>
                    </button>
                    <button className={cx('left-sidebar__submenu-item')} onClick={() => handleDropdownItemClick('templates')}>
                      <FileText size={16} />
                      <span>{t('tab_templates')}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className={cx('left-sidebar__dropdown-divider')} />

              {/* 7. Đăng xuất (Red text) */}
              <button
                className={cx('left-sidebar__dropdown-item', 'left-sidebar__dropdown-item--danger')}
                onClick={() => {
                  setDropdownOpen(false);
                  handleLogout();
                }}
                onMouseEnter={() => handleSubmenuEnter(null)}
              >
                <div className={cx('left-sidebar__item-left')}>
                  <LogOut size={18} />
                  <span>{t('logout')}</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
