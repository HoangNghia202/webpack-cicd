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
    assetModuleFilename: 'assets/[name][ext]',
    publicPath: '/',
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: { '@': path.resolve(root, 'src') },
  },
  module: {
    rules: [
      {
        oneOf: [
          { resourceQuery: /raw/, type: 'asset/source' },
          { test: /\.[jt]sx?$/, exclude: /node_modules/, use: 'babel-loader' },
          styleRule({ test: /\.module\.scss$/, modules: true, sass: true }),
          styleRule({ test: /\.module\.css$/, modules: true }),
          styleRule({ test: /\.scss$/, exclude: /\.module\.scss$/, sass: true }),
          styleRule({ test: /\.css$/, exclude: /\.module\.css$/ }),
          { test: /\.svg$/i, resourceQuery: /url/, type: 'asset/resource' },
          { test: /\.svg$/i, resourceQuery: /inline/, type: 'asset/inline' },
          { test: /\.svg$/i, issuer: /\.[cm]?[jt]sx?$/i, use: ['@svgr/webpack'] },
          { test: /\.svg$/i, type: 'asset/resource' },
          {
            test: /\.(png|jpe?g|gif|webp)$/i,
            type: 'asset',
            parser: { dataUrlCondition: { maxSize: 8 * 1024 } },
          },
          {
            test: /\.(woff2?|ttf|eot)$/i,
            type: 'asset/resource',
            generator: { filename: 'fonts/[name][ext]' },
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './public/index.html' }),
    new ForkTsCheckerWebpackPlugin(),
  ],
};
