# @magicpages/ghost-typesense-config

Configuration types and utilities for Ghost-Typesense integration. This package provides type-safe configuration management for Ghost CMS and Typesense integration.

## Installation

```bash
npm install @magicpages/ghost-typesense-config
```

## Usage

```typescript
import type { Config } from '@magicpages/ghost-typesense-config';
import { validateConfig } from '@magicpages/ghost-typesense-config';

const config: Config = {
  ghost: {
    url: 'https://your-ghost-blog.com',
    key: 'your-content-api-key',
    version: 'v5.0'
  },
  typesense: {
    nodes: [{
      host: 'your-typesense-host',
      port: 443,
      protocol: 'https'
    }],
    apiKey: 'your-typesense-api-key',
    connectionTimeoutSeconds: 10,
    retryIntervalSeconds: 0.1
  },
  collection: {
    name: 'posts',
    fields: [
      { name: 'id', type: 'string' },
      { name: 'title', type: 'string', index: true, sort: true },
      { name: 'slug', type: 'string', index: true },
      { name: 'html', type: 'string', index: true },
      { name: 'excerpt', type: 'string', index: true },
      { name: 'feature_image', type: 'string', index: false, optional: true },
      { name: 'published_at', type: 'int64', sort: true },
      { name: 'updated_at', type: 'int64', sort: true },
      { name: 'tags', type: 'string[]', facet: true, optional: true },
      { name: 'authors', type: 'string[]', facet: true, optional: true }
    ]
  }
};

// Validate configuration
const result = validateConfig(config);
if (!result.success) {
  console.error('Invalid configuration:', result.error);
}
```

## Type Definitions

### `Config`

The main configuration type that includes all settings for Ghost and Typesense integration.

```typescript
interface Config {
  ghost: GhostConfig;
  typesense: TypesenseConfig;
  collection: CollectionConfig;
}
```

### `GhostConfig`

Configuration for connecting to Ghost CMS.

```typescript
interface GhostConfig {
  url: string;
  key: string;
  version: string;
}
```

### `TypesenseConfig`

Configuration for connecting to Typesense.

```typescript
interface TypesenseConfig {
  nodes: {
    host: string;
    port: number;
    protocol: 'http' | 'https';
  }[];
  apiKey: string;
  connectionTimeoutSeconds?: number;
  retryIntervalSeconds?: number;
}
```

### `CollectionConfig`

Configuration for the Typesense collection schema.

```typescript
interface CollectionConfig {
  name: string;
  fields: FieldConfig[];
}

interface FieldConfig {
  name: string;
  type: 'string' | 'int32' | 'int64' | 'float' | 'bool' | 'string[]' | 'int32[]' | 'int64[]' | 'float[]' | 'bool[]';
  index?: boolean;
  sort?: boolean;
  facet?: boolean;
  optional?: boolean;
}
```

## Validation

The package uses Zod for runtime type validation of configuration objects. The `validateConfig` function returns a type-safe result that indicates whether the configuration is valid.

## TypeScript Support

This package is written in TypeScript and includes full type definitions. It uses strict type checking and provides comprehensive type safety for all configuration options.

## License

MIT - see the [LICENSE](../../LICENSE) file for details. 