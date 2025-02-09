# Ghost Typesense Webhook Handler

A production-ready Netlify Function that keeps your [Typesense](https://typesense.org/) search index synchronized with your [Ghost](https://ghost.org/) blog content in real-time. This webhook handler automatically processes content updates from Ghost and reflects them in your Typesense search index.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/magicpages/ghost-typesense)

## Features

The webhook handler provides seamless integration between Ghost and Typesense. It enables real-time content synchronization and automatic handling of post publishing, updates, unpublishing, and deleting. The handler implements type-safe request processing with runtime validation and includes comprehensive error handling and logging capabilities.

## Deployment

### Option 1: One-Click Deploy (Recommended)

1. Click the "Deploy to Netlify" button above
2. Connect your GitHub account
3. Configure the required environment variables
4. Deploy the function

### Option 2: Manual Deployment

1. Clone the repository:
```bash
git clone https://github.com/magicpages/ghost-typesense.git
cd ghost-typesense
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Deploy using the Netlify CLI:
```bash
netlify deploy --prod
```

## Configuration

### Environment Variables

Configure the following environment variables in your Netlify dashboard:

| Variable | Description | Example |
|----------|-------------|---------|
| `GHOST_URL` | Your Ghost blog URL | `https://blog.example.com` |
| `GHOST_CONTENT_API_KEY` | Ghost Content API key | `1234abcd...` |
| `TYPESENSE_HOST` | Typesense server host | `search.example.com` |
| `TYPESENSE_API_KEY` | Typesense API key (full API access, not search-only) | `xyz789...` |
| `COLLECTION_NAME` | Typesense collection name | `posts` |
| `WEBHOOK_SECRET` | A secure random string to validate webhook requests | `your-secret-key` |

### Ghost Integration Setup

1. Access your Ghost Admin panel
2. Navigate to Settings → Integrations
3. Click "Add custom integration"
4. Name your integration (e.g., "Typesense Search")
5. Copy the Content API Key
6. Generate a secure random string for your webhook secret:
   ```bash
   openssl rand -hex 32
   ```
7. Under Webhooks, add the following webhooks:

| Name | Event | Target URL |
|------|--------|------------|
| Post published | Post published | `https://your-netlify-site.netlify.app/.netlify/functions/handler?secret=your-secret-key` |
| Post updated | Post updated | `https://your-netlify-site.netlify.app/.netlify/functions/handler?secret=your-secret-key` |
| Post unpublished | Post unpublished | `https://your-netlify-site.netlify.app/.netlify/functions/handler?secret=your-secret-key` |
| Post deleted | Post deleted | `https://your-netlify-site.netlify.app/.netlify/functions/handler?secret=your-secret-key` |

Make sure to replace `your-secret-key` with the same secure random string you set in your Netlify environment variables.

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with your configuration:
```env
GHOST_URL=https://your-blog.ghost.io
GHOST_CONTENT_API_KEY=your_content_api_key
TYPESENSE_HOST=your_typesense_host
TYPESENSE_API_KEY=your_typesense_api_key
COLLECTION_NAME=posts
WEBHOOK_SECRET=your-development-secret
```

3. Start the development server:
```bash
npm run dev
```

4. Send webhook events to the local server from a local Ghost instance, including your secret:
   `http://localhost:8888/.netlify/functions/handler?secret=your-development-secret`

## License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.