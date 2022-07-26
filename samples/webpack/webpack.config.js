const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require('webpack')

const config = {
    context: path.resolve(__dirname, "src"),
    entry: {
        main: "./main.js",
    },
    resolve: {
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
    },
    output: {
        filename: "[name].[contenthash].js",
        path: path.resolve(__dirname, "build"),
    },
    plugins: [
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer'],
        }),
        new HtmlWebpackPlugin({ template: "./index.html" }),
        new CleanWebpackPlugin(),
    ],
    externals: ['tls', 'net', 'fs'],
    optimization: {
        splitChunks: {
            chunks: "all",
        },
    },
    devServer: {
        port: 9001,
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: "asset/resource",
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/i,
                type: "asset/resource",
            },
            {
                test: /\.m?js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env"],
                    },
                },
            },
        ],
    },
};

module.exports = config
