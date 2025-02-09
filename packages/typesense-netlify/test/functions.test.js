const should = require('should');
const sinon = require('sinon');

// Mock the environment variables
process.env.TYPESENSE_HOST = 'localhost';
process.env.TYPESENSE_PORT = '8108';
process.env.TYPESENSE_PROTOCOL = 'http';
process.env.TYPESENSE_API_KEY = 'test-key';
process.env.TYPESENSE_INDEX_NAME = 'test-posts';
process.env.NETLIFY_KEY = 'test-netlify-key';

// Mock the dependencies
const mockIndexer = {
    deleteByQuery: sinon.stub().resolves(),
    saveObjects: sinon.stub().resolves()
};

// Mock the TypesenseIndexer class
const TypesenseIndexer = sinon.stub().returns(mockIndexer);

// Mock the transformToTypesenseObject function
const transformToTypesenseObject = sinon.stub().returns([
    { id: '1', type: 'post' },
    { id: '1_0', type: 'fragment' }
]);

// Override require calls
const proxyquire = require('proxyquire').noCallThru();
const postPublished = proxyquire('../functions/post-published', {
    '@magicpages/typesense-indexer': TypesenseIndexer,
    '@magicpages/typesense-fragmenter': { transformToTypesenseObject }
});

const postUnpublished = proxyquire('../functions/post-unpublished', {
    '@magicpages/typesense-indexer': TypesenseIndexer
});

describe('Netlify Functions', () => {
    beforeEach(() => {
        mockIndexer.deleteByQuery.reset();
        mockIndexer.saveObjects.reset();
        transformToTypesenseObject.reset();
    });

    describe('post-published', () => {
        it('should handle valid post publish webhook', async () => {
            const event = {
                body: JSON.stringify({
                    post: {
                        id: '1',
                        title: 'Test Post'
                    }
                }),
                queryStringParameters: {
                    key: 'test-netlify-key'
                }
            };

            const response = await postPublished.handler(event);

            should(response.statusCode).equal(200);
            should(transformToTypesenseObject.calledOnce).be.true();
            should(mockIndexer.deleteByQuery.calledOnce).be.true();
            should(mockIndexer.saveObjects.calledOnce).be.true();
        });

        it('should reject invalid key', async () => {
            const event = {
                body: JSON.stringify({ post: { id: '1' } }),
                queryStringParameters: {
                    key: 'wrong-key'
                }
            };

            const response = await postPublished.handler(event);
            should(response.statusCode).equal(401);
        });

        it('should handle missing post data', async () => {
            const event = {
                body: JSON.stringify({}),
                queryStringParameters: {
                    key: 'test-netlify-key'
                }
            };

            const response = await postPublished.handler(event);
            should(response.statusCode).equal(400);
        });
    });

    describe('post-unpublished', () => {
        it('should handle valid post unpublish webhook', async () => {
            const event = {
                body: JSON.stringify({
                    post: {
                        id: '1',
                        title: 'Test Post'
                    }
                }),
                queryStringParameters: {
                    key: 'test-netlify-key'
                }
            };

            const response = await postUnpublished.handler(event);

            should(response.statusCode).equal(200);
            should(mockIndexer.deleteByQuery.calledOnce).be.true();
            should(mockIndexer.deleteByQuery.firstCall.args[0])
                .equal('id:1* OR id:1_*');
        });

        it('should reject invalid key', async () => {
            const event = {
                body: JSON.stringify({ post: { id: '1' } }),
                queryStringParameters: {
                    key: 'wrong-key'
                }
            };

            const response = await postUnpublished.handler(event);
            should(response.statusCode).equal(401);
        });

        it('should handle missing post data', async () => {
            const event = {
                body: JSON.stringify({}),
                queryStringParameters: {
                    key: 'test-netlify-key'
                }
            };

            const response = await postUnpublished.handler(event);
            should(response.statusCode).equal(400);
        });
    });
}); 