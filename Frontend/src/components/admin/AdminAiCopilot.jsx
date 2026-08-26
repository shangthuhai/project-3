import React, { useState, useRef, useEffect } from 'react';
import { chatWithAdminAi } from '../../api';

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
          className="admin-ai-fab animate-glow"
          onMouseDown={handleAdminAiBubbleMouseDown}
          style={{
            position: 'fixed',
            left: `${adminAiPosition.x}px`,
            top: `${adminAiPosition.y}px`,
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary), #8b5cf6)',
            border: 'none',
            cursor: 'grab',
            boxShadow: '0 0 15px rgba(36, 129, 204, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            fontSize: '1.8rem',
            outline: 'none',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            userSelect: 'none'
          }}
          title="Open Admin AI Copilot"
        >
          🤖
        </button>
      )}

      {/* Admin AI Copilot Drawer */}
      <div
        className={`admin-ai-drawer ${isAdminChatOpen ? 'open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          right: isAdminChatOpen ? 0 : `-${adminChatWidth + 20}px`,
          width: `${adminChatWidth}px`,
          height: '100vh',
          background: 'rgba(21, 31, 43, 0.8)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.05s ease-out',
          overflow: 'hidden'
        }}
      >
        {/* Resize Handle */}
        <div
          onMouseDown={startResizeAdminChat}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '6px',
            height: '100%',
            cursor: 'col-resize',
            zIndex: 100000,
            background: 'transparent',
            transition: 'background 0.2s'
          }}
          className="drawer-resize-handle"
        />
        {/* Drawer Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>🤖</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.05rem', fontWeight: '600' }}>Admin Copilot</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Online & Connected</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsAdminChatOpen(false)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer', outline: 'none' }}
            className="drawer-close-btn"
          >
            ✕
          </button>
        </div>

        {/* Chat Messages */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }} className="admin-chat-scroll">
          {adminChatMessages.map((msg, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                  background: msg.role === 'user' ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.05)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  lineHeight: '1.4',
                  whiteSpace: 'pre-wrap',
                  border: msg.role === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                {msg.content}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.role === 'user' ? 'Bạn' : 'Copilot'}
              </span>
            </div>
          ))}
          {isAdminChatLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start', background: 'rgba(255, 255, 255, 0.03)', padding: '10px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="spinner-mini" style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Copilot đang phân tích dữ liệu...</span>
            </div>
          )}
          <div ref={adminChatEndRef} />
        </div>

        {/* Suggested Quick Prompt Chips */}
        <div style={{ padding: '0 20px 15px 20px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            onClick={(e) => handleAdminChatSend(e, 'Hãy báo cáo tỷ lệ gửi tin nhắn SMS thành công hiện tại.')}
            style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '6px 12px', fontSize: '0.78rem', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s', outline: 'none' }}
            className="suggestion-chip"
          >
            📊 Tỷ lệ SMS
          </button>
          <button
            onClick={(e) => handleAdminChatSend(e, 'Hãy thống kê nhanh các thông số tổng quan hệ thống.')}
            style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '6px 12px', fontSize: '0.78rem', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s', outline: 'none' }}
            className="suggestion-chip"
          >
            📉 Thống kê tổng quan
          </button>
          <button
            onClick={(e) => handleAdminChatSend(e, 'Soạn giúp tôi một mẫu tin nhắn SMS thông báo bảo trì hệ thống dài dưới 120 ký tự.')}
            style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '6px 12px', fontSize: '0.78rem', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s', outline: 'none' }}
            className="suggestion-chip"
          >
            🔧 Soạn SMS bảo trì
          </button>
        </div>

        {/* Drawer Input */}
        <form
          onSubmit={(e) => handleAdminChatSend(e)}
          style={{ padding: '15px 20px 20px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', gap: '10px', alignItems: 'center' }}
        >
          <input
            type="text"
            placeholder="Hỏi về doanh thu, stats hoặc nhờ soạn SMS..."
            value={adminChatInput}
            onChange={(e) => setAdminChatInput(e.target.value)}
            disabled={isAdminChatLoading}
            style={{ flex: 1, padding: '12px 16px', background: '#121c27', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
          />
          <button
            type="submit"
            disabled={isAdminChatLoading || !adminChatInput.trim()}
            style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--color-primary)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}
          >
            ➔
          </button>
        </form>
      </div>
    </>
  );
}
