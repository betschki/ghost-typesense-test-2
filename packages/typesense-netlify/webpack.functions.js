module.exports = {
    resolve: {
        alias: {
            'node:stream': 'stream-browserify',
            'stream': 'stream-browserify',
            'buffer': 'buffer'
        }
    },
    node: {
        __dirname: true,
        __filename: true,
        global: true,
        process: true,
        Buffer: true
    },
    plugins: [
        // Add Node.js polyfills
        new (require('webpack')).ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer']
        })
    ]
}; 