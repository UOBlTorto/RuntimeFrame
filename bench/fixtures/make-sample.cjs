'use strict';

/**
 * 生成一份**示例**结果，用来预览报告长什么样（数据是编的，不是实测）。
 * 用法：node task/2026-9-14/bench/fixtures/make-sample.cjs
 *      然后 node task/2026-9-14/bench/report.cjs task/2026-9-14/bench/fixtures/sample-results.json
 */

const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'sample-results.json');

function jitter(base, ratio, seed) {
  const wave = Math.sin(seed * 12.9898) * 43758.5453;
  const frac = wave - Math.floor(wave);
  return base * (1 + (frac - 0.5) * 2 * ratio);
}

const KB = 1024;

// 每个变体的产物构成：[文件名, raw, gzip]
const BEFORE_FILES = [
  ['js/dashboard.bundle.js', 3994 * KB, 1075 * KB],
  ['js/page1.bundle.js', 819 * KB, 215 * KB],
  ['js/project-list.bundle.js', 635 * KB, 154 * KB],
  ['dashboard.html', 16 * KB, 4.4 * KB],
  ['page1.html', 15 * KB, 4.1 * KB],
  ['project-list.html', 15 * KB, 4.1 * KB]
];

const AFTER_FILES = [
  ['js/vendor.bundle.js', 1638 * KB, 450 * KB],
  ['js/dashboard.bundle.js', 563 * KB, 153 * KB],
  ['js/common.bundle.js', 430 * KB, 112 * KB],
  ['js/page1.bundle.js', 246 * KB, 72 * KB],
  ['js/project-list.bundle.js', 195 * KB, 56 * KB],
  ['js/runtime.bundle.js', 31 * KB, 8 * KB],
  ['css/dashboard.bundle.css', 61 * KB, 15 * KB],
  ['dashboard.html', 16 * KB, 4.4 * KB],
  ['page1.html', 15 * KB, 4.1 * KB],
  ['project-list.html', 15 * KB, 4.1 * KB]
];

const DEV_BASE_FILES = [
  ['js/vendor.bundle.js', 5222 * KB, 1044 * KB],
  ['js/dashboard.bundle.js', 3482 * KB, 717 * KB],
  ['js/page1.bundle.js', 1638 * KB, 338 * KB],
  ['js/project-list.bundle.js', 1741 * KB, 358 * KB],
  ['dashboard.html', 16 * KB, 4.4 * KB],
  ['page1.html', 15 * KB, 4.1 * KB],
  ['project-list.html', 15 * KB, 4.1 * KB]
];

// dev.hmr 相比 dev.nohmr：每个业务入口多了 hot-middleware client + HMR runtime
const DEV_HMR_FILES = DEV_BASE_FILES.map(([name, raw, gzip]) =>
  name.indexOf('vendor') !== -1 || name.indexOf('.html') !== -1
    ? [name, raw, gzip]
    : [name, raw + 35 * KB, gzip + 8 * KB]
);

function summarize(files) {
  return {
    assets: files.map(([name, raw, gzip]) => ({ name, raw, gzip })),
    totals: files.reduce(
      (acc, [, raw, gzip]) => ({ raw: acc.raw + raw, gzip: acc.gzip + gzip }),
      { raw: 0, gzip: 0 }
    )
  };
}

function coldRun(seed, webpackMs, wallMs, files) {
  return {
    variant: null,
    mode: 'cold',
    ok: true,
    webpackMs: jitter(webpackMs, 0.04, seed),
    wallMs: jitter(wallMs, 0.03, seed + 7),
    hash: `sample${seed}`,
    errors: [],
    warnings: 2,
    notes: ['示例数据：由 fixtures/make-sample.cjs 生成，不是实测结果'],
    emitted: summarize(files)
  };
}

function watchRun(seed, initialMs, rebuildMs, raw, gzip) {
  const rebuilds = [];
  for (let i = 0; i < 5; i++) {
    rebuilds.push({
      index: i,
      ok: true,
      touchToDoneMs: jitter(rebuildMs, 0.05, seed + i),
      webpackMs: jitter(rebuildMs * 0.9, 0.05, seed + i + 3),
      changed: ['js/dashboard.bundle.js'],
      raw,
      gzip
    });
  }
  return {
    variant: null,
    mode: 'watch',
    touchFile: 'app/pages/dashboard/dashboard.vue',
    initial: { ok: true, webpackMs: initialMs, emitted: { assets: [], totals: { raw: 0, gzip: 0 } } },
    rebuilds,
    notes: ['示例数据：由 fixtures/make-sample.cjs 生成，不是实测结果']
  };
}

const results = {
  meta: {
    label: 'Elpis 构建基准 · 示例报告（占位数据）',
    generatedAt: new Date().toISOString(),
    elpisRoot: 'D:\\work\\vscode4w\\Elpis',
    elpisHead: 'sample',
    node: process.version,
    platform: `${process.platform}-${process.arch}`,
    cpu: '示例 CPU',
    cpuCount: require('os').cpus().length,
    totalMemGB: 32,
    coldRuns: 3,
    touches: 5,
    touchFile: 'app/pages/dashboard/dashboard.vue',
    disclaimer: '本文件是排版示例，所有数字均为占位值，请用 run.cjs 跑出真实数据'
  },
  variants: {
    'prod.before': {
      id: 'prod.before',
      title: '生产构建 · 优化前（只有基础配置：无拆分、无 CSS 提取、无压缩、单线程）',
      baseline: null,
      cold: [
        coldRun(1, 26800, 29400, BEFORE_FILES),
        coldRun(2, 26100, 28800, BEFORE_FILES),
        coldRun(3, 27100, 29700, BEFORE_FILES)
      ],
      watch: watchRun(11, 26800, 1450, 3994 * KB, 1075 * KB),
      profile: null
    },
    'prod.after': {
      id: 'prod.after',
      title: '生产构建 · 现状（splitChunks + runtimeChunk + CSS 提取/压缩 + Terser + Happypack 多线程）',
      baseline: 'prod.before',
      cold: [
        coldRun(4, 18400, 20900, AFTER_FILES),
        coldRun(5, 17900, 20500, AFTER_FILES),
        coldRun(6, 18700, 21200, AFTER_FILES)
      ],
      watch: watchRun(22, 18400, 1180, 563 * KB, 153 * KB),
      profile: null
    },
    'prod.nothreads': {
      id: 'prod.nothreads',
      title: '生产构建 · 现状但关闭所有并发（Happypack → 直接 loader，Terser parallel=false）',
      baseline: 'prod.after',
      cold: [
        coldRun(7, 23600, 26200, AFTER_FILES),
        coldRun(8, 24100, 26700, AFTER_FILES),
        coldRun(9, 23800, 26400, AFTER_FILES)
      ],
      watch: watchRun(33, 23600, 1520, 563 * KB, 153 * KB),
      profile: null
    },
    'dev.nohmr': {
      id: 'dev.nohmr',
      title: '开发态 · 同一份配置关掉 HMR（无 client 注入、无 HotModuleReplacementPlugin）',
      baseline: null,
      cold: [
        coldRun(10, 8200, 9600, DEV_BASE_FILES),
        coldRun(11, 8100, 9500, DEV_BASE_FILES),
        coldRun(12, 8300, 9700, DEV_BASE_FILES)
      ],
      watch: watchRun(44, 8200, 432, 3482 * KB, 717 * KB),
      profile: null
    },
    'dev.hmr': {
      id: 'dev.hmr',
      title: '开发态 · 自研 dev server（dev-middleware + hot-middleware + HotModuleReplacementPlugin）',
      baseline: 'dev.nohmr',
      cold: [
        coldRun(13, 8400, 9800, DEV_HMR_FILES),
        coldRun(14, 8300, 9700, DEV_HMR_FILES),
        coldRun(15, 8500, 9900, DEV_HMR_FILES)
      ],
      watch: watchRun(55, 8400, 449, (3482 + 35) * KB, (717 + 8) * KB),
      profile: null
    }
  }
};

fs.writeFileSync(OUT, JSON.stringify(results, null, 2), 'utf8');
process.stdout.write(`示例结果已写出：${OUT}\n`);
