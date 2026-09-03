import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { searchUsers, sendFriendRequest, blockNumber } from '../../api';
import CustomSelect from '../common/CustomSelect';
import styles from './FriendsTab.module.css';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

export default function FriendsTab() {
  const { t } = useLanguage();
  const { loggedInUser, triggerAlert } = useAuth();

  const searchFilterOptions = [
    { value: 'friends', label: t('filter_friends') },
    { value: 'strangers', label: t('filter_strangers') },
    { value: 'all', label: t('filter_all') }
  ];
  const {
    friends,
    pendingRequests,
    handleRespondRequest,
    setSelectedContact,
    setActiveTab,
    blocklist,
    handleUnblockNumber,
    setBlocklist
  } = useChat();
  // Unified Directory Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('friends'); // 'friends' | 'strangers' | 'all'
  const [apiSearchResults, setApiSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Blocklist Search States
  const [blockSearchQuery, setBlockSearchQuery] = useState('');
  const [blockSearchResults, setBlockSearchResults] = useState([]);
  const [loadingBlockSearch, setLoadingBlockSearch] = useState(false);

  // Filter friends list locally in memory by searchQuery
  const filteredFriends = friends.filter(friend => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const name = (friend.name || '').toLowerCase();
    const username = (friend.username || '').toLowerCase();
    const phone = (friend.mobileNumber || '').toLowerCase();
    const email = (friend.email || '').toLowerCase();
    return name.includes(query) || username.includes(query) || phone.includes(query) || email.includes(query);
  });

  // Debounced search for unified system users
  useEffect(() => {
    if (searchFilter === 'friends' || !searchQuery.trim()) {
      setApiSearchResults([]);
      setLoadingSearch(false);
      return;
    }

    setLoadingSearch(true);
    const delayDebounceFn = setTimeout(() => {
      searchUsers(searchQuery.trim(), 1, 15)
        .then(res => {
          let results = res.items || [];
          if (searchFilter === 'strangers') {
            results = results.filter(u => {
              const isFriend = friends.some(f => f.id === u.id || f.mobileNumber === u.mobileNumber);
              return !isFriend && u.friendshipStatus !== 'accepted';
            });
          }
          setApiSearchResults(results);
          setLoadingSearch(false);
        })
        .catch(() => {
          setLoadingSearch(false);
        });
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchFilter, friends]);

  // Sync friendshipStatus inside apiSearchResults when global context lists change
  useEffect(() => {
    setApiSearchResults(prev => prev.map(user => {
      const isFriend = friends.some(f => f.id === user.id);
      const incomingReq = pendingRequests.find(r => r.senderId === user.id);
      if (isFriend) {
        return { ...user, friendshipStatus: 'accepted' };
      } else if (incomingReq) {
        return { ...user, friendshipStatus: 'pending_received', friendshipId: incomingReq.connectionId };
      }
      return user;
    }));
  }, [friends, pendingRequests]);

  // Debounced search for block list candidates
  useEffect(() => {
    if (!blockSearchQuery.trim()) {
      setBlockSearchResults([]);
      setLoadingBlockSearch(false);
      return;
    }

    setLoadingBlockSearch(true);
    const delayDebounceFn = setTimeout(() => {
      searchUsers(blockSearchQuery.trim(), 1, 15)
        .then(res => {
          setBlockSearchResults(res.items || []);
          setLoadingBlockSearch(false);
        })
        .catch(() => {
          setLoadingBlockSearch(false);
        });
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [blockSearchQuery]);

  // Handle blocking a user directly from search results
  const handleBlockUserDirect = (user) => {
    if (!user.mobileNumber) return;

    blockNumber(user.mobileNumber)
      .then(res => {
        setBlocklist(prev => [...prev, res.block]);
        triggerAlert('success', res.message || `${t('block_success_prefix')} ${user.mobileNumber}`);
      })
      .catch(err => {
        const errorMsg = err.response?.data?.message || t('block_error_default');
        triggerAlert('error', errorMsg);
      });
  };

  // Handle direct friend request send from search list
  const handleSendFriendRequestDirect = (user) => {
    if (!user.email) return;

    sendFriendRequest(loggedInUser.id, user.email)
      .then(res => {
        triggerAlert('success', res.message || t('send_req_success_default'));
        setApiSearchResults(prev =>
          prev.map(u => (u.id === user.id ? { ...u, friendshipStatus: 'pending_sent' } : u))
        );
      })
      .catch(err => {
        const errorMsg = err.response?.data?.message || t('send_req_error_default');
        triggerAlert('error', errorMsg);
      });
  };
  const handleStartChat = (userOrFriend) => {
    const isFriend = friends.some(f => f.id === userOrFriend.id || f.mobileNumber === userOrFriend.mobileNumber) || userOrFriend.friendshipStatus === 'accepted';
    setSelectedContact({
      id: userOrFriend.id || userOrFriend.userId,
      name: userOrFriend.name || userOrFriend.username,
      contactNumber: userOrFriend.mobileNumber || userOrFriend.contactNumber,
      isFriend: isFriend,
      avatar: userOrFriend.profilePhoto || userOrFriend.avatar
    });
    setActiveTab('chats');
  };

  return (
    <div className={cx('friends-tab')}>
      <div className={cx('friends-tab__header')}>
        <h1>{t('tab_friends')}</h1>
        <p>{t('friends_desc')}</p>
      </div>

      <div className={cx('friends-tab__container')}>
        {/* LEFT COLUMN: Friends Directory & User Search */}
        <div className={cx('friends-tab__left-pane')}>
          <div className={cx('friends-tab__section-header')}>
            <h3>
              {searchFilter === 'friends' ? t('tab_friends') : (searchFilter === 'strangers' ? t('search_strangers_title') : t('search_all_title'))}
            </h3>
          </div>

          <div className={cx('friends-tab__search-container-row')}>
            <div className={cx('friends-tab__search-box-wrapper')}>
              <input
                type="text"
                placeholder={searchFilter === 'friends' ? t('search_friends_placeholder') : (searchFilter === 'strangers' ? t('search_strangers_placeholder') : t('search_all_placeholder'))}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cx('friends-tab__search-input')}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className={cx('friends-tab__search-clear')}
                  title={t('clear_search')}
                >
                  ✕
                </button>
              )}
            </div>
            <div style={{ minWidth: '120px' }}>
              <CustomSelect
                options={searchFilterOptions}
                value={searchFilter}
                onChange={setSearchFilter}
              />
            </div>
          </div>

          <div className={cx('friends-tab__list-wrapper')}>
            {loadingSearch ? (
              <div className={cx('friends-tab__status-message')}>{t('searching')}</div>
            ) : searchFilter === 'friends' ? (
              // Friends Directory list (filtered locally if searchQuery is active)
              filteredFriends.length === 0 ? (
                <div className={cx('friends-tab__status-message')}>
                  {searchQuery ? t('no_friends_found') : t('no_friends_yet')}
                </div>
              ) : (
                <div className={cx('friends-tab__list')}>
                  {filteredFriends.map((friend) => (
                    <div key={friend.id} className={cx('friends-tab__card')}>
                      <img
                        src={friend.profilePhoto || 'https://via.placeholder.com/48'}
                        alt={friend.name || friend.username}
                        className={cx('friends-tab__avatar')}
                      />
                      <div className={cx('friends-tab__info')}>
                        <div className={cx('friends-tab__name')}>{friend.name || friend.username}</div>
                        <div className={cx('friends-tab__subtext')}>{friend.mobileNumber}</div>
                        <div className={cx('friends-tab__email')}>{friend.email}</div>
                      </div>
                      <div className={cx('friends-tab__actions')}>
                        <button
                          className={cx('friends-tab__btn', 'friends-tab__btn--chat')}
                          onClick={() => handleStartChat(friend)}
                        >
                          💬 {t('btn_chat')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : !searchQuery.trim() ? (
              <div className={cx('friends-tab__status-message')}>
                {searchFilter === 'strangers'
                  ? t('enter_search_strangers_prompt')
                  : t('enter_search_all_prompt')}
              </div>
            ) : (
              // API search results list
              apiSearchResults.length === 0 ? (
                <div className={cx('friends-tab__status-message')}>{t('no_matching_users')}</div>
              ) : (
                <div className={cx('friends-tab__list')}>
                  {apiSearchResults.map((user) => (
                    <div key={user.id} className={cx('friends-tab__card')}>
                      <img
                        src={user.profilePhoto || 'https://via.placeholder.com/48'}
                        alt={user.name || user.username}
                        className={cx('friends-tab__avatar')}
                      />
                      <div className={cx('friends-tab__info')}>
                        <div className={cx('friends-tab__name')}>{user.name || user.username}</div>
                        <div className={cx('friends-tab__subtext')}>{user.mobileNumber}</div>
                        <div className={cx('friends-tab__email')}>{user.email}</div>
                      </div>
                      <div className={cx('friends-tab__actions')}>
                        {user.friendshipStatus !== 'accepted' && (
                          <>
                            {user.friendshipStatus === 'pending_sent' ? (
                              <span className={cx('friends-tab__badge', 'friends-tab__badge--sent')}>
                                {t('sent_friend_req')}
                              </span>
                            ) : user.friendshipStatus === 'pending_received' ? (
                              <div className={cx('friends-tab__actions-group')}>
                                <span className={cx('friends-tab__received-label')}>{t('friend_req_from')}</span>
                                <div className={cx('friends-tab__action-buttons')}>
                                  <button
                                    className={cx('friends-tab__btn', 'friends-tab__btn--accept')}
                                    onClick={() => handleRespondRequest(user.friendshipId, true)}
                                  >
                                    {t('accept')}
                                  </button>
                                  <button
                                    className={cx('friends-tab__btn', 'friends-tab__btn--reject')}
                                    onClick={() => handleRespondRequest(user.friendshipId, false)}
                                  >
                                    {t('decline')}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                className={cx('friends-tab__btn', 'friends-tab__btn--add')}
                                onClick={() => handleSendFriendRequestDirect(user)}
                              >
                                👤+ {t('btn_add_friend')}
                              </button>
                            )}
                          </>
                        )}

                        <button
                          className={cx('friends-tab__btn', 'friends-tab__btn--chat')}
                          onClick={() => handleStartChat(user)}
                        >
                          💬 {t('btn_chat')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Friend Requests Pane */}
        <div className={cx('friends-tab__right-pane')}>
          {/* Incoming Requests */}
          <div className={cx('friends-tab__pane-section')}>
            <div className={cx('friends-tab__section-header')}>
              <h3>
                {t('incoming_requests')} ({pendingRequests.length})
              </h3>
            </div>
            <div className={cx('friends-tab__requests-list')}>
              {pendingRequests.length === 0 ? (
                <p className={cx('friends-tab__empty-notice')}>{t('no_incoming_requests')}</p>
              ) : (
                pendingRequests.map((req) => (
                  <div key={req.connectionId} className={cx('friends-tab__request-item')}>
                    <img
                      src={req.senderPhoto || 'https://via.placeholder.com/40'}
                      alt={req.senderName}
                      className={cx('friends-tab__request-avatar')}
                    />
                    <div className={cx('friends-tab__request-info')}>
                      <div className={cx('friends-tab__request-name')}>{req.senderName}</div>
                      <div className={cx('friends-tab__request-subtext')}>
                        {req.senderEmail} ({req.senderMobile})
                      </div>
                    </div>
                    <div className={cx('friends-tab__request-actions')}>
                      <button
                        className={cx('friends-tab__btn', 'friends-tab__btn--accept')}
                        onClick={() => handleRespondRequest(req.connectionId, true)}
                      >
                        {t('accept')}
                      </button>
                      <button
                        className={cx('friends-tab__btn', 'friends-tab__btn--reject')}
                        onClick={() => handleRespondRequest(req.connectionId, false)}
                      >
                        {t('decline')}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Blacklist / Blocklist panel */}
          <div className={cx('friends-tab__pane-section', 'friends-tab__pane-section--blocklist')}>
            <div className={cx('friends-tab__section-header')}>
              <h3>{t('blacklist_title')}</h3>
            </div>

            <div className={cx('friends-tab__block-search-box')}>
              <input
                type="text"
                placeholder={t('search_block_placeholder')}
                value={blockSearchQuery}
                onChange={(e) => setBlockSearchQuery(e.target.value)}
                className={cx('friends-tab__search-input')}
              />
              {blockSearchQuery && (
                <button
                  type="button"
                  onClick={() => setBlockSearchQuery('')}
                  className={cx('friends-tab__search-clear')}
                  title={t('clear_search')}
                >
                  ✕
                </button>
              )}
            </div>

            <div className={cx('friends-tab__blocklist-results-wrapper')}>
              {loadingBlockSearch ? (
                <div className={cx('friends-tab__status-message-small')}>{t('searching')}</div>
              ) : blockSearchQuery ? (
                blockSearchResults.length === 0 ? (
                  <div className={cx('friends-tab__status-message-small')}>{t('no_matching_users')}</div>
                ) : (
                  <div className={cx('friends-tab__block-search-results')}>
                    {blockSearchResults.map(user => {
                      const isBlocked = blocklist.some(b => b.blockedNumber === user.mobileNumber);
                      return (
                        <div key={user.id} className={cx('friends-tab__block-candidate-card')}>
                          <img
                            src={user.profilePhoto || 'https://via.placeholder.com/32'}
                            alt={user.name || user.username}
                            className={cx('friends-tab__block-candidate-avatar')}
                          />
                          <div className={cx('friends-tab__block-candidate-info')}>
                            <div className={cx('friends-tab__block-candidate-name')}>{user.name || user.username}</div>
                            <div className={cx('friends-tab__block-candidate-phone')}>{user.mobileNumber}</div>
                          </div>
                          <div className={cx('friends-tab__block-candidate-actions')}>
                            {isBlocked ? (
                              <button
                                className={cx('friends-tab__btn', 'friends-tab__btn--unblock-small')}
                                onClick={() => {
                                  const blockedEntry = blocklist.find(b => b.blockedNumber === user.mobileNumber);
                                  if (blockedEntry) handleUnblockNumber(blockedEntry.id);
                                }}
                              >
                                {t('btn_unblock_short')}
                              </button>
                            ) : (
                              <button
                                className={cx('friends-tab__btn', 'friends-tab__btn--block-small')}
                                onClick={() => handleBlockUserDirect(user)}
                              >
                                {t('btn_block_short')}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                // Display list of currently blocked numbers when search is empty
                <div className={cx('friends-tab__blocked-list')}>
                  {blocklist.length === 0 ? (
                    <p className={cx('friends-tab__empty-notice')}>{t('blocklist_empty')}</p>
                  ) : (
                    blocklist.map(b => (
                      <div key={b.id} className={cx('friends-tab__blocked-item')}>
                        <div className={cx('friends-tab__blocked-info')}>
                          <span className={cx('friends-tab__blocked-name')}>🚫 {b.blockedName || t('unknown_user')}</span>
                          <span className={cx('friends-tab__blocked-number')}>{b.blockedNumber}</span>
                        </div>
                        <button
                          className={cx('friends-tab__btn', 'friends-tab__btn--unblock-small')}
                          onClick={() => handleUnblockNumber(b.id)}
                        >
                          {t('btn_unblock_short')}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
