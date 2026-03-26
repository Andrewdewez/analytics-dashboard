const BASE_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:9999/.netlify/functions'
  : '/.netlify/functions';

export async function fetchStripeData() {
  const res = await fetch(`${BASE_URL}/stripe`);
  if (!res.ok) throw new Error(`Stripe API error: ${res.status}`);
  return res.json();
}

export async function fetchShopifyData() {
  const res = await fetch(`${BASE_URL}/shopify`);
  if (!res.ok) throw new Error(`Shopify API error: ${res.status}`);
  return res.json();
}

export async function fetchEmbeddablesData() {
  const res = await fetch(`${BASE_URL}/embeddables`);
  if (!res.ok) throw new Error(`Embeddables API error: ${res.status}`);
  return res.json();
}

export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function formatPercent(num) {
  return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
}
