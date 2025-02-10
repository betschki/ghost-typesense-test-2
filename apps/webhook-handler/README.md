# @magicpages/ghost-typesense-webhook

A Netlify Function that handles Ghost webhooks to keep your Typesense search index in sync with your Ghost content in real-time.

## Installation

```bash
npm install @magicpages/ghost-typesense-webhook
```

## Usage with Netlify

1. Install the package in your Netlify project
2. Create a `netlify.toml` configuration:

```toml
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

[functions.ghost-typesense]
  external_node_modules = ["@netlify/functions"]
```

3. Create the function in your Netlify functions directory:

```typescript
// netlify/functions/ghost-typesense.ts
import { handler } from '@magicpages/ghost-typesense-webhook';
export { handler };
```

4. Configure environment variables in your Netlify dashboard:

```env
GHOST_URL=https://your-ghost-blog.com
GHOST_ADMIN_API_KEY=your-admin-api-key
GHOST_WEBHOOK_SECRET=your-webhook-secret
TYPESENSE_HOST=your-typesense-host
TYPESENSE_PORT=443
TYPESENSE_PROTOCOL=https
TYPESENSE_API_KEY=your-typesense-api-key
TYPESENSE_COLLECTION_NAME=posts
```

5. Configure the webhook in Ghost Admin:
   - Go to Settings > Integrations
   - Create a new Custom Integration
   - Add a webhook with the following settings:
     - Event: Post published/updated/unpublished
     - Target URL: Your Netlify function URL (e.g., `https://your-site.netlify.app/.netlify/functions/ghost-typesense`)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GHOST_URL` | URL of your Ghost blog |
| `GHOST_ADMIN_API_KEY` | Ghost Admin API key |
| `GHOST_WEBHOOK_SECRET` | Secret for validating webhook requests |
| `TYPESENSE_HOST` | Typesense server host |
| `TYPESENSE_PORT` | Typesense server port |
| `TYPESENSE_PROTOCOL` | Typesense server protocol (http/https) |
| `TYPESENSE_API_KEY` | Typesense API key |
| `TYPESENSE_COLLECTION_NAME` | Name of the Typesense collection |

## Webhook Events

The handler processes the following Ghost webhook events:

- `post.published`: Adds or updates the post in Typesense
- `post.updated`: Updates the post in Typesense
- `post.unpublished`: Removes the post from Typesense
- `post.deleted`: Removes the post from Typesense

## Security

The webhook handler validates incoming requests using the `GHOST_WEBHOOK_SECRET`. Make sure to:

1. Generate a secure random string for your webhook secret
2. Configure the same secret in both Ghost and your environment variables
3. Keep your secret secure and never commit it to version control

## Error Handling

The handler includes comprehensive error handling:

- Validates webhook signatures
- Validates request payloads
- Handles Ghost API errors
- Handles Typesense errors
- Returns appropriate HTTP status codes

## TypeScript Support

This package is written in TypeScript and includes full type definitions. It uses strict type checking and provides comprehensive type safety for all APIs.

## License

MIT - see the [LICENSE](../../LICENSE) file for details.