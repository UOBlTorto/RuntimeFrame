'use strict';

/**
 * 单变体探针：在**全新进程**里跑一次测量。
 *   --mode cold    冷构建（cache:false，一次编译）
 *   --mode watch   增量热更新（首次构建 + N 次「改文件 → 新产物 ready」）
 *   --mode profile 单次带 profile 的构建，用于耗时归因（最慢的模块 / loader 链）
 *
 * 结果以 __BENCH_JSON__ 前缀的单行 JSON 打到 stdout，交给 run.cjs 汇总。
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { ROOT, requireFromElpis } = require('./lib/elpis.cjs');
const { collectEmitted, sizeOfFiles } = require('./lib/stats.cjs');

const MARKER = '__BENCH_JSON__';

function parseArgs(argv) {
  const args = {
    mode: 'cold',
    variant: null,
    touches: 5,
    touchFile: 'app/pages/dashboard/dashboard.vue',
    touchMode: 'content',
    runId: 'run',
    outDir: null,
    aggregateTimeout: 200,
    profileTop: 15
  };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token.indexOf('--') !== 0) continue;
    const key = token.slice(2).replace(/-([a-z])/g, (m, c) => c.toUpperCase());
    const next = argv[i + 1];
    if (next && next.indexOf('--') !== 0) {
      args[key] = next;
      i++;
    } else {
      args[key] = true;
    }
  }
  return args;
}

function freshDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function loadWebpack() {
  try {
    return requireFromElpis('webpack');
  } catch (err) {
    throw new Error(
      `无法从 ${ROOT} 加载 webpack：${err.message}\n` +
        '→ 先在 Elpis 仓库执行 npm install，或用 ELPIS_ROOT 指向已安装依赖的仓库。'
    );
  }
}

function buildConfig(args, ctx) {
  const variant = require(path.join(__dirname, 'variants', `${args.variant}.cjs`));
  process.chdir(ROOT); // Elpis 的配置全靠 process.cwd() 定位 app/pages、app/view
  let config = variant.load();
  if (typeof variant.prepare === 'function') {
    config = variant.prepare(config, ctx) || config;
  }
  config.context = ROOT;
  config.output = Object.assign({}, config.output, { path: ctx.outDir });
  if (args.mode === 'cold' || args.mode === 'profile') {
    config.cache = false; // 冷构建必须显式关缓存，否则第二次开始就不是冷启动
  }
  if (args.mode === 'profile') config.profile = true;
  return { variant, config };
}

function firstErrors(stats, limit = 3) {
  try {
    const json = stats.toJson({ all: false, errors: true });
    return (json.errors || []).slice(0, limit).map((e) => String(e.message || e).split('\n')[0]);
  } catch (err) {
    return [`<读取 stats.errors 失败: ${err.message}>`];
  }
}

function warnCount(stats) {
  try {
    const json = stats.toJson({ all: false, warnings: true });
    return (json.warnings || []).length;
  } catch (err) {
    return null;
  }
}

/**
 * 「触碰文件」的两种模式：
 *  content（默认）—— 交替追加 1 / 2 个结尾换行，跑完还原文件。
 *      必须真的改内容：只改 mtime 时 webpack 重新编译后 chunk hash 不变，
 *      会判定产物未变化而不重新落盘，于是「本轮重传字节」会读到 0。
 *  mtime —— 只 fs.utimes 不动文件内容，适合仓库只读时用，代价是上面那个 0。
 */
function createToucher(args) {
  const target = path.resolve(ROOT, String(args.touchFile));
  if (!fs.existsSync(target)) {
    throw new Error(`要触碰的文件不存在：${target}（可用 --touch-file 指定）`);
  }
  const original = fs.readFileSync(target, 'utf8');
  const mode = String(args.touchMode || 'content');
  let counter = 0;
  return {
    target,
    mode,
    touch() {
      counter += 1;
      if (mode === 'mtime') {
        const now = new Date();
        fs.utimesSync(target, now, now);
        return;
      }
      fs.writeFileSync(target, original + '\n'.repeat((counter % 2) + 1), 'utf8');
    },
    restore() {
      if (mode === 'content') fs.writeFileSync(target, original, 'utf8');
    }
  };
}

async function runCold(args, ctx) {
  const webpack = loadWebpack();
  const { variant, config } = buildConfig(args, ctx);
  const compiler = webpack(config);

  const t0 = process.hrtime.bigint();
  const stats = await new Promise((resolve, reject) => {
    compiler.run((err, st) => (err ? reject(err) : resolve(st)));
  });
  const wallMs = Number(process.hrtime.bigint() - t0) / 1e6;

  await new Promise((resolve) => compiler.close(() => resolve()));

  return {
    variant: variant.id,
    mode: 'cold',
    ok: !stats.hasErrors(),
    // webpack 自己量到的编译窗口（不含进程启动、require 依赖、退出）
    webpackMs: stats.endTime - stats.startTime,
    wallMs,
    hash: stats.hash,
    errors: firstErrors(stats),
    warnings: warnCount(stats),
    emitted: collectEmitted(ctx.outDir),
    notes: ctx.notes
  };
}

async function runWatch(args, ctx) {
  const webpack = loadWebpack();
  const { variant, config } = buildConfig(args, ctx);
  const compiler = webpack(config);

  const queue = [];
  const waiters = [];
  const push = (ev) => {
    const waiter = waiters.shift();
    if (waiter) waiter(ev);
    else queue.push(ev);
  };
  const next = () =>
    new Promise((resolve) => {
      const ev = queue.shift();
      if (ev) resolve(ev);
      else waiters.push(resolve);
    });

  const watching = compiler.watch({ aggregateTimeout: Number(args.aggregateTimeout) }, (err, stats) => {
    push({ err, stats });
  });

  const first = await next();
  const initial = first.stats
    ? {
        ok: !first.stats.hasErrors(),
        webpackMs: first.stats.endTime - first.stats.startTime,
        emitted: sizeOfFiles(
          ctx.outDir,
          (first.stats.toJson({ all: false, assets: true }).assets || []).map((a) => a.name)
        )
      }
    : { ok: false, webpackMs: null, emitted: { assets: [], totals: { raw: 0, gzip: 0 } } };

  const toucher = createToucher(args);
  const rebuilds = [];
  try {
    for (let i = 0; i < Number(args.touches); i++) {
      toucher.touch();

      const t0 = process.hrtime.bigint();
      const ev = await next();
      const touchToDoneMs = Number(process.hrtime.bigint() - t0) / 1e6;

      const stats = ev.stats;
      const changed = stats
        ? (stats.toJson({ all: false, assets: true }).assets || []).filter((a) => a.emitted).map((a) => a.name)
        : [];
      const sizes = sizeOfFiles(ctx.outDir, changed);

      rebuilds.push({
        index: i,
        ok: stats ? !stats.hasErrors() : false,
        touchToDoneMs,
        webpackMs: stats ? stats.endTime - stats.startTime : null,
        changed,
        raw: sizes.totals.raw,
        gzip: sizes.totals.gzip
      });
    }
  } finally {
    toucher.restore(); // 无论如何都要把源文件还原
  }

  await watching.close();

  return {
    variant: variant.id,
    mode: 'watch',
    touchFile: String(args.touchFile),
    touchMode: toucher.mode,
    initial,
    rebuilds,
    notes: ctx.notes
  };
}

async function runProfile(args, ctx) {
  const webpack = loadWebpack();
  const { variant, config } = buildConfig(args, ctx);
  const compiler = webpack(config);

  const stats = await new Promise((resolve, reject) => {
    compiler.run((err, st) => (err ? reject(err) : resolve(st)));
  });
  await new Promise((resolve) => compiler.close(() => resolve()));

  const json = stats.toJson({ all: false, modules: true, profile: true });
  const modules = (json.modules || [])
    .filter((m) => m.profile && typeof m.profile.total === 'number')
    .map((m) => ({
      name: m.name || m.identifier || '(anonymous)',
      total: m.profile.total,
      building: m.profile.building || 0
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, Number(args.profileTop));

  const byLoader = {};
  for (const m of json.modules || []) {
    if (!m.profile || typeof m.profile.total !== 'number') continue;
    const key = (m.loaders || []).map((l) => l.loader || '').join(' → ') || '(no loader)';
    byLoader[key] = (byLoader[key] || 0) + m.profile.total;
  }
  const loaders = Object.keys(byLoader)
    .map((name) => ({ name, total: byLoader[name] }))
    .sort((a, b) => b.total - a.total)
    .slice(0, Number(args.profileTop));

  return {
    variant: variant.id,
    mode: 'profile',
    ok: !stats.hasErrors(),
    webpackMs: stats.endTime - stats.startTime,
    modules,
    loaders,
    notes: ctx.notes
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.variant) throw new Error('缺少 --variant（见 variants/ 目录）');

  const ctx = {
    notes: [],
    outDir: args.outDir
      ? path.resolve(String(args.outDir))
      : path.join(os.tmpdir(), 'elpis-bench', String(args.runId), String(args.variant))
  };
  freshDir(ctx.outDir);

  const runner = args.mode === 'watch' ? runWatch : args.mode === 'profile' ? runProfile : runCold;
  const result = await runner(args, ctx);
  result.outDir = ctx.outDir;

  process.stdout.write(`\n${MARKER}${JSON.stringify(result)}\n`);
  process.exit(0);
}

main().catch((err) => {
  process.stderr.write(`[bench-one] ${(err && err.stack) || err}\n`);
  process.exit(1);
});
