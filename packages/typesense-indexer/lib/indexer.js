const Typesense = require('typesense');
const debug = require('debug')('typesense-indexer');

class TypesenseIndexer {
    constructor(config) {
        this.client = new Typesense.Client({
            nodes: [{
                host: config.host,
                port: config.port,
                protocol: config.protocol
            }],
            apiKey: config.apiKey,
            connectionTimeoutSeconds: 2
        });

        this.indexName = config.indexName;
    }

    /**
     * Initialize the search index with the correct schema
     * @returns {Promise} Resolves when the index is ready
     */
    async initializeIndex() {
        try {
            await this.client.collections(this.indexName).delete();
            debug('Deleted existing index');
        } catch (err) {
            debug('Index did not exist, proceeding with creation');
        }

        const schema = {
            name: this.indexName,
            fields: [
                { name: 'id', type: 'string' },
                { name: 'type', type: 'string' },
                { name: 'slug', type: 'string' },
                { name: 'url', type: 'string' },
                { name: 'title', type: 'string' },
                { name: 'content', type: 'string' },
                { name: 'heading', type: 'string', optional: true },
                { name: 'image', type: 'string', optional: true },
                { name: 'tags', type: 'object[]', optional: true },
                { name: 'authors', type: 'object[]', optional: true }
            ],
            default_sorting_field: 'id'
        };

        await this.client.collections().create(schema);
        debug('Created index with schema');
    }

    /**
     * Save a batch of documents to the index
     * @param {Array} documents Array of documents to index
     * @returns {Promise} Resolves when the documents are indexed
     */
    async saveObjects(documents) {
        if (!documents || !documents.length) {
            debug('No documents to index');
            return;
        }

        try {
            const result = await this.client
                .collections(this.indexName)
                .documents()
                .import(documents);

            debug(`Indexed ${result.length} documents`);
            
            // Check for any failed items
            const failed = result.filter(item => item.success === false);
            if (failed.length > 0) {
                debug(`Failed to index ${failed.length} documents:`, failed);
            }

            return result;
        } catch (error) {
            debug('Error indexing documents:', error);
            throw error;
        }
    }

    /**
     * Delete objects from the index
     * @param {Array} objectIds Array of object IDs to delete
     * @returns {Promise} Resolves when the objects are deleted
     */
    async deleteObjects(objectIds) {
        if (!objectIds || !objectIds.length) {
            debug('No objects to delete');
            return;
        }

        try {
            const promises = objectIds.map(id =>
                this.client
                    .collections(this.indexName)
                    .documents(id)
                    .delete()
                    .catch(err => {
                        debug(`Error deleting object ${id}:`, err);
                        return { success: false, id };
                    })
            );

            const results = await Promise.all(promises);
            debug(`Deleted ${results.length} objects`);
            return results;
        } catch (error) {
            debug('Error deleting objects:', error);
            throw error;
        }
    }

    /**
     * Delete objects by query
     * @param {Object} query Query to match objects to delete
     * @returns {Promise} Resolves when the objects are deleted
     */
    async deleteByQuery(query) {
        try {
            const result = await this.client
                .collections(this.indexName)
                .documents()
                .delete({ filter_by: query });

            debug(`Deleted ${result.num_deleted} objects by query`);
            return result;
        } catch (error) {
            debug('Error deleting objects by query:', error);
            throw error;
        }
    }
}

module.exports = TypesenseIndexer; 