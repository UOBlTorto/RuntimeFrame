'use strict';

/**
 * 从被测量的项目里解析依赖与配置。
 *
 * 项目根 = 从本文件位置向上找第一个含 app/webpack 的目录（也支持 ELPIS_ROOT 显式指定）。
 * 用 createRequire 以项目 package.json 为锚点，好处是 loader / plugin 实例全局唯一，
 * variants 里的 instanceof 判断才不会失效。
 */

const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

function findProjectRoot(start) {
  let dir = start;
  for (;;) {
    if (fs.existsSync(path.join(dir, 'app', 'webpack'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

const ROOT = path.resolve(
  process.env.ELPIS_ROOT || findProjectRoot(path.resolve(__dirname, '..', '..')) || process.cwd()
);

if (!fs.existsSync(path.join(ROOT, 'package.json')) || !fs.existsSync(path.join(ROOT, 'app', 'webpack'))) {
  throw new Error(
    `找不到项目根：${ROOT}\n` + '请用环境变量指定：ELPIS_ROOT=D:\\path\\to\\project'
  );
}

const requireFromElpis = createRequire(path.join(ROOT, 'package.json'));

/** 配置模块是单例：dev 配置会就地改写 base 的 entry，不清缓存就会互相污染 */
function clearConfigCache() {
  const prefix = path.join(ROOT, 'app', 'webpack') + path.sep;
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(prefix)) delete require.cache[key];
  }
}

function loadConfig(relPath) {
  clearConfigCache();
  return requireFromElpis(path.join(ROOT, relPath));
}

module.exports = { ROOT, requireFromElpis, loadConfig, clearConfigCache };