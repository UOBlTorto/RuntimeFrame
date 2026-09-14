'use strict';

const { loadConfig } = require('../lib/elpis.cjs');
const { relocateHtmlOutput } = require('../lib/config-io.cjs');

module.exports = {
  id: 'dev.hmr',
  title: '开发态 · 自研 dev server（dev-middleware + hot-middleware + HotModuleReplacementPlugin）',
  baseline: 'dev.nohmr',
  load() {
    return loadConfig('app/webpack/config/webpack.dev.js').webpackConfig;
  },
  prepare(config, ctx) {
    relocateHtmlOutput(config);
    ctx.notes.push('entry 已注入 webpack-hot-middleware/client，已启用 HotModuleReplacementPlugin(multiStep:false)');
    return config;
  }
};
