import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import { ShoppingBag, Users, Package, TrendingUp, RefreshCw } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import ChartCard from '../components/ChartCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { LoadingState, ErrorState } from '../components/LoadingState';
import { useDataFetcher } from '../hooks/useDataFetcher';
import { fetchShopifyData, formatCurrency } from '../utils/api';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

export default function ShopifyPage() {
  const { data, loading, error, refetch } = useDataFetcher(fetchShopifyData);

  if (loading) return <LoadingState message="Loading Shopify data..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  const fulfillmentData = Object.entries(data.fulfillmentStatus || {}).map(([name, value]) => ({
    name: name.toLowerCase().replace(/_/g, ' '),
    value,
  }));

  const orderColumns = [
    { header: 'Order', key: 'name' },
    { header: 'Customer', key: 'customer' },
    { header: 'Amount', key: 'amount', align: 'right', render: (r) => formatCurrency(r.amount, r.currency) },
    { header: 'Payment', key: 'status', render: (r) => <StatusBadge status={r.status} /> },
    { header: 'Fulfillment', key: 'fulfillment', render: (r) => <StatusBadge status={r.fulfillment} /> },
    { header: 'Date', key: 'date', render: (r) => new Date(r.date).toLocaleDateString() },
  ];

  const productColumns = [
    { header: 'Product', key: 'title' },
    { header: 'Units Sold', key: 'quantity', align: 'right' },
    { header: 'Revenue', key: 'revenue', align: 'right', render: (r) => formatCurrency(r.revenue) },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Shopify</h1>
          <p style={styles.pageSubtitle}>Sales, orders & product analytics</p>
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
          icon={TrendingUp}
          subtitle="vs previous 30 days"
          color="#10b981"
        />
        <MetricCard
          title="Orders (30d)"
          value={data.orders.total30Days.toLocaleString()}
          icon={ShoppingBag}
          subtitle={`Previous: ${data.orders.previous30Days}`}
          color="#6366f1"
        />
        <MetricCard
          title="Avg Order Value"
          value={formatCurrency(data.orders.avgOrderValue)}
          icon={Package}
          color="#f59e0b"
        />
        <MetricCard
          title="New Customers (30d)"
          value={data.customers.new30Days.toLocaleString()}
          icon={Users}
          subtitle={`${data.customers.returningOrders} returning orders`}
          color="#8b5cf6"
        />
      </div>

      <div style={styles.chartsRow}>
        <ChartCard title="Daily Sales" subtitle="Last 30 days">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.salesByDay}>
              <defs>
                <linearGradient id="shopifyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={v => `$${v}`} />
              <Tooltip
                formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#shopifyGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Orders per Day" subtitle="Last 30 days">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.salesByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Bar dataKey="orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div style={styles.chartsRow}>
        <DataTable title="Top Products" columns={productColumns} data={data.topProducts || []} />

        <ChartCard title="Fulfillment Status">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={fulfillmentData}
                cx="50%" cy="50%"
                innerRadius={60} outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {fulfillmentData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={styles.legend}>
            {fulfillmentData.map((item, i) => (
              <div key={i} style={styles.legendItem}>
                <span style={{ ...styles.legendDot, background: COLORS[i % COLORS.length] }} />
                <span style={styles.legendText}>{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <DataTable title="Recent Orders" columns={orderColumns} data={data.recentOrders || []} />
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
  metricsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16,
  },
  chartsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16,
  },
  legend: { display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 },
  legendItem: { display: 'flex', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: '50%', display: 'inline-block' },
  legendText: { fontSize: 13, color: '#64748b', textTransform: 'capitalize' },
};
