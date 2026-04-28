# Splainer Local

A local clone of splainer.io for debugging search queries and analyzing Solr responses.

## Features

- Search interface with collapsible/expandable results
- OAuth authentication with token caching
- Detailed score explanations
- Document field inspection
- Debug information viewer
- Facet analysis

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create your config file:
```bash
cp config.json.example config.json
```

3. Edit `config.json` with your credentials:
```json
{
  "tenantId": "your-tenant-id",
  "siteId": "your-site-id",
  "appKey": "your-app-key",
  "appSecret": "your-app-secret",
  "baseUrl": "https://t<tenantId>.<pod>.kibocommerce.com",
  "searchHost": "https://t<tenantId>-s<siteId>.<pod>.kibocommerce.com"
}
```

- **`baseUrl`** — tenant host used for OAuth (e.g. `https://t1000xxx.sb.usc1.gcp.kibocommerce.com`). Legacy Mozu sandboxes use `https://t<tenantId>.sandbox.mozu.com`.
- **`searchHost`** — site-scoped host the `/search` request is sent to (e.g. `https://t1000xxx-s1000xxx.sb.usc1.gcp.kibocommerce.com`). Legacy: `https://t<tenantId>-s<siteId>.sandbox.mozu.com`. See `config.json.example` for the placeholder format.

4. Start the server:
```bash
npm start
```

5. Open your browser to http://localhost:3000

## Usage

1. Enter your search query
2. (Optional) Modify search settings and field spec
3. Click "Search"
4. Expand/collapse sections to explore results
5. View score explanations for each document

## Search Parameters

- **Query**: The search term(s)
- **Search Settings**: Search configuration name (default: "test")
- **Field Spec**: Fields to return (default: "*" for all)

## Response Sections

- **Response Header**: Request parameters and metadata
- **Documents**: Search results with scores and fields
- **Score Explanation**: Detailed breakdown of how each score was calculated
- **Facets**: Facet counts and aggregations
- **Debug Information**: Timing, query parsing, and other debug data
