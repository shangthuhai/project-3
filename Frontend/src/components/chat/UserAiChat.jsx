import React, { useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { useLanguage } from '../../context/LanguageContext';
import styles from './UserAiChat.module.css';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

export default function UserAiChat() {
  const { t } = useLanguage();
  const {
    aiPosition,
    setAiPosition,
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

  const aiDragRef = useRef({ isDragging: false, startX: 0, startY: 0, posX: 0, posY: 0 });
  const aiChatDragRef = useRef({ isDragging: false, startX: 0, startY: 0, posX: 0, posY: 0 });

  const handleAiBubbleMouseDown = (e) => {
    if (e.button !== 0) return;
    aiDragRef.current.isDragging = false;
    aiDragRef.current.startX = e.clientX;
    aiDragRef.current.startY = e.clientY;
    aiDragRef.current.posX = aiPosition.x;
    aiDragRef.current.posY = aiPosition.y;

    document.addEventListener('mousemove', handleAiBubbleMouseMove);
    document.addEventListener('mouseup', handleAiBubbleMouseUp);
  };

  const handleAiBubbleMouseMove = (e) => {
    const dx = e.clientX - aiDragRef.current.startX;
    const dy = e.clientY - aiDragRef.current.startY;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      aiDragRef.current.isDragging = true;
    }

    let newX = aiDragRef.current.posX + dx;
    let newY = aiDragRef.current.posY + dy;

    newX = Math.max(10, Math.min(window.innerWidth - 70, newX));
    newY = Math.max(10, Math.min(window.innerHeight - 70, newY));

    setAiPosition({ x: newX, y: newY });
  };

  const handleAiBubbleMouseUp = (e) => {
    document.removeEventListener('mousemove', handleAiBubbleMouseMove);
    document.removeEventListener('mouseup', handleAiBubbleMouseUp);

    if (!aiDragRef.current.isDragging) {
      const bubbleSize = 56;
      const chatWidth = 360;
      const chatHeight = 480;

      // Align right edge of chat with right edge of bubble if bubble is on the right half of screen.
      // Otherwise align left edge of chat with left edge of bubble.
      let targetX;
      if (aiPosition.x < window.innerWidth / 2) {
        targetX = aiPosition.x;
      } else {
        targetX = aiPosition.x - chatWidth + bubbleSize;
      }

      // Position chat window above the bubble by default, or below if there isn't enough space above.
      let targetY = aiPosition.y - chatHeight - 10;
      if (targetY < 10) {
        targetY = aiPosition.y + bubbleSize + 10;
      }

      // Constrain to viewport bounds
      targetX = Math.max(10, Math.min(window.innerWidth - chatWidth - 10, targetX));
      targetY = Math.max(10, Math.min(window.innerHeight - chatHeight - 10, targetY));

      setAiChatPosition({ x: targetX, y: targetY });
      setIsAiBubbleOpen(true);
    }
  };

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
      setAiPosition(prev => ({
        x: Math.max(10, Math.min(window.innerWidth - 70, prev.x)),
        y: Math.max(10, Math.min(window.innerHeight - 70, prev.y))
      }));
      setAiChatPosition(prev => ({
        x: Math.max(10, Math.min(window.innerWidth - 370, prev.x)),
        y: Math.max(10, Math.min(window.innerHeight - 490, prev.y))
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* AI Floating Chatbot Widget Bubble */}
      {!isAiBubbleOpen && (
        <div
          className={cx('ai-chat__bubble')}
          style={{ left: `${aiPosition.x}px`, top: `${aiPosition.y}px` }}
          onMouseDown={handleAiBubbleMouseDown}
        >
          🤖
        </div>
      )}

      {isAiBubbleOpen && (
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

          <div className={cx('ai-chat__messages')}>
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
      )}
    </>
  );
}
