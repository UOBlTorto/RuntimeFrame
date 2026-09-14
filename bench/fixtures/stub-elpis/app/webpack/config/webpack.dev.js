'use strict';

const webpack = require('webpack');
const baseConfig = require('./webpack.base');

const DEV_SERVER_CONFIG = {
  HOST: '127.0.0.1',
  PORT: 9002,
  HMR_PATH: '__webpack_hmr',
  TIMEOUT: 20000
};

const entry = {};
Object.keys(baseConfig.entry).forEach((key) => {
  entry[key] = [
    baseConfig.entry[key],
    `webpack-hot-middleware/client?path=http://${DEV_SERVER_CONFIG.HOST}:${DEV_SERVER_CONFIG.PORT}/${DEV_SERVER_CONFIG.HMR_PATH}&timeout=${DEV_SERVER_CONFIG.TIMEOUT}&reload=true`
  ];
});

const webpackConfig = Object.assign({}, baseConfig, {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',
  entry,
  output: Object.assign({}, baseConfig.output, {
    filename: 'js/[name].[chunkhash:8].bundle.js',
    path: '/stub-unused/dev',
    publicPath: `http://${DEV_SERVER_CONFIG.HOST}:${DEV_SERVER_CONFIG.PORT}/public/dist/dev/`
  }),
  plugins: baseConfig.plugins.concat([new webpack.HotModuleReplacementPlugin({ multiStep: false })])
});

module.exports = { webpackConfig, DEV_SERVER_CONFIG };
