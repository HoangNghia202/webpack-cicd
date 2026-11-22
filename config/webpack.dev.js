const { merge } = require('webpack-merge');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const common = require('./webpack.common');

/** @type {import('webpack').Configuration} */
module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',
  devServer: {
    port: 3000,
    hot: true,
    compress: true,
    historyApiFallback: true,
    client: { overlay: true },
    proxy: [{ context: ['/api'], target: 'http://localhost:4000', changeOrigin: true }],
  },
  plugins: [new ReactRefreshWebpackPlugin()],
});
