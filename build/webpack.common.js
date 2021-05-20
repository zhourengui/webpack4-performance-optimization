const HtmlWebpackPlugin = require("html-webpack-plugin")
// const { ProgressPlugin } = require("webpack")
const ProgressBarPlugin = require("progress-bar-webpack-plugin")
const DashboardPlugin = require("webpack-dashboard/plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const PurgeCSSPlugin = require("purgecss-webpack-plugin")
const glob = require("glob")
const { mainEntryPath, defaultTemplatePath, srcPath } = require("./path")
const argv = require("yargs").argv
const { distPath } = require("./path")
const WebpackBuildNotifierPlugin = require("webpack-build-notifier")
const ParallelUglifyPlugin = require("webpack-parallel-uglify-plugin")
const HtmlInlineScriptPlugin = require("html-inline-script-webpack-plugin")
const OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin")
console.error(argv.env) // prod

const generatePlugins = (config) => {
  let plugins = [
    new PurgeCSSPlugin({
      paths: glob.sync(`${distPath}/*.html`, { nodir: true }),
    }),
    // new ProgressPlugin(),
    new ProgressBarPlugin(),
    new MiniCssExtractPlugin({
      filename: "./css/[name].[fullhash].css",
      chunkFilename: "[name].css",
    }),
    new WebpackBuildNotifierPlugin({
      title: "My Webpack Project",
      logo: "../src/assets/images/wechat-pay.jpeg",
      suppressSuccess: true,
    }),
    new DashboardPlugin({
      port: 3001,
    }),
    new HtmlInlineScriptPlugin([/runtime/]),
    new ParallelUglifyPlugin({
      exclude: /\.min\.js/,
      workerCount: 4, // 多核
      uglifyJS: {},
      uglifyES: {
        output: {
          beautify: false,
          comments: false,
        },
        compress: {
          warnings: false,
          drop_console: true,
          collapse_vars: true,
        },
      },
    }),
    new OptimizeCssAssetsPlugin({
      assetNameRegExp: /\.optimize\.css$/g,
      cssProcessor: require("cssnano"),
      cssProcessorPluginOptions: {
        preset: ["default", { discardComments: { removeAll: true } }],
      },
      canPrint: true,
    }),
  ]

  // 配置多页面
  Object.keys(config.entry).forEach((key) =>
    plugins.push(
      new HtmlWebpackPlugin({
        filename: `${key}.html`,
        template: defaultTemplatePath,
        inlineSource: ".(runtime)$",
        chunks: ["runtime", "vendors", key],
        loading: {
          html: "加载中...",
        },
      })
    )
  )

  return plugins
}

function digest(str) {
  return crypto.createHash("md5").update(str).digest("hex")
}

// Generate own cache key
function cacheKey(options, request) {
  return `build:cache:${digest(request)}`
}

// Read data from database and parse them
function read(key, callback) {
  client.get(key, (err, result) => {
    if (err) {
      return callback(err)
    }

    if (!result) {
      return callback(new Error(`Key ${key} not found`))
    }

    try {
      let data = JSON.parse(result)
      callback(null, data)
    } catch (e) {
      callback(e)
    }
  })
}

// Write data to database under cacheKey
function write(key, data, callback) {
  client.set(key, JSON.stringify(data), "EX", BUILD_CACHE_TIMEOUT, callback)
}
const commonConfig = {
  entry: {
    main: mainEntryPath,
  },
  output: {
    // 自定义打包文件名
    filename: "./js/[name].[fullhash].js",
    path: distPath,
    // publicPath: "https://alibaba.cdn.com",
  },
  module: {
    rules: [
      // {
      //   test: /\.m?js$/,
      //   exclude: /(node_modules|bower_components)/,
      //   use: {
      //     loader: "babel-loader",
      //   },
      // },
      {
        test: /.(jpg|jpeg|png|svg|gif)$/,
        use: {
          loader: "url-loader",
          options: {
            name: "[name].[fullhash].[ext]",
            limit: 2048, // 小于这个文件大小直接打进js
            outputPath: "./assets/images",
          },
        },
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              modules: {
                compileType: "module",
                localIdentName: "[path][name]__[local]--[hash:base64:5]",
              },
            },
          },
          "postcss-loader",
        ],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          // Translates CSS into CommonJS
          {
            loader: "css-loader",
            options: {
              modules: {
                compileType: "module",
                localIdentName: "[path][name]__[local]--[hash:base64:5]",
              },
            },
          },
          "postcss-loader",
          // Compiles Sass to CSS
          "sass-loader",
        ],
      },
    ],
  },
  optimization: {
    innerGraph: true,
    runtimeChunk: {
      name: "runtime",
    },
    splitChunks: {
      chunks: "async", // async sync all 配置对哪种引入文件进行代码分割
      minSize: 300000, // 当文件的大小大于这个的话就进行代码分割
      minChunks: 1, // 当一个模块被用了几次的时候就进行代码分割
      maxAsyncRequests: 30, // 同时加载的模块数 如果超过这个设置的数个的文件分割的时候就不会进行代码分割
      maxInitialRequests: 5, // 入口文件最大分割数 如果超过这个数就不会代码分割
      automaticNameDelimiter: "~", // 文件生成的时候名称中间加的字符串
      enforceSizeThreshold: 50000, //
      cacheGroups: {
        // 打包同步代码的时候下面的代码有效 设置分割的代码放到哪个文件
        // priority 如果符合的项有几个的话 会根据这个值的大小来判断优先级
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true, // 复用之前已经被打包过的模块
        },
        styles: {
          // 入口函数多个的时候，配置这个就可以将多个入口用到的相同样式只打包一个
          name: "styles",
          test: /\.(css|scss|less)$/,
          chunks: "all",
          enforce: true, // 忽略默认参数
        },
        // 如果想要一个入口文件打包一个css文件可以通过下面这种配置
        // mainStyles: {
        //   name: "main",
        //   test: (m, c, entry = "main") =>
        //     m.constructor.name === "CssModule" && recursiveIssuer(m) === entry,
        //   chunks: "all",
        //   enforce: true,
        // },
      },
    },
    usedExports: true,
  },
  resolve: {},
  externals: {},
  // performance: {
  //   hints: false, // 不让webpack警告
  // },
}

commonConfig.plugins = generatePlugins(commonConfig)

module.exports = commonConfig
