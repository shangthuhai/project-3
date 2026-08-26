import React, { useState, useRef, useEffect } from 'react';
import { chatWithAdminAi } from '../../api';
import styles from './AdminAiCopilot.module.css';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

export default function AdminAiCopilot({ triggerAlert }) {
  const [isAdminChatOpen, setIsAdminChatOpen] = useState(false);
  const [adminChatWidth, setAdminChatWidth] = useState(420);
  const [adminChatMessages, setAdminChatMessages] = useState([
    { role: 'assistant', content: 'Xin chào! Tôi là Admin Copilot. Tôi có quyền truy cập vào thông số hệ thống thời gian thực của bạn. Bạn muốn tôi hỗ trợ phân tích dữ liệu hay soạn thảo mẫu tin nhắn SMS?' }
  ]);
  const [adminChatInput, setAdminChatInput] = useState('');
  const [isAdminChatLoading, setIsAdminChatLoading] = useState(false);
  const adminChatEndRef = useRef(null);

  const [adminAiPosition, setAdminAiPosition] = useState({
    x: window.innerWidth - 90,
    y: window.innerHeight - 90
  });

  const adminAiDragRef = useRef({ isDragging: false, startX: 0, startY: 0, posX: 0, posY: 0 });

  const startResizeAdminChat = (mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    const startWidth = adminChatWidth;
    const startX = mouseDownEvent.clientX;

    const doResize = (mouseMoveEvent) => {
      const newWidth = startWidth + (startX - mouseMoveEvent.clientX);
      if (newWidth >= 320 && newWidth <= window.innerWidth * 0.8) {
        setAdminChatWidth(newWidth);
      }
    };

    const stopResize = () => {
      window.removeEventListener('mousemove', doResize);
      window.removeEventListener('mouseup', stopResize);
    };

    window.addEventListener('mousemove', doResize);
    window.addEventListener('mouseup', stopResize);
  };

  useEffect(() => {
    adminChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [adminChatMessages, isAdminChatOpen]);

  const handleAdminChatSend = (e, customPrompt = '') => {
    if (e) e.preventDefault();

    const promptToSend = customPrompt || adminChatInput.trim();
    if (!promptToSend || isAdminChatLoading) return;

    setAdminChatInput('');
    setAdminChatMessages(prev => [...prev, { role: 'user', content: promptToSend }]);
    setIsAdminChatLoading(true);

    const formattedHistory = adminChatMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    chatWithAdminAi(promptToSend, formattedHistory)
      .then(res => {
        setAdminChatMessages(prev => [...prev, { role: 'assistant', content: res.content }]);
        setIsAdminChatLoading(false);
      })
      .catch(err => {
        const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra khi kết nối tới Admin Copilot.';
        triggerAlert('error', errorMsg);
        setIsAdminChatLoading(false);
      });
  };

  const handleAdminAiBubbleMouseDown = (e) => {
    if (e.button !== 0) return;
    adminAiDragRef.current.isDragging = false;
    adminAiDragRef.current.startX = e.clientX;
    adminAiDragRef.current.startY = e.clientY;
    adminAiDragRef.current.posX = adminAiPosition.x;
    adminAiDragRef.current.posY = adminAiPosition.y;

    document.addEventListener('mousemove', handleAdminAiBubbleMouseMove);
    document.addEventListener('mouseup', handleAdminAiBubbleMouseUp);
  };

  const handleAdminAiBubbleMouseMove = (e) => {
    const dx = e.clientX - adminAiDragRef.current.startX;
    const dy = e.clientY - adminAiDragRef.current.startY;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      adminAiDragRef.current.isDragging = true;
    }

    let newX = adminAiDragRef.current.posX + dx;
    let newY = adminAiDragRef.current.posY + dy;

    newX = Math.max(10, Math.min(window.innerWidth - 70, newX));
    newY = Math.max(10, Math.min(window.innerHeight - 70, newY));

    setAdminAiPosition({ x: newX, y: newY });
  };

  const handleAdminAiBubbleMouseUp = (e) => {
    document.removeEventListener('mousemove', handleAdminAiBubbleMouseMove);
    document.removeEventListener('mouseup', handleAdminAiBubbleMouseUp);

    if (!adminAiDragRef.current.isDragging) {
      setIsAdminChatOpen(prev => !prev);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setAdminAiPosition(prev => ({
        x: Math.max(10, Math.min(window.innerWidth - 70, prev.x)),
        y: Math.max(10, Math.min(window.innerHeight - 70, prev.y))
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Admin AI Copilot Button (FAB) */}
      {!isAdminChatOpen && (
        <button
          className={cx('admin-copilot__fab')}
          onMouseDown={handleAdminAiBubbleMouseDown}
          style={{
            left: `${adminAiPosition.x}px`,
            top: `${adminAiPosition.y}px`
          }}
          title="Open Admin AI Copilot"
        >
          🤖
        </button>
      )}

      {/* Admin AI Copilot Drawer */}
      <div
        className={cx('admin-copilot__drawer')}
        style={{
          right: isAdminChatOpen ? 0 : `-${adminChatWidth + 20}px`,
          width: `${adminChatWidth}px`
        }}
      >
        {/* Resize Handle */}
        <div
          onMouseDown={startResizeAdminChat}
          className={cx('admin-copilot__resize-handle')}
        />
        {/* Drawer Header */}
        <div className={cx('admin-copilot__header')}>
          <div className={cx('admin-copilot__header-profile')}>
            <span style={{ fontSize: '1.5rem' }}>🤖</span>
            <div className={cx('admin-copilot__header-info')}>
              <h3 className={cx('admin-copilot__header-title')}>Admin Copilot</h3>
              <div className={cx('admin-copilot__status-container')}>
                <span className={cx('admin-copilot__status-dot')}></span>
                <span className={cx('admin-copilot__status-text')}>Online & Connected</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsAdminChatOpen(false)}
            className={cx('admin-copilot__close-btn')}
          >
            ✕
          </button>
        </div>

        {/* Chat Messages */}
        <div className={cx('admin-copilot__messages')}>
          {adminChatMessages.map((msg, index) => (
            <div
              key={index}
              className={cx('admin-copilot__message-wrapper', {
                'admin-copilot__message-wrapper--user': msg.role === 'user',
                'admin-copilot__message-wrapper--assistant': msg.role !== 'user'
              })}
            >
              <div
                className={cx('admin-copilot__message-bubble', {
                  'admin-copilot__message-bubble--user': msg.role === 'user',
                  'admin-copilot__message-bubble--assistant': msg.role !== 'user'
                })}
              >
                {msg.content}
              </div>
              <span
                className={cx('admin-copilot__message-meta', {
                  'admin-copilot__message-meta--user': msg.role === 'user',
                  'admin-copilot__message-meta--assistant': msg.role !== 'user'
                })}
              >
                {msg.role === 'user' ? 'Bạn' : 'Copilot'}
              </span>
            </div>
          ))}
          {isAdminChatLoading && (
            <div className={cx('admin-copilot__loading-indicator')}>
              <div className={cx('admin-copilot__spinner')}></div>
              <span className={cx('admin-copilot__status-text')}>Copilot đang phân tích dữ liệu...</span>
            </div>
          )}
          <div ref={adminChatEndRef} />
        </div>

        {/* Suggested Quick Prompt Chips */}
        <div className={cx('admin-copilot__suggestions')}>
          <button
            onClick={(e) => handleAdminChatSend(e, 'Hãy báo cáo tỷ lệ gửi tin nhắn SMS thành công hiện tại.')}
            className={cx('admin-copilot__suggestion-chip')}
          >
            📊 Tỷ lệ SMS
          </button>
          <button
            onClick={(e) => handleAdminChatSend(e, 'Hãy thống kê nhanh các thông số tổng quan hệ thống.')}
            className={cx('admin-copilot__suggestion-chip')}
          >
            📉 Thống kê tổng quan
          </button>
          <button
            onClick={(e) => handleAdminChatSend(e, 'Soạn giúp tôi một mẫu tin nhắn SMS thông báo bảo trì hệ thống dài dưới 120 ký tự.')}
            className={cx('admin-copilot__suggestion-chip')}
          >
            🔧 Soạn SMS bảo trì
          </button>
        </div>

        {/* Drawer Input */}
        <form
          onSubmit={(e) => handleAdminChatSend(e)}
          className={cx('admin-copilot__input-form')}
        >
          <input
            type="text"
            placeholder="Hỏi về doanh thu, stats hoặc nhờ soạn SMS..."
            value={adminChatInput}
            onChange={(e) => setAdminChatInput(e.target.value)}
            disabled={isAdminChatLoading}
            className={cx('admin-copilot__input')}
          />
          <button
            type="submit"
            disabled={isAdminChatLoading || !adminChatInput.trim()}
            className={cx('admin-copilot__send-btn')}
          >
            ➔
          </button>
        </form>
      </div>
    </>
  );
}
