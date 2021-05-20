const { CleanWebpackPlugin } = require("clean-webpack-plugin")
const TerserPlugin = require("terser-webpack-plugin")
const commonConfig = require("./webpack.common")
const { WebpackManifestPlugin } = require("webpack-manifest-plugin")
// const BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
//   .BundleAnalyzerPlugin
const { merge } = require("webpack-merge")

const prodConfig = {
  mode: "production",
  devtool: "cheap-module-source-map",
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
  plugins: [
    new WebpackManifestPlugin({}),
    // new BundleAnalyzerPlugin(),
    new CleanWebpackPlugin({
      cleanAfterEveryBuildPatterns: ["dist"],
    }),
  ],
}

module.exports = merge(prodConfig, commonConfig)
