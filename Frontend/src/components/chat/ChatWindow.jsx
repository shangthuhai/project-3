import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { sendFriendRequest, respondFriendRequest } from '../../api';
import styles from './ChatWindow.module.css';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

export default function ChatWindow() {
  const { loggedInUser, triggerAlert } = useAuth();

  const {
    selectedContact,
    remainingQuota,
    chatMessages,
    contactIsTyping,
    newMessage,
    setNewMessage,
    scheduleDate,
    setScheduleDate,
    showScheduler,
    setShowScheduler,
    templates,
    showTemplatePicker,
    setShowTemplatePicker,
    showAiAssistant,
    setShowAiAssistant,
    aiPrompt,
    setAiPrompt,
    aiTone,
    setAiTone,
    generatingAi,
    messagesEndRef,
    chatMessagesAreaRef,
    textareaRef,
    handleSendMessageSubmit,
    handleGenerateAiMessage,
    handleTyping,
    loadChatDetails,
    refreshDashboardData,
    handleScroll
  } = useChat();

  const getCharCounterClass = () => {
    const count = newMessage.length;
    if (count > 120) return cx('chat-window__char-counter', 'chat-window__char-counter--danger');
    if (count > 100) return cx('chat-window__char-counter', 'chat-window__char-counter--warning');
    return cx('chat-window__char-counter', 'chat-window__char-counter--safe');
  };

  // Auto-scroll to bottom of messages thread when chat messages update
  const prevChatMessagesLengthRef = React.useRef(0);
  const prevChatMessagesFirstIdRef = React.useRef(null);

  useEffect(() => {
    if (chatMessages.length === 0) {
      prevChatMessagesLengthRef.current = 0;
      prevChatMessagesFirstIdRef.current = null;
      return;
    }

    const firstId = chatMessages[0]?.id;
    const isPrepend = prevChatMessagesFirstIdRef.current !== null && firstId !== prevChatMessagesFirstIdRef.current;
    
    if (!isPrepend) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    prevChatMessagesLengthRef.current = chatMessages.length;
    prevChatMessagesFirstIdRef.current = firstId;
  }, [chatMessages]);

  // Auto-resize chat textarea to fit content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newMessage, selectedContact]);

  return (
    <>
      <div className={cx('chat-window__header')}>
        <div className={cx('chat-window__header-user')}>
          <img
            src={selectedContact.avatar || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%237f91a4"/><text x="50%" y="50%" font-family="sans-serif" font-weight="bold" font-size="40" fill="white" text-anchor="middle" dominant-baseline="central">${selectedContact.name[0]}</text></svg>`}
            alt={selectedContact.name}
            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <div className={cx('chat-window__header-info')}>
            <h3>{selectedContact.name}</h3>
            <p>{selectedContact.contactNumber} • {remainingQuota?.isFriend ? 'Friend (Unlimited SMS)' : 'Non-friend (5 Free Messages Limit)'}</p>
          </div>
        </div>
      </div>

      {remainingQuota && !remainingQuota.isFriend && (
        <div className={cx('chat-window__quota-banner')} style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 24px',
          background: 'rgba(23, 33, 43, 0.95)',
          borderBottom: '1px solid var(--border-light)',
          fontSize: '0.88rem'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span>
              <strong>SMS Quota:</strong> {remainingQuota.remaining} of {remainingQuota.limit} free messages left for this number.
            </span>
            {remainingQuota.contactUserId === 0 && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                ⚠️ Số điện thoại chưa đăng ký tài khoản Online SMS Hub.
              </span>
            )}
          </div>

          {remainingQuota.contactUserId > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {(remainingQuota.friendshipStatus === 'none' || remainingQuota.friendshipStatus === 'rejected') && (
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    sendFriendRequest(loggedInUser.id, remainingQuota.email)
                      .then(res => {
                        triggerAlert('success', res.message);
                        loadChatDetails();
                        refreshDashboardData();
                      })
                      .catch(err => {
                        triggerAlert('error', err.response?.data?.message || 'Không thể gửi lời mời kết bạn');
                      });
                  }}
                  style={{ padding: '6px 14px', fontSize: '0.82rem', borderRadius: '20px' }}
                >
                  🤝 Kết bạn
                </button>
              )}

              {remainingQuota.friendshipStatus === 'pending_sent' && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>
                  ⏳ Đã gửi lời mời kết bạn
                </span>
              )}

              {remainingQuota.friendshipStatus === 'pending_received' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-accent"
                    onClick={() => {
                      respondFriendRequest(remainingQuota.friendshipId, true)
                        .then(res => {
                          triggerAlert('success', res.message);
                          loadChatDetails();
                          refreshDashboardData();
                        })
                        .catch(() => triggerAlert('error', 'Lỗi khi chấp nhận kết bạn'));
                    }}
                    style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: '20px', background: 'var(--color-accent)' }}
                  >
                    ✓ Chấp nhận
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      respondFriendRequest(remainingQuota.friendshipId, false)
                        .then(res => {
                          triggerAlert('success', res.message);
                          loadChatDetails();
                          refreshDashboardData();
                        })
                        .catch(() => triggerAlert('error', 'Lỗi khi từ chối kết bạn'));
                    }}
                    style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)' }}
                  >
                    ✕ Từ chối
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div 
        ref={chatMessagesAreaRef}
        onScroll={handleScroll}
        className={cx('chat-window__messages')}
      >
        {chatMessages.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', opacity: 0.3, fontSize: '0.9rem' }}>
            No messages yet. Say hello!
          </div>
        ) : (
          chatMessages.map(msg => {
            const isSentByMe = msg.senderId === loggedInUser.id;
            const date = new Date(msg.sentTime);
            const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const isPending = msg.scheduledAt && new Date(msg.scheduledAt) > new Date();
            return (
              <div key={msg.id} className={cx('chat-window__message-row', isSentByMe ? 'chat-window__message-row--sent' : 'chat-window__message-row--received')}>
                <div className={cx('chat-window__message-bubble', isSentByMe ? 'chat-window__message-bubble--sent' : 'chat-window__message-bubble--received')}>
                  <span className={cx('chat-window__message-text')}>{msg.content}</span>
                  <span className={cx('chat-window__message-time')}>
                    {formattedTime}
                    {isPending && (
                      <span className={cx('chat-window__msg-scheduled-badge')}>⏰ Hẹn giờ: {new Date(msg.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </span>
                </div>
              </div>
            );
          })
        )}
        {contactIsTyping && (
          <div className={cx('chat-window__message-row', 'chat-window__message-row--received')}>
            <div className={cx('chat-window__message-bubble', 'chat-window__message-bubble--received', 'chat-window__typing-bubble')}>
              <div className={cx('chat-window__typing-dots')}>
                <span className={cx('chat-window__typing-dot')}></span>
                <span className={cx('chat-window__typing-dot')}></span>
                <span className={cx('chat-window__typing-dot')}></span>
              </div>
              <span className={cx('chat-window__typing-text')}>{selectedContact.name} đang nhập...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className={cx('chat-window__input-area')} onSubmit={handleSendMessageSubmit} style={{ position: 'relative' }}>
        {/* Composer Toolbar */}
        <div className={cx('chat-window__composer-tools')}>
          <button
            type="button"
            className={cx('chat-window__composer-btn', { 'chat-window__composer-btn--active': showScheduler })}
            onClick={() => {
              setShowScheduler(!showScheduler);
              setShowTemplatePicker(false);
              setShowAiAssistant(false);
            }}
          >
            ⏰ Hẹn giờ {scheduleDate && '✓'}
          </button>
          <button
            type="button"
            className={cx('chat-window__composer-btn', { 'chat-window__composer-btn--active': showTemplatePicker })}
            onClick={() => {
              setShowTemplatePicker(!showTemplatePicker);
              setShowScheduler(false);
              setShowAiAssistant(false);
            }}
          >
            📄 Mẫu tin nhắn
          </button>
          <button
            type="button"
            className={cx('chat-window__composer-btn', { 'chat-window__composer-btn--active': showAiAssistant })}
            onClick={() => {
              setShowAiAssistant(!showAiAssistant);
              setShowScheduler(false);
              setShowTemplatePicker(false);
            }}
          >
            ✨ Trợ lý AI
          </button>
          {scheduleDate && (
            <span style={{ fontSize: '0.75rem', color: '#fbbf24', marginLeft: 'auto' }}>
              Hẹn giờ: {new Date(scheduleDate).toLocaleString()}
            </span>
          )}
        </div>

        {/* Scheduler Popover */}
        {showScheduler && (
          <div className={cx('chat-window__scheduler-popover')}>
            <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Chọn Ngày/Giờ Gửi:</label>
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button type="button" className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.72rem' }} onClick={() => { setScheduleDate(''); setShowScheduler(false); }}>
                Xóa
              </button>
              <button type="button" className="btn btn-primary" style={{ padding: '2px 8px', fontSize: '0.72rem' }} onClick={() => setShowScheduler(false)}>
                Xác nhận
              </button>
            </div>
          </div>
        )}

        {/* Template Picker Popover */}
        {showTemplatePicker && (
          <div className={cx('chat-window__template-picker')}>
            <div style={{ padding: '10px', fontWeight: 'bold', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Chọn tin nhắn mẫu</span>
              <button type="button" style={{ background: 'none', border: 'none', color: '#ff5555', cursor: 'pointer' }} onClick={() => setShowTemplatePicker(false)}>✕</button>
            </div>
            {templates.length === 0 ? (
              <div style={{ padding: '15px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Không có mẫu tin nhắn.</div>
            ) : (
              templates.map(tpl => (
                <div
                  key={tpl.id}
                  className={cx('chat-window__template-item')}
                  onClick={() => {
                    let text = tpl.body.replace('{Name}', selectedContact.name);
                    setNewMessage(text.substring(0, 120));
                    setShowTemplatePicker(false);
                  }}
                >
                  <h5 className={cx('chat-window__template-item-title')}>{tpl.title}</h5>
                  <p className={cx('chat-window__template-item-body')}>{tpl.body}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* AI Assistant Popover */}
        {showAiAssistant && (
          <div className={cx('chat-window__ai-popover')}>
            <div style={{ padding: '4px 0px 8px 0px', fontWeight: 'bold', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-main)' }}>✨ Trợ lý SMS AI</span>
              <button type="button" style={{ background: 'none', border: 'none', color: '#ff5555', cursor: 'pointer', fontSize: '1rem' }} onClick={() => setShowAiAssistant(false)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--text-muted)', textAlign: 'left', display: 'block' }}>Ý tưởng tin nhắn:</label>
              <textarea
                placeholder="VD: nhắc nợ bạn tiền ăn trưa lịch sự..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                disabled={generatingAi}
                className={cx('chat-window__ai-textarea')}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />

              <label style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--text-muted)', textAlign: 'left', display: 'block' }}>Văn phong:</label>
              <select
                value={aiTone}
                onChange={(e) => setAiTone(e.target.value)}
                disabled={generatingAi}
                className={cx('chat-window__ai-select')}
                style={{ width: '100%' }}
              >
                <option value="polite">Lịch sự</option>
                <option value="formal">Trang trọng</option>
                <option value="funny">Hài hước</option>
                <option value="intimate">Thân mật</option>
              </select>

              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '6px', fontSize: '0.8rem', marginTop: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', width: '100%' }}
                onClick={handleGenerateAiMessage}
                disabled={generatingAi || !aiPrompt.trim()}
              >
                {generatingAi ? (
                  <>
                    <span className={cx('chat-window__spinner-small')}></span> Đang tạo...
                  </>
                ) : (
                  'Tạo tin nhắn'
                )}
              </button>
            </div>
          </div>
        )}

        <div className={cx('chat-window__input-row')}>
          <div className={cx('chat-window__textarea-container')}>
            <textarea
              ref={textareaRef}
              className={cx('chat-window__textarea')}
              placeholder={
                remainingQuota?.remaining === 0 && !remainingQuota?.isFriend
                  ? "SMS limit reached. Friend this user to chat."
                  : "Type an SMS message..."
              }
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value.substring(0, 150));
                handleTyping();
              }}
              disabled={remainingQuota?.remaining === 0 && !remainingQuota?.isFriend}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessageSubmit(e);
                }
              }}
            />
            <div className={cx('chat-window__input-controls')}>
              <span className={getCharCounterClass()}>
                {newMessage.length}/120
              </span>
            </div>
          </div>
          <button
            type="submit"
            className={cx('chat-window__send-btn')}
            disabled={!newMessage.trim() || newMessage.length > 120 || (remainingQuota?.remaining === 0 && !remainingQuota?.isFriend)}
          >
            ➤
          </button>
        </div>
      </form>
    </>
  );
}
