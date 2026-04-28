const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Load config
let config;
try {
  config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
} catch (err) {
  console.error('ERROR: config.json not found. Please copy config.json.example to config.json and fill in your credentials.');
  process.exit(1);
}

// Token cache
let tokenCache = {
  accessToken: null,
  expiration: null
};

// Auth function
async function getAccessToken() {
  const now = Date.now();

  // Return cached token if still valid
  if (tokenCache.accessToken && tokenCache.expiration && tokenCache.expiration > now) {
    return tokenCache.accessToken;
  }

  // Get new token
  try {
    const response = await fetch(`${config.baseUrl}/api/platform/applications/authtickets/oauth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: config.appKey,
        client_secret: config.appSecret
      })
    });

    if (!response.ok) {
      throw new Error(`Auth failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    tokenCache.accessToken = data.access_token;
    tokenCache.expiration = now + (50 * 60 * 1000); // 50 minutes

    console.log('New access token obtained');
    return tokenCache.accessToken;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}

// Search endpoint
app.post('/api/search', async (req, res) => {
  try {
    const { query, searchSettings, fieldSpec } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Get access token
    const accessToken = await getAccessToken();

    // Build search URL
    if (!config.searchHost) {
      throw new Error('searchHost is required in config.json (e.g. "https://t1000xxx-s1000xxx.sb.usc1.gcp.kibocommerce.com")');
    }
    const searchUrl = `${config.searchHost.replace(/\/$/, '')}/search`;
    const params = new URLSearchParams({
      query: query,
      searchSettings: searchSettings || 'test',
      fieldSpec: fieldSpec || '*',
      fl: '*',
      wt: 'json',
      debug: 'true',
      'debug.explain.structured': 'true',
      hl: 'false',
      rows: '10'
    });

    const fullUrl = `${searchUrl}?${params.toString()}`;

    console.log(`Searching for: ${query}`);

    // Make search request
    const searchResponse = await fetch(fullUrl, {
      headers: {
        'x-vol-site': config.siteId,
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!searchResponse.ok) {
      throw new Error(`Search failed: ${searchResponse.status} ${searchResponse.statusText}`);
    }

    // Get response as text first to handle JSONP or BOM issues
    let responseText = await searchResponse.text();

    // Remove BOM if present
    if (responseText.charCodeAt(0) === 0xFEFF) {
      responseText = responseText.slice(1);
    }

    // Strip JSONP callback if present (pattern: callbackName({...}))
    const jsonpMatch = responseText.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*\((.*)\);?\s*$/);
    if (jsonpMatch) {
      responseText = jsonpMatch[1];
    }

    const searchData = JSON.parse(responseText);
    res.json(searchData);

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    config: {
      tenantId: config.tenantId,
      siteId: config.siteId
    }
  });
});

app.listen(PORT, () => {
  console.log(`\nSplainer Local is running!`);
  console.log(`Open http://localhost:${PORT} in your browser\n`);
  console.log(`Tenant: ${config.tenantId}, Site: ${config.siteId}`);
});
