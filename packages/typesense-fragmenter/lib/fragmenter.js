const cheerio = require('cheerio');
const { convert } = require('html-to-text');

/**
 * Utility function to extract text content from HTML while preserving some structure
 * @param {string} html HTML content to process
 * @returns {string} Processed text content
 */
const processHtmlContent = (html) => {
    return convert(html, {
        wordwrap: false,
        selectors: [
            { selector: 'img', format: 'skip' },
            { selector: 'a', options: { hideLinkHrefIfSameAsText: true } }
        ]
    })
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

/**
 * Extracts fragments from HTML content based on headings
 * @param {string} html HTML content to fragment
 * @returns {Array} Array of fragments with their headings and content
 */
const extractFragments = (html) => {
    const $ = cheerio.load(html);
    const fragments = [];
    let currentHeading = null;
    let currentContent = [];

    $('h1, h2, h3, h4, h5, h6, p, pre, td, li').each((_, element) => {
        const $el = $(element);
        const tagName = element.tagName.toLowerCase();
        
        if (tagName.match(/^h[1-6]$/)) {
            // If we have accumulated content, save it
            if (currentContent.length > 0) {
                fragments.push({
                    heading: currentHeading,
                    content: currentContent.join(' '),
                    anchor: currentHeading ? currentHeading.toLowerCase()
                        .replace(/[^\w\s-]/g, '')
                        .replace(/\s+/g, '-') : null
                });
                currentContent = [];
            }
            currentHeading = $el.text().trim();
        } else {
            currentContent.push(processHtmlContent($el.html()));
        }
    });

    // Push the last fragment if there's content
    if (currentContent.length > 0) {
        fragments.push({
            heading: currentHeading,
            content: currentContent.join(' '),
            anchor: currentHeading ? currentHeading.toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-') : null
        });
    }

    return fragments;
};

/**
 * Transforms Ghost posts into Typesense-compatible objects
 * @param {Array} posts Array of Ghost posts
 * @param {Array} ignoreSlugs Optional array of slugs to ignore
 * @returns {Array} Array of Typesense-compatible objects
 */
const transformToTypesenseObject = (posts, ignoreSlugs = []) => {
    const typesenseObjects = [];

    posts.forEach((post) => {
        // Skip if post slug is in ignoreSlugs
        if (ignoreSlugs.includes(post.slug)) {
            return;
        }

        // Extract fragments from the post content
        const fragments = extractFragments(post.html);

        // Create a base object with common properties
        const baseObject = {
            slug: post.slug,
            url: post.url,
            image: post.feature_image,
            title: post.title,
            tags: post.tags ? post.tags.map(tag => ({
                name: tag.name,
                slug: tag.slug
            })) : [],
            authors: post.authors ? post.authors.map(author => ({
                name: author.name,
                slug: author.slug
            })) : []
        };

        // Create a main document for the full post
        typesenseObjects.push({
            ...baseObject,
            id: post.id,
            type: 'post',
            content: processHtmlContent(post.html)
        });

        // Create separate documents for each content fragment
        fragments.forEach((fragment, index) => {
            typesenseObjects.push({
                ...baseObject,
                id: `${post.id}_${index}`,
                type: 'fragment',
                heading: fragment.heading,
                content: fragment.content,
                url: fragment.anchor ? `${post.url}#${fragment.anchor}` : post.url
            });
        });
    });

    return typesenseObjects;
};

module.exports = {
    transformToTypesenseObject,
    extractFragments,
    processHtmlContent
}; 