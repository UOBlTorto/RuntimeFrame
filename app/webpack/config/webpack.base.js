const path = require('path')
const { VueLoaderPlugin } = require('vue-loader')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const glob = require('glob');


/**
 * 获取app/pages/所有VUE文件
 */
const pageEntry={};
const htmlWebpackPluginList=[];
const entryList = glob.sync(path.resolve(process.cwd(), './app/pages/**/entry.*.js'));
entryList.forEach(file=>{
  const entryName = path.basename(file, '.js');
  //构造entry
  pageEntry[entryName] = file;
  //构造渲染的页面
  htmlWebpackPluginList.push(
    new HtmlWebpackPlugin({
      filename: path.resolve(process.cwd(),'./app/public/dist',`${entryName}.html`),
      template: path.resolve(process.cwd(),'./app/view/entry.html'),
      chunks: [entryName]
    })
  )
})
/**
 * webpack基础配置
 */
module.exports = {
  // ===== 入口 =====
  entry: pageEntry,

  // ===== 出口 =====
  output: {
    // filename: 'js/[name]_[chunkhash:8].bundle.js',
    // path: path.resolve(process.cwd(),'./app/public/dist/prod'),
    // publicPath: '/dist/prod/',
    // crossOriginLoading: 'anonymous'
  },

  // ===== 模块解析 =====
  resolve: {
    extensions: ['.js', '.vue', '.less', '.css'],
    alias: {
      $pages: path.resolve(process.cwd(),'./app/pages'),
      $common: path.resolve(process.cwd(),'./app/pages/common'),
      $widgets: path.resolve(process.cwd(),'./app/pages/widgets'),
      $store: path.resolve(process.cwd(),'./app/pages/store')
    }
  },

  // ===== Loader =====
  module: {
    rules: [
      // JS 
      {
        test: /\.js$/,
        include: [path.resolve(process.cwd(),'./app/pages')],
        use: {
          loader: "babel-loader",
        }
      },

      // Vue（不需要可删）
      {
        test: /\.vue$/,
        use: 'vue-loader'
      },

      // CSS
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },

      // LeSS
      {
        test: /\.less$/,
        use: [
          'style-loader',
          'css-loader',
          'less-loader'
        ]
      },

      // 图片
      {
        test: /\.(png|jpe?g|gif)(\?.+)?$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 300,
            esModule: false
          }
        }
      },

      // 字体
      {
        test: /\.(woff2?|eot|ttf|woff)(\?\S*)?$/,
        use: 'file-loader'
      }
    ]
  },

  // ===== 插件 =====
  plugins: [
    new VueLoaderPlugin(), // Vue 项目保留
    new webpack.ProvidePlugin({
      Vue: 'vue',
      axios: 'axios',
      _: 'lodash'
    }),
    new webpack.DefinePlugin({
      __VUE_OPTIONS_API__: 'true',
      __VUE_PROD_DEVTOOLS__: 'false',
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
    }),
    ...htmlWebpackPluginList
  ],

  // ==== 打包优化 ====
  optimization: {
    splitChunks: {
      chunks: 'all',
      maxAsyncRequests: 10,
      maxInitialRequests: 10,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          priority: 20,
          enforce: true,
          reuseExistingChunk: true,
        },
        common: {
          test: /[\\/]widgets|common[\\/]/,
          name: 'common',
          minChunks: 2,
          minSize: 1,
          priority: 10,
          reuseExistingChunk: true
        }
      }
    },
    // 将webpack运行时生成的代码打包到runtime.js
    runtimeChunk: true
  }
}
