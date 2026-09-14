'use strict';

const { loadConfig, requireFromElpis } = require('../lib/elpis.cjs');
const { relocateHtmlOutput } = require('../lib/config-io.cjs');

/**
 * 单变量：同一份 dev 配置，只把 HMR 关掉 ——
 * 去掉 entry 里的 hot-middleware client 注入 + 去掉 HotModuleReplacementPlugin。
 * devtool / mode / 其它插件保持完全一致，否则比出来的差值不干净。
 */
module.exports = {
  id: 'dev.nohmr',
  title: '开发态 · 同一份配置关掉 HMR（无 client 注入、无 HotModuleReplacementPlugin）',
  baseline: null,
  load() {
    const webpack = requireFromElpis('webpack');
    const config = loadConfig('app/webpack/config/webpack.dev.js').webpackConfig;

    config.plugins = (config.plugins || []).filter((p) => !(p instanceof webpack.HotModuleReplacementPlugin));

    for (const key of Object.keys(config.entry || {})) {
      const value = config.entry[key];
      if (!Array.isArray(value)) continue;
      config.entry[key] = value.filter(
        (item) => !(typeof item === 'string' && item.indexOf('webpack-hot-middleware/client') !== -1)
      );
    }

    return config;
  },
  prepare(config, ctx) {
    relocateHtmlOutput(config);
    ctx.notes.push('仅移除 HMR：entry 里的 hot-middleware client 与 HotModuleReplacementPlugin，其余与 dev.hmr 完全一致');
    return config;
  }
};
