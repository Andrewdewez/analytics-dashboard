# Analytics Dashboard — Setup & Deployment Guide

## Quick Start

### 1. Install Dependencies
```bash
cd analytics-dashboard
npm install
```

### 2. Create Your Environment File
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```
STRIPE_SECRET_KEY=sk_live_your_key_here
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ADMIN_API_TOKEN=shpat_your_token_here
EMBEDDABLES_API_KEY=rk_your_key_here
EMBEDDABLES_PROJECT_ID=pr_your_project_id_here
```

### 3. Run Locally
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Start dev server with functions
netlify dev
```

The dashboard will open at `http://localhost:3000`.

---

## Getting Your API Keys

### Stripe
1. Go to https://dashboard.stripe.com/apikeys
2. Copy your **Secret key** (starts with `sk_live_`)
3. Use `sk_test_` keys first if you want to test with sandbox data

### Shopify
1. In Shopify Admin → **Settings** → **Apps and sales channels**
2. Click **Develop apps** → **Create an app**
3. Under **Configuration**, enable these scopes:
   - `read_orders`
   - `read_customers`
   - `read_products`
   - `read_analytics`
4. Click **Install app** → copy the **Admin API access token**
5. Your store domain is: `your-store.myshopify.com`

### Embeddables
1. Log in to Embeddables → **Settings** → **Credentials and Endpoints**
2. Copy your **API Key** (starts with `rk_`)
3. Copy your **Project ID** (starts with `pr_`)

---

## Deploy to Netlify

### Option A: One-Click (Recommended)
1. Push this project to a GitHub repo
2. Go to https://app.netlify.com → **Add new site** → **Import from Git**
3. Select your repo
4. Build settings are auto-detected from `netlify.toml`
5. Add your environment variables in **Site settings** → **Environment variables**
6. Deploy!

### Option B: Netlify CLI
```bash
# Login to Netlify
netlify login

# Create a new site and deploy
netlify init
netlify deploy --prod
```

Don't forget to set environment variables:
```bash
netlify env:set STRIPE_SECRET_KEY "sk_live_..."
netlify env:set SHOPIFY_STORE_DOMAIN "your-store.myshopify.com"
netlify env:set SHOPIFY_ADMIN_API_TOKEN "shpat_..."
netlify env:set EMBEDDABLES_API_KEY "rk_..."
netlify env:set EMBEDDABLES_PROJECT_ID "pr_..."
```

---

## Project Structure

```
analytics-dashboard/
├── netlify.toml                 # Netlify config (build, redirects)
├── netlify/functions/
│   ├── stripe.js                # Stripe API proxy
│   ├── shopify.js               # Shopify GraphQL proxy
│   └── embeddables.js           # Embeddables API proxy
├── src/
│   ├── App.js                   # Main layout + navigation
│   ├── pages/
│   │   ├── OverviewPage.js      # Combined dashboard
│   │   ├── StripePage.js        # Stripe analytics
│   │   ├── ShopifyPage.js       # Shopify analytics
│   │   └── EmbeddablesPage.js   # Embeddables funnel
│   ├── components/
│   │   ├── MetricCard.js        # KPI metric cards
│   │   ├── ChartCard.js         # Chart wrapper
│   │   ├── DataTable.js         # Data tables
│   │   ├── StatusBadge.js       # Status indicators
│   │   └── LoadingState.js      # Loading/error/empty states
│   ├── hooks/
│   │   └── useDataFetcher.js    # Data fetching hook
│   └── utils/
│       └── api.js               # API client + formatters
└── .env.example                 # Environment variable template
```

## Security Notes

- API keys are NEVER exposed to the browser
- All API calls go through Netlify Functions (serverless)
- The `.env` file is gitignored — keys stay local
- On Netlify, use their encrypted environment variables
