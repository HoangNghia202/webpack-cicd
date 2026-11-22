const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const root = path.resolve(__dirname, '..');

/** @type {import('webpack').Configuration} */
module.exports = {
  context: root,
  entry: './src/index.tsx',
  output: {
    path: path.resolve(root, 'dist'),
    filename: 'js/[name].js',
    publicPath: '/',
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: { '@': path.resolve(root, 'src') },
  },
  module: {
    rules: [{ test: /\.[jt]sx?$/, exclude: /node_modules/, use: 'babel-loader' }],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './public/index.html' }),
    new ForkTsCheckerWebpackPlugin(),
  ],
};
