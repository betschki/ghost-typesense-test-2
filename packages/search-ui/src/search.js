import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter';
import instantsearch from 'instantsearch.js/dist/instantsearch.production.min';
import { searchBox, hits } from 'instantsearch.js/es/widgets';
import './styles.css';

(function () {
    let isInitialized = false;

    // Block Ghost's search script from loading
    Object.defineProperty(window, 'SodoSearch', {
        configurable: false,
        enumerable: false,
        get: () => ({
            init: () => { },
            preact: {
                render: () => { },
                h: () => { },
                Component: class { }
            }
        }),
        set: () => { }
    });

    // Remove any existing sodo-search elements and prevent new ones from being added
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1) { // Element node
                    // Remove script tags with data-sodo-search
                    if (node.tagName === 'SCRIPT' && node.hasAttribute('data-sodo-search')) {
                        node.remove();
                    }
                    // Remove the root div if it's added
                    if (node.id === 'sodo-search-root') {
                        node.remove();
                    }
                }
            }
        }
    });

    // Start observing before anything else
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    // Initial cleanup
    function cleanupGhostSearch() {
        // Remove any existing sodo-search elements
        const searchScript = document.querySelector('script[data-sodo-search]');
        if (searchScript) {
            searchScript.remove();
        }

        const searchRoot = document.getElementById('sodo-search-root');
        if (searchRoot) {
            searchRoot.remove();
        }
    }

    // Call it immediately
    cleanupGhostSearch();

    // Also call it when DOM is ready to catch any late additions
    document.addEventListener('DOMContentLoaded', cleanupGhostSearch);

    class MagicPagesSearch {
        constructor(config = {}) {
            // Prevent multiple instances
            if (isInitialized) {
                console.warn('MagicPagesSearch is already initialized');
                return window.magicSearch;
            }

            const defaultConfig = window.__MP_SEARCH_CONFIG__ || {
                typesenseNodes: [{
                    host: 'localhost',
                    port: '8108',
                    protocol: 'http'
                }],
                typesenseApiKey: null,
                collectionName: null,
                commonSearches: [], // Default to empty array
                theme: 'system', // 'light', 'dark', or 'system'
                searchFields: {
                    title: { weight: 4, highlight: true },
                    excerpt: { weight: 2, highlight: true },
                    html: { weight: 1, highlight: true }
                }
            };

            this.config = {
                // Ensure commonSearches is always an array
                commonSearches: [],
                ...defaultConfig,
                ...config,
                commonSearches: config.commonSearches || defaultConfig.commonSearches || []
            };

            if (!this.config.typesenseNodes || !this.config.typesenseApiKey || !this.config.collectionName) {
                throw new Error('MagicPagesSearch: Missing required configuration. Please ensure typesenseNodes, typesenseApiKey, and collectionName are provided.');
            }

            this.selectedIndex = -1;
            this.init();

            isInitialized = true;
        }

        getSearchParameters() {
            // Ensure we have at least some search fields configured
            const fields = Object.keys(this.config.searchFields || {}).length > 0
                ? this.config.searchFields
                : {
                    // Default fallback fields based on typical Ghost schema
                    title: { weight: 4, highlight: true },
                    excerpt: { weight: 2, highlight: true },
                    html: { weight: 1, highlight: true }
                };

            const searchFields = [];
            const weights = [];
            const highlightFields = [];

            Object.entries(fields).forEach(([field, config]) => {
                searchFields.push(field);
                weights.push(config.weight || 1);
                if (config.highlight) {
                    highlightFields.push(field);
                }
            });

            // Ensure we have at least one search field
            if (searchFields.length === 0) {
                console.warn('No search fields configured, falling back to title field');
                searchFields.push('title');
                weights.push(1);
                highlightFields.push('title');
            }

            return {
                query_by: searchFields.join(','),
                query_by_weights: weights.join(','),
                highlight_full_fields: highlightFields.join(','),
                highlight_affix_num_tokens: 20,
                include_fields: '*',  // Include all fields in the response
                typo_tolerance: true,
                num_typos: 1,
                per_page: 10
            };
        }

        createSearchModal() {
            const commonSearchesHtml = this.config.commonSearches?.length
                ? `
                    <div class="mp-common-searches">
                        <div class="mp-common-searches-title" role="heading" aria-level="2">
                            Common searches
                        </div>
                        <div id="mp-common-searches-container" role="list">
                            ${this.config.commonSearches.map(search => `
                                <button type="button" 
                                    class="mp-common-search-btn" 
                                    data-search="${search}"
                                    role="listitem">
                                    ${search}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `
                : `<div class="mp-common-searches">
                    <div class="mp-empty-message">Start typing to search...</div>
                  </div>`;

            const modalHtml = `
                <div id="mp-search-wrapper" data-theme="${this.config.theme}">
                    <div id="mp-search-modal" class="hidden" role="dialog" aria-modal="true" aria-label="Search">
                        <div class="mp-backdrop"></div>
                        <div class="mp-modal-container">
                            <button 
                                class="mp-close-button" 
                                aria-label="Close search"
                                onclick="this.closest('#mp-search-modal').dispatchEvent(new Event('close'))">
                                <span aria-hidden="true">×</span>
                            </button>
                            <div class="mp-modal-content">
                                <div class="mp-search-header">
                                    <div id="mp-searchbox" role="search"></div>
                                    <div class="mp-keyboard-hints">
                                        <span>
                                            <kbd class="mp-kbd">↑↓</kbd>
                                            to navigate
                                        </span>
                                        <span>
                                            <kbd class="mp-kbd">esc</kbd>
                                            to close
                                        </span>
                                    </div>
                                </div>
                                <div class="mp-results-container">
                                    ${commonSearchesHtml}
                                    <div id="mp-hits" role="region" aria-label="Search results"></div>
                                    <div id="mp-empty-state" class="hidden" role="status" aria-live="polite">
                                        <div class="mp-empty-message">
                                            <p>No results found for your search</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Create and append modal
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = modalHtml;
            document.body.appendChild(modalContainer.firstElementChild);
        }

        init() {
            this.createSearchModal();

            // Get modal reference after creation
            this.modal = document.getElementById('mp-search-modal');

            // Initialize theme before anything else
            this.handleThemeChange();

            const searchParameters = this.getSearchParameters();
            console.log('Search parameters:', searchParameters);

            // Initialize Typesense search with dynamic fields
            const typesenseInstantsearchAdapter = new TypesenseInstantSearchAdapter({
                server: {
                    apiKey: this.config.typesenseApiKey,
                    nodes: this.config.typesenseNodes
                },
                additionalSearchParameters: searchParameters
            });

            // Add console logging to help debug
            console.log('Typesense Configuration:', {
                nodes: this.config.typesenseNodes,
                collectionName: this.config.collectionName,
                searchParameters
            });

            this.search = instantsearch({
                indexName: this.config.collectionName,
                searchClient: typesenseInstantsearchAdapter.searchClient,
                searchFunction: (helper) => {
                    // Add debugging for search queries
                    console.log('Search query:', helper.state);
                    this.handleSearch(helper);
                }
            });

            // Initialize widgets and start search
            this.initWidgets();
            this.search.start();

            // Add event listeners after modal and search are initialized
            this.initEventListeners();
            this.attachCommonSearchListeners();

            // Check if we should open the modal
            if (window.location.hash === '#/search') {
                this.openModal();
            }
        }

        handleSearch(helper) {
            const container = document.getElementById('mp-hits');
            const commonSearches = document.querySelector('.mp-common-searches');
            const emptyState = document.getElementById('mp-empty-state');

            // Hide empty state by default
            if (emptyState && !helper.state.query) {
                emptyState.classList.add('hidden');
            }

            // If no query, hide results and show common searches
            if (!helper.state.query || !helper.state.query.trim()) {
                // Reset selection when showing common searches
                this.selectedIndex = -1;

                if (container) {
                    container.classList.add('hidden');
                }
                if (commonSearches) {
                    commonSearches.classList.remove('hidden');
                }
                if (emptyState) {
                    emptyState.classList.add('hidden');
                }
                return;
            }

            // Reset selection when showing search results
            this.selectedIndex = -1;

            // Hide common searches when there's a query
            if (commonSearches) {
                commonSearches.classList.add('hidden');
            }

            // Show the hits container for results
            if (container) {
                container.classList.remove('hidden');
            }

            // Perform the search
            helper.search();
        }

        initWidgets() {
            this.searchBox = searchBox({
                container: '#mp-searchbox',
                placeholder: 'Search for anything',
                autofocus: true,
                showReset: false,
                showSubmit: false,
                showLoadingIndicator: false,
                searchAsYouType: true,
                cssClasses: {
                    root: '',
                    form: '',
                    input: 'mp-search-input',
                    resetIcon: 'hidden',
                    submitIcon: 'hidden',
                }
            });

            this.search.addWidgets([
                this.searchBox,
                hits({
                    container: '#mp-hits',
                    cssClasses: {
                        root: '',
                        list: 'mp-hits-list',
                        item: ''
                    },
                    templates: {
                        item: (hit, { html, components }) => {
                            try {
                                // Create a temporary div to safely strip HTML
                                const div = document.createElement('div');
                                // Use excerpt if available, fall back to html
                                div.innerHTML = hit.excerpt || hit.html || '';
                                const text = div.textContent || div.innerText || '';

                                // Get first 120 characters and trim to last complete word
                                const excerpt = text
                                    .trim()
                                    .substring(0, 120)
                                    .replace(/\s+[^\s]*$/, '...');

                                // Handle highlighted results from Typesense
                                const title = hit._highlightResult?.title?.value || hit.title || 'Untitled';

                                return `
                                    <a href="${hit.url || '#'}" 
                                        class="mp-result-link"
                                        aria-label="${title.replace(/<[^>]*>/g, '')}">
                                       <article class="mp-result-item" role="article">
                                           <h3 class="mp-result-title" role="heading" aria-level="3">${title}</h3>
                                            <p class="mp-result-excerpt" aria-label="Article excerpt">${excerpt}</p>
                                        </article>
                                    </a>
                                        </h3>
                                `;
                            } catch (error) {
                                console.error('Error rendering hit:', error, hit);
                                return '';
                            }
                        },
                        empty: (results) => {
                            // Only show empty state if we have a query
                            if (results.query && results.query.trim()) {
                                const emptyState = document.getElementById('mp-empty-state');
                                const container = document.getElementById('mp-hits');

                                if (container) {
                                    container.classList.add('hidden');
                                }
                                if (emptyState) {
                                    emptyState.classList.remove('hidden');
                                } else {
                                    console.warn('Empty state element not found');
                                }
                            }
                            return '';
                        }
                    },
                    transformItems: (items) => {
                        // Simply return the items, state management is handled elsewhere
                        return items;
                    }
                })
            ]);
        }

        initEventListeners() {
            if (!this.modal) return;  // Guard clause

            // Handle hash change
            window.addEventListener('hashchange', () => {
                if (window.location.hash === '#/search') {
                    this.openModal();
                } else if (this.modal && !this.modal.classList.contains('hidden')) {
                    this.closeModal();
                }
            });

            // Modal close event
            this.modal.addEventListener('close', () => this.closeModal());

            // Prevent clicks on modal content from closing the modal
            const modalContent = this.modal.querySelector('.mp-modal-content');
            if (modalContent) {
                modalContent.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
            }

            // Close on click outside modal content
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal ||
                    e.target.classList.contains('mp-modal-container') ||
                    !e.target.closest('.mp-modal-content')) {
                    this.closeModal();
                }
            });

            // Handle Ghost's data-ghost-search buttons
            const searchButtons = document.querySelectorAll('[data-ghost-search]');
            searchButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();  // Prevent event from bubbling up

                    // Ensure any existing Ghost search initialization is prevented
                    if (window.SodoSearch && window.SodoSearch.init) {
                        window.SodoSearch.init = () => { };
                    }

                    // If search isn't initialized yet, initialize it first
                    if (!window.magicSearch) {
                        window.magicSearch = new MagicPagesSearch();
                    }

                    // Small delay to ensure DOM is ready
                    setTimeout(() => {
                        this.openModal();
                        const searchInput = document.querySelector('.mp-search-input');
                        if (searchInput) {
                            searchInput.focus();
                        }
                    }, 50);
                });
            });

            // Keyboard navigation
            document.addEventListener('keydown', (e) => this.handleKeydown(e));

            // Add cmd/ctrl + k shortcut (Ghost's default)
            document.addEventListener('keydown', (e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                    e.preventDefault();
                    this.openModal();
                }
            });
        }

        attachCommonSearchListeners() {
            const container = document.getElementById('mp-common-searches-container');
            if (!container) return;

            container.removeEventListener('click', this._handleCommonSearchClick);
            container.removeEventListener('touchend', this._handleCommonSearchClick);

            this._handleCommonSearchClick = (e) => {
                const btn = e.target.closest('.mp-common-search-btn');
                if (!btn) return;

                e.preventDefault();
                const searchTerm = btn.dataset.search;
                e.stopPropagation(); // Prevent any parent handlers from firing

                try {
                    const searchInput = document.querySelector('.mp-search-input');
                    if (searchInput) {
                        // Reset selection before updating input
                        this.selectedIndex = -1;

                        // Update input and trigger input event
                        searchInput.value = searchTerm;
                        searchInput.dispatchEvent(new Event('input', { bubbles: true }));

                        // Update InstantSearch helper and trigger search
                        this.search.helper.setQuery(searchTerm);
                        this.search.helper.search();

                        // Focus the input and set cursor position
                        setTimeout(() => {
                            searchInput.focus();
                            const length = searchInput.value.length;
                            searchInput.setSelectionRange(length, length);
                        }, 0);
                    }
                } catch (error) {
                    console.error('Error handling common search click:', error);
                }
            };

            container.addEventListener('click', this._handleCommonSearchClick);
            container.addEventListener('touchend', this._handleCommonSearchClick);
        }

        openModal() {
            this.modal.classList.remove('hidden');
            document.documentElement.style.overflow = 'hidden';
            document.body.setAttribute('aria-hidden', 'true');
            const searchInput = document.querySelector('.mp-search-input');
            if (searchInput) {
                searchInput.focus();
            }
            history.replaceState(null, null, '#/search');
        }

        closeModal() {
            this.modal.classList.add('hidden');
            document.documentElement.style.overflow = '';
            document.body.removeAttribute('aria-hidden');
            const searchInput = document.querySelector('.mp-search-input');
            if (searchInput) {
                searchInput.value = '';
            }
            this.search.helper.setQuery('').search();
            if (window.location.hash === '#/search') {
                history.replaceState(null, null, window.location.pathname);
            }
        }

        handleKeydown(e) {
            // Don't handle keyboard shortcuts if target is an input
            const isSearchInput = e.target.classList.contains('mp-search-input');

            // If we're in an input but not the search input, ignore shortcuts
            if (e.target.tagName === 'INPUT' && !isSearchInput) {
                return;
            }

            if (window.innerWidth < 640) return;

            // If the modal is hidden, only handle the open shortcut
            if (this.modal.classList.contains('hidden')) {
                if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    this.openModal();
                }
                return;
            }

            // Handle navigation
            switch (e.key) {
                case 'Escape':
                    e.preventDefault();
                    this.closeModal();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.navigateResults('next');
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.navigateResults('prev');
                    break;
                case 'Enter':
                    if (this.selectedIndex !== -1) {
                        e.preventDefault();
                        this.handleEnterKey();
                    }
                    break;
            }
        }

        navigateResults(direction) {
            const results = [...document.querySelectorAll('#mp-hits .mp-result-link, .mp-common-search-btn:not(.hidden)')].filter(
                el => el.offsetParent !== null && !el.closest('.hidden')
            );

            if (results.length === 0) return;

            if (this.selectedIndex === -1) {
                this.selectedIndex = direction === 'next' ? 0 : results.length - 1;
            } else {
                this.selectedIndex = direction === 'next'
                    ? (this.selectedIndex + 1) % results.length
                    : (this.selectedIndex - 1 + results.length) % results.length;
            }

            results.forEach(result => result.classList.remove('mp-selected'));
            const selectedElement = results[this.selectedIndex];
            selectedElement.classList.add('mp-selected');
            selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }

        handleEnterKey() {
            const results = [...document.querySelectorAll('#mp-hits .mp-result-link, .mp-common-search-btn:not(.hidden)')].filter(
                el => el.offsetParent !== null && !el.closest('.hidden')
            );

            if (this.selectedIndex >= 0 && this.selectedIndex < results.length) {
                const selectedElement = results[this.selectedIndex];
                if (selectedElement.classList.contains('mp-result-link')) {
                    const link = selectedElement;
                    if (link) window.location.href = link.href;
                } else {
                    const searchBox = document.querySelector('.mp-search-input');
                    searchBox.value = selectedElement.textContent.trim();
                    searchBox.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        }

        handleThemeChange() {
            const wrapper = document.getElementById('mp-search-wrapper');
            if (!wrapper) return;

            const setTheme = (isDark) => {
                wrapper.classList.toggle('dark', isDark);
            };

            // Remove any existing theme first
            wrapper.classList.remove('dark');

            switch (this.config.theme) {
                case 'dark':
                    setTheme(true);
                    break;
                case 'light':
                    setTheme(false);
                    break;
                case 'system':
                default:
                    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                    setTheme(mediaQuery.matches);
                    mediaQuery.addEventListener('change', (e) => setTheme(e.matches));
                    break;
            }
        }
    }

    // Export to window
    window.MagicPagesSearch = MagicPagesSearch;

    // Auto-initialize when the script loads
    document.addEventListener('DOMContentLoaded', () => {
        // Initialize if we have a config, if #/search is in the URL, or if there are search buttons
        if (window.__MP_SEARCH_CONFIG__ ||
            window.location.hash === '#/search' ||
            document.querySelectorAll('[data-ghost-search]').length > 0) {
            window.magicSearch = new MagicPagesSearch();
        }
    });
})();