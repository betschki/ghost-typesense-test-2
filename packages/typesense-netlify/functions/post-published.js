require('dotenv').config();
const TypesenseIndexer = require('@magicpages/typesense-indexer');
const { transformToTypesenseObject } = require('@magicpages/typesense-fragmenter');

// Initialize Typesense client
const indexer = new TypesenseIndexer({
    host: process.env.TYPESENSE_HOST,
    port: process.env.TYPESENSE_PORT || 8108,
    protocol: process.env.TYPESENSE_PROTOCOL || 'https',
    apiKey: process.env.TYPESENSE_API_KEY,
    indexName: process.env.TYPESENSE_INDEX_NAME || 'posts'
});

const validateWebhook = (event) => {
    const netlifyKey = process.env.NETLIFY_KEY;
    if (netlifyKey) {
        const queryKey = event.queryStringParameters.key;
        if (queryKey !== netlifyKey) {
            throw new Error('Invalid key');
        }
    }
};

exports.handler = async (event) => {
    try {
        // Validate webhook
        validateWebhook(event);

        // Parse the incoming webhook data
        const { post } = JSON.parse(event.body);

        if (!post) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'No post data received' })
            };
        }

        // Transform the post into Typesense objects
        const objects = transformToTypesenseObject([post]);

        // Delete any existing documents for this post
        await indexer.deleteByQuery(`id:${post.id}* OR id:${post.id}_*`);

        // Index the new/updated documents
        await indexer.saveObjects(objects);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Post indexed successfully',
                postId: post.id,
                objectCount: objects.length
            })
        };
    } catch (error) {
        console.error('Error processing webhook:', error);
        return {
            statusCode: error.message === 'Invalid key' ? 401 : 500,
            body: JSON.stringify({ error: error.message })
        };
    }
}; 