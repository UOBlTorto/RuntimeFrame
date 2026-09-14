'use strict';

/**
 * 编排器：对每个变体跑「N 个全新进程的冷构建」+「1 个 watch 增量」，
 * 汇总成一个 results/*.json，并自动生成 report.md / report.html。
 *
 * 用法：
 *   node task/2026-9-14/bench/run.cjs
 *   node task/2026-9-14/bench/run.cjs --variants prod.before,prod.after --cold-runs 5 --touches 8
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { ROOT } = require('./lib/elpis.cjs');

const MARKER = '__BENCH_JSON__';
const DEFAULT_VARIANTS = ['prod.before', 'prod.after', 'prod.nothreads', 'dev.hmr', 'dev.nohmr'];

function parseArgs(argv) {
  const args = {
    variants: DEFAULT_VARIANTS,
    coldRuns: 3,
    touches: 5,
    label: 'Elpis 构建基准',
    out: null,
    skipWatch: false,
    profile: false,
    touchFile: 'app/pages/dashboard/dashboard.vue',
    touchMode: 'content'
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
  args.variants = Array.isArray(args.variants) ? args.variants : String(args.variants).split(',');
  args.coldRuns = Number(args.coldRuns);
  args.touches = Number(args.touches);
  return args;
}

function elpisHead() {
  try {
    const r = spawnSync('git', ['-C', ROOT, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' });
    return r.status === 0 ? r.stdout.trim() : null;
  } catch (err) {
    return null;
  }
}

function runStep(step) {
  const benchOne = path.join(__dirname, 'bench-one.cjs');
  const argv = [benchOne, '--variant', step.variant, '--mode', step.mode, '--run-id', step.runId].concat(step.extra || []);
  const started = Date.now();
  process.stdout.write(`\n[run] ${step.variant} · ${step.mode} … `);

  const child = spawnSync(process.execPath, argv, {
    cwd: __dirname,
    env: Object.assign({}, process.env, { ELPIS_ROOT: ROOT }),
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024
  });

  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  const line = String(child.stdout || '')
    .split(/\r?\n/)
    .find((l) => l.indexOf(MARKER) === 0);

  if (!line) {
    process.stdout.write(`失败 (${seconds}s)\n`);
    process.stderr.write(`${child.stdout || ''}\n${child.stderr || ''}\n`);
    return {
      variant: step.variant,
      mode: step.mode,
      ok: false,
      error: String(child.stderr || 'no output').trim().split('\n').slice(-4).join('\n')
    };
  }

  process.stdout.write(`完成 (${seconds}s)\n`);
  return JSON.parse(line.slice(MARKER.length));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const runId = `run-${Date.now()}`;
  const results = {
    meta: {
      label: String(args.label),
      generatedAt: new Date().toISOString(),
      elpisRoot: ROOT,
      elpisHead: elpisHead(),
      node: process.version,
      platform: `${process.platform}-${process.arch}`,
      cpu: (os.cpus()[0] || {}).model || 'unknown',
      cpuCount: os.cpus().length,
      totalMemGB: Math.round((os.totalmem() / 1024 ** 3) * 10) / 10,
      coldRuns: args.coldRuns,
      touches: args.touches,
      touchFile: String(args.touchFile),
      touchMode: String(args.touchMode)
    },
    variants: {}
  };

  for (const id of args.variants) {
    let variantMeta = { id };
    try {
      const mod = require(path.join(__dirname, 'variants', `${id}.cjs`));
      variantMeta = { id: mod.id, title: mod.title, baseline: mod.baseline === undefined ? null : mod.baseline };
    } catch (err) {
      variantMeta = { id, title: id, baseline: null, loadError: err.message };
    }

    const cold = [];
    for (let i = 0; i < args.coldRuns; i++) {
      cold.push(runStep({ variant: id, mode: 'cold', runId }));
    }

    let watch = null;
    if (!args.skipWatch) {
      watch = runStep({
        variant: id,
        mode: 'watch',
        runId,
        extra: [
          '--touches',
          String(args.touches),
          '--touch-file',
          String(args.touchFile),
          '--touch-mode',
          String(args.touchMode)
        ]
      });
    }

    let profile = null;
    if (args.profile) {
      profile = runStep({ variant: id, mode: 'profile', runId });
    }

    results.variants[id] = Object.assign(variantMeta, { cold, watch, profile });
  }

  const outPath = args.out
    ? path.resolve(String(args.out))
    : path.join(__dirname, 'results', `${new Date().toISOString().slice(0, 10)}-${runId}.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
  process.stdout.write(`\n[done] 原始数据：${outPath}\n`);

  try {
    const { generateReport } = require('./report.cjs');
    for (const file of generateReport(outPath)) process.stdout.write(`[done] 报告：${file}\n`);
  } catch (err) {
    process.stderr.write(`[warn] 生成报告失败：${(err && err.stack) || err}\n`);
  }
}

main();
