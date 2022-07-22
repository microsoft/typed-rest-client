const webpack = require('webpack')

module.exports = function override(config, env) {
    config.plugins.push(new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
    }))

    config.resolve = {
        ...config.resolve,
        extensions: ['.ts', '.js', '.jsx', '.tsx'],
        fallback: {
            fs: false,
            "http": require.resolve("stream-http"),
            "https": require.resolve("https-browserify"),
            "url": require.resolve("url/"),
            "zlib": require.resolve("browserify-zlib"),
            "path": require.resolve("path-browserify"),
            "assert": require.resolve("assert"),
            "util": require.resolve("util"),
            "stream": require.resolve("stream-browserify"),
            "buffer": require.resolve("buffer")
        }
    }

    config.externals = ['tls', 'net', 'fs']

    return config;
}