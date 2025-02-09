import { z } from 'zod';

/**
 * Ghost API configuration schema
 */
export const GhostConfigSchema = z.object({
  url: z.string().url(),
  key: z.string().min(1),
  version: z.string().default('v5.0')
});

/**
 * Typesense node configuration schema
 */
export const TypesenseNodeSchema = z.object({
  host: z.string(),
  port: z.number(),
  protocol: z.enum(['http', 'https']),
  path: z.string().optional()
});

/**
 * Typesense configuration schema
 */
export const TypesenseConfigSchema = z.object({
  nodes: z.array(TypesenseNodeSchema).min(1),
  apiKey: z.string().min(1),
  connectionTimeoutSeconds: z.number().optional(),
  retryIntervalSeconds: z.number().optional()
});

/**
 * Collection field configuration schema
 */
export const CollectionFieldSchema = z.object({
  name: z.string(),
  type: z.enum(['string', 'int32', 'int64', 'float', 'bool', 'string[]', 'int32[]', 'int64[]', 'float[]', 'bool[]']),
  facet: z.boolean().optional(),
  index: z.boolean().optional(),
  optional: z.boolean().optional(),
  sort: z.boolean().optional()
});

/**
 * Collection configuration schema
 */
export const CollectionConfigSchema = z.object({
  name: z.string(),
  fields: z.array(CollectionFieldSchema).min(1),
  default_sorting_field: z.string().optional()
});

/**
 * Main configuration schema
 */
export const ConfigSchema = z.object({
  ghost: GhostConfigSchema,
  typesense: TypesenseConfigSchema,
  collection: CollectionConfigSchema
});

/**
 * Type definitions derived from schemas
 */
export type GhostConfig = z.infer<typeof GhostConfigSchema>;
export type TypesenseNode = z.infer<typeof TypesenseNodeSchema>;
export type TypesenseConfig = z.infer<typeof TypesenseConfigSchema>;
export type CollectionField = z.infer<typeof CollectionFieldSchema>;
export type CollectionConfig = z.infer<typeof CollectionConfigSchema>;
export type Config = z.infer<typeof ConfigSchema>;

/**
 * Validates the configuration object against the schema
 * @param config The configuration object to validate
 * @returns The validated configuration object with types
 * @throws {ZodError} If validation fails
 */
export function validateConfig(config: unknown): Config {
  return ConfigSchema.parse(config);
}

/**
 * Default collection fields that should be included
 */
export const DEFAULT_COLLECTION_FIELDS: CollectionField[] = [
  { name: 'id', type: 'string' },
  { name: 'title', type: 'string' },
  { name: 'slug', type: 'string' },
  { name: 'html', type: 'string' },
  { name: 'excerpt', type: 'string' },
  { name: 'feature_image', type: 'string', optional: true },
  { name: 'published_at', type: 'int64' },
  { name: 'updated_at', type: 'int64' },
  { name: 'tags', type: 'string[]', facet: true, optional: true },
  { name: 'authors', type: 'string[]', facet: true, optional: true }
];

/**
 * Creates a default configuration object
 * @param ghostUrl The URL of the Ghost instance
 * @param ghostKey The Ghost Content API key
 * @param typesenseHost The Typesense host
 * @param typesenseApiKey The Typesense API key
 * @param collectionName The name of the collection (defaults to 'posts')
 * @returns A default configuration object
 */
export function createDefaultConfig(
  ghostUrl: string,
  ghostKey: string,
  typesenseHost: string,
  typesenseApiKey: string,
  collectionName = 'posts'
): Config {
  return {
    ghost: {
      url: ghostUrl,
      key: ghostKey,
      version: 'v5.0'
    },
    typesense: {
      nodes: [
        {
          host: typesenseHost,
          port: 443,
          protocol: 'https'
        }
      ],
      apiKey: typesenseApiKey
    },
    collection: {
      name: collectionName,
      fields: DEFAULT_COLLECTION_FIELDS
    }
  };
} 