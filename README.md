# @magicpages/ghost-typesense

A powerful, type-safe solution for integrating [Ghost](https://ghost.org/) with [Typesense](https://typesense.org/). This package provides the backend for real-time search capabilities on your Ghost blog by automatically syncing your content with Typesense. Inspired by the [Ghost Foundation's Algolia package](https://github.com/TryGhost/algolia).

## Overview

This monorepo provides a complete solution for integrating Ghost with Typesense:

- **CLI Tool**: Easily manage your Ghost content in Typesense with commands for initialization, syncing, and maintenance
- **Webhook Handler**: Keep your search index up-to-date in real-time with a Netlify-deployable webhook handler
- **Type-Safe Core**: Built with TypeScript and [ts-ghost](https://ts-ghost.dev/) for reliable API interactions
- **Flexible Configuration**: Customize field mappings and search settings to match your needs

This setup is used on [Magic Pages](https://www.magicpages.co)' managed Ghost CMS hosting to enable advanced search capabilities for customers on the Pro plan.

## Quick Start

### Prerequisites

Before you begin, ensure you have:

- Node.js 18 or later installed
- npm 10.2.4 or later installed
- A Ghost blog with Content API access
- A Typesense instance (self-hosted or cloud) with full API access (no search-only API keys)

## CLI Tool Setup

### Installation

Install the CLI tool globally:

```bash
npm install -g @magicpages/ghost-typesense-cli
```

### Configuration

Create a `ghost-typesense.config.json` file in your project:

```json
{
  "ghost": {
    "url": "https://your-ghost-blog.com",
    "key": "your-content-api-key",
    "version": "v5.0"
  },
  "typesense": {
    "nodes": [{
      "host": "your-typesense-host",
      "port": 443,
      "protocol": "https"
    }],
    "apiKey": "your-typesense-api-key",
    "connectionTimeoutSeconds": 10,
    "retryIntervalSeconds": 0.1
  },
  "collection": {
    "name": "posts",
    "fields": [
      { "name": "id", "type": "string" },
      { "name": "title", "type": "string", "index": true, "sort": true },
      { "name": "slug", "type": "string", "index": true },
      { "name": "html", "type": "string", "index": true },
      { "name": "excerpt", "type": "string", "index": true },
      { "name": "feature_image", "type": "string", "index": false, "optional": true },
      { "name": "published_at", "type": "int64", "sort": true },
      { "name": "updated_at", "type": "int64", "sort": true },
      { "name": "tags", "type": "string[]", "facet": true, "optional": true },
      { "name": "authors", "type": "string[]", "facet": true, "optional": true }
    ]
  }
}
```

### Field Configuration

The `fields` array in your configuration defines the schema for your Typesense collection. Each field object supports the following properties:

- `name` (required): The name of the field
- `type` (required): The data type. Supported types:
  - `string`: For text fields
  - `int32`/`int64`: For integer values
  - `float`: For decimal numbers
  - `bool`: For boolean values
  - `string[]`: For arrays of strings
  - `int32[]`/`int64[]`: For arrays of integers
  - `float[]`: For arrays of decimals
- `index` (optional): Whether the field should be searchable (default: false)
- `sort` (optional): Whether the field can be used for sorting (default: false)
- `facet` (optional): Whether the field can be used for faceted search (default: false)
- `optional` (optional): Whether the field is required (default: false)

### CLI Commands

Initialize your Typesense collection:
```bash
ghost-typesense init --config ./ghost-typesense.config.json
```

Perform initial content sync:
```bash
ghost-typesense sync --config ./ghost-typesense.config.json
```

Clear the search index:
```bash
ghost-typesense clear --config ./ghost-typesense.config.json
```

## Webhook Handler Setup

The webhook handler keeps your Typesense index in sync with your Ghost content in real-time.

### Deployment

Deploy the webhook handler to Netlify:

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/magicpages/ghost-typesense)

For detailed webhook handler setup and configuration, see the [webhook handler documentation](apps/webhook-handler/README.md).

## Package Structure

This monorepo contains the following packages:

- `@magicpages/ghost-typesense-cli`: Command-line interface for content management
- `@magicpages/ghost-typesense-webhook`: Netlify-deployable webhook handler
- `@magicpages/ghost-typesense-core`: Shared core functionality
- `@magicpages/ghost-typesense-config`: Configuration types and utilities

## Development

To contribute or modify the packages:

1. Clone the repository:
```bash
git clone https://github.com/magicpages/ghost-typesense.git
cd ghost-typesense
```

2. Install dependencies:
```bash
npm install
```

3. Build all packages:
```bash
npm run build
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.