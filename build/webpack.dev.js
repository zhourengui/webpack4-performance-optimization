const path = require("path")
const { HotModuleReplacementPlugin } = require("webpack")
const { merge } = require("webpack-merge")
const commonConfig = require("./webpack.common")
const { distPath } = require("./path")

const devConfig = {
  mode: "development",
  devtool: "eval-cheap-module-source-map",
  devServer: {
    contentBase: distPath,
    compress: true,
    port: 9000,
    open: true,
    proxy: {},
    hot: true,
  },
  plugins: [new HotModuleReplacementPlugin()],
}
module.exports = merge(devConfig, commonConfig)
