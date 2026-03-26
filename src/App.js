import React, { useState } from 'react';
import { LayoutDashboard, CreditCard, ShoppingBag, Layers } from 'lucide-react';
import OverviewPage from './pages/OverviewPage';
import StripePage from './pages/StripePage';
import ShopifyPage from './pages/ShopifyPage';
import EmbeddablesPage from './pages/EmbeddablesPage';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'stripe', label: 'Stripe', icon: CreditCard },
  { id: 'shopify', label: 'Shopify', icon: ShoppingBag },
  { id: 'embeddables', label: 'Embeddables', icon: Layers },
];

function App() {
  const [activePage, setActivePage] = useState('overview');

  const renderPage = () => {
    switch (activePage) {
      case 'stripe': return <StripePage />;
      case 'shopify': return <ShopifyPage />;
      case 'embeddables': return <EmbeddablesPage />;
      default: return <OverviewPage />;
    }
  };

  return (
    <div style={styles.layout}>
      {/* Sidebar */}
      <nav style={styles.sidebar}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>A</div>
          <span style={styles.logoText}>Analytics</span>
        </div>

        <div style={styles.navList}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                style={{
                  ...styles.navItem,
                  ...(isActive ? styles.navItemActive : {}),
                }}
              >
                <Icon size={18} color={isActive ? '#6366f1' : '#64748b'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div style={styles.sidebarFooter}>
          <div style={styles.envBadge}>
            <span style={styles.envDot} />
            Live Data
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main style={styles.main}>
        {renderPage()}
      </main>
    </div>
  );
}

const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
  },
  sidebar: {
    width: 240,
    background: '#ffffff',
    borderRight: '1px solid #f1f5f9',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 12px',
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 10,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '4px 12px 20px',
    borderBottom: '1px solid #f1f5f9',
    marginBottom: 16,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 700,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 700,
    color: '#0f172a',
  },
  navList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    border: 'none',
    borderRadius: 8,
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    color: '#64748b',
    transition: 'all 0.15s ease',
    textAlign: 'left',
    width: '100%',
  },
  navItemActive: {
    background: '#eef2ff',
    color: '#6366f1',
    fontWeight: 600,
  },
  sidebarFooter: {
    marginTop: 'auto',
    padding: '16px 12px 0',
    borderTop: '1px solid #f1f5f9',
  },
  envBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    color: '#64748b',
  },
  envDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#10b981',
  },
  main: {
    flex: 1,
    marginLeft: 240,
    padding: 32,
    maxWidth: 1200,
  },
};

export default App;
