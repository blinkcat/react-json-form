const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const isDev = process.env.NODE_ENV === 'development';

/**
 * @type {import('webpack').Configuration}
 */
module.exports = {
  devtool: isDev ? 'source-map' : false,
  mode: isDev ? 'development' : 'production',
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: isDev
    ? {
        hot: true,
        port: 1234,
        client: {
          logging: 'error',
          overlay: false,
        },
        open: true,
      }
    : undefined,
  resolve: {
    extensions: ['.js', '.json', '.ts', '.tsx'],
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            // cacheDirectory: true,
            presets: [
              '@babel/preset-env',
              ['@babel/preset-react', { development: isDev }],
              '@babel/preset-typescript',
            ],
            plugins: [
              isDev && require.resolve('react-refresh/babel'),
              [
                '@babel/plugin-transform-runtime',
                {
                  corejs: false,
                  version: require('@babel/runtime/package.json').version,
                  regenerator: true,
                },
              ],
            ].filter(Boolean),
          },
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
    }),
    isDev && new ReactRefreshWebpackPlugin({ overlay: false }),
  ].filter(Boolean),
};
