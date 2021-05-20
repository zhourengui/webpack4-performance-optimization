const path = require("path")

const resolve = (dir) => path.resolve(__dirname, dir)

module.exports = {
  mainEntryPath: resolve("../src/main.js"),
  distPath: resolve("../dist"),
  defaultTemplatePath: resolve("../public/index.html"),
  srcPath: resolve("../src"),
}
