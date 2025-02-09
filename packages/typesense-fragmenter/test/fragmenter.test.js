const should = require('should');
const {transformToTypesenseObject, extractFragments, processHtmlContent} = require('../lib/fragmenter');

describe('Typesense Fragmenter', () => {
    describe('processHtmlContent', () => {
        it('should convert HTML to plain text', () => {
            const html = '<p>Hello <strong>world</strong>!</p>';
            const result = processHtmlContent(html);
            should(result).equal('Hello world!');
        });

        it('should handle multiple lines', () => {
            const html = '<p>Line 1</p>\\n<p>Line 2</p>';
            const result = processHtmlContent(html);
            should(result).equal('Line 1 Line 2');
        });
    });

    describe('extractFragments', () => {
        it('should extract fragments based on headings', () => {
            const html = `
                <h1>Main Title</h1>
                <p>First paragraph</p>
                <h2>Section 1</h2>
                <p>Section content</p>
            `;
            const fragments = extractFragments(html);
            should(fragments).have.length(2);
            should(fragments[0]).have.properties({
                heading: 'Main Title',
                content: 'First paragraph',
                anchor: 'main-title'
            });
            should(fragments[1]).have.properties({
                heading: 'Section 1',
                content: 'Section content',
                anchor: 'section-1'
            });
        });

        it('should handle content without headings', () => {
            const html = '<p>Just a paragraph</p>';
            const fragments = extractFragments(html);
            should(fragments).have.length(1);
            should(fragments[0]).have.properties({
                heading: null,
                content: 'Just a paragraph',
                anchor: null
            });
        });
    });

    describe('transformToTypesenseObject', () => {
        it('should transform Ghost posts into Typesense objects', () => {
            const posts = [{
                id: '1',
                slug: 'test-post',
                url: 'https://example.com/test-post',
                html: '<h1>Test</h1><p>Content</p>',
                feature_image: 'image.jpg',
                title: 'Test Post',
                tags: [{name: 'Test', slug: 'test'}],
                authors: [{name: 'Author', slug: 'author'}]
            }];

            const result = transformToTypesenseObject(posts);
            should(result).have.length(2); // Main post + 1 fragment
            
            // Check main post
            should(result[0]).have.properties({
                id: '1',
                type: 'post',
                slug: 'test-post',
                title: 'Test Post'
            });

            // Check fragment
            should(result[1]).have.properties({
                id: '1_0',
                type: 'fragment',
                heading: 'Test',
                content: 'Content'
            });
        });

        it('should respect ignoreSlugs', () => {
            const posts = [{
                id: '1',
                slug: 'ignore-me',
                url: 'https://example.com/ignore-me',
                html: '<p>Content</p>',
                title: 'Ignore This'
            }];

            const result = transformToTypesenseObject(posts, ['ignore-me']);
            should(result).have.length(0);
        });
    });
}); 