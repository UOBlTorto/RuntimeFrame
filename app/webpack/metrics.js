'use strict';

/**
 * 构建指标包
 * 使用方式：在 dev.js / prod.js 里用 maybeWithMetrics(webpackConfig, { label: 'xxx' }) 包一层。
 * 设计原则：
 *   1) 只有环境变量 ELPIS_METRICS=1 时才生效，日常构建零开销（npm run build:prod 完全不受影响）；
 *   2) 每个插件独立 try/catch —— 没装的只打印一行提示，绝不把构建搞挂；
 *   3) 所有产物统一归档到项目根目录的 metrics-out/，方便对比和清理。
 */

const fs = require('fs');
const path = require('path');

/** 归档目录（按需创建） */
function ensureOutDir() {
  const dir = path.resolve(process.cwd(), 'metrics-out');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * 给 webpack 配置挂上指标插件。
 * @param {object} config  webpack 配置对象（原地追加 plugins 后返回）
 * @param {object} [options]
 * @param {string}  [options.label]    标签，用来给产物命名，如 'dev' / 'prod'
 * @param {boolean} [options.analyze]  是否做体积分析，默认 true（dev 建议关掉）
 * @param {boolean} [options.open]     体积报告是否自动开浏览器，默认 true
 * @param {boolean} [options.gzip]     是否额外产出 .gz 文件，默认 true（dev 建议关掉）
 * @param {boolean} [options.summary]  是否每次编译后在终端打一行汇总，默认 true
 */
function withMetrics(config, options) {
  const opts = Object.assign(
    { label: 'build', analyze: true, open: true, gzip: true, summary: true },
    options || {}
  );
  const warnings = [];
  const outputPath = (config.output && config.output.path) || process.cwd();
  config.plugins = config.plugins || [];

  // ① 终端进度条 + 分阶段耗时（compile / emit 各花多久，回答"4354ms 花在哪"）
  try {
    const WebpackBar = require('webpackbar');
    config.plugins.push(new WebpackBar({ name: opts.label, profile: true }));
  } catch (err) {
    warnings.push(`webpackbar 未接入（${err.message}）→ npm i -D webpackbar`);
  }

  // ② 体积分析：静态 HTML 报告 + stats.json
  //    filename 用相对名：bundle-analyzer 会把它们写在 output.path 下，稍后由 ④ 归档到 metrics-out
  if (opts.analyze) {
    try {
      const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: opts.open,
          defaultSizes: 'gzip', // 方块图默认按 gzip 显示，这才是用户实际下载的体积
          reportFilename: `bundle-report-${opts.label}.html`,
          generateStatsFile: true,
          statsFilename: `bundle-stats-${opts.label}.json`,
          logLevel: 'silent'
        })
      );
    } catch (err) {
      warnings.push(`webpack-bundle-analyzer 未接入（${err.message}）→ npm i -D webpack-bundle-analyzer`);
    }
  }

  // ③ 真实 gzip 体积（webpack 汇总报的是 raw，用户下载的是 gzip）
  if (opts.gzip) {
    try {
      const CompressionPlugin = require('compression-webpack-plugin');
      config.plugins.push(
        new CompressionPlugin({
          filename: '[path][base].gz',
          algorithm: 'gzip',
          threshold: 1024,
          minRatio: 0.8
        })
      );
    } catch (err) {
      warnings.push(`compression-webpack-plugin 未接入（${err.message}）→ npm i -D compression-webpack-plugin`);
    }
  }

  // ④ 兜底：无论上面装没装，都在每次编译结束后写一份 stats.json 并在终端打一行汇总
  config.plugins.push({
    apply(compiler) {
      compiler.hooks.done.tap('elpis-metrics', (stats) => {
        try {
          const dir = ensureOutDir();
          const json = stats.toJson({ all: false, assets: true, chunks: true, modules: false });
          const assets = (json.assets || []).slice().sort((a, b) => b.size - a.size);
          const total = assets.reduce((sum, a) => sum + a.size, 0);
          const ms = stats.endTime - stats.startTime;

          fs.writeFileSync(path.join(dir, `stats-${opts.label}.json`), JSON.stringify(json, null, 2), 'utf8');

          // 把 bundle-analyzer 写在输出目录里的报告归档到 metrics-out
          const archive = [
            [`bundle-report-${opts.label}.html`, `bundle-${opts.label}.html`],
            [`bundle-stats-${opts.label}.json`, `bundle-stats-${opts.label}.json`]
          ];
          for (const [from, to] of archive) {
            const src = path.join(outputPath, from);
            if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dir, to));
          }

          if (opts.summary) {
            const top = assets
              .slice(0, 8)
              .map((a) => `  ${(a.size / 1024).toFixed(1).padStart(9)} KB  ${a.name}`)
              .join('\n');
            process.stdout.write(
              `\n[metrics:${opts.label}] 编译耗时 ${ms} ms，产物合计 ${(total / 1024).toFixed(1)} KB` +
                `（${assets.length} 个文件），最大的 8 个：\n${top}\n` +
                `[metrics:${opts.label}] 报告目录：${dir}\n`
            );
          }
        } catch (err) {
          process.stdout.write(`\n[metrics] 汇总失败：${err.message}\n`);
        }
      });
    }
  });

  for (const warning of warnings) process.stdout.write(`[metrics] ${warning}\n`);
  return config;
}

/** 开关：只有 ELPIS_METRICS=1 时才接入；否则原样返回 config，日常构建零开销 */
function maybeWithMetrics(config, options) {
  if (String(process.env.ELPIS_METRICS || '') !== '1') return config;
  return withMetrics(config, options);
}

module.exports = { withMetrics, maybeWithMetrics };