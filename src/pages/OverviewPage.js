import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { DollarSign, Users, Activity, TrendingUp, RefreshCw } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import ChartCard from '../components/ChartCard';
import { LoadingState, ErrorState } from '../components/LoadingState';
import { useDataFetcher } from '../hooks/useDataFetcher';
import { fetchStripeData, fetchShopifyData, fetchEmbeddablesData, formatCurrency } from '../utils/api';

function useAllData() {
  const stripe = useDataFetcher(fetchStripeData);
  const shopify = useDataFetcher(fetchShopifyData);
  const embeddables = useDataFetcher(fetchEmbeddablesData);

  const loading = stripe.loading || shopify.loading || embeddables.loading;
  const errors = [stripe.error, shopify.error, embeddables.error].filter(Boolean);

  return { stripe: stripe.data, shopify: shopify.data, embeddables: embeddables.data, loading, errors, refetchAll: () => { stripe.refetch(); shopify.refetch(); embeddables.refetch(); } };
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

export default function OverviewPage() {
  const { stripe, shopify, embeddables, loading, errors, refetchAll } = useAllData();

  if (loading) return <LoadingState message="Loading all dashboards..." />;

  // Calculate combined metrics (use what's available)
  const stripeRevenue = stripe?.revenue?.last30Days || 0;
  const shopifyRevenue = shopify?.revenue?.last30Days || 0;
  const totalRevenue = stripeRevenue + shopifyRevenue;

  const stripeRevPrev = stripe?.revenue?.previous30Days || 0;
  const shopifyRevPrev = shopify?.revenue?.previous30Days || 0;
  const totalPrevRevenue = stripeRevPrev + shopifyRevPrev;
  const revenueChange = totalPrevRevenue > 0 ? ((totalRevenue - totalPrevRevenue) / totalPrevRevenue) * 100 : 0;

  const totalCustomers = (stripe?.customers?.new30Days || 0) + (shopify?.customers?.new30Days || 0);
  const totalFunnelStarts = embeddables?.summary?.totalStarted || 0;
  const totalConversions = embeddables?.summary?.totalCompleted || 0;
  const conversionRate = embeddables?.summary?.overallCompletionRate || 0;

  // Revenue split for pie chart
  const revenueSplit = [
    { name: 'Stripe', value: stripeRevenue },
    { name: 'Shopify', value: shopifyRevenue },
  ].filter(d => d.value > 0);

  // Merge monthly revenue from Stripe
  const monthlyTrend = stripe?.revenueByMonth || [];

  // Connection status
  const connections = [
    { name: 'Stripe', connected: !!stripe, color: '#6366f1' },
    { name: 'Shopify', connected: !!shopify, color: '#10b981' },
    { name: 'Embeddables', connected: !!embeddables, color: '#f59e0b' },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Overview</h1>
          <p style={styles.pageSubtitle}>Combined analytics across all platforms</p>
        </div>
        <button onClick={refetchAll} style={styles.refreshBtn}>
          <RefreshCw size={16} /> Refresh All
        </button>
      </div>

      {errors.length > 0 && (
        <div style={styles.warningBanner}>
          Some data sources returned errors. Showing available data.
        </div>
      )}

      <div style={styles.connectionBar}>
        {connections.map((c, i) => (
          <div key={i} style={styles.connectionItem}>
            <span style={{ ...styles.connectionDot, background: c.connected ? c.color : '#e2e8f0' }} />
            <span style={styles.connectionName}>{c.name}</span>
            <span style={{ ...styles.connectionStatus, color: c.connected ? '#10b981' : '#94a3b8' }}>
              {c.connected ? 'Connected' : 'Not configured'}
            </span>
          </div>
        ))}
      </div>

      <div style={styles.metricsGrid}>
        <MetricCard
          title="Total Revenue (30d)"
          value={formatCurrency(totalRevenue)}
          change={revenueChange}
          icon={DollarSign}
          subtitle="Stripe + Shopify combined"
          color="#10b981"
        />
        <MetricCard
          title="New Customers (30d)"
          value={totalCustomers.toLocaleString()}
          icon={Users}
          subtitle="Across all platforms"
          color="#6366f1"
        />
        <MetricCard
          title="Funnel Starts (30d)"
          value={totalFunnelStarts.toLocaleString()}
          icon={Activity}
          subtitle={`${totalConversions} completed`}
          color="#f59e0b"
        />
        <MetricCard
          title="MRR"
          value={formatCurrency(stripe?.mrr || 0)}
          icon={TrendingUp}
          subtitle={`ARR: ${formatCurrency(stripe?.arr || 0)}`}
          color="#8b5cf6"
        />
      </div>

      <div style={styles.chartsRow}>
        <ChartCard title="Revenue Trend" subtitle="Stripe — Last 12 months">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="overviewGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} contentStyle={{ borderRadius: 8 }} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#overviewGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue Split" subtitle="By platform — Last 30 days">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={revenueSplit} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {revenueSplit.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {embeddables && (
        <ChartCard title="Embeddables Funnel Summary">
          <div style={styles.funnelSummary}>
            <div style={styles.funnelBox}>
              <span style={styles.funnelBoxValue}>{totalFunnelStarts}</span>
              <span style={styles.funnelBoxLabel}>Started</span>
            </div>
            <div style={styles.funnelArrow}>→</div>
            <div style={styles.funnelBox}>
              <span style={styles.funnelBoxValue}>{totalConversions}</span>
              <span style={styles.funnelBoxLabel}>Completed</span>
            </div>
            <div style={styles.funnelArrow}>→</div>
            <div style={{ ...styles.funnelBox, background: conversionRate >= 50 ? '#dcfce7' : '#fef9c3' }}>
              <span style={styles.funnelBoxValue}>{conversionRate}%</span>
              <span style={styles.funnelBoxLabel}>Conversion Rate</span>
            </div>
          </div>
        </ChartCard>
      )}

      <div style={styles.quickStats}>
        <div style={styles.quickStatCard}>
          <h4 style={styles.quickStatTitle}>Stripe Quick Stats</h4>
          {stripe ? (
            <div style={styles.quickStatList}>
              <div style={styles.quickStatRow}><span>Active Subscriptions</span><strong>{stripe.subscriptions.active}</strong></div>
              <div style={styles.quickStatRow}><span>Churn Rate</span><strong>{stripe.subscriptions.churnRate}%</strong></div>
              <div style={styles.quickStatRow}><span>Payment Success</span><strong>{stripe.paymentSuccessRate}%</strong></div>
              <div style={styles.quickStatRow}><span>Available Balance</span><strong>{formatCurrency(stripe.balance.available)}</strong></div>
            </div>
          ) : <p style={styles.notConfigured}>Not configured</p>}
        </div>

        <div style={styles.quickStatCard}>
          <h4 style={styles.quickStatTitle}>Shopify Quick Stats</h4>
          {shopify ? (
            <div style={styles.quickStatList}>
              <div style={styles.quickStatRow}><span>Orders (30d)</span><strong>{shopify.orders.total30Days}</strong></div>
              <div style={styles.quickStatRow}><span>Avg Order Value</span><strong>{formatCurrency(shopify.orders.avgOrderValue)}</strong></div>
              <div style={styles.quickStatRow}><span>New Customers</span><strong>{shopify.customers.new30Days}</strong></div>
              <div style={styles.quickStatRow}><span>Returning Orders</span><strong>{shopify.customers.returningOrders}</strong></div>
            </div>
          ) : <p style={styles.notConfigured}>Not configured</p>}
        </div>

        <div style={styles.quickStatCard}>
          <h4 style={styles.quickStatTitle}>Embeddables Quick Stats</h4>
          {embeddables ? (
            <div style={styles.quickStatList}>
              <div style={styles.quickStatRow}><span>Active Embeddables</span><strong>{embeddables.summary.totalEmbeddables}</strong></div>
              <div style={styles.quickStatRow}><span>Form Starts (30d)</span><strong>{embeddables.summary.totalStarted}</strong></div>
              <div style={styles.quickStatRow}><span>Completions</span><strong>{embeddables.summary.totalCompleted}</strong></div>
              <div style={styles.quickStatRow}><span>Completion Rate</span><strong>{embeddables.summary.overallCompletionRate}%</strong></div>
            </div>
          ) : <p style={styles.notConfigured}>Not configured</p>}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { display: 'flex', flexDirection: 'column', gap: 24 },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  pageTitle: { margin: 0, fontSize: 28, fontWeight: 700, color: '#0f172a' },
  pageSubtitle: { margin: '4px 0 0', fontSize: 14, color: '#64748b' },
  refreshBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 16px', background: '#f8fafc', border: '1px solid #e2e8f0',
    borderRadius: 8, fontSize: 13, fontWeight: 500, color: '#475569', cursor: 'pointer',
  },
  warningBanner: {
    padding: '12px 20px', background: '#fef9c3', border: '1px solid #fde68a',
    borderRadius: 8, fontSize: 14, color: '#854d0e',
  },
  connectionBar: {
    display: 'flex', gap: 24, padding: '16px 24px',
    background: '#ffffff', borderRadius: 12, border: '1px solid #f1f5f9',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  connectionItem: { display: 'flex', alignItems: 'center', gap: 8 },
  connectionDot: { width: 10, height: 10, borderRadius: '50%' },
  connectionName: { fontSize: 14, fontWeight: 600, color: '#0f172a' },
  connectionStatus: { fontSize: 12 },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 },
  chartsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16 },
  funnelSummary: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, padding: 20 },
  funnelBox: {
    padding: '20px 32px', borderRadius: 12, background: '#f8fafc', textAlign: 'center',
    border: '1px solid #e2e8f0',
  },
  funnelBoxValue: { display: 'block', fontSize: 28, fontWeight: 700, color: '#0f172a' },
  funnelBoxLabel: { display: 'block', fontSize: 12, color: '#64748b', textTransform: 'uppercase', marginTop: 4 },
  funnelArrow: { fontSize: 24, color: '#94a3b8' },
  quickStats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 },
  quickStatCard: {
    background: '#ffffff', borderRadius: 12, padding: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9',
  },
  quickStatTitle: { margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#0f172a' },
  quickStatList: { display: 'flex', flexDirection: 'column', gap: 12 },
  quickStatRow: {
    display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#475569',
    paddingBottom: 8, borderBottom: '1px solid #f8fafc',
  },
  notConfigured: { fontSize: 14, color: '#94a3b8', fontStyle: 'italic' },
};
