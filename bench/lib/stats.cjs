'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/** 递归列出目录下所有文件，返回 posix 风格的相对路径 */
function walk(dir, base = dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(abs, base, out);
    else if (entry.isFile()) out.push(path.relative(base, abs).split(path.sep).join('/'));
  }
  return out;
}

/** gzip 口径固定：level 9，和 compression-webpack-plugin 默认一致 */
function gzipSize(buf) {
  return zlib.gzipSync(buf, { level: 9 }).length;
}

function sumAssets(assets) {
  return assets.reduce(
    (acc, a) => ({ raw: acc.raw + (a.raw || 0), gzip: acc.gzip + (a.gzip || 0) }),
    { raw: 0, gzip: 0 }
  );
}

/** 一次性统计 output.path 下的全部产物（真实落盘字节，不是 stats 估算） */
function collectEmitted(outDir) {
  const files = fs.existsSync(outDir) ? walk(outDir) : [];
  const assets = files
    .map((name) => {
      const buf = fs.readFileSync(path.join(outDir, name));
      return { name, raw: buf.length, gzip: gzipSize(buf) };
    })
    .sort((a, b) => b.raw - a.raw);
  return { assets, totals: sumAssets(assets) };
}

/** 只统计指定文件（热更新里 = 本轮真正重新发送给浏览器的那几个 chunk） */
function sizeOfFiles(outDir, names) {
  const assets = [];
  for (const name of names) {
    const abs = path.join(outDir, name);
    if (!fs.existsSync(abs)) continue;
    const buf = fs.readFileSync(abs);
    assets.push({ name, raw: buf.length, gzip: gzipSize(buf) });
  }
  return { assets, totals: sumAssets(assets) };
}

function median(xs) {
  const list = xs.filter((x) => typeof x === 'number' && isFinite(x)).sort((a, b) => a - b);
  if (!list.length) return null;
  const mid = Math.floor(list.length / 2);
  return list.length % 2 ? list[mid] : (list[mid - 1] + list[mid]) / 2;
}

function min(xs) {
  const list = xs.filter((x) => typeof x === 'number' && isFinite(x));
  return list.length ? Math.min.apply(null, list) : null;
}

function max(xs) {
  const list = xs.filter((x) => typeof x === 'number' && isFinite(x));
  return list.length ? Math.max.apply(null, list) : null;
}

/** (value - baseline) / baseline，基线为 0 或缺失时返回 null */
function pctChange(value, baseline) {
  if (typeof value !== 'number' || typeof baseline !== 'number' || !baseline) return null;
  return ((value - baseline) / baseline) * 100;
}

function round(n, digits = 1) {
  if (typeof n !== 'number' || !isFinite(n)) return n;
  const f = Math.pow(10, digits);
  return Math.round(n * f) / f;
}

module.exports = {
  walk,
  gzipSize,
  sumAssets,
  collectEmitted,
  sizeOfFiles,
  median,
  min,
  max,
  pctChange,
  round
};
