import React from 'react';

export default function MetricCard({ title, value, change, icon: Icon, subtitle, color = '#6366f1' }) {
  const isPositive = change > 0;
  const isNeutral = change === 0 || change === undefined || change === null;

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.title}>{title}</span>
        {Icon && (
          <div style={{ ...styles.iconWrap, backgroundColor: `${color}15` }}>
            <Icon size={18} color={color} />
          </div>
        )}
      </div>
      <div style={styles.value}>{value}</div>
      <div style={styles.footer}>
        {!isNeutral && (
          <span style={{
            ...styles.change,
            color: isPositive ? '#10b981' : '#ef4444',
          }}>
            {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
          </span>
        )}
        {subtitle && <span style={styles.subtitle}>{subtitle}</span>}
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: '#ffffff',
    borderRadius: 12,
    padding: '20px 24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
    border: '1px solid #f1f5f9',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    minWidth: 0,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 13,
    fontWeight: 500,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 28,
    fontWeight: 700,
    color: '#0f172a',
    letterSpacing: '-0.02em',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  change: {
    fontSize: 13,
    fontWeight: 600,
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
  },
};
