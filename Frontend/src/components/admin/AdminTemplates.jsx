import React, { useState, useMemo } from 'react';

export default function AdminTemplates({
  adminTemplates,
  adminTemplateForm,
  setAdminTemplateForm,
  handleCreateSystemTemplate,
  handleDeleteSystemTemplate
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const systemTemplates = useMemo(() => {
    let result = adminTemplates.filter(t => t.userId === null);

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(t =>
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.body && t.body.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'oldest') return a.id - b.id;
      if (sortBy === 'titleAsc') return a.title.localeCompare(b.title);
      if (sortBy === 'titleDesc') return b.title.localeCompare(a.title);
      return b.id - a.id;
    });

    return result;
  }, [adminTemplates, searchQuery, sortBy]);

  const totalSystemTemplatesCount = adminTemplates.filter(t => t.userId === null).length;
  const hasActiveFilters = searchQuery !== '' || sortBy !== 'newest';

  const resetFilters = () => {
    setSearchQuery('');
    setSortBy('newest');
  };

  return (
    <div className="admin-tab-content">
      <div className="admin-header" style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '6px' }}>System-Wide SMS Templates</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>Define default, structured templates for all platform users to quickly choose from when drafting SMS messages.</p>
      </div>

      {/* Add template form */}
      <div className="admin-template-create-card" style={{ background: 'var(--bg-sidebar)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '16px' }}>Create New System Template</h3>
        <form onSubmit={handleCreateSystemTemplate} className="admin-template-form" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Template Title</label>
            <input
              type="text"
              placeholder="e.g. Happy New Year Greeting"
              value={adminTemplateForm.title}
              onChange={(e) => setAdminTemplateForm({ ...adminTemplateForm, title: e.target.value })}
              style={{ background: 'var(--bg-app)', border: '1px solid var(--border-light)', padding: '10px 12px', borderRadius: '8px', color: 'var(--text-main)' }}
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
              style={{ background: 'var(--bg-app)', border: '1px solid var(--border-light)', padding: '10px 12px', borderRadius: '8px', color: 'var(--text-main)', resize: 'vertical' }}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '10px 24px', fontSize: '0.88rem' }}>
            Create Template
          </button>
        </form>
      </div>

      {/* Search & Filter Bar for Templates */}
      <div className="admin-filter-bar" style={{
        background: 'var(--bg-sidebar)',
        padding: '16px 20px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-light)',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', flex: '1', minWidth: '300px' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
            <input
              type="text"
              placeholder="🔍 Search template title or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                paddingRight: searchQuery ? '32px' : '12px',
                background: 'var(--bg-app)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                fontSize: '0.88rem',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Select */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '9px 12px',
              background: '#182533',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            <option value="newest">📅 ID (Newest First)</option>
            <option value="oldest">📅 ID (Oldest First)</option>
            <option value="titleAsc">🔤 Title (A-Z)</option>
            <option value="titleDesc">🔤 Title (Z-A)</option>
          </select>
        </div>

        {/* Filter Stats & Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{systemTemplates.length}</strong> / <strong>{totalSystemTemplatesCount}</strong> templates
          </span>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              style={{
                padding: '6px 12px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid var(--color-danger)',
                color: 'var(--color-danger)',
                borderRadius: '6px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              🔄 Reset Filters
            </button>
          )}
        </div>
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
            {systemTemplates.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No system templates found matching your search criteria.
                </td>
              </tr>
            ) : (
              systemTemplates.map(t => {
                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border-light)' }} className="table-row-hover">
                    <td style={{ padding: '12px 20px', color: 'var(--text-muted)' }}>#{t.id}</td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-main)' }}><strong>{t.title}</strong></td>
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
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
