'use strict';

const path = require('path');

class HtmlWebpackPlugin {
  constructor(options) {
    this.userOptions = options;
    this.options = Object.assign({}, options);
  }
}

module.exports = {
  entry: { dashboard: path.resolve(process.cwd(), 'app/pages/dashboard/dashboard.vue') },
  output: {},
  resolve: { extensions: ['.js', '.vue'] },
  module: { rules: [] },
  plugins: [
    new HtmlWebpackPlugin({
      filename: path.resolve(process.cwd(), 'app/public/dist', 'dashboard.html'),
      template: path.resolve(process.cwd(), 'app/view/entry.html')
    })
  ],
  optimization: { splitChunks: false, runtimeChunk: false }
};
