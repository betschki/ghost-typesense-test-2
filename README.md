# @magicpages/ghost-typesense

Add powerful search to your Ghost blog with Typesense. This package provides everything you need:

- 🔍 **Search UI**: Beautiful, accessible search interface
- 🤖 **CLI Tool**: Easy content syncing and management
- 🪝 **Webhook Handler**: Real-time content updates

## Quick Start

### 1. Set Up Typesense

You'll need:
- A Typesense instance (self-hosted or cloud)
- Typesense API key with full admin access to sync Ghost's content to Typesense
- Search-only API key for the Search UI

### 2. Add Search to Your Theme

Add this to your Ghost theme's code injection (Settings → Code injection → Site Header):

```html
<script>
  window.__MP_SEARCH_CONFIG__ = {
    typesenseNodes: [{
      host: 'your-typesense-host',
      port: '443',
      protocol: 'https'
    }],
    typesenseApiKey: 'your-search-only-api-key',
    collectionName: 'ghost'
  };
</script>
<script src="https://unpkg.com/@magicpages/ghost-typesense-search-ui/dist/search.min.js"></script>
```

Press `/` to open search or use `#/search` in the URL.

### 3. Initial Content Sync

1. Install the CLI:
```bash
npm install -g @magicpages/ghost-typesense-cli
```

2. Create `ghost-typesense.config.json`:
```json
{
  "ghost": {
    "url": "https://your-ghost-blog.com",
    "key": "your-content-api-key",  // Get this by setting up a Custom Integration in Ghost Admin → Settings → Integrations
    "version": "v5.0"
  },
  "typesense": {
    "nodes": [{
      "host": "your-typesense-host",
      "port": 443,
      "protocol": "https"
    }],
    "apiKey": "your-admin-api-key"  // Use your Typesense admin API key here
  },
  "collection": {
    "name": "ghost"  // Must match the collectionName in your search config
  }
}
```

3. Initialize and sync:
```bash
ghost-typesense init --config ghost-typesense.config.json
ghost-typesense sync --config ghost-typesense.config.json
```

### 4. Set Up Real-Time Updates

This step ensures your search index stays in sync with your Ghost content, but you can skip it if you don't need real-time updates.

1. Deploy the webhook handler to Netlify:

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/magicpages/ghost-typesense)

2. Set these environment variables in Netlify (Site settings → Environment variables):
```bash
GHOST_URL=https://your-ghost-blog.com
GHOST_CONTENT_API_KEY=your-content-api-key  # Same as in config.json
TYPESENSE_HOST=your-typesense-host
TYPESENSE_API_KEY=your-admin-api-key  # Same as in config.json
COLLECTION_NAME=ghost  # Same as in config.json
WEBHOOK_SECRET=your-secret-key  # Create a secure random string
```

3. Create a new Custom Integration in Ghost (or reuse an existing one, if you already have one setup for this purpose):
   - Go to Ghost Admin → Settings → Integrations
   - Click "Add custom integration"
   - Give it a name, e.g. "Typesense Search"
   - Copy the Content API key (you'll need it for the config)

4. Add the webhook to your integration:
   - In the same integration, scroll to Webhooks
   - Click "Add webhook" and add the following four webhooks:

  | Name | Event | Target URL |
  |------|-------|------------|
  | Post published | Post published | `https://your-site.netlify.app/.netlify/functions/handler?secret=your-secret-key` |
  | Post updated | Post updated | `https://your-site.netlify.app/.netlify/functions/handler?secret=your-secret-key` |
  | Post deleted | Post deleted | `https://your-site.netlify.app/.netlify/functions/handler?secret=your-secret-key` |
  | Post unpublished | Post unpublished | `https://your-site.netlify.app/.netlify/functions/handler?secret=your-secret-key` |


Now your search index will automatically update when you publish, update, or delete posts!

## Packages

- [@magicpages/ghost-typesense-search-ui](packages/search-ui/README.md): Search interface
- [@magicpages/ghost-typesense-cli](packages/cli/README.md): CLI tool
- [@magicpages/ghost-typesense-webhook](packages/webhook-handler/README.md): Webhook handler

## License

MIT © [MagicPages](https://www.magicpages.co)