const webpack = require('webpack');
const webpackProdConfig = require('./config/webpack.prod.js');
const { maybeWithMetrics } = require('./metrics');

// 只在 ELPIS_METRICS=1 时挂指标插件：进度条 + 分阶段耗时 + 体积报告 + gzip 产物
const prodConfig = maybeWithMetrics(webpackProdConfig, { label: 'prod' });

webpack(prodConfig, (err, stats) => {
    if (err) { console.log(err); return }
    process.stdout.write(`${stats.toString({
        colors: true,
        modules: false,
        children: false,
        chunks: false,
        chunkModules: true
    })}\n`)
});