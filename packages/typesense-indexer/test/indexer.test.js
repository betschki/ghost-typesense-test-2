const should = require('should');
const sinon = require('sinon');
const TypesenseIndexer = require('../lib/indexer');

describe('Typesense Indexer', () => {
    let indexer;
    let mockClient;
    let mockCollection;
    let mockDocuments;

    beforeEach(() => {
        // Create mock Typesense client and methods
        mockDocuments = {
            import: sinon.stub().resolves([{ success: true }]),
            delete: sinon.stub().resolves({ num_deleted: 1 })
        };

        mockCollection = {
            delete: sinon.stub().resolves(),
            documents: sinon.stub().returns(mockDocuments)
        };

        mockClient = {
            collections: sinon.stub().returns(mockCollection),
        };

        // Create indexer instance with test config
        indexer = new TypesenseIndexer({
            host: 'localhost',
            port: 8108,
            protocol: 'http',
            apiKey: 'test-key',
            indexName: 'test-index'
        });

        // Replace the real client with our mock
        indexer.client = mockClient;
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('initializeIndex', () => {
        it('should create index with correct schema', async () => {
            mockCollection.create = sinon.stub().resolves();

            await indexer.initializeIndex();

            should(mockCollection.delete.calledOnce).be.true();
            should(mockCollection.create.calledOnce).be.true();
            
            const schema = mockCollection.create.firstCall.args[0];
            should(schema).have.property('name', 'test-index');
            should(schema.fields).be.an.Array();
            should(schema.fields).have.length(10);
        });

        it('should handle non-existent index during deletion', async () => {
            mockCollection.delete = sinon.stub().rejects(new Error('Not found'));
            mockCollection.create = sinon.stub().resolves();

            await indexer.initializeIndex();

            should(mockCollection.create.calledOnce).be.true();
        });
    });

    describe('saveObjects', () => {
        it('should save documents to index', async () => {
            const documents = [
                { id: '1', title: 'Test' },
                { id: '2', title: 'Test 2' }
            ];

            await indexer.saveObjects(documents);

            should(mockDocuments.import.calledOnce).be.true();
            should(mockDocuments.import.firstCall.args[0]).equal(documents);
        });

        it('should handle empty documents array', async () => {
            await indexer.saveObjects([]);
            should(mockDocuments.import.called).be.false();
        });

        it('should handle failed documents', async () => {
            mockDocuments.import.resolves([
                { success: true },
                { success: false, error: 'Failed' }
            ]);

            const result = await indexer.saveObjects([{ id: '1' }, { id: '2' }]);
            should(result).have.length(2);
            should(result[1].success).be.false();
        });
    });

    describe('deleteObjects', () => {
        it('should delete documents by ID', async () => {
            const mockDelete = sinon.stub().resolves({ success: true });
            mockCollection.documents = sinon.stub().returns({ delete: mockDelete });

            await indexer.deleteObjects(['1', '2']);

            should(mockCollection.documents.callCount).equal(2);
            should(mockDelete.calledTwice).be.true();
        });

        it('should handle empty ID array', async () => {
            await indexer.deleteObjects([]);
            should(mockCollection.documents.called).be.false();
        });
    });

    describe('deleteByQuery', () => {
        it('should delete documents by query', async () => {
            const query = 'type:post';
            await indexer.deleteByQuery(query);

            should(mockDocuments.delete.calledOnce).be.true();
            should(mockDocuments.delete.firstCall.args[0])
                .have.property('filter_by', query);
        });

        it('should handle delete errors', async () => {
            mockDocuments.delete.rejects(new Error('Delete failed'));

            await should(indexer.deleteByQuery('type:post'))
                .be.rejectedWith('Delete failed');
        });
    });
}); 