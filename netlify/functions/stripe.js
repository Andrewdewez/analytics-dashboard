exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'STRIPE_SECRET_KEY not configured' }),
    };
  }

  const stripeHeaders = {
    Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  try {
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60;
    const twelveMonthsAgo = now - 365 * 24 * 60 * 60;

    // Fetch all data in parallel
    const [
      balanceRes,
      chargesRes,
      chargesPrevRes,
      customersRes,
      customersPrevRes,
      subscriptionsRes,
      canceledSubsRes,
      recentChargesRes,
      monthlyChargesRes,
    ] = await Promise.all([
      // Current balance
      fetch('https://api.stripe.com/v1/balance', { headers: stripeHeaders }),
      // Charges last 30 days
      fetch(`https://api.stripe.com/v1/charges?limit=100&created[gte]=${thirtyDaysAgo}`, { headers: stripeHeaders }),
      // Charges previous 30 days (for comparison)
      fetch(`https://api.stripe.com/v1/charges?limit=100&created[gte]=${sixtyDaysAgo}&created[lt]=${thirtyDaysAgo}`, { headers: stripeHeaders }),
      // New customers last 30 days
      fetch(`https://api.stripe.com/v1/customers?limit=100&created[gte]=${thirtyDaysAgo}`, { headers: stripeHeaders }),
      // New customers previous 30 days
      fetch(`https://api.stripe.com/v1/customers?limit=100&created[gte]=${sixtyDaysAgo}&created[lt]=${thirtyDaysAgo}`, { headers: stripeHeaders }),
      // Active subscriptions
      fetch('https://api.stripe.com/v1/subscriptions?status=active&limit=100', { headers: stripeHeaders }),
      // Canceled subscriptions last 30 days
      fetch(`https://api.stripe.com/v1/subscriptions?status=canceled&limit=100&created[gte]=${thirtyDaysAgo}`, { headers: stripeHeaders }),
      // Recent charges for activity feed
      fetch('https://api.stripe.com/v1/charges?limit=10', { headers: stripeHeaders }),
      // Charges over last 12 months for trend chart
      fetch(`https://api.stripe.com/v1/charges?limit=100&created[gte]=${twelveMonthsAgo}`, { headers: stripeHeaders }),
    ]);

    const [
      balance,
      charges,
      chargesPrev,
      customers,
      customersPrev,
      subscriptions,
      canceledSubs,
      recentCharges,
      monthlyCharges,
    ] = await Promise.all([
      balanceRes.json(),
      chargesRes.json(),
      chargesPrevRes.json(),
      customersRes.json(),
      customersPrevRes.json(),
      subscriptionsRes.json(),
      canceledSubsRes.json(),
      recentChargesRes.json(),
      monthlyChargesRes.json(),
    ]);

    // Calculate revenue for last 30 days
    const successfulCharges = (charges.data || []).filter(c => c.status === 'succeeded');
    const revenue30d = successfulCharges.reduce((sum, c) => sum + c.amount, 0) / 100;

    const prevSuccessfulCharges = (chargesPrev.data || []).filter(c => c.status === 'succeeded');
    const revenuePrev30d = prevSuccessfulCharges.reduce((sum, c) => sum + c.amount, 0) / 100;

    // Calculate MRR from active subscriptions
    const activeSubsData = subscriptions.data || [];
    const mrr = activeSubsData.reduce((sum, sub) => {
      const amount = sub.items?.data?.[0]?.price?.unit_amount || 0;
      const interval = sub.items?.data?.[0]?.price?.recurring?.interval || 'month';
      if (interval === 'year') return sum + amount / 12;
      if (interval === 'week') return sum + amount * 4;
      return sum + amount;
    }, 0) / 100;

    // Churn rate
    const totalSubs = activeSubsData.length + (canceledSubs.data || []).length;
    const churnRate = totalSubs > 0 ? ((canceledSubs.data || []).length / totalSubs) * 100 : 0;

    // Revenue by month (last 12 months)
    const monthlyData = {};
    const allMonthlyCharges = (monthlyCharges.data || []).filter(c => c.status === 'succeeded');
    allMonthlyCharges.forEach(charge => {
      const date = new Date(charge.created * 1000);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[key]) monthlyData[key] = { month: key, revenue: 0, transactions: 0 };
      monthlyData[key].revenue += charge.amount / 100;
      monthlyData[key].transactions += 1;
    });

    const revenueByMonth = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

    // Payment success rate
    const allRecentCharges = charges.data || [];
    const successRate = allRecentCharges.length > 0
      ? (successfulCharges.length / allRecentCharges.length) * 100
      : 100;

    // Format recent activity
    const recentActivity = (recentCharges.data || []).slice(0, 10).map(c => ({
      id: c.id,
      amount: c.amount / 100,
      currency: c.currency,
      status: c.status,
      customer: c.customer,
      description: c.description,
      created: new Date(c.created * 1000).toISOString(),
    }));

    const result = {
      revenue: {
        last30Days: revenue30d,
        previous30Days: revenuePrev30d,
        changePercent: revenuePrev30d > 0 ? ((revenue30d - revenuePrev30d) / revenuePrev30d) * 100 : 0,
      },
      mrr,
      arr: mrr * 12,
      customers: {
        new30Days: (customers.data || []).length,
        previous30Days: (customersPrev.data || []).length,
      },
      subscriptions: {
        active: activeSubsData.length,
        canceled30Days: (canceledSubs.data || []).length,
        churnRate: Math.round(churnRate * 10) / 10,
      },
      paymentSuccessRate: Math.round(successRate * 10) / 10,
      revenueByMonth,
      recentActivity,
      balance: {
        available: (balance.available || []).reduce((sum, b) => sum + b.amount, 0) / 100,
        pending: (balance.pending || []).reduce((sum, b) => sum + b.amount, 0) / 100,
      },
    };

    return { statusCode: 200, headers, body: JSON.stringify(result) };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
