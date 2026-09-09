import React from 'react';

export default function Pagination({ page = 1, totalPages = 1, totalCount = 0, pageSize = 10, onPageChange }) {
  if (totalCount <= 0) return null;

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);
  const actualTotalPages = Math.max(1, totalPages);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (actualTotalPages <= maxVisible + 2) {
      for (let i = 1; i <= actualTotalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      
      const start = Math.max(2, page - 1);
      const end = Math.min(actualTotalPages - 1, page + 1);
      
      for (let i = start; i <= end; i++) pages.push(i);
      
      if (page < actualTotalPages - 2) pages.push('...');
      pages.push(actualTotalPages);
    }
    return pages;
  };

  return (
    <div className="admin-pagination-container" style={{
      display: 'flex',
      flexWrap: 'wrap',
      justify: 'space-between',
      alignItems: 'center',
      padding: '14px 20px',
      marginTop: '20px',
      background: 'var(--bg-sidebar)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-light)',
      gap: '12px'
    }}>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of <strong>{totalCount}</strong> entries
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          style={{
            padding: '6px 12px',
            background: page <= 1 ? 'rgba(255, 255, 255, 0.03)' : 'var(--bg-app)',
            border: '1px solid var(--border-light)',
            borderRadius: '6px',
            color: page <= 1 ? 'rgba(255, 255, 255, 0.25)' : 'var(--text-main)',
            fontSize: '0.82rem',
            fontWeight: '600',
            cursor: page <= 1 ? 'not-allowed' : 'pointer',
            transition: 'var(--transition-fast)'
          }}
        >
          ‹ Prev
        </button>

        {getPageNumbers().map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`ellipsis-${idx}`} style={{ padding: '0 6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                ...
              </span>
            );
          }
          const isActive = p === page;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              disabled={actualTotalPages <= 1}
              style={{
                minWidth: '32px',
                height: '32px',
                padding: '0 8px',
                background: isActive ? 'var(--color-primary)' : 'var(--bg-app)',
                border: isActive ? '1px solid var(--color-primary)' : '1px solid var(--border-light)',
                borderRadius: '6px',
                color: isActive ? '#ffffff' : 'var(--text-main)',
                fontSize: '0.82rem',
                fontWeight: isActive ? '700' : '500',
                cursor: actualTotalPages <= 1 ? 'default' : 'pointer',
                transition: 'var(--transition-fast)'
              }}
            >
              {p}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= actualTotalPages}
          style={{
            padding: '6px 12px',
            background: page >= actualTotalPages ? 'rgba(255, 255, 255, 0.03)' : 'var(--bg-app)',
            border: '1px solid var(--border-light)',
            borderRadius: '6px',
            color: page >= actualTotalPages ? 'rgba(255, 255, 255, 0.25)' : 'var(--text-main)',
            fontSize: '0.82rem',
            fontWeight: '600',
            cursor: page >= actualTotalPages ? 'not-allowed' : 'pointer',
            transition: 'var(--transition-fast)'
          }}
        >
          Next ›
        </button>
      </div>
    </div>
  );
}
