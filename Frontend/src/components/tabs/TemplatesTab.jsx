import React from 'react';
import { useChat } from '../../context/ChatContext';
import styles from './TemplatesTab.module.css';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

export default function TemplatesTab() {
  const {
    templates,
    templateForm,
    setTemplateForm,
    handleCreateTemplate,
    handleDeleteTemplate
  } = useChat();

  return (
    <div className="view-panel">
      <div className="view-header">
        <h1>Quản lý Tin nhắn mẫu</h1>
        <p>Tạo và quản lý các câu chúc, mẫu tin nhắn công việc hoặc lời nhắc tự động.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '25px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '20px', height: 'fit-content' }}>
          <h3 style={{ marginBottom: '15px', color: 'var(--color-primary)' }}>Tạo mẫu mới</h3>
          <form onSubmit={handleCreateTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="form-group">
              <label>Tiêu đề mẫu</label>
              <input
                type="text"
                placeholder="e.g. Lời chúc Sinh nhật"
                value={templateForm.title}
                onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Nội dung tin nhắn</label>
              <textarea
                placeholder="Sử dụng {Name} để tự điền tên người nhận."
                value={templateForm.body}
                onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value.substring(0, 120) })}
                rows={4}
                required
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Hạn mức: {templateForm.body.length}/120 ký tự.
              </span>
            </div>
            <button type="submit" className="btn btn-primary">Lưu mẫu tin</button>
          </form>
        </div>

        <div className={cx('templates-tab__grid')}>
          {templates.length === 0 ? (
            <div className="empty-list-message" style={{ gridColumn: '1/-1' }}>
              Chưa có tin nhắn mẫu nào. Hãy tạo một mẫu ở form bên trái!
            </div>
          ) : (
            templates.map(tpl => (
              <div key={tpl.id} className={cx('templates-tab__card')}>
                <div className={cx('templates-tab__card-header')}>
                  <span className={cx('templates-tab__card-title')}>{tpl.title}</span>
                  <span className={cx('templates-tab__badge', tpl.userId ? 'templates-tab__badge--custom' : 'templates-tab__badge--system')}>
                    {tpl.userId ? 'Custom' : 'System'}
                  </span>
                </div>
                <div className={cx('templates-tab__card-body')}>
                  {tpl.body}
                </div>
                <div className={cx('templates-tab__card-actions')}>
                  {tpl.userId && (
                    <button
                      className="btn-icon-danger"
                      onClick={() => handleDeleteTemplate(tpl.id)}
                      title="Xóa mẫu tin"
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
