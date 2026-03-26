exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const API_KEY = process.env.EMBEDDABLES_API_KEY;
  const PROJECT_ID = process.env.EMBEDDABLES_PROJECT_ID;

  if (!API_KEY || !PROJECT_ID) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Embeddables credentials not configured' }),
    };
  }

  const baseUrl = `https://api.embeddables.com/projects/${PROJECT_ID}`;
  const apiHeaders = {
    'X-Api-Key': API_KEY,
    'Content-Type': 'application/json',
  };

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch entries and page views in parallel
    const [entriesRes, pageViewsRes] = await Promise.all([
      fetch(`${baseUrl}/entries?limit=100&updated_after=${thirtyDaysAgo}&direction=DESC`, {
        headers: apiHeaders,
      }),
      fetch(`${baseUrl}/entries-page-views?limit=100&updated_after=${thirtyDaysAgo}&direction=DESC`, {
        headers: apiHeaders,
      }),
    ]);

    const entries = await entriesRes.json();
    const pageViews = await pageViewsRes.json();

    const entriesArray = Array.isArray(entries) ? entries : entries.data || [];
    const pageViewsArray = Array.isArray(pageViews) ? pageViews : pageViews.data || [];

    // Group entries by embeddable
    const embeddableStats = {};

    entriesArray.forEach(entry => {
      const embId = entry.embeddable_id || 'unknown';
      if (!embeddableStats[embId]) {
        embeddableStats[embId] = {
          embeddable_id: embId,
          totalEntries: 0,
          entriesWithData: 0,
          entries: [],
        };
      }
      embeddableStats[embId].totalEntries += 1;
      embeddableStats[embId].entries.push(entry);

      // Check if entry has meaningful data (user progressed through form)
      const entryData = typeof entry.entry_data === 'string'
        ? JSON.parse(entry.entry_data || '{}')
        : entry.entry_data || {};

      if (Object.keys(entryData).length > 0) {
        embeddableStats[embId].entriesWithData += 1;
      }
    });

    // Analyze page views for funnel data
    const funnelByEmbeddable = {};

    pageViewsArray.forEach(pv => {
      const embId = pv.embeddable_id || 'unknown';
      if (!funnelByEmbeddable[embId]) {
        funnelByEmbeddable[embId] = {
          embeddable_id: embId,
          totalPageViews: 0,
          uniqueEntries: new Set(),
          pageProgression: {},
          maxPageReached: {},
        };
      }

      const views = pv.page_views || [];
      funnelByEmbeddable[embId].uniqueEntries.add(pv.entry_id);

      let maxIndex = -1;
      views.forEach(view => {
        funnelByEmbeddable[embId].totalPageViews += 1;
        const pageKey = view.page_key || view.page_id || `page_${view.page_index}`;
        funnelByEmbeddable[embId].pageProgression[pageKey] =
          (funnelByEmbeddable[embId].pageProgression[pageKey] || 0) + 1;

        if (view.page_index > maxIndex) maxIndex = view.page_index;
      });

      if (maxIndex >= 0) {
        funnelByEmbeddable[embId].maxPageReached[pv.entry_id] = maxIndex;
      }
    });

    // Build per-embeddable analytics
    const embeddableAnalytics = {};

    Object.keys({ ...embeddableStats, ...funnelByEmbeddable }).forEach(embId => {
      const stats = embeddableStats[embId] || { totalEntries: 0, entriesWithData: 0 };
      const funnel = funnelByEmbeddable[embId] || {
        totalPageViews: 0,
        uniqueEntries: new Set(),
        pageProgression: {},
        maxPageReached: {},
      };

      const uniqueStarters = funnel.uniqueEntries?.size || stats.totalEntries;
      const maxPages = Object.values(funnel.maxPageReached || {});
      const totalPages = Object.keys(funnel.pageProgression || {}).length;

      // Estimate funnel stages based on page progression
      const startedForm = uniqueStarters;
      const reachedMidpoint = maxPages.filter(p => p >= Math.floor(totalPages / 2)).length;
      const reachedEnd = maxPages.filter(p => p >= totalPages - 2).length;
      const completed = stats.entriesWithData;

      embeddableAnalytics[embId] = {
        embeddable_id: embId,
        started: startedForm,
        reachedMidpoint,
        reachedEnd,
        completed,
        completionRate: startedForm > 0 ? Math.round((completed / startedForm) * 1000) / 10 : 0,
        dropOffRate: startedForm > 0 ? Math.round(((startedForm - completed) / startedForm) * 1000) / 10 : 0,
        totalPageViews: funnel.totalPageViews,
        pageProgression: funnel.pageProgression,
      };
    });

    // Daily trends
    const dailyTrends = {};
    entriesArray.forEach(entry => {
      const day = (entry.created_at || entry.updated_at || '').split('T')[0];
      if (day) {
        if (!dailyTrends[day]) dailyTrends[day] = { date: day, starts: 0, completions: 0 };
        dailyTrends[day].starts += 1;
        const data = typeof entry.entry_data === 'string'
          ? JSON.parse(entry.entry_data || '{}')
          : entry.entry_data || {};
        if (Object.keys(data).length > 0) dailyTrends[day].completions += 1;
      }
    });

    const dailyTrendsArray = Object.values(dailyTrends).sort((a, b) => a.date.localeCompare(b.date));

    // Summary totals
    const totalStarted = Object.values(embeddableAnalytics).reduce((s, e) => s + e.started, 0);
    const totalCompleted = Object.values(embeddableAnalytics).reduce((s, e) => s + e.completed, 0);

    const result = {
      summary: {
        totalStarted,
        totalCompleted,
        overallCompletionRate: totalStarted > 0 ? Math.round((totalCompleted / totalStarted) * 1000) / 10 : 0,
        totalEmbeddables: Object.keys(embeddableAnalytics).length,
      },
      embeddables: Object.values(embeddableAnalytics),
      dailyTrends: dailyTrendsArray,
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
