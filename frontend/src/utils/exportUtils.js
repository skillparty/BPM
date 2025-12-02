/**
 * Utilidades de Exportación - Excel y PDF
 */

// Exportar a Excel (CSV compatible con Excel)
export const exportToExcel = (data, columns, filename = 'export') => {
  if (!data || data.length === 0) {
    console.warn('No hay datos para exportar');
    return;
  }

  // Filtrar solo columnas visibles
  const visibleColumns = columns.filter(col => col.visible !== false);
  
  // Crear cabeceras
  const headers = visibleColumns.map(col => col.label);
  
  // Crear filas de datos
  const rows = data.map(row => {
    return visibleColumns.map(col => {
      let value = row[col.key];
      
      // Formatear valores especiales
      if (col.format) {
        value = col.format(value, row);
      } else if (typeof value === 'number') {
        value = value.toString();
      } else if (value === null || value === undefined) {
        value = '';
      }
      
      // Escapar comillas y comas para CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    });
  });

  // Crear contenido CSV con BOM para caracteres especiales
  const BOM = '\uFEFF';
  const csvContent = BOM + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  
  // Crear blob y descargar
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${formatDate(new Date())}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Exportar a PDF (genera HTML que se puede imprimir como PDF)
export const exportToPDF = (data, columns, filename = 'export', title = 'Reporte') => {
  if (!data || data.length === 0) {
    console.warn('No hay datos para exportar');
    return;
  }

  // Filtrar solo columnas visibles
  const visibleColumns = columns.filter(col => col.visible !== false);
  
  // Crear contenido HTML
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 20px;
          color: #1e293b;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e2e8f0;
        }
        .header h1 {
          font-size: 24px;
          color: #1e40af;
        }
        .header .meta {
          text-align: right;
          font-size: 12px;
          color: #64748b;
        }
        .summary {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
        }
        .summary-item {
          background: #f8fafc;
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        .summary-item .label {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .summary-item .value {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        th {
          background: #f1f5f9;
          padding: 10px 8px;
          text-align: left;
          font-weight: 600;
          color: #475569;
          border-bottom: 2px solid #e2e8f0;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.5px;
        }
        td {
          padding: 10px 8px;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
        }
        tr:hover { background: #f8fafc; }
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 500;
        }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-warning { background: #fef3c7; color: #92400e; }
        .badge-danger { background: #fee2e2; color: #991b1b; }
        .badge-info { background: #dbeafe; color: #1e40af; }
        .text-right { text-align: right; }
        .font-mono { font-family: 'SF Mono', Monaco, monospace; }
        .footer {
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #e2e8f0;
          font-size: 11px;
          color: #94a3b8;
          text-align: center;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <div class="meta">
          <div>Generado: ${new Date().toLocaleString('es-BO')}</div>
          <div>Total registros: ${data.length}</div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            ${visibleColumns.map(col => `<th>${col.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${visibleColumns.map(col => {
                let value = row[col.key];
                let className = '';
                
                if (col.format) {
                  value = col.format(value, row);
                } else if (typeof value === 'number') {
                  className = 'text-right font-mono';
                  value = col.key.includes('total') || col.key.includes('amount') 
                    ? `Bs. ${parseFloat(value).toFixed(2)}` 
                    : value;
                }
                
                // Badges para estados
                if (col.key === 'payment_status') {
                  const badgeClass = {
                    'pagado': 'badge-success',
                    'parcial': 'badge-warning',
                    'pendiente': 'badge-danger'
                  }[value] || 'badge-info';
                  value = `<span class="badge ${badgeClass}">${value}</span>`;
                }
                
                if (col.key === 'status') {
                  const badgeClass = {
                    'activo': 'badge-info',
                    'completado': 'badge-success',
                    'cancelado': 'badge-danger'
                  }[value] || 'badge-info';
                  value = `<span class="badge ${badgeClass}">${value}</span>`;
                }
                
                return `<td class="${className}">${value || '-'}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        Sistema BPM - Reporte generado automáticamente
      </div>
      
      <script>
        // Auto-abrir diálogo de impresión
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  // Abrir en nueva ventana para imprimir/guardar como PDF
  const printWindow = window.open('', '_blank');
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

// Utilidad para formatear fecha
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Calcular totales para resumen
export const calculateSummary = (data, columns) => {
  const summary = {};
  
  columns.forEach(col => {
    if (col.aggregate === 'sum') {
      summary[col.key] = data.reduce((acc, row) => acc + (parseFloat(row[col.key]) || 0), 0);
    } else if (col.aggregate === 'count') {
      summary[col.key] = data.length;
    } else if (col.aggregate === 'avg') {
      const sum = data.reduce((acc, row) => acc + (parseFloat(row[col.key]) || 0), 0);
      summary[col.key] = data.length > 0 ? sum / data.length : 0;
    }
  });
  
  return summary;
};
