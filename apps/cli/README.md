# @magicpages/ghost-typesense-cli

A command-line interface for managing Ghost content in Typesense. This tool provides commands for initializing collections, syncing content, and maintaining your search index.

## Installation

```bash
npm install -g @magicpages/ghost-typesense-cli
```

## Usage

The CLI provides three main commands:

### Initialize Collection

Creates or recreates the Typesense collection with the specified schema:

```bash
ghost-typesense init --config ./ghost-typesense.config.json
```

### Sync Content

Performs a full sync of all Ghost content to Typesense:

```bash
ghost-typesense sync --config ./ghost-typesense.config.json
```

### Clear Collection

Removes all documents from the Typesense collection:

```bash
ghost-typesense clear --config ./ghost-typesense.config.json
```

## Configuration

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

## Field Configuration

The `fields` array in your configuration defines the schema for your Typesense collection. Each field object supports:

- `name` (required): Field name
- `type` (required): Data type (`string`, `int32`, `int64`, `float`, `bool`, `string[]`, etc.)
- `index` (optional): Whether the field is searchable
- `sort` (optional): Whether the field can be used for sorting
- `facet` (optional): Whether the field can be used for faceted search
- `optional` (optional): Whether the field is required

## License

MIT - see the [LICENSE](../../LICENSE) file for details. 