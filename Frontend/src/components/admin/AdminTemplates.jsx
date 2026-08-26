import React from 'react';

export default function AdminTemplates({
  adminTemplates,
  adminTemplateForm,
  setAdminTemplateForm,
  handleCreateSystemTemplate,
  handleDeleteSystemTemplate
}) {
  const systemTemplates = adminTemplates.filter(t => t.userId === null);

  return (
    <div className="admin-tab-content">
      <div className="admin-header" style={{ marginBottom: '25px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '600', color: '#fff', marginBottom: '6px' }}>System-Wide SMS Templates</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>Define default, structured templates for all platform users to quickly choose from when drafting SMS messages.</p>
      </div>

      {/* Add template form */}
      <div className="admin-template-create-card" style={{ background: 'var(--bg-sidebar)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', marginBottom: '30px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#fff', marginBottom: '16px' }}>Create New System Template</h3>
        <form onSubmit={handleCreateSystemTemplate} className="admin-template-form" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Template Title</label>
            <input
              type="text"
              placeholder="e.g. Happy New Year Greeting"
              value={adminTemplateForm.title}
              onChange={(e) => setAdminTemplateForm({ ...adminTemplateForm, title: e.target.value })}
              style={{ background: '#182533', border: '1px solid var(--border-light)', padding: '10px 12px', borderRadius: '8px', color: '#fff' }}
              required
            />
          </div>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Template Body (supports {`{Name}`} auto-replacements)</label>
            <textarea
              rows="3"
              placeholder="e.g. Wishing you a wonderful birthday, {Name}! Hope your day is filled with joy."
              value={adminTemplateForm.body}
              onChange={(e) => setAdminTemplateForm({ ...adminTemplateForm, body: e.target.value })}
              style={{ background: '#182533', border: '1px solid var(--border-light)', padding: '10px 12px', borderRadius: '8px', color: '#fff', resize: 'vertical' }}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '10px 24px', fontSize: '0.88rem' }}>
            Create Template
          </button>
        </form>
      </div>

      {/* Templates List Table */}
      <div className="admin-table-container" style={{ background: 'var(--bg-sidebar)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflowX: 'auto' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', width: '15%' }}>Template ID</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', width: '25%' }}>Title</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', width: '45%' }}>Template Content (Body)</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', width: '15%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {systemTemplates.map(t => {
              return (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border-light)' }} className="table-row-hover">
                  <td style={{ padding: '12px 20px', color: 'var(--text-muted)' }}>#{t.id}</td>
                  <td style={{ padding: '12px 20px', color: '#fff' }}><strong>{t.title}</strong></td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-main)', fontSize: '0.88rem' }}>{t.body}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteSystemTemplate(t.id)}
                      style={{ padding: '6px 12px', fontSize: '0.78rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }}
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
