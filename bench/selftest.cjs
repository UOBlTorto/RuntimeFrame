'use strict';

/**
 * 自检：用桩 webpack 端到端跑一遍完整链路（变体加载 → prepare → 冷构建/增量 → 汇总 → 报告），
 * 不需要 Elpis 装依赖。真实测量前先跑这个，确认工具本身没坏。
 *
 *   node task/2026-9-14/bench/selftest.cjs
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const STUB_ROOT = path.join(__dirname, 'fixtures', 'stub-elpis');
const TOUCHED = path.join(STUB_ROOT, 'app/pages/dashboard/dashboard.vue');
const OUT = path.join(__dirname, 'results', '_selftest.json');
const VARIANTS = ['prod.before', 'prod.after', 'prod.nothreads', 'dev.hmr', 'dev.nohmr'];

function main() {
  const before = fs.readFileSync(TOUCHED, 'utf8');

  const child = spawnSync(
    process.execPath,
    [
      path.join(__dirname, 'run.cjs'),
      '--variants',
      VARIANTS.join(','),
      '--cold-runs',
      '1',
      '--touches',
      '2',
      '--out',
      OUT,
      '--label',
      '自检（桩 webpack，非真实测量）'
    ],
    {
      cwd: __dirname,
      env: Object.assign({}, process.env, { ELPIS_ROOT: STUB_ROOT }),
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024
    }
  );

  if (child.status !== 0) {
    process.stderr.write(child.stdout || '');
    process.stderr.write(child.stderr || '');
    throw new Error(`run.cjs 退出码 ${child.status}`);
  }

  const results = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  const problems = [];

  for (const id of VARIANTS) {
    const variant = results.variants[id];
    if (!variant) {
      problems.push(`${id}: 结果里没有这个变体`);
      continue;
    }
    const coldOk = (variant.cold || []).filter((r) => r.ok && r.emitted);
    if (!coldOk.length) problems.push(`${id}: 冷构建没有成功记录`);
    else if (!(coldOk[0].emitted.totals.raw > 0)) problems.push(`${id}: 冷构建产物字节为 0`);

    const rebuilds = ((variant.watch || {}).rebuilds || []).filter((r) => r.ok);
    if (!rebuilds.length) problems.push(`${id}: 增量没有成功记录`);
    else if (!(rebuilds[0].raw > 0)) problems.push(`${id}: 增量「本轮重传字节」为 0（触碰没让内容变化）`);
  }

  // dev.nohmr 必须真的把 HMR 相关的东西摘掉了
  const noHmrNotes = ((results.variants['dev.nohmr'] || {}).cold || [])[0];
  if (!noHmrNotes || !/移除 HMR/.test(String((noHmrNotes.notes || []).join('')))) {
    problems.push('dev.nohmr: 没有走「关掉 HMR」的分支');
  }

  if (fs.readFileSync(TOUCHED, 'utf8') !== before) {
    problems.push('增量实验结束后源文件没有还原');
  }

  for (const suffix of ['.report.md', '.report.html']) {
    if (!fs.existsSync(OUT.replace(/\.json$/, suffix))) problems.push(`报告没生成：${suffix}`);
  }

  process.stdout.write('\n===== 自检结果 =====\n');
  for (const id of VARIANTS) {
    const variant = results.variants[id] || {};
    const cold = ((variant.cold || [])[0] || {}).emitted;
    const rebuild = ((variant.watch || {}).rebuilds || [])[0] || {};
    process.stdout.write(
      `${id.padEnd(14)} 冷构建 ${String((((variant.cold || [])[0] || {}).webpackMs || 0).toFixed(0)).padStart(4)}ms  ` +
        `产物 ${cold ? (cold.totals.raw / 1024).toFixed(1) : '—'}KB  ` +
        `重建 ${String((rebuild.touchToDoneMs || 0).toFixed(0)).padStart(4)}ms  重传 ${(rebuild.raw || 0) / 1024}KB\n`
    );
  }

  if (problems.length) {
    process.stdout.write('\n自检失败：\n');
    for (const p of problems) process.stdout.write(`  ✗ ${p}\n`);
    process.exit(1);
  }

  process.stdout.write('\n自检通过：链路完整、源文件已还原、报告已生成。\n');
  process.stdout.write(`（产物：${OUT.replace(/\.json$/, '.report.html')}）\n`);
}

main();
