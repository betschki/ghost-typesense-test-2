module.exports = {
    resolve: {
        fallback: {
            "stream": require.resolve("stream-browserify"),
            "buffer": require.resolve("buffer/")
        },
        alias: {
            'node:stream': 'stream-browserify'
        }
    },
    plugins: [
        // Add Node.js polyfills
        new (require('webpack')).ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer']
        })
    ]
}; 