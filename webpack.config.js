const path = require('node:path');
const fs = require('node:fs');
const webpack = require('webpack');
const { WebpackAssetsManifest } = require('webpack-assets-manifest');
const TerserPlugin = require('terser-webpack-plugin');

// Webpack expects booleans for minimize, etc. Treat production as an actual boolean.
const isProduction = (process.env.NODE_ENV || '').toLowerCase() === 'production';
const rawPublicPath = process.env.PUBLIC_PATH || process.env.WEBPACK_PUBLIC_PATH || '/assets/';
const publicPath = rawPublicPath.endsWith('/') ? rawPublicPath : `${rawPublicPath}/`;
const localCertsPath = path.join(__dirname, '../../docker/certificates');
const localCertFiles = {
    ca: path.join(localCertsPath, 'root_ca.pem'),
    cert: path.join(localCertsPath, 'pterodactyl.test.pem'),
    key: path.join(localCertsPath, 'pterodactyl.test-key.pem'),
};

const hasValidPemHeader = (filePath, header) => {
    if (!fs.existsSync(filePath)) return false;

    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes(header);
};

const localCertsConfigured =
    process.env.USE_LOCAL_CERTS &&
    hasValidPemHeader(localCertFiles.ca, '-----BEGIN CERTIFICATE-----') &&
    hasValidPemHeader(localCertFiles.cert, '-----BEGIN CERTIFICATE-----') &&
    hasValidPemHeader(localCertFiles.key, '-----BEGIN PRIVATE KEY-----');

if (process.env.USE_LOCAL_CERTS && !localCertsConfigured) {
    // Fall back to default dev-server HTTPS certs if local PEM files are unavailable or malformed.
    console.warn(`USE_LOCAL_CERTS is set, but local certificates are missing/invalid at ${localCertsPath}.`);
}

let devServerPort = 5173;
let devServerType = 'https';

try {
    if (/^https?:\/\//.test(publicPath)) {
        const parsedPublicPath = new URL(publicPath);
        devServerType = parsedPublicPath.protocol === 'http:' ? 'http' : 'https';
        if (parsedPublicPath.port) devServerPort = Number(parsedPublicPath.port);
    }
} catch (error) {
    console.warn(`Failed to parse public path "${publicPath}", using default dev server settings.`);
}

module.exports = {
    cache: true,
    target: 'web',
    mode: isProduction ? 'production' : 'development',
    devtool: process.env.DEVTOOL || (isProduction ? false : 'eval-source-map'),
    performance: {
        hints: false,
    },
    entry: ['react-hot-loader/patch', './resources/scripts/index.tsx'],
    output: {
        path: path.join(__dirname, '/public/assets'),
        filename: isProduction ? 'bundle.[chunkhash:8].js' : 'bundle.[fullhash:8].js',
        chunkFilename: isProduction ? '[name].[chunkhash:8].js' : '[name].[fullhash:8].js',
        publicPath,
        crossOriginLoading: 'anonymous',
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules|\.spec\.tsx?$/,
                loader: 'babel-loader',
            },
            {
                test: /\.mjs$/,
                include: /node_modules/,
                type: 'javascript/auto',
            },
            {
                test: /\.css$/,
                use: [
                    { loader: 'style-loader' },
                    {
                        loader: 'css-loader',
                        options: {
                            modules: {
                                auto: true,
                                // https://github.com/webpack/css-loader/blob/main/CHANGELOG.md#700-2024-04-04
                                namedExport: false,
                                exportLocalsConvention: 'as-is',
                                localIdentName: isProduction ? '[name]_[hash:base64:8]' : '[path][name]__[local]',
                                localIdentContext: path.join(__dirname, 'resources/scripts/components'),
                            },
                            sourceMap: !isProduction,
                            importLoaders: 1,
                        },
                    },
                    {
                        loader: 'postcss-loader',
                        options: { sourceMap: !isProduction },
                    },
                ],
            },
            {
                test: /\.(png|jp(e?)g|gif)$/,
                loader: 'file-loader',
                options: {
                    name: 'images/[name].[hash:8].[ext]',
                },
            },
            {
                test: /\.(woff|woff2)$/i,
                type: 'asset/resource',
            },
            {
                test: /\.svg$/,
                loader: 'svg-url-loader',
            },
            {
                test: /\.js$/,
                enforce: 'pre',
                loader: 'source-map-loader',
            },
        ],
    },
    stats: {
        // Ignore warnings emitted by "source-map-loader" when trying to parse source maps from
        // JS plugins we use, namely brace editor.
        warningsFilter: [/Failed to parse source map/],
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json'],
        alias: {
            '@': path.join(__dirname, '/resources/scripts'),
            '@definitions': path.join(__dirname, '/resources/scripts/api/definitions'),
            '@feature': path.join(__dirname, '/resources/scripts/components/server/features'),
        },
        symlinks: false,
    },
    externals: {
        // Mark moment as an external to exclude it from the Chart.js build since we don't need to use
        // it for anything.
        moment: 'moment',
    },
    plugins: [
        new webpack.EnvironmentPlugin({
            NODE_ENV: process.env.NODE_ENV || 'development',
            DEBUG: process.env.NODE_ENV !== 'production',
            WEBPACK_BUILD_HASH: Date.now().toString(16),
        }),
        new WebpackAssetsManifest({
            output: 'manifest.json',
            writeToDisk: true,
            publicPath: true,
            integrity: true,
            integrityHashes: ['sha384'],
        }),
    ],
    optimization: {
        usedExports: true,
        sideEffects: false,
        runtimeChunk: false,
        removeEmptyChunks: true,
        minimize: isProduction,
        minimizer: [
            new TerserPlugin({
                parallel: true,
                extractComments: false,
                terserOptions: {
                    mangle: true,
                    output: {
                        comments: false,
                    },
                },
            }),
        ],
    },
    watchOptions: {
        poll: 1000,
        ignored: /node_modules/,
    },
    devServer: {
        compress: true,
        port: devServerPort,
        server: {
            type: devServerType,
            options: devServerType === 'https' && localCertsConfigured ? localCertFiles : undefined,
        },
        static: {
            directory: path.join(__dirname, '/public'),
            publicPath,
        },
        allowedHosts: 'all',
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
    },
};
