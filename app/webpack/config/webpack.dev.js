const path = require('path');
const merge = require('webpack-merge');
const baseConfig = require('./webpack.base');
const  webpack  = require('webpack');
//devServer配置
const DEV_SERVER_CONFIG = {
  HOST: '127.0.0.1',
  PORT: 9002,
  HMR_PATH: '__webpack_hmr',
  TIMEOUT: 20000
};
// 开发阶段的entry配置要加入HMR
Object.keys(baseConfig.entry).forEach(v=>{
  // 第三方包不参与hmr热更新
  if(v!=='vendor'){
    baseConfig.entry[v] = [
      baseConfig.entry[v],
      `webpack-hot-middleware/client?path=http://${DEV_SERVER_CONFIG.HOST}:${DEV_SERVER_CONFIG.PORT}/${DEV_SERVER_CONFIG.HMR_PATH}&timeout=${DEV_SERVER_CONFIG.TIMEOUT}&reload=true`
    ]
  }
})
//生产环境webpack配置
const webpackConfig = merge.smart(baseConfig,{
  mode: 'development',
  // source-map
  devtool: 'eval-cheap-module-source-map',
  output: {
    filename: 'js/[name].[chunkhash:8].bundle.js',
    path: path.resolve(process.cwd(), './app/public/dist/dev/'),
    publicPath: `http://${DEV_SERVER_CONFIG.HOST}:${DEV_SERVER_CONFIG.PORT}/public/dist/dev/`,
    globalObject: 'this'
  },
  // 开发阶段插件
  plugins: [
    new webpack.HotModuleReplacementPlugin({
      multiStep:false,
    })
  ]
});
module.exports = {
  webpackConfig,
  DEV_SERVER_CONFIG
};