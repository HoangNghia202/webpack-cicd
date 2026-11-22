const path = require('path');
const Dotenv = require('dotenv-webpack');
const { merge } = require('webpack-merge');
const common = require('./webpack.common');

/** @type {import('webpack').Configuration} */
module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map',
  plugins: [new Dotenv({ path: path.resolve(__dirname, '../.env.production') })],
});
