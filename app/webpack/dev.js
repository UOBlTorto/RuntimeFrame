const express = require('express');
const path = require('path');
const webpack = require('webpack');
const devMiddleware = require('webpack-dev-middleware');
const hotMiddleware = require('webpack-hot-middleware');
const consoler = require('consoler');
const { webpackConfig, DEV_SERVER_CONFIG } = require('./config/webpack.dev');
const { maybeWithMetrics } = require('./metrics');

const app = express();

// 只在 ELPIS_METRICS=1 时挂指标插件。
// dev 下关掉体积分析与 gzip：eval-source-map 会让 dev 体积虚高（不可与 prod 比），
// 而且每次热更新都重写体积报告纯属浪费 —— dev 只留进度条 + 每次重建的耗时汇总。
const compiler = webpack(maybeWithMetrics(webpackConfig, { label: 'dev', analyze: false, gzip: false }));

// 指定静态文件目录
app.use(express.static(path.join(__dirname, '../public/dist')));
// 引入devMiddleware中间件（监听文件改动）---当成注册路由
app.use(devMiddleware(compiler, {
  writeToDisk: (filePath) => {
    return filePath.endsWith('.html')
  },
  publicPath: webpackConfig.output.publicPath,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'X-Requested-With,content-type,Authorization'
  },
  stats: {
    colors: true
  }
}));
// 引入devMiddleware中间件(实现热更新通知浏览器) ----当成建立一个长链接通道
app.use(hotMiddleware(compiler, {
  path: `/${DEV_SERVER_CONFIG.HMR_PATH}`,
  log: () => {}
}));

consoler.info('请等待webpage初次构建...');

const PORT = DEV_SERVER_CONFIG.PORT;

app.listen(PORT, () => {
  console.log(`app listening on port : ${PORT}`);
});