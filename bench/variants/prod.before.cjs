'use strict';

const { loadConfig } = require('../lib/elpis.cjs');
const { relocateHtmlOutput } = require('../lib/config-io.cjs');

/**
 * 「优化前」基线：只保留 webpack.base.js 的基础配置。
 * 特征：单线程 babel-loader、style-loader 内联 CSS、无代码分割、无压缩。
 */
module.exports = {
  id: 'prod.before',
  title: '生产构建 · 优化前（只有基础配置：无拆分、无 CSS 提取、无压缩、单线程）',
  baseline: null,
  load() {
    return loadConfig('app/webpack/config/webpack.base.js');
  },
  prepare(config, ctx) {
    config.mode = 'production';
    config.devtool = false;
    config.output = Object.assign({}, config.output, {
      filename: 'js/[name].[contenthash:8].bundle.js',
      publicPath: '/dist/bench/'
    });
    config.optimization = { minimize: false, splitChunks: false, runtimeChunk: false };
    relocateHtmlOutput(config);
    ctx.notes.push('optimization = { minimize:false, splitChunks:false, runtimeChunk:false }，css/less 走 style-loader');
    return config;
  }
};
