'use strict';

const { loadConfig } = require('../lib/elpis.cjs');
const { relocateHtmlOutput, stripCleanPlugin } = require('../lib/config-io.cjs');

module.exports = {
  id: 'prod.after',
  title: '生产构建 · 现状（splitChunks + runtimeChunk + CSS 提取/压缩 + Terser + Happypack 多线程）',
  baseline: 'prod.before',
  load() {
    return loadConfig('app/webpack/config/webpack.prod.js');
  },
  prepare(config, ctx) {
    stripCleanPlugin(config, ctx);
    relocateHtmlOutput(config);
    ctx.notes.push(
      '优化开关：' +
        JSON.stringify({
          splitChunks: !!config.optimization.splitChunks,
          runtimeChunk: !!config.optimization.runtimeChunk,
          minimize: config.optimization.minimize,
          happyPack: (config.plugins || []).some((p) => p && p.constructor && p.constructor.name === 'HappyPack')
        })
    );
    return config;
  }
};
