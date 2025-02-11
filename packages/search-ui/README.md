# @magicpages/ghost-typesense-search-ui

A beautiful, accessible, and customizable search interface for Ghost blogs using Typesense. Built with vanilla JavaScript for maximum compatibility and minimal overhead.

![Search UI Preview](https://raw.githubusercontent.com/magicpages/ghost-typesense/main/packages/search-ui/preview.png)

## Features

- 🔍 Real-time search with Typesense
- 🎨 Replaces the default search modal with a beautiful, accessible, and customizable search interface
- 🌓 Automatic dark mode support
- ⌨️ Full keyboard navigation
- 📱 Responsive design
- ♿ WCAG accessible
- 🎯 Common searches support
- 💅 Customizable styling

## Installation

Ghost's configuration allows you to replace the default search script: https://ghost.org/docs/config/#search

The most comprehensive way to use this package is to upload the `dist/search.min.js` file to your Ghost theme and replace the default search script by adding the following configuration to your config.[environment].json file:

```
"sodoSearch": {
    "url": "[link to your search.min.js file]"
}
```
As an alternative, you can set the following environment variable:

```
sodoSearch__url=[link to your search.min.js file]
```

A second approach is to install the package directly as a dependency in your theme. 
```bash
npm install @magicpages/ghost-typesense-search-ui
```

If you do this, you might want to disable the default search script in your config.[environment].json file:

```
"sodoSearch": {
   "url": false
},
```

Or include it directly in your Ghost theme:

```html
<script src="https://unpkg.com/@magicpages/ghost-typesense-search-ui/dist/search.min.js"></script>
```

## Usage

1. Add the script to your Ghost theme:

```html
<!-- In default.hbs or post.hbs -->
<script>
  window.__MP_SEARCH_CONFIG__ = {
    typesenseNodes: [{
      host: 'your-typesense-host',
      port: '443',
      protocol: 'https'
    }],
    typesenseApiKey: 'your-search-only-api-key',
    collectionName: 'posts',
    theme: 'system', // 'light', 'dark', or 'system'
    commonSearches: ['Getting Started', 'FAQ', 'Features'] // optional
  };
</script>
<script src="https://unpkg.com/@magicpages/ghost-typesense-search-ui/dist/search.min.js"></script>
```

2. Add a search trigger button:

```html
<button onclick="window.location.hash = '#/search'">
  Search
</button>
```

The search modal will automatically open when the URL hash is `#/search`.

## Configuration

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `typesenseNodes` | `Array` | Yes | Array of Typesense node configurations |
| `typesenseApiKey` | `String` | Yes | Search-only API key from Typesense |
| `collectionName` | `String` | Yes | Name of your Typesense collection |
| `theme` | `String` | No | Color theme ('light', 'dark', or 'system') |
| `commonSearches` | `Array` | No | List of common search terms to show |
| `searchFields` | `Object` | No | Custom search field weights and highlighting |

## Customization

### Styling

The search UI uses CSS variables for easy customization:

```css
#mp-search-wrapper {
  --modal-bg: #fff;
  --text-primary: #333;
  --text-secondary: #666;
  --border-color: rgba(0, 0, 0, 0.1);
  --hover-bg: rgba(0, 0, 0, 0.05);
  --backdrop-color: rgba(0, 0, 0, 0.5);
  --accent-color: var(--ghost-accent-color, #1c1c1c);
}

/* Dark mode overrides */
#mp-search-wrapper.dark {
  --modal-bg: #1c1c1c;
  --text-primary: #fff;
  --text-secondary: #999;
  --border-color: rgba(255, 255, 255, 0.1);
  --hover-bg: rgba(255, 255, 255, 0.05);
}
```

### Search Fields

Customize search field weights and highlighting:

```javascript
window.__MP_SEARCH_CONFIG__ = {
  // ... other config
  searchFields: {
    title: { weight: 4, highlight: true },
    excerpt: { weight: 2, highlight: true },
    html: { weight: 1, highlight: true }
  }
};
```

## Keyboard Navigation

- `Ctrl/Cmd + K`: Open search
- `Esc`: Close search
- `↑/↓`: Navigate results
- `Enter`: Select result
- `Tab`: Navigate UI elements

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Safari iOS (latest)
- Chrome Android (latest)

## Development

1. Clone the repository:
```bash
git clone https://github.com/magicpages/ghost-typesense.git
cd ghost-typesense
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev -w packages/search-ui
```

## License

MIT © [MagicPages](https://github.com/magicpages) 