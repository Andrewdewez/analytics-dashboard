import React from 'react';

export default function ChartCard({ title, subtitle, children }) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>{title}</h3>
        {subtitle && <span style={styles.subtitle}>{subtitle}</span>}
      </div>
      <div style={styles.body}>
        {children}
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
  header: {
    padding: '16px 24px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
  },
  body: {
    padding: '16px 24px 24px',
  },
};
