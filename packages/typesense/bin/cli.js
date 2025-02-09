#!/usr/bin/env node
const prettyCLI = require('@tryghost/pretty-cli');
const ui = require('@tryghost/pretty-cli').ui;
const fs = require('fs-extra');
const utils = require('../lib/utils');
const GhostContentAPI = require('@tryghost/content-api');
const Typesense = require('typesense');

prettyCLI.preface('Command line utilities to batch index content from Ghost to Typesense');

prettyCLI.command({
    id: 'typesense',
    flags: 'index <pathToConfig>',
    desc: 'Run a batch index of all Ghost posts to Typesense',
    paramsDesc: ['Path to a valid config JSON file'],
    setup: (sywac) => {
        sywac.boolean('-V --verbose', {
            defaultValue: false,
            desc: 'Show verbose output'
        });
        sywac.array('-s --skip', {
            defaultValue: [],
            desc: 'Comma separated list of post slugs to exclude from indexing'
        });
        sywac.number('-l --limit', {
            desc: 'Amount of posts we want to fetch from Ghost'
        });
        sywac.number('-p --page', {
            desc: 'Use page to navigate through posts when setting a limit'
        });
        sywac.array('-sjs --skipjsonslugs', {
            defaultValue: false,
            desc: 'Exclude post slugs from config JSON file'
        });
    },
    run: async (argv) => {
        const mainTimer = Date.now();
        let context = {errors: [], posts: []};

        if (argv.verbose) {
            ui.log.info(`Received config file ${argv.pathToConfig}`);
        }

        // 1. Read the config files and verify everything
        try {
            const config = await fs.readJSON(argv.pathToConfig);
            context = Object.assign(context, config);

            utils.verifyConfig(context);
        } catch (error) {
            context.errors.push(error);
            return ui.log.error('Failed loading JSON config file:', context.errors);
        }

        // 2. Fetch all posts from the Ghost instance
        try {
            const timer = Date.now();
            const params = {limit: 'all', include: 'tags,authors'};
            const ghost = new GhostContentAPI({
                url: context.ghost.apiUrl,
                key: context.ghost.apiKey,
                version: 'canary'
            });

            if (argv.skip && argv.skip.length > 0) {
                const filterSlugs = argv.skip.join(',');
                params.filter = `slug:-[${filterSlugs}]`;
            }

            if (argv.limit) {
                params.limit = argv.limit;
            }

            ui.log.info(`Fetching ${params.limit} posts from Ghost...`);

            if (argv.page) {
                ui.log.info(`...from page #${argv.page}.`);
                params.page = argv.page;
            }

            context.posts = await ghost.posts.browse(params);

            ui.log.info(`Done fetching posts in ${Date.now() - timer}ms.`);
        } catch (error) {
            context.errors.push(error);
            return ui.log.error('Could not fetch posts from Ghost', context.errors);
        }

        // 3. Transform posts for Typesense
        try {
            const timer = Date.now();
            ui.log.info('Transforming posts for Typesense...');

            if (argv.skipjsonslugs) {
                const ignoreSlugsCount = context.ignore_slugs.length;
                ui.log.info(`Skipping the ${ignoreSlugsCount} slugs in ${argv.pathToConfig}`);
            }

            context.documents = context.posts.map(post => {
                if (!post.id || !post.published_at) {
                    ui.log.warn(`Post with title "${post.title}" is missing required fields`);
                }

                const timestamp = new Date(post.published_at).getTime();
                if (isNaN(timestamp)) {
                    ui.log.warn(`Post "${post.title}" has invalid published_at date: ${post.published_at}`);
                }

                return {
                    id: post.id,
                    title: post.title || '',
                    html: post.html || '',
                    custom_excerpt: post.custom_excerpt || '',
                    excerpt: post.excerpt || '',
                    url: post.url || '',
                    tags: post.tags ? post.tags.map(tag => tag.name) : [],
                    authors: post.authors ? post.authors.map(author => author.name) : [],
                    headings: [],
                    slug: post.slug || '',
                    published_at: timestamp || 0
                };
            });

            // Clean up posts array
            delete context.posts;

            ui.log.info(`Done transforming posts in ${Date.now() - timer}ms.`);
        } catch (error) {
            context.errors.push(error);
            return ui.log.error('Error transforming posts', context.errors);
        }

        // 4. Save to Typesense
        try {
            let timer = Date.now();
            ui.log.info('Connecting to Typesense and setting up collection...');

            const client = new Typesense.Client({
                nodes: context.typesense.nodes,
                apiKey: context.typesense.apiKey,
                connectionTimeoutSeconds: 2
            });

            // Create or update collection
            try {
                await client.collections(context.typesense.collection).delete();
            } catch (e) {
                // Collection may not exist, ignore error
            }

            // Create collection with schema
            const schema = {
                name: context.typesense.collection,
                enable_nested_fields: true,
                fields: [
                    {"name": "id", "type": "string"},
                    {"name": "title", "type": "string"},
                    {"name": "html", "type": "string"},
                    {"name": "custom_excerpt", "type": "string"},
                    {"name": "excerpt", "type": "string"},
                    {"name": "url", "type": "string"},
                    {"name": "tags", "type": "string[]", "facet": true},
                    {"name": "authors", "type": "string[]", "facet": true},
                    {"name": "headings", "type": "string[]"},
                    {"name": "slug", "type": "string", "facet": true},
                    {"name": "published_at", "type": "int64", "sort": true}
                ],
                default_sorting_field: "published_at"
            };

            await client.collections().create(schema);

            ui.log.info(`Done setting up Typesense collection in ${Date.now() - timer}ms.`);

            timer = Date.now();
            ui.log.info('Importing documents to Typesense...');

            try {
                await client.collections(context.typesense.collection).documents().import(context.documents);
            } catch (error) {
                if (error.importResults) {
                    const failedImports = error.importResults.filter(result => !result.success);
                    failedImports.forEach(result => {
                        ui.log.error(`Failed to import document ${result.document.id}:`, result.error);
                    });
                    
                    ui.log.info(`Successfully imported ${error.importResults.length - failedImports.length} documents`);
                    ui.log.error(`Failed to import ${failedImports.length} documents`);
                }
                throw error;
            }

            ui.log.ok(`${context.documents.length} Documents successfully imported to Typesense in ${Date.now() - timer}ms.`);
        } catch (error) {
            context.errors.push(error);
            return ui.log.error('Error importing documents', context.errors);
        }

        // Report success
        ui.log.ok(`Successfully indexed all the things in ${Date.now() - mainTimer}ms.`);
    }
});

prettyCLI.style({
    usageCommandPlaceholder: () => '<source or utility>'
});

prettyCLI.groupOrder([
    'Commands:',
    'Arguments:',
    'Required Options:',
    'Options:',
    'Global Options:'
]);

prettyCLI.parseAndExit();