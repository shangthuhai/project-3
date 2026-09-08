import * as XLSX from 'xlsx';

/**
 * Utility functions for exporting Admin Reports to native Excel (.xlsx), CSV, and PDF formats.
 */

/**
 * Exports data array directly to a native Excel (.xlsx) file using SheetJS.
 * This guarantees proper columns (A, B, C...), auto column widths, and clean formatting
 * without all columns jammed into column A or quote marks around strings.
 * 
 * @param {string} filename - Output filename (e.g. 'Bao_Cao_Nguoi_Dung.xlsx')
 * @param {Array<{header: string, accessor: string|Function}>} columns - Column definitions
 * @param {Array<Object>} data - Data array
 */
export const exportToExcel = (filename, columns, data) => {
  if (!data || !data.length) {
    alert('Không có dữ liệu để xuất báo cáo!');
    return;
  }

  // 1. Format raw data into clean key-value object rows with header titles
  const formattedData = data.map(item => {
    const row = {};
    columns.forEach(col => {
      let val;
      if (typeof col.accessor === 'function') {
        val = col.accessor(item);
      } else {
        val = item[col.accessor];
      }
      row[col.header] = val !== undefined && val !== null ? val : '';
    });
    return row;
  });

  // 2. Convert to SheetJS Worksheet
  const worksheet = XLSX.utils.json_to_sheet(formattedData);

  // 3. Auto-calculate column widths
  const colWidths = columns.map(col => {
    let maxLen = String(col.header).length;
    formattedData.forEach(row => {
      const valStr = String(row[col.header] || '');
      if (valStr.length > maxLen) {
        maxLen = valStr.length;
      }
    });
    return { wch: Math.min(Math.max(maxLen + 4, 12), 50) };
  });
  worksheet['!cols'] = colWidths;

  // 4. Create Workbook and write .xlsx file
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Báo Cáo');

  const baseName = filename.replace(/\.(xlsx|csv)$/i, '');
  XLSX.writeFile(workbook, `${baseName}.xlsx`);
};

/**
 * Alias exportToCSV to exportToExcel so existing callers get real, beautiful .xlsx files natively.
 */
export const exportToCSV = exportToExcel;

/**
 * Opens a print-friendly document window formatted for PDF printing/saving.
 * 
 * @param {string} reportTitle - Report Title
 * @param {Array<{header: string, accessor: string|Function}>} columns - Column definitions
 * @param {Array<Object>} data - Data array
 * @param {string} filterSummary - Brief description of active filters
 */
export const exportToPDF = (reportTitle, columns, data, filterSummary = '') => {
  if (!data || !data.length) {
    alert('Không có dữ liệu để xuất báo cáo!');
    return;
  }

  const printWindow = window.open('', '_blank', 'width=1000,height=800');
  if (!printWindow) {
    alert('Vui lòng cho phép popup trình duyệt để tải file PDF!');
    return;
  }

  const now = new Date().toLocaleString('vi-VN');

  const headersHtml = columns.map(col => `<th style="padding: 10px 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 600; text-align: left; font-size: 13px;">${col.header}</th>`).join('');

  const rowsHtml = data.map((item, idx) => {
    const cells = columns.map(col => {
      let val;
      if (typeof col.accessor === 'function') {
        val = col.accessor(item);
      } else {
        val = item[col.accessor];
      }
      return `<td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 12px;">${val !== undefined && val !== null ? val : ''}</td>`;
    }).join('');

    const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    return `<tr style="background: ${bg};">${cells}</tr>`;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>${reportTitle}</title>
      <style>
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .no-print { display: none; }
        }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; padding: 24px; margin: 0; }
        .header { margin-bottom: 20px; border-bottom: 2px solid #3b82f6; padding-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end; }
        .title { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0; }
        .meta { font-size: 12px; color: #64748b; margin: 0; }
        .summary { font-size: 12px; color: #475569; background: #f1f5f9; padding: 8px 12px; border-radius: 6px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .footer { margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        .btn-print { background: #3b82f6; color: white; border: none; padding: 8px 16px; font-size: 13px; border-radius: 6px; cursor: pointer; font-weight: 500; margin-bottom: 16px; }
      </style>
    </head>
    <body>
      <button class="no-print btn-print" onclick="window.print()">🖨️ In / Lưu file PDF (Save as PDF)</button>
      <div class="header">
        <div>
          <h1 class="title">${reportTitle}</h1>
          <p class="meta">Hệ thống Quản trị MyAppChat • Xuất ngày: ${now}</p>
        </div>
      </div>
      ${filterSummary ? `<div class="summary"><strong>Điều kiện lọc:</strong> ${filterSummary}</div>` : ''}
      <table>
        <thead>
          <tr>${headersHtml}</tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      <div class="footer">
        Báo cáo được khởi tạo tự động từ Admin Dashboard • Tổng số bản ghi: ${data.length}
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
