import React from 'react';

export function LoadingState({ message = 'Loading data...' }) {
  return (
    <div style={styles.container}>
      <div style={styles.spinner} />
      <p style={styles.text}>{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div style={styles.container}>
      <div style={styles.errorIcon}>!</div>
      <p style={styles.errorText}>{message}</p>
      {onRetry && (
        <button onClick={onRetry} style={styles.retryBtn}>
          Try Again
        </button>
      )}
    </div>
  );
}

export function EmptyConfig({ service, fields }) {
  return (
    <div style={styles.configContainer}>
      <h3 style={styles.configTitle}>Connect {service}</h3>
      <p style={styles.configText}>
        Add the following environment variables to your Netlify dashboard to enable this integration:
      </p>
      <div style={styles.fieldList}>
        {fields.map((field, i) => (
          <code key={i} style={styles.field}>{field}</code>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    gap: 16,
  },
  spinner: {
    width: 40,
    height: 40,
    border: '3px solid #e2e8f0',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  text: {
    fontSize: 14,
    color: '#64748b',
  },
  errorIcon: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: '#fef2f2',
    color: '#ef4444',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    fontWeight: 700,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
    maxWidth: 400,
  },
  retryBtn: {
    padding: '8px 20px',
    background: '#6366f1',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  configContainer: {
    background: '#f8fafc',
    borderRadius: 12,
    border: '2px dashed #e2e8f0',
    padding: 40,
    textAlign: 'center',
  },
  configTitle: {
    margin: '0 0 8px',
    fontSize: 20,
    fontWeight: 600,
    color: '#0f172a',
  },
  configText: {
    margin: '0 0 20px',
    fontSize: 14,
    color: '#64748b',
  },
  fieldList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    alignItems: 'center',
  },
  field: {
    padding: '8px 16px',
    background: '#1e293b',
    color: '#a5f3fc',
    borderRadius: 6,
    fontSize: 13,
    fontFamily: 'monospace',
  },
};
