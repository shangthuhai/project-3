import React from 'react';
import { useChat } from '../../context/ChatContext';
import { useLanguage } from '../../context/LanguageContext';
import styles from './TemplatesTab.module.css';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

export default function TemplatesTab() {
  const { t } = useLanguage();
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
        <h1>{t('sms_templates')}</h1>
        <p>{t('templates_desc')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '25px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '20px', height: 'fit-content' }}>
          <h3 style={{ marginBottom: '15px', color: 'var(--color-primary)' }}>{t('create_template')}</h3>
          <form onSubmit={handleCreateTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="form-group">
              <label>{t('template_title')}</label>
              <input
                type="text"
                placeholder="e.g. Lời chúc Sinh nhật"
                value={templateForm.title}
                onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>{t('template_body')}</label>
              <textarea
                placeholder="Sử dụng {Name} để tự điền tên người nhận."
                value={templateForm.body}
                onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value.substring(0, 120) })}
                rows={4}
                required
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Length: {templateForm.body.length}/120
              </span>
            </div>
            <button type="submit" className="btn btn-primary">{t('save_template')}</button>
          </form>
        </div>

        <div className={cx('templates-tab__grid')}>
          {templates.length === 0 ? (
            <div className="empty-list-message" style={{ gridColumn: '1/-1' }}>
              {t('no_templates')}
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
                      title={t('confirm_delete_template')}
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
