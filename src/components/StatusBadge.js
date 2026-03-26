import React from 'react';

const statusColors = {
  succeeded: { bg: '#dcfce7', text: '#166534' },
  paid: { bg: '#dcfce7', text: '#166534' },
  active: { bg: '#dcfce7', text: '#166534' },
  FULFILLED: { bg: '#dcfce7', text: '#166534' },
  PAID: { bg: '#dcfce7', text: '#166534' },
  pending: { bg: '#fef9c3', text: '#854d0e' },
  UNFULFILLED: { bg: '#fef9c3', text: '#854d0e' },
  PARTIALLY_FULFILLED: { bg: '#fef9c3', text: '#854d0e' },
  PENDING: { bg: '#fef9c3', text: '#854d0e' },
  failed: { bg: '#fef2f2', text: '#991b1b' },
  canceled: { bg: '#fef2f2', text: '#991b1b' },
  REFUNDED: { bg: '#fef2f2', text: '#991b1b' },
  VOIDED: { bg: '#fef2f2', text: '#991b1b' },
};

export default function StatusBadge({ status }) {
  const colors = statusColors[status] || { bg: '#f1f5f9', text: '#64748b' };

  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
      backgroundColor: colors.bg,
      color: colors.text,
      textTransform: 'capitalize',
    }}>
      {status?.toLowerCase().replace(/_/g, ' ') || 'unknown'}
    </span>
  );
}
