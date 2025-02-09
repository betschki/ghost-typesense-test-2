# Typesense Ghost CLI

CLI tool to index Ghost content into a Typesense search index.

## Install

```bash
npm install @tryghost/typesense --save
```

or

```bash
yarn add @tryghost/typesense
```

## Usage

1. First, install the dependencies:
```bash
yarn install
# or
npm install
```

2. Create a configuration file by copying the example:
```bash
cp example.config.json config.json
```

3. Update the config.json with your credentials:
```json
{
  "ghost": {
    "apiKey": "YOUR_GHOST_CONTENT_API_KEY",
    "apiUrl": "https://your-ghost-blog.com"
  },
  "typesense": {
    "nodes": [{
      "host": "your-typesense-host",
      "port": "8108",
      "protocol": "https"
    }],
    "apiKey": "YOUR_TYPESENSE_API_KEY",
    "collection": "posts"
  }
}
```

4. Run the indexing command:
```bash
yarn typesense index config.json
```

### Configuration Options

#### Ghost Settings
- `apiKey`: Your Ghost Content API key
- `apiUrl`: URL of your Ghost blog
- `ignore_slugs`: Array of post slugs to exclude from indexing

#### Typesense Settings
- `nodes`: Array of Typesense node configurations
  - `host`: Hostname of your Typesense server
  - `port`: Port number (default: 8108)
  - `protocol`: http or https
- `apiKey`: Your Typesense API key
- `collection`: Name of the collection to store posts
- `collectionSettings`: Schema configuration for the collection

### Command Line Options

- `-V, --verbose`: Show detailed output during indexing
- `-s, --skip`: Comma-separated list of post slugs to exclude
  ```bash
  yarn typesense index config.json -s post-slug-1,post-slug-2
  ```
- `-l, --limit`: Limit the number of posts to index
  ```bash
  yarn typesense index config.json -l 100
  ```
- `-p, --page`: Specify which page of posts to fetch (use with limit)
  ```bash
  yarn typesense index config.json -l 100 -p 2
  ```
- `-sjs, --skipjsonslugs`: Use the ignore_slugs from config.json instead of command line

### Example Collection Schema

The default schema includes:
```json
{
  "fields": [
    {"name": "title", "type": "string"},
    {"name": "html", "type": "string"},
    {"name": "custom_excerpt", "type": "string"},
    {"name": "excerpt", "type": "string"},
    {"name": "url", "type": "string"},
    {"name": "tags", "type": "string[]", "facet": true},
    {"name": "authors", "type": "string[]", "facet": true},
    {"name": "headings", "type": "string[]"},
    {"name": "slug", "type": "string", "facet": true},
    {"name": "customRanking", "type": "object"}
  ],
  "default_sorting_field": "customRanking"
}
```

### Differences from Algolia

1. Schema Definition: Typesense requires explicit schema definition in the configuration
2. No Content Fragmentation: Unlike Algolia, content is indexed as whole documents
3. Different Ranking: Uses Typesense's built-in ranking mechanisms
4. Simpler Setup: Direct integration without need for additional indexer package

## Development

This is a mono repository, managed with [lerna](https://lernajs.io/).

1. `git clone` this repo & `cd` into it
2. Run `yarn` to install dependencies
3. Run `yarn dev` for development

## Testing

- `yarn lint`: Run ESLint
- `yarn test`: Run tests and linting

## License

Copyright (c) 2013-2025 Ghost Foundation - Released under the [MIT license](LICENSE). 