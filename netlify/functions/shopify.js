exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
  const SHOPIFY_ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;

  if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ADMIN_API_TOKEN) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Shopify credentials not configured' }),
    };
  }

  const shopifyUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/graphql.json`;
  const shopifyHeaders = {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN,
  };

  const graphqlQuery = async (query) => {
    const res = await fetch(shopifyUrl, {
      method: 'POST',
      headers: shopifyHeaders,
      body: JSON.stringify({ query }),
    });
    return res.json();
  };

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch orders, customers, and products in parallel
    const [ordersData, prevOrdersData, customersData, productsData] = await Promise.all([
      // Orders last 30 days
      graphqlQuery(`{
        orders(first: 250, query: "created_at:>='${thirtyDaysAgo}'") {
          edges {
            node {
              id
              name
              createdAt
              totalPriceSet { shopMoney { amount currencyCode } }
              subtotalPriceSet { shopMoney { amount } }
              currentTotalDiscountsSet { shopMoney { amount } }
              displayFinancialStatus
              displayFulfillmentStatus
              customer { id firstName lastName email ordersCount }
              lineItems(first: 10) {
                edges { node { title quantity originalUnitPriceSet { shopMoney { amount } } } }
              }
            }
          }
        }
      }`),
      // Orders previous 30 days
      graphqlQuery(`{
        orders(first: 250, query: "created_at:>='${sixtyDaysAgo}' AND created_at:<'${thirtyDaysAgo}'") {
          edges {
            node {
              id
              totalPriceSet { shopMoney { amount } }
            }
          }
        }
      }`),
      // Customers
      graphqlQuery(`{
        customers(first: 100, query: "created_at:>='${thirtyDaysAgo}'") {
          edges {
            node {
              id
              firstName
              lastName
              email
              createdAt
              ordersCount
              totalSpentV2 { amount currencyCode }
            }
          }
        }
      }`),
      // Top products
      graphqlQuery(`{
        products(first: 50, sortKey: BEST_SELLING) {
          edges {
            node {
              id
              title
              totalInventory
              status
              variants(first: 1) {
                edges { node { price } }
              }
            }
          }
        }
      }`),
    ]);

    // Process orders
    const orders = (ordersData?.data?.orders?.edges || []).map(e => e.node);
    const prevOrders = (prevOrdersData?.data?.orders?.edges || []).map(e => e.node);
    const customers = (customersData?.data?.customers?.edges || []).map(e => e.node);
    const products = (productsData?.data?.products?.edges || []).map(e => e.node);

    // Revenue calculations
    const revenue30d = orders.reduce((sum, o) => sum + parseFloat(o.totalPriceSet?.shopMoney?.amount || 0), 0);
    const revenuePrev30d = prevOrders.reduce((sum, o) => sum + parseFloat(o.totalPriceSet?.shopMoney?.amount || 0), 0);
    const avgOrderValue = orders.length > 0 ? revenue30d / orders.length : 0;

    // Orders by day for trend chart
    const dailyData = {};
    orders.forEach(order => {
      const day = order.createdAt.split('T')[0];
      if (!dailyData[day]) dailyData[day] = { date: day, revenue: 0, orders: 0 };
      dailyData[day].revenue += parseFloat(order.totalPriceSet?.shopMoney?.amount || 0);
      dailyData[day].orders += 1;
    });
    const salesByDay = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));

    // Returning vs new customers
    const returningCustomers = orders.filter(o => o.customer && o.customer.ordersCount > 1).length;
    const newCustomerOrders = orders.length - returningCustomers;

    // Top products from line items
    const productSales = {};
    orders.forEach(order => {
      (order.lineItems?.edges || []).forEach(({ node }) => {
        const title = node.title;
        if (!productSales[title]) productSales[title] = { title, quantity: 0, revenue: 0 };
        productSales[title].quantity += node.quantity;
        productSales[title].revenue += node.quantity * parseFloat(node.originalUnitPriceSet?.shopMoney?.amount || 0);
      });
    });
    const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    // Fulfillment breakdown
    const fulfillmentStatus = {};
    orders.forEach(order => {
      const status = order.displayFulfillmentStatus || 'UNKNOWN';
      fulfillmentStatus[status] = (fulfillmentStatus[status] || 0) + 1;
    });

    // Recent orders
    const recentOrders = orders.slice(0, 10).map(o => ({
      name: o.name,
      amount: parseFloat(o.totalPriceSet?.shopMoney?.amount || 0),
      currency: o.totalPriceSet?.shopMoney?.currencyCode || 'USD',
      status: o.displayFinancialStatus,
      fulfillment: o.displayFulfillmentStatus,
      customer: o.customer ? `${o.customer.firstName || ''} ${o.customer.lastName || ''}`.trim() : 'Guest',
      date: o.createdAt,
    }));

    const result = {
      revenue: {
        last30Days: Math.round(revenue30d * 100) / 100,
        previous30Days: Math.round(revenuePrev30d * 100) / 100,
        changePercent: revenuePrev30d > 0 ? Math.round(((revenue30d - revenuePrev30d) / revenuePrev30d) * 1000) / 10 : 0,
      },
      orders: {
        total30Days: orders.length,
        previous30Days: prevOrders.length,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      },
      customers: {
        new30Days: customers.length,
        returningOrders: returningCustomers,
        newOrders: newCustomerOrders,
      },
      topProducts,
      salesByDay,
      fulfillmentStatus,
      recentOrders,
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
