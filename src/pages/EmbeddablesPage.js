import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, FunnelChart, Funnel, LabelList,
} from 'recharts';
import { Activity, Target, TrendingDown, Layers, RefreshCw } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import ChartCard from '../components/ChartCard';
import { LoadingState, ErrorState } from '../components/LoadingState';
import { useDataFetcher } from '../hooks/useDataFetcher';
import { fetchEmbeddablesData } from '../utils/api';

export default function EmbeddablesPage() {
  const { data, loading, error, refetch } = useDataFetcher(fetchEmbeddablesData);

  if (loading) return <LoadingState message="Loading Embeddables data..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  const { summary, embeddables, dailyTrends } = data;

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Embeddables</h1>
          <p style={styles.pageSubtitle}>Form funnels, completions & conversion analytics</p>
        </div>
        <button onClick={refetch} style={styles.refreshBtn}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div style={styles.metricsGrid}>
        <MetricCard
          title="Total Started"
          value={summary.totalStarted.toLocaleString()}
          icon={Activity}
          subtitle="Form sessions initiated"
          color="#6366f1"
        />
        <MetricCard
          title="Total Completed"
          value={summary.totalCompleted.toLocaleString()}
          icon={Target}
          subtitle="Forms fully completed"
          color="#10b981"
        />
        <MetricCard
          title="Completion Rate"
          value={`${summary.overallCompletionRate}%`}
          icon={TrendingDown}
          color="#f59e0b"
        />
        <MetricCard
          title="Active Embeddables"
          value={summary.totalEmbeddables.toLocaleString()}
          icon={Layers}
          color="#8b5cf6"
        />
      </div>

      <ChartCard title="Daily Form Activity" subtitle="Starts vs Completions — Last 30 days">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={dailyTrends}>
            <defs>
              <linearGradient id="startsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="completionsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => v.slice(5)} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
            <Area type="monotone" dataKey="starts" stroke="#6366f1" fill="url(#startsGrad)" strokeWidth={2} name="Started" />
            <Area type="monotone" dataKey="completions" stroke="#10b981" fill="url(#completionsGrad)" strokeWidth={2} name="Completed" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <h2 style={styles.sectionTitle}>Per-Embeddable Breakdown</h2>

      {embeddables.map((emb) => {
        const funnelData = [
          { name: 'Started', value: emb.started, fill: '#6366f1' },
          { name: 'Midpoint', value: emb.reachedMidpoint, fill: '#8b5cf6' },
          { name: 'Near End', value: emb.reachedEnd, fill: '#a78bfa' },
          { name: 'Completed', value: emb.completed, fill: '#10b981' },
        ];

        const barData = [
          { stage: 'Started', count: emb.started },
          { stage: 'Midpoint', count: emb.reachedMidpoint },
          { stage: 'Near End', count: emb.reachedEnd },
          { stage: 'Completed', count: emb.completed },
        ];

        return (
          <div key={emb.embeddable_id} style={styles.embeddableCard}>
            <div style={styles.embeddableHeader}>
              <h3 style={styles.embeddableName}>{emb.embeddable_id}</h3>
              <div style={styles.embeddableStats}>
                <span style={styles.statPill}>
                  {emb.completionRate}% completion
                </span>
                <span style={{ ...styles.statPill, background: '#fef2f2', color: '#ef4444' }}>
                  {emb.dropOffRate}% drop-off
                </span>
              </div>
            </div>

            <div style={styles.funnelRow}>
              <div style={styles.funnelChart}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <YAxis type="category" dataKey="stage" tick={{ fontSize: 12, fill: '#64748b' }} width={80} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {barData.map((entry, index) => {
                        const colors = ['#6366f1', '#8b5cf6', '#a78bfa', '#10b981'];
                        return <Bar key={index} fill={colors[index]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={styles.funnelSteps}>
                {funnelData.map((step, i) => (
                  <div key={i} style={styles.funnelStep}>
                    <div style={{ ...styles.funnelStepBar, width: `${emb.started > 0 ? (step.value / emb.started) * 100 : 0}%`, background: step.fill }} />
                    <div style={styles.funnelStepInfo}>
                      <span style={styles.funnelStepName}>{step.name}</span>
                      <span style={styles.funnelStepValue}>{step.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {embeddables.length === 0 && (
        <div style={styles.emptyState}>
          No embeddable data found for the last 30 days.
        </div>
      )}
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
  sectionTitle: { margin: '8px 0 0', fontSize: 20, fontWeight: 600, color: '#0f172a' },
  embeddableCard: {
    background: '#ffffff', borderRadius: 12, padding: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9',
  },
  embeddableHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20, flexWrap: 'wrap', gap: 12,
  },
  embeddableName: { margin: 0, fontSize: 16, fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' },
  embeddableStats: { display: 'flex', gap: 8 },
  statPill: {
    padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    background: '#dcfce7', color: '#166534',
  },
  funnelRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'center' },
  funnelChart: { minWidth: 0 },
  funnelSteps: { display: 'flex', flexDirection: 'column', gap: 12 },
  funnelStep: { position: 'relative' },
  funnelStepBar: {
    height: 32, borderRadius: 6, minWidth: 4, transition: 'width 0.3s ease',
  },
  funnelStepInfo: {
    position: 'absolute', top: 0, left: 12, right: 12,
    height: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  funnelStepName: { fontSize: 13, fontWeight: 500, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' },
  funnelStepValue: { fontSize: 13, fontWeight: 700, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' },
  emptyState: {
    padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14,
    background: '#f8fafc', borderRadius: 12, border: '2px dashed #e2e8f0',
  },
};
