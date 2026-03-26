import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import { DollarSign, Users, CreditCard, TrendingUp, RefreshCw } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import ChartCard from '../components/ChartCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { LoadingState, ErrorState } from '../components/LoadingState';
import { useDataFetcher } from '../hooks/useDataFetcher';
import { fetchStripeData, formatCurrency } from '../utils/api';

export default function StripePage() {
  const { data, loading, error, refetch } = useDataFetcher(fetchStripeData);

  if (loading) return <LoadingState message="Loading Stripe data..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  const recentColumns = [
    { header: 'Date', key: 'created', render: (r) => new Date(r.created).toLocaleDateString() },
    { header: 'Amount', key: 'amount', align: 'right', render: (r) => formatCurrency(r.amount, r.currency) },
    { header: 'Status', key: 'status', render: (r) => <StatusBadge status={r.status} /> },
    { header: 'Description', key: 'description', render: (r) => r.description || '—' },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Stripe</h1>
          <p style={styles.pageSubtitle}>Revenue, subscriptions & payment analytics</p>
        </div>
        <button onClick={refetch} style={styles.refreshBtn}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div style={styles.metricsGrid}>
        <MetricCard
          title="Revenue (30d)"
          value={formatCurrency(data.revenue.last30Days)}
          change={data.revenue.changePercent}
          icon={DollarSign}
          subtitle="vs previous 30 days"
          color="#10b981"
        />
        <MetricCard
          title="MRR"
          value={formatCurrency(data.mrr)}
          icon={TrendingUp}
          subtitle={`ARR: ${formatCurrency(data.arr)}`}
          color="#6366f1"
        />
        <MetricCard
          title="Active Subscriptions"
          value={data.subscriptions.active.toLocaleString()}
          icon={CreditCard}
          subtitle={`${data.subscriptions.churnRate}% churn rate`}
          color="#f59e0b"
        />
        <MetricCard
          title="New Customers (30d)"
          value={data.customers.new30Days.toLocaleString()}
          icon={Users}
          subtitle={`Previous: ${data.customers.previous30Days}`}
          color="#8b5cf6"
        />
      </div>

      <div style={styles.chartsRow}>
        <ChartCard title="Revenue Trend" subtitle="Last 12 months">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.revenueByMonth}>
              <defs>
                <linearGradient id="stripeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#stripeGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Transactions by Month" subtitle="Last 12 months">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Bar dataKey="transactions" fill="#818cf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div style={styles.bottomRow}>
        <div style={styles.balanceCard}>
          <h3 style={styles.sectionTitle}>Balance</h3>
          <div style={styles.balanceRow}>
            <div>
              <span style={styles.balanceLabel}>Available</span>
              <span style={styles.balanceValue}>{formatCurrency(data.balance.available)}</span>
            </div>
            <div>
              <span style={styles.balanceLabel}>Pending</span>
              <span style={styles.balanceValue}>{formatCurrency(data.balance.pending)}</span>
            </div>
            <div>
              <span style={styles.balanceLabel}>Payment Success Rate</span>
              <span style={styles.balanceValue}>{data.paymentSuccessRate}%</span>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        title="Recent Charges"
        columns={recentColumns}
        data={data.recentActivity || []}
      />
    </div>
  );
}

const styles = {
  page: { display: 'flex', flexDirection: 'column', gap: 24 },
  pageHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  pageTitle: { margin: 0, fontSize: 28, fontWeight: 700, color: '#0f172a' },
  pageSubtitle: { margin: '4px 0 0', fontSize: 14, color: '#64748b' },
  refreshBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 16px', background: '#f8fafc', border: '1px solid #e2e8f0',
    borderRadius: 8, fontSize: 13, fontWeight: 500, color: '#475569', cursor: 'pointer',
  },
  metricsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16,
  },
  chartsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16,
  },
  bottomRow: { display: 'flex', gap: 16 },
  balanceCard: {
    flex: 1, background: '#ffffff', borderRadius: 12, padding: '20px 24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9',
  },
  sectionTitle: { margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#0f172a' },
  balanceRow: { display: 'flex', gap: 32, flexWrap: 'wrap' },
  balanceLabel: { display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' },
  balanceValue: { display: 'block', fontSize: 22, fontWeight: 700, color: '#0f172a' },
};
