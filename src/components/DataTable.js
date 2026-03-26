import React from 'react';

export default function DataTable({ columns, data, title }) {
  return (
    <div style={styles.container}>
      {title && <h3 style={styles.title}>{title}</h3>}
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} style={{ ...styles.th, textAlign: col.align || 'left' }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                {columns.map((col, j) => (
                  <td key={j} style={{ ...styles.td, textAlign: col.align || 'left' }}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length} style={{ ...styles.td, textAlign: 'center', color: '#94a3b8' }}>
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: '#ffffff',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
    border: '1px solid #f1f5f9',
    overflow: 'hidden',
  },
  title: {
    margin: 0,
    padding: '16px 24px',
    fontSize: 16,
    fontWeight: 600,
    color: '#0f172a',
    borderBottom: '1px solid #f1f5f9',
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px 24px',
    fontSize: 12,
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #f1f5f9',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '12px 24px',
    fontSize: 14,
    color: '#334155',
    borderBottom: '1px solid #f8fafc',
    whiteSpace: 'nowrap',
  },
  rowEven: { background: '#ffffff' },
  rowOdd: { background: '#f8fafc' },
};
