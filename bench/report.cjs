'use strict';

/**
 * 把 results/*.json 变成 report.md + report.html。
 * 口径：耗时 ms/s，体积 raw 与 gzip(level 9)，全部取中位数。
 */

const fs = require('fs');
const path = require('path');
const { median, min, max, pctChange, round } = require('./lib/stats.cjs');

const ORDER = ['prod.before', 'prod.after', 'prod.nothreads', 'dev.nohmr', 'dev.hmr'];

function fmtMs(ms) {
  if (typeof ms !== 'number' || !isFinite(ms)) return '—';
  return ms >= 1000 ? `${round(ms / 1000, 2)} s` : `${round(ms, 0)} ms`;
}

function fmtBytes(bytes) {
  if (typeof bytes !== 'number' || !isFinite(bytes)) return '—';
  const kb = bytes / 1024;
  return kb >= 1024 ? `${round(kb / 1024, 2)} MB` : `${round(kb, 1)} KB`;
}

function fmtPct(p) {
  if (typeof p !== 'number' || !isFinite(p)) return '—';
  return `${p > 0 ? '+' : ''}${round(p, 1)}%`;
}

function orderOf(id) {
  const index = ORDER.indexOf(id);
  return index === -1 ? ORDER.length : index;
}

function coldStats(variant) {
  const ok = ((variant || {}).cold || []).filter((r) => r && r.ok && r.emitted);
  const webpackMs = ok.map((r) => r.webpackMs);
  const wallMs = ok.map((r) => r.wallMs);
  const raw = ok.map((r) => r.emitted.totals.raw);
  const gzip = ok.map((r) => r.emitted.totals.gzip);
  return {
    runs: (((variant || {}).cold || []) || []).length,
    okRuns: ok.length,
    webpackMs: median(webpackMs),
    webpackMin: min(webpackMs),
    webpackMax: max(webpackMs),
    wallMs: median(wallMs),
    raw: median(raw),
    gzip: median(gzip),
    rawMin: min(raw),
    rawMax: max(raw),
    gzipMin: min(gzip),
    gzipMax: max(gzip),
    assets: ok.length ? ok[ok.length - 1].emitted.assets : [],
    errors: ((variant || {}).cold || [])[0] ? ((variant || {}).cold[0].errors || []) : []
  };
}

function rebuildStats(variant) {
  const watch = (variant || {}).watch || {};
  const rebuilds = (watch.rebuilds || []).filter((r) => r && r.ok);
  if (!rebuilds.length) return null;
  const ms = rebuilds.map((r) => r.touchToDoneMs);
  const raw = rebuilds.map((r) => r.raw);
  const gzip = rebuilds.map((r) => r.gzip);
  return {
    count: rebuilds.length,
    initialMs: watch.initial ? watch.initial.webpackMs : null,
    ms: median(ms),
    msMin: min(ms),
    msMax: max(ms),
    raw: median(raw),
    gzip: median(gzip),
    sample: rebuilds[0]
  };
}

function collect(results) {
  const variants = results.variants || {};
  return Object.keys(variants)
    .sort((a, b) => orderOf(a) - orderOf(b))
    .map((id) => ({
      id,
      title: variants[id].title || id,
      baseline: variants[id].baseline || null,
      cold: coldStats(variants[id]),
      rebuild: rebuildStats(variants[id]),
      profile: variants[id].profile || null,
      loadError: variants[id].loadError || null
    }));
}

function topAssets(assets, count) {
  return assets.slice().sort((a, b) => b.gzip - a.gzip).slice(0, count);
}

function buildMarkdown(results) {
  const rows = collect(results);
  const meta = results.meta || {};
  const byId = {};
  for (const row of rows) byId[row.id] = row;

  const lines = [];
  let sectionNo = 0;
  const heading = (title) => {
    sectionNo += 1;
    lines.push(`## ${sectionNo}. ${title}`);
    lines.push('');
  };

  lines.push(`# ${meta.label || '构建基准报告'}`);
  lines.push('');
  lines.push(
    `生成时间：${meta.generatedAt || '—'}　|　仓库：\`${meta.elpisRoot || '—'}\` @ \`${meta.elpisHead || '—'}\`` +
      `　|　Node ${meta.node || '—'}　|　${meta.cpu || '—'} × ${meta.cpuCount || '?'} 核　|　内存 ${meta.totalMemGB || '?'} GB`
  );
  lines.push('');
  lines.push(
    `口径：冷构建 = 每个变体 ${meta.coldRuns} 个**全新进程** + \`cache:false\`，取中位数；` +
      `增量 = watch 模式触碰 \`${meta.touchFile || '—'}\`（模式 \`${meta.touchMode || 'content'}\`），测「写盘 → 编译 done」；` +
      `体积 = 磁盘实际产物字节 + gzip(level 9)。`
  );
  lines.push('');

  heading('冷构建：耗时与产物体积');
  lines.push('| 变体 | 编译耗时（中位） | 最小 ~ 最大 | 进程墙钟（中位） | 产物 raw | 产物 gzip | 相对基线 | 成功/总次数 |');
  lines.push('|---|---|---|---|---|---|---|---|');
  for (const row of rows) {
    const base = row.baseline ? byId[row.baseline] : null;
    const timeDelta = base ? fmtPct(pctChange(row.cold.webpackMs, base.cold.webpackMs)) : '基线';
    const gzipDelta = base ? fmtPct(pctChange(row.cold.gzip, base.cold.gzip)) : '基线';
    lines.push(
      `| ${row.id}${row.baseline ? `（对比 ${row.baseline}）` : '（基线）'} ` +
        `| ${fmtMs(row.cold.webpackMs)} | ${fmtMs(row.cold.webpackMin)} ~ ${fmtMs(row.cold.webpackMax)} ` +
        `| ${fmtMs(row.cold.wallMs)} | ${fmtBytes(row.cold.raw)} | ${fmtBytes(row.cold.gzip)} ` +
        `| 耗时 ${timeDelta}　体积 ${gzipDelta} | ${row.cold.okRuns}/${row.cold.runs} |`
    );
  }
  lines.push('');
  lines.push(`> 变体说明：${rows.map((r) => `${r.id} = ${r.title}`).join('；')}`);
  lines.push('');

  const before = byId['prod.before'];
  const after = byId['prod.after'];
  if (before && after && before.cold.assets.length && after.cold.assets.length) {
    heading('产物体积构成（按 gzip 降序，前 8）');
    lines.push('| 文件 | 优化前 raw | 优化前 gzip | 优化后 raw | 优化后 gzip | gzip 变化 |');
    lines.push('|---|---|---|---|---|---|');
    const mapOf = (assets) => {
      const map = {};
      for (const a of assets) map[a.name] = a;
      return map;
    };
    const beforeMap = mapOf(before.cold.assets);
    const afterMap = mapOf(after.cold.assets);
    const names = new Set(topAssets(before.cold.assets, 8).map((a) => a.name));
    for (const a of topAssets(after.cold.assets, 8)) names.add(a.name);
    for (const name of names) {
      const b = beforeMap[name];
      const a = afterMap[name];
      lines.push(
        `| \`${name}\` | ${b ? fmtBytes(b.raw) : '—'} | ${b ? fmtBytes(b.gzip) : '—'} ` +
          `| ${a ? fmtBytes(a.raw) : '—'} | ${a ? fmtBytes(a.gzip) : '—'} ` +
          `| ${a && b ? fmtPct(pctChange(a.gzip, b.gzip)) : '—'} |`
      );
    }
    lines.push('');
  }

  const watchRows = rows.filter((r) => r.rebuild);
  if (watchRows.length) {
    heading('增量热更新：改一个文件到新产物 ready');
    lines.push('| 变体 | 首次构建 | 重建中位 | 最小 ~ 最大 | 本轮真正重传 raw | 本轮真正重传 gzip | 相对基线（重建耗时） |');
    lines.push('|---|---|---|---|---|---|---|');
    for (const row of watchRows) {
      const base = row.baseline ? byId[row.baseline] : null;
      const delta = base && base.rebuild ? fmtPct(pctChange(row.rebuild.ms, base.rebuild.ms)) : '基线';
      lines.push(
        `| ${row.id} | ${fmtMs(row.rebuild.initialMs)} | ${fmtMs(row.rebuild.ms)} ` +
          `| ${fmtMs(row.rebuild.msMin)} ~ ${fmtMs(row.rebuild.msMax)} | ${fmtBytes(row.rebuild.raw)} ` +
          `| ${fmtBytes(row.rebuild.gzip)} | ${delta} |`
      );
    }
    lines.push('');
    const sampleRow = watchRows[0];
    if (sampleRow.rebuild.sample) {
      const changed = sampleRow.rebuild.sample.changed || [];
      lines.push(`> 重建样例（${sampleRow.id}）：本轮产出变更文件 ${changed.length} 个 → ${changed.map((c) => `\`${c}\``).join('、') || '（无）'}`);
      lines.push('');
    }
  }

  const profileRows = rows.filter((r) => r.profile && r.profile.ok);
  if (profileRows.length) {
    heading('耗时归因（profile）');
    for (const row of profileRows) {
      lines.push(`### ${row.id}`);
      lines.push('');
      lines.push('| 模块 | profile total | 其中 building |');
      lines.push('|---|---|---|');
      for (const m of (row.profile.modules || []).slice(0, 10)) {
        lines.push(`| \`${String(m.name).slice(0, 80)}\` | ${fmtMs(m.total)} | ${fmtMs(m.building)} |`);
      }
      lines.push('');
      if ((row.profile.loaders || []).length) {
        lines.push('| loader 链 | 累计耗时 |');
        lines.push('|---|---|');
        for (const l of row.profile.loaders.slice(0, 8)) {
          lines.push(`| \`${String(l.name).slice(0, 80) || '(no loader)'}\` | ${fmtMs(l.total)} |`);
        }
        lines.push('');
      }
    }
  }

  heading('结论（自动生成）');
  for (const row of rows) {
    const base = row.baseline ? byId[row.baseline] : null;
    if (!base) {
      lines.push(
        `- **${row.id}** 作为基线：冷构建 ${fmtMs(row.cold.webpackMs)}、产物 gzip ${fmtBytes(row.cold.gzip)}` +
          `${row.rebuild ? `、重建 ${fmtMs(row.rebuild.ms)}` : ''}。`
      );
      continue;
    }
    const parts = [];
    parts.push(`耗时 ${fmtPct(pctChange(row.cold.webpackMs, base.cold.webpackMs))}`);
    parts.push(`gzip 体积 ${fmtPct(pctChange(row.cold.gzip, base.cold.gzip))}`);
    if (row.rebuild && base.rebuild) parts.push(`重建耗时 ${fmtPct(pctChange(row.rebuild.ms, base.rebuild.ms))}`);
    lines.push(`- **${row.id}** 相对 ${row.baseline}：${parts.join('，')}。`);
  }
  lines.push('');

  const failed = rows.filter((r) => r.cold.okRuns === 0);
  if (failed.length) {
    heading('需要人工确认的变体');
    for (const row of failed) {
      lines.push(`- **${row.id}** 全部冷构建失败${row.loadError ? `（${row.loadError}）` : ''}：`);
      for (const err of (row.cold.errors || []).slice(0, 3)) lines.push(`  - \`${err}\``);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('口径与纪律见同目录 README.md：单变量、全新进程、取中位数、raw/gzip 双口径。');
  lines.push('');
  return lines.join('\n');
}

function bar(value, base, color, label) {
  const width = base > 0 ? Math.max(2, Math.min(100, (value / base) * 100)) : 0;
  return (
    `<div class="bar"><span style="width:${round(width, 2)}%;background:${color}"></span>` +
    `<em>${label}</em></div>`
  );
}

function buildHtml(results) {
  const rows = collect(results);
  const meta = results.meta || {};
  const timeBase = Math.max.apply(null, rows.map((r) => r.cold.webpackMs || 0).concat([1]));
  const sizeBase = Math.max.apply(null, rows.map((r) => r.cold.gzip || 0).concat([1]));

  const timeBars = rows
    .map((r) => `<div class="row"><b>${r.id}</b>${bar(r.cold.webpackMs || 0, timeBase, '#4f8cff', fmtMs(r.cold.webpackMs))}</div>`)
    .join('');
  const sizeBars = rows
    .map((r) => `<div class="row"><b>${r.id}</b>${bar(r.cold.gzip || 0, sizeBase, '#22c55e', fmtBytes(r.cold.gzip))}</div>`)
    .join('');
  const rebuildRows = rows
    .filter((r) => r.rebuild)
    .map(
      (r) =>
        `<tr><td>${r.id}</td><td>${fmtMs(r.rebuild.initialMs)}</td><td>${fmtMs(r.rebuild.ms)}</td>` +
        `<td>${fmtBytes(r.rebuild.raw)}</td><td>${fmtBytes(r.rebuild.gzip)}</td></tr>`
    )
    .join('');
  const tableRows = rows
    .map(
      (r) =>
        `<tr><td>${r.id}</td><td>${fmtMs(r.cold.webpackMs)}</td><td>${fmtBytes(r.cold.raw)}</td>` +
        `<td>${fmtBytes(r.cold.gzip)}</td><td>${r.baseline || '基线'}</td></tr>`
    )
    .join('');

  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>${meta.label || '构建基准报告'}</title>
<style>
  :root{color-scheme:dark}
  body{margin:0;padding:32px;background:#0f1115;color:#e6e8ee;font:14px/1.7 -apple-system,"Segoe UI",system-ui,sans-serif}
  h1{font-size:22px;margin:0 0 6px}
  h2{font-size:15px;margin:30px 0 12px;color:#9fb4d8}
  .meta{color:#8b93a7;font-size:12.5px;margin-bottom:6px}
  .row{display:grid;grid-template-columns:150px 1fr;gap:12px;align-items:center;margin:6px 0}
  .row b{font-weight:500;color:#c7cede;font-size:12.5px}
  .bar{position:relative;background:#181c24;border-radius:6px;height:22px}
  .bar span{display:block;height:100%;border-radius:6px;opacity:.85}
  .bar em{position:absolute;right:8px;top:0;font-style:normal;font-size:12px;line-height:22px}
  table{border-collapse:collapse;width:100%;margin-top:8px;font-size:13px}
  th,td{border-bottom:1px solid #222833;padding:8px 10px;text-align:left}
  th{color:#8b93a7;font-weight:500}
  code{background:#181c24;padding:1px 5px;border-radius:4px}
</style></head>
<body>
  <h1>${meta.label || '构建基准报告'}</h1>
  <div class="meta">${meta.generatedAt || ''} · Node ${meta.node || ''} · ${meta.cpu || ''} × ${meta.cpuCount || '?'} 核 · 仓库 ${meta.elpisHead || ''}</div>
  <div class="meta">冷构建 = 每变体 ${meta.coldRuns} 个全新进程 + cache:false，取中位数；增量 = 触碰 <code>${meta.touchFile || ''}</code>（模式 ${meta.touchMode || 'content'}）到编译 done</div>
  <h2>冷构建耗时（中位数）</h2>
  ${timeBars || '<div class="meta">无数据</div>'}
  <h2>产物 gzip 体积（中位数）</h2>
  ${sizeBars || '<div class="meta">无数据</div>'}
  <h2>总表</h2>
  <table><thead><tr><th>变体</th><th>编译耗时</th><th>raw</th><th>gzip</th><th>对比对象</th></tr></thead><tbody>${tableRows}</tbody></table>
  <h2>增量重建</h2>
  <table><thead><tr><th>变体</th><th>首次构建</th><th>重建中位</th><th>重传 raw</th><th>重传 gzip</th></tr></thead><tbody>${rebuildRows || '<tr><td colspan="5">无数据</td></tr>'}</tbody></table>
</body></html>`;
}

function generateReport(jsonPath, options) {
  const opts = options || {};
  const results = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const base = jsonPath.replace(/\.json$/i, '');
  const written = [];

  const mdPath = `${base}.report.md`;
  fs.writeFileSync(mdPath, buildMarkdown(results), 'utf8');
  written.push(mdPath);

  if (opts.html !== false) {
    const htmlPath = `${base}.report.html`;
    fs.writeFileSync(htmlPath, buildHtml(results), 'utf8');
    written.push(htmlPath);
  }

  return written;
}

module.exports = { generateReport, buildMarkdown, buildHtml };

if (require.main === module) {
  const target = process.argv[2];
  if (!target) {
    process.stderr.write('用法：node report.cjs <results/*.json>\n');
    process.exit(1);
  }
  for (const file of generateReport(path.resolve(target))) process.stdout.write(`写出：${file}\n`);
}
