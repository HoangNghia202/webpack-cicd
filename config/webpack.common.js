const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const root = path.resolve(__dirname, '..');

const cssModuleOptions = {
  localIdentName: '[name]__[local]--[hash:base64:5]',
  namedExport: false,
};

const styleRule = ({ test, exclude, modules = false, sass = false }) => ({
  test,
  exclude,
  use: [
    'style-loader',
    {
      loader: 'css-loader',
      options: {
        importLoaders: sass ? 2 : 1,
        modules: modules ? cssModuleOptions : false,
        sourceMap: false,
      },
    },
    'postcss-loader',
    ...(sass ? ['sass-loader'] : []),
  ],
});

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
    rules: [
      { test: /\.[jt]sx?$/, exclude: /node_modules/, use: 'babel-loader' },
      styleRule({ test: /\.module\.scss$/, modules: true, sass: true }),
      styleRule({ test: /\.module\.css$/, modules: true }),
      styleRule({ test: /\.scss$/, exclude: /\.module\.scss$/, sass: true }),
      styleRule({ test: /\.css$/, exclude: /\.module\.css$/ }),
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './public/index.html' }),
    new ForkTsCheckerWebpackPlugin(),
  ],
};
