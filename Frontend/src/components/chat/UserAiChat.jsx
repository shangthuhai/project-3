import React, { useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { useLanguage } from '../../context/LanguageContext';
import styles from './UserAiChat.module.css';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

export default function UserAiChat() {
  const { t } = useLanguage();
  const {
    isAiBubbleOpen,
    setIsAiBubbleOpen,
    aiMessages,
    aiNewMessage,
    setAiNewMessage,
    isAiLoading,
    aiChatPosition,
    setAiChatPosition,
    aiMessagesEndRef,
    handleAiSendMessage
  } = useChat();

  const aiChatDragRef = useRef({ isDragging: false, startX: 0, startY: 0, posX: 0, posY: 0 });

  const handleCloseAiChat = () => {
    setIsAiBubbleOpen(false);
  };

  const handleAiChatMouseDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest(`.${styles['ai-chat__close-btn']}`)) return;

    aiChatDragRef.current.isDragging = false;
    aiChatDragRef.current.startX = e.clientX;
    aiChatDragRef.current.startY = e.clientY;
    aiChatDragRef.current.posX = aiChatPosition.x;
    aiChatDragRef.current.posY = aiChatPosition.y;

    document.addEventListener('mousemove', handleAiChatMouseMove);
    document.addEventListener('mouseup', handleAiChatMouseUp);
  };

  const handleAiChatMouseMove = (e) => {
    const dx = e.clientX - aiChatDragRef.current.startX;
    const dy = e.clientY - aiChatDragRef.current.startY;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      aiChatDragRef.current.isDragging = true;
    }

    let newX = aiChatDragRef.current.posX + dx;
    let newY = aiChatDragRef.current.posY + dy;

    newX = Math.max(10, Math.min(window.innerWidth - 370, newX));
    newY = Math.max(10, Math.min(window.innerHeight - 490, newY));

    setAiChatPosition({ x: newX, y: newY });
  };

  const handleAiChatMouseUp = () => {
    document.removeEventListener('mousemove', handleAiChatMouseMove);
    document.removeEventListener('mouseup', handleAiChatMouseUp);
  };

  useEffect(() => {
    const handleResize = () => {
      setAiChatPosition(prev => ({
        x: Math.max(10, Math.min(window.innerWidth - 370, prev.x)),
        y: Math.max(10, Math.min(window.innerHeight - 490, prev.y))
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [showScrollBottom, setShowScrollBottom] = React.useState(false);
  const aiMessagesAreaRef = useRef(null);

  const scrollToBottom = (behavior = 'smooth') => {
    if (aiMessagesAreaRef.current) {
      aiMessagesAreaRef.current.scrollTo({
        top: aiMessagesAreaRef.current.scrollHeight,
        behavior
      });
    } else {
      aiMessagesEndRef.current?.scrollIntoView({ behavior });
    }
  };

  useEffect(() => {
    if (isAiBubbleOpen) {
      setShowScrollBottom(false);
      scrollToBottom('auto');
      const timer = setTimeout(() => scrollToBottom('auto'), 50);
      return () => clearTimeout(timer);
    }
  }, [isAiBubbleOpen, aiMessages.length]);

  const handleMessagesScroll = (e) => {
    const container = e.target;
    if (!container) return;
    const scrollBottomDistance = container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollBottom(scrollBottomDistance > 80);
  };

  if (!isAiBubbleOpen) return null;

  return (
    <div
      className={cx('ai-chat__window')}
      style={{
        left: `${aiChatPosition.x}px`,
        top: `${aiChatPosition.y}px`,
        right: 'auto',
        bottom: 'auto'
      }}
    >
      <div className={cx('ai-chat__header')} onMouseDown={handleAiChatMouseDown}>
        <h3>{t('ai_chatbot_title')}</h3>
        <button className={cx('ai-chat__close-btn')} onClick={handleCloseAiChat}>×</button>
      </div>

      <div className={cx('ai-chat__messages-wrapper')}>
        <div
          ref={aiMessagesAreaRef}
          onScroll={handleMessagesScroll}
          className={cx('ai-chat__messages')}
        >
          {aiMessages.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: '0.82rem', textAlign: 'center', marginTop: '20px' }}>
              {t('ask_anything')}
            </div>
          ) : (
            aiMessages.map((msg, index) => {
              const isBot = msg.senderId === 999;
              return (
                <div key={index} className={cx('ai-chat__msg', isBot ? 'ai-chat__msg--bot' : 'ai-chat__msg--user')}>
                  {msg.content}
                </div>
              );
            })
          )}
          {isAiLoading && (
            <div className={cx('ai-chat__loading')}>
              <div className={cx('ai-chat__spinner')}></div>
              <span>{t('ai_typing')}</span>
            </div>
          )}
          <div ref={aiMessagesEndRef} />
        </div>

        {showScrollBottom && (
          <button
            type="button"
            className={cx('ai-chat__scroll-bottom-btn')}
            onClick={() => scrollToBottom('smooth')}
            title="Cuộn xuống tin nhắn mới nhất"
            aria-label="Scroll to bottom"
          >
            ↓
          </button>
        )}
      </div>

      <form className={cx('ai-chat__input-area')} onSubmit={handleAiSendMessage}>
        <input
          type="text"
          placeholder={t('input_question')}
          value={aiNewMessage}
          onChange={(e) => setAiNewMessage(e.target.value)}
          disabled={isAiLoading}
        />
        <button type="submit" className={cx('ai-chat__send-btn')} disabled={!aiNewMessage.trim() || isAiLoading}>
          ➡️
        </button>
      </form>
    </div>
  );
}
