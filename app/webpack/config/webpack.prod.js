const merge = require('webpack-merge');
const os = require('os');
const HappyPack = require('happypack')

const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const path = require('path');
const baseConfig = require('./webpack.base');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CSSMinimizerPlugin = require('css-minimizer-webpack-plugin');
const HtmlWebpackInjectAttributesPlugin = require('html-webpack-inject-attributes-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');

//多线程build设置
const happypackCommonConfig = {
  debug: false,
  threadPool:HappyPack.ThreadPool({size: os.cpus().length})
};
const webpackConfig = merge.smart(baseConfig, {
  mode: 'production',
  output: {
    filename: 'js/[name].[contenthash:8].bundle.js',
    path: path.join(process.cwd(), './app/public/dist/prod/'),
    publicPath: '/dist/prod/',
    crossOriginLoading: 'anonymous'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'happypack/loader?id=css'
        ]
      },
      {
        test: /\.js$/,
        include: [
          path.resolve(process.cwd(), './app/pages')
        ],
        use: [
          'happypack/loader?id=js'
        ]
      }
    ]
  },
  // webpack默认不会有大量hint信息，默认warning
  performance: {
    hints: false
  },
  plugins: [
    // 每次 build 前先清空public/dist
    new CleanWebpackPlugin(['public/dist'], {
      root: path.resolve(process.cwd(), './app/'),
      exclude: [],
      verbose: true,
      dry: false
    }),
    // 提取CSS的公共部分
    new MiniCssExtractPlugin({
      chunkFilename: 'css/[name]_[contenthash:8].bundle.css',
    }),
    // 压缩、优化CSS资源
    new CSSMinimizerPlugin(),
    // 多线程打包js，
    new HappyPack({
      ...happypackCommonConfig,
      id: 'js',
      loaders: [`babel-loader?${JSON.stringify({
        presets: ['@babel/preset-env'],
        plugins: [
          '@babel/plugin-transform-runtime'
        ]
      })}`]
    }),
    // 多线程打包CSS
    new HappyPack({
      ...happypackCommonConfig,
      id: 'css',
      loaders: [{
        path: 'css-loader',
        options: {
          importLoaders: 1
        }
      }]
    }),
    // 浏览器请求资源时不发送用户凭证
    new HtmlWebpackInjectAttributesPlugin({
      crossorigin: 'anonymous'
    })
  ],
  optimization: {
    // 使用TerserWebpackPlugin的并发和缓存，提升压缩阶段的性能
    minimize: true,
    minimizer: [
      new TerserWebpackPlugin({
        // cache: true,
        parallel: true,//利用多核CPU加快压缩速度
        terserOptions: {
          compress: {
            drop_console: true, //清除console.log
          }
        }
      })
    ]
  },
});
module.exports = webpackConfig;