'use strict';

const baseConfig = require('./webpack.base');

class HappyPack {
  constructor(options) {
    this.options = options || {};
  }
}

class CleanWebpackPlugin {}

class TerserPlugin {
  constructor() {
    this.options = { parallel: true };
  }
}

const webpackConfig = Object.assign({}, baseConfig, {
  mode: 'production',
  output: { filename: 'js/[name].[contenthash:8].bundle.js', path: '/stub-unused/prod' },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: [require('path').resolve(process.cwd(), 'app/pages')],
        use: ['happypack/loader?id=js']
      }
    ]
  },
  plugins: baseConfig.plugins.concat([new CleanWebpackPlugin(), new HappyPack({ id: 'js' })]),
  optimization: {
    splitChunks: { chunks: 'all' },
    runtimeChunk: true,
    minimize: true,
    minimizer: [new TerserPlugin()]
  }
});

module.exports = webpackConfig;
