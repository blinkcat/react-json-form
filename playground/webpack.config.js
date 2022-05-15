const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

/**
 * @type {import('webpack').Configuration}
 */
module.exports = {
  devtool: 'source-map',
  mode: 'development',
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {
    hot: true,
    port: 1234,
    client: {
      logging: 'error',
      overlay: false,
    },
    open: true,
  },
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
              ['@babel/preset-react', { development: true }],
              '@babel/preset-typescript',
            ],
            plugins: [
              require.resolve('react-refresh/babel'),
              [
                '@babel/plugin-transform-runtime',
                {
                  corejs: false,
                  version: require('@babel/runtime/package.json').version,
                  regenerator: true,
                },
              ],
            ],
          },
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
    }),
    new ReactRefreshWebpackPlugin({ overlay: false }),
  ],
};
