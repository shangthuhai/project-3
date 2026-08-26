import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

export default function Sidebar() {
  const {
    loggedInUser,
    users,
    handleDemoUserSwitch,
    handleLogout
  } = useAuth();

  const {
    activeTab,
    setActiveTab,
    pendingRequests,
    searchQuery,
    setSearchQuery,
    searchResults,
    loadingMoreSearchResults,
    hasMoreSearchResults,
    selectedContact,
    setSelectedContact,
    conversations,
    friends,
    contacts,
    setShowAddContactModal,
    loadTemplates,
    loadGroups,
    loadBlocklist,
    loadAnalyticsStats,
    clearSearch,
    handleSearchScroll,
    handleDeleteContact,
    searchListRef
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
      return <div className="empty-list-message">Đang tìm kiếm...</div>;
    }

    if (searchResults.length === 0) {
      return <div className="empty-list-message">Không tìm thấy người dùng phù hợp.</div>;
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
            statusText = 'Bạn bè';
            badgeClass = 'friend';
          } else if (user.friendshipStatus === 'pending_sent') {
            statusText = 'Đã gửi lời mời';
            badgeClass = 'pending-sent';
          } else if (user.friendshipStatus === 'pending_received') {
            statusText = 'Lời mời kết bạn';
            badgeClass = 'pending-received';
          }

          return (
            <div
              key={user.id}
              className={`sidebar-list-item`}
              onClick={() => startChat(user.name || user.username, user.mobileNumber, user.friendshipStatus === 'accepted')}
              style={{ cursor: 'pointer' }}
            >
              <img src={user.profilePhoto || 'https://via.placeholder.com/40'} alt={user.username} className="item-avatar" />
              <div className="item-details">
                <div className="item-row">
                  <span className="item-name">{user.name || user.username}</span>
                  <span className="item-meta">{user.mobileNumber}</span>
                </div>
                <div className="item-row">
                  <span className="item-subtext">{user.email}</span>
                  {statusText && (
                    <span className={`item-status-badge ${badgeClass}`}>
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
            Đang tải thêm...
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
            subtext: 'Friend (No messages)',
            lastMessageTime: null
          });
        }
      });

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
            subtext: 'Contact (No messages)',
            lastMessageTime: null
          });
        }
      });

      if (chatItems.length === 0) {
        return <div className="empty-list-message">No active chats. Add contacts to begin messaging.</div>;
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
          className={`sidebar-list-item ${selectedContact?.contactNumber === item.contactNumber ? 'selected' : ''}`}
          onClick={() => setSelectedContact(item)}
        >
          <img src={item.avatar} alt={item.name} className="item-avatar" />
          <div className="item-details">
            <div className="item-row">
              <span className="item-name">{item.name}</span>
              <span className="item-meta">
                {item.lastMessageTime ? formatMessageTime(item.lastMessageTime) : item.contactNumber}
              </span>
            </div>
            <div className="item-row">
              <span className="item-subtext" title={item.subtext}>{item.subtext}</span>
              <span className="item-meta" style={{ fontSize: '0.7rem' }}>
                {item.lastMessageTime ? item.contactNumber : (
                  <span className={`item-status-badge ${item.isFriend ? 'friend' : 'non-friend'}`}>
                    {item.isFriend ? 'Free' : 'Free 5/5'}
                  </span>
                )}
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

  return (
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
        {users.length > 0 && loggedInUser && (
          <div className="user-switcher-container">
            <img src={loggedInUser.profilePhoto} alt={loggedInUser.name} className="user-switcher-avatar" />
            <div className="user-switcher-info">
              <span className="user-switcher-label">Logged In As</span>
              <select 
                className="user-select" 
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

      {/* Search bar for friends/users */}
      <div className="sidebar-search-container" style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Tìm bạn bè bằng tên/SĐT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 32px 8px 12px',
              borderRadius: '20px',
              border: '1px solid var(--border-light)',
              background: 'var(--bg-app)',
              color: '#fff',
              fontSize: '0.88rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '1rem',
                padding: '2px'
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="sidebar-list-container">
        {searchQuery ? renderSearchResultsList() : renderSidebarList()}
        {['requests', 'services', 'profile', 'templates', 'groups', 'analytics', 'security'].includes(activeTab) && !searchQuery && (
          <div className="empty-list-message" style={{ opacity: 0.7 }}>
            Content is open in the main panel.
          </div>
        )}
      </div>
    </div>
  );
}
