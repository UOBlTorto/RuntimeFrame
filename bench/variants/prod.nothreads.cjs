'use strict';

const { loadConfig } = require('../lib/elpis.cjs');
const { relocateHtmlOutput, stripCleanPlugin, isInstance } = require('../lib/config-io.cjs');

/**
 * 单变量：从「现状」中只去掉多线程（Happypack + Terser parallel），
 * 用来回答「多线程打包到底省了多少时间」——体积应当几乎不变。
 */
module.exports = {
  id: 'prod.nothreads',
  title: '生产构建 · 现状但关闭所有并发（Happypack → 直接 loader，Terser parallel=false）',
  baseline: 'prod.after',
  load() {
    const config = loadConfig('app/webpack/config/webpack.prod.js');

    config.plugins = (config.plugins || []).filter((p) => !isInstance(p, 'HappyPack'));

    config.module.rules = (config.module.rules || []).map((rule) => {
      const replaceOne = (item) => {
        const name = typeof item === 'string' ? item : (item && item.loader) || '';
        if (name.indexOf('happypack/loader?id=js') === 0) {
          return {
            loader: 'babel-loader',
            options: { presets: ['@babel/preset-env'], plugins: ['@babel/plugin-transform-runtime'] }
          };
        }
        if (name.indexOf('happypack/loader?id=css') === 0) {
          return { loader: 'css-loader', options: { importLoaders: 1 } };
        }
        return item;
      };
      if (Array.isArray(rule.use)) {
        return Object.assign({}, rule, { use: rule.use.map(replaceOne) });
      }
      if (typeof rule.use === 'string' || (rule.use && rule.use.loader)) {
        return Object.assign({}, rule, { use: replaceOne(rule.use) });
      }
      return rule;
    });

    for (const item of config.optimization.minimizer || []) {
      if (item && item.options && 'parallel' in item.options) item.options.parallel = false;
    }

    return config;
  },
  prepare(config, ctx) {
    stripCleanPlugin(config, ctx);
    relocateHtmlOutput(config);
    ctx.notes.push('仅关闭并发：Happypack 全部移除、Terser parallel=false，其余与 prod.after 完全一致');
    return config;
  }
};
