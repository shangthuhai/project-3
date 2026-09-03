import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useLanguage } from '../../context/LanguageContext';
import { sendFriendRequest, respondFriendRequest } from '../../api';
import CustomSelect from '../common/CustomSelect';
import styles from './ChatWindow.module.css';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

export default function ChatWindow() {
  const { loggedInUser, triggerAlert } = useAuth();
  const { language, t } = useLanguage();

  const {
    selectedContact,
    setSelectedContact,
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
    setIsAiBubbleOpen,
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
    handleUnblockNumber,
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
        <button
          type="button"
          className="mobile-back-btn"
          onClick={() => setSelectedContact(null)}
          title={language === 'en' ? 'Back' : 'Quay lại'}
        >
          ←
        </button>
        <div className={cx('chat-window__header-user')}>
          <img
            src={selectedContact.avatar || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%237f91a4"/><text x="50%" y="50%" font-family="sans-serif" font-weight="bold" font-size="40" fill="white" text-anchor="middle" dominant-baseline="central">${selectedContact.name[0]}</text></svg>`}
            alt={selectedContact.name}
            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <div className={cx('chat-window__header-info')}>
            <h3>{selectedContact.name}</h3>
            <p>{selectedContact.contactNumber} • {remainingQuota?.isFriend ? (language === 'en' ? 'Friend (Unlimited SMS)' : 'Bạn bè (Tin nhắn vô hạn)') : (language === 'en' ? 'Non-friend (5 Free Messages Limit)' : 'Người lạ (Hạn mức 5 tin miễn phí)')}</p>
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
              <strong>{language === 'en' ? 'SMS Quota:' : 'Hạn ngạch SMS:'}</strong> {remainingQuota.remaining} of {remainingQuota.limit} {language === 'en' ? 'free messages left for this number.' : 'tin nhắn miễn phí còn lại.'}
            </span>
            {remainingQuota.contactUserId === 0 && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {language === 'en' ? '⚠️ Mobile number not registered on Online SMS Hub.' : '⚠️ Số điện thoại chưa đăng ký tài khoản Online SMS Hub.'}
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
                        triggerAlert('error', err.response?.data?.message || (language === 'en' ? 'Failed to send friend request' : 'Không thể gửi lời mời kết bạn'));
                      });
                  }}
                  style={{ padding: '6px 14px', fontSize: '0.82rem', borderRadius: '20px' }}
                >
                  🤝 {language === 'en' ? 'Add Friend' : 'Kết bạn'}
                </button>
              )}

              {remainingQuota.friendshipStatus === 'pending_sent' && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>
                  {t('sent_friend_req')}
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
                        .catch(() => triggerAlert('error', language === 'en' ? 'Error accepting friend request' : 'Lỗi khi chấp nhận kết bạn'));
                    }}
                    style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: '20px', background: 'var(--color-accent)' }}
                  >
                    ✓ {t('accept')}
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
                        .catch(() => triggerAlert('error', language === 'en' ? 'Error rejecting friend request' : 'Lỗi khi từ chối kết bạn'));
                    }}
                    style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)' }}
                  >
                    ✕ {t('decline')}
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
            {language === 'en' ? 'No messages yet. Say hello!' : 'Chưa có tin nhắn. Hãy chào nhau nào!'}
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
                      <span className={cx('chat-window__msg-scheduled-badge')}>⏰ {language === 'en' ? 'Scheduled' : 'Hẹn giờ'}: {new Date(msg.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
              <span className={cx('chat-window__typing-text')}>{selectedContact.name} {language === 'en' ? 'is typing...' : 'đang nhập...'}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {remainingQuota?.iAmBlocked ? (
        <div className={cx('chat-window__blocked-container')}>
          <p className={cx('chat-window__blocked-text')}>
            🚫 {t('you_are_blocked')}
          </p>
        </div>
      ) : remainingQuota?.iHaveBlocked ? (
        <div className={cx('chat-window__blocked-container')}>
          <p className={cx('chat-window__blocked-subtext')}>
            {t('you_blocked_this_user')}
          </p>
          <button
            type="button"
            className={cx('chat-window__unblock-btn')}
            onClick={() => handleUnblockNumber(remainingQuota.blockId || selectedContact.contactNumber)}
          >
            🔓 {t('unblock_to_chat')}
          </button>
        </div>
      ) : (
        <form className={cx('chat-window__input-area')} onSubmit={handleSendMessageSubmit} style={{ position: 'relative' }}>
          {/* Composer Toolbar */}
          <div className={cx('chat-window__composer-tools')}>

            <div className={cx('chat-window__composer-tool-container')}>
              <button
                type="button"
                className={cx('chat-window__composer-btn', { 'chat-window__composer-btn--active': showScheduler })}
                onClick={() => {
                  setShowScheduler(!showScheduler);
                  setShowTemplatePicker(false);
                  setShowAiAssistant(false);
                }}
              >
                ⏰ {language === 'en' ? 'Schedule' : 'Hẹn giờ'} {scheduleDate && '✓'}
              </button>

              {/* Scheduler Popover */}
              {showScheduler && (
                <div className={cx('chat-window__scheduler-popover')}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{language === 'en' ? 'Select Send Date/Time:' : 'Chọn Ngày/Giờ Gửi:'}</label>
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button type="button" className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.72rem' }} onClick={() => { setScheduleDate(''); setShowScheduler(false); }}>
                      {language === 'en' ? 'Clear' : 'Xóa'}
                    </button>
                    <button type="button" className="btn btn-primary" style={{ padding: '2px 8px', fontSize: '0.72rem' }} onClick={() => setShowScheduler(false)}>
                      {language === 'en' ? 'Confirm' : 'Xác nhận'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className={cx('chat-window__composer-tool-container')}>
              <button
                type="button"
                className={cx('chat-window__composer-btn', { 'chat-window__composer-btn--active': showTemplatePicker })}
                onClick={() => {
                  setShowTemplatePicker(!showTemplatePicker);
                  setShowScheduler(false);
                  setShowAiAssistant(false);
                }}
              >
                📄 {language === 'en' ? 'Templates' : 'Mẫu tin nhắn'}
              </button>

              {/* Template Picker Popover */}
              {showTemplatePicker && (
                <div className={cx('chat-window__template-picker')}>
                  <div style={{ padding: '10px', fontWeight: 'bold', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{language === 'en' ? 'Select Template' : 'Chọn tin nhắn mẫu'}</span>
                    <button type="button" style={{ background: 'none', border: 'none', color: '#ff5555', cursor: 'pointer' }} onClick={() => setShowTemplatePicker(false)}>✕</button>
                  </div>
                  {templates.length === 0 ? (
                    <div style={{ padding: '15px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{language === 'en' ? 'No templates found.' : 'Không có mẫu tin nhắn.'}</div>
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
            </div>

            <div className={cx('chat-window__composer-tool-container')}>
              <button
                type="button"
                className={cx('chat-window__composer-btn', { 'chat-window__composer-btn--active': showAiAssistant })}
                onClick={() => {
                  setShowAiAssistant(!showAiAssistant);
                  setShowScheduler(false);
                  setShowTemplatePicker(false);
                }}
              >
                ✨ {language === 'en' ? 'AI Assistant' : 'Trợ lý AI'}
              </button>

              {/* AI Assistant Popover */}
              {showAiAssistant && (
                <div className={cx('chat-window__ai-popover')}>
                  <div style={{ padding: '4px 0px 8px 0px', fontWeight: 'bold', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-main)' }}>✨ {t('ai_assistant')}</span>
                    <button type="button" style={{ background: 'none', border: 'none', color: '#ff5555', cursor: 'pointer', fontSize: '1rem' }} onClick={() => setShowAiAssistant(false)}>✕</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{
                        padding: '7px 12px',
                        fontSize: '0.82rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.18), rgba(139, 92, 246, 0.18))',
                        border: '1px solid rgba(236, 72, 153, 0.35)',
                        color: 'var(--text-main)',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setIsAiBubbleOpen(true);
                        setShowAiAssistant(false);
                      }}
                    >
                      🤖 💬 {language === 'en' ? 'Chat with Bot' : 'Trò chuyện'}
                    </button>

                    <div style={{ height: '1px', background: 'var(--border-light)', margin: '2px 0' }} />

                    <label style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--text-muted)', textAlign: 'left', display: 'block' }}>{language === 'en' ? 'Message Idea:' : 'Ý tưởng tin nhắn:'}</label>
                    <textarea
                      placeholder={t('prompt_placeholder')}
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      disabled={generatingAi}
                      className={cx('chat-window__ai-textarea')}
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    />

                    <label style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--text-muted)', textAlign: 'left', display: 'block' }}>{language === 'en' ? 'Tone:' : 'Văn phong:'}</label>
                    <CustomSelect
                      options={[
                        { value: 'polite', label: t('tone_polite') },
                        { value: 'formal', label: t('tone_formal') },
                        { value: 'funny', label: t('tone_funny') },
                        { value: 'intimate', label: t('tone_intimate') }
                      ]}
                      value={aiTone}
                      onChange={setAiTone}
                      disabled={generatingAi}
                    />

                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: '6px', fontSize: '0.8rem', marginTop: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', width: '100%' }}
                      onClick={handleGenerateAiMessage}
                      disabled={generatingAi || !aiPrompt.trim()}
                    >
                      {generatingAi ? (
                        <>
                          <span className={cx('chat-window__spinner-small')}></span> {language === 'en' ? 'Generating...' : 'Đang tạo...'}
                        </>
                      ) : (
                        t('generate')
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {scheduleDate && (
              <span style={{ fontSize: '0.75rem', color: '#fbbf24', marginLeft: 'auto' }}>
                {language === 'en' ? 'Scheduled:' : 'Hẹn giờ:'} {new Date(scheduleDate).toLocaleString()}
              </span>
            )}
          </div>

          <div className={cx('chat-window__input-row')}>
            <div className={cx('chat-window__textarea-container')}>
              <textarea
                ref={textareaRef}
                className={cx('chat-window__textarea')}
                placeholder={
                  remainingQuota?.remaining === 0 && !remainingQuota?.isFriend
                    ? (language === 'en' ? "SMS limit reached. Friend this user to chat." : "Đã hết hạn ngạch SMS. Kết bạn để nhắn tin.")
                    : (language === 'en' ? "Type an SMS message..." : "Nhập tin nhắn SMS...")
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
              title={language === 'en' ? 'Send Message' : 'Gửi tin nhắn'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'translateX(1px)' }}>
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </form>
      )}
    </>
  );
}
