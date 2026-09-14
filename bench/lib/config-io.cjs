'use strict';

const path = require('path');

function ctorName(value) {
  return value && value.constructor ? value.constructor.name : '';
}

function isInstance(value, name) {
  return ctorName(value) === name;
}

/**
 * Elpis 的 HtmlWebpackPlugin 写的是绝对 filename（app/public/dist/xxx.html），
 * 这会把产物写回仓库。基准里统一改成相对名，落到 output.path（临时目录）。
 */
function relocateHtmlOutput(config) {
  for (const plugin of config.plugins || []) {
    if (!isInstance(plugin, 'HtmlWebpackPlugin')) continue;
    for (const bag of [plugin.userOptions, plugin.options]) {
      if (bag && typeof bag.filename === 'string') {
        bag.filename = path.basename(bag.filename);
      }
    }
  }
  return config;
}

/**
 * clean-webpack-plugin@0.1.x 与 webpack5 不兼容（构建时直接抛错），
 * 而且「清空 dist」与耗时/体积测量无关 —— 基准里剔除，并在报告里如实标注。
 */
function stripCleanPlugin(config, ctx) {
  const before = (config.plugins || []).length;
  config.plugins = (config.plugins || []).filter((p) => !isInstance(p, 'CleanWebpackPlugin'));
  if (ctx && before !== config.plugins.length) {
    ctx.notes.push('已剔除 CleanWebpackPlugin（0.1.x 与 webpack5 不兼容，且清盘与测量无关）');
  }
  return config;
}

module.exports = { ctorName, isInstance, relocateHtmlOutput, stripCleanPlugin };
