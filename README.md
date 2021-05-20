# Webpack5 配置实战

## SPA 配置

### 安装 Webpack（推荐安装在项目里）

```bash
$ yarn add webpack webpack-cli -D
```

### mode

默认是 production，打包文件压缩，开发是 development，不被压缩

### entry

打包入口

### output

打包后的文件目录

### loader

文件的预处理器，webpack 默认只认识 js 文件，在静态编译的时候就需要对应的 loader 支持

一切皆模块

语法：

```javascript
const path = require("path")

module.exports = {
  ...,
  module: {
    ...,
    rules: [
      {
        test: /.(jpg|jpeg|png|svg|gif)/,
        use: {
          loader: "file-loader",
        },
      },
      ...,
    ],
  },
}
```

图片资源（url-loader）、css 资源（style-loader（将样式放到 style 标签内）、css-loader、sass-loader、postcss-loader）

### Plugin

HtmlWebpackPlugin 自动往 html 引入打包后的文件
CleanWebpackPlugin 打包前清除 dist 文件
ProgressPlugin 打包进程

### 配置 CDN

```javascript
module.exports = {
  ...,
  output: {
    ...,
    publicPath: "https://alibaba.cdn.com",
  },
}
```

### SourceMap 错误定位

能定位源代码的位置，定位错误代码调试
dev 环境下推荐：eval-cheap-module-source-map
prod 环境下推荐：cheap-module-source-map 不显式源码并且提示友好

```javascript
module.exports = {
  ...,
  devtool: "cheap-module-source-map",
}
```

### 自动打包，监听文件变化

这种方式需要我们手动刷新浏览器

```bash
$ npx webpack --watch
```

devServer，启动服务，可以监听文件变化，并自动刷新
webpack-dev-server

```javascript
module.exports = {
  ...,
  devServer: {
    contentBase: path.join(__dirname, "dist"),
    compress: true,
    port: 9000,
    open: true,
  },
}

```

### HMR 局部更新

开启步骤：

- 必须使用 webpack-dev-server 作为服务器启动
- devServer 中配置中 hot 为 true
- 添加 HotModuleReplacementPlugin
- 需要在 JS 模块中添加一些代码

```javascript
if (module.hot) {
  module.hot.accept("./print.js", function () {
    console.log("Accepting the updated printMe module!")
    printMe()
  })
}
```

### JavaScript 的处理（babel）

babel 就是 js 的编译器，ES2015 转化为向后兼容的低浏览器兼容的语法
ES2016-2020 转为 ES2015
babel-loader @babel/core @babel/preset-env(ES6+语法转换)

但是有一些语法没有转，因为 babel 只转新标准新增的方法（箭头函数、let、const）
标准引入的全局变量，部分原生对象新增的原型链上的方法不转，像 Promise、Symbol、set，这个时候就需要 polyfill
@babel/proyfill
这时候就需要按需引入，不然会将 proyfill(垫片) 整个文件引入
配置.babelrc

```javascript
{
  ...,
  "presets": [
    [
      "@babel/preset-env",
      {
        "useBuiltIns": "usage", // 必须同时设置corejs3 默认使用core2
        "corejs": 3
      }
    ]
  ]
}
```

@babel/proyfill 它以全局变量方法注入，如果在开发类库，UI 组件时使用，会造成全局变量污染

所以使用@babel/plugin-transform-runtime 替代@babel/proyfill，它是以闭包的形式注入，推荐使用这种
需要配合@babel/runtime-corejs3

```javascript
{
  "plugins": [
    [
      "@babel/plugin-transform-runtime",
      {
        "absoluteRuntime": false,
        "helpers": true,
        "regenerator": true,
        "version": "7.0.0-beta.0",
        "corejs": 3
      }
    ]
  ]
}
```

Magic Component

```javascript
import(/* webpackChunkName: "chunkName" */ "./utils.js")
```

### TreeShaking 摇树优化

依赖于 ES6 的模块语法

只有在 Production 模式下才会进行 TreeShaking

webpack 默认只对某一些导出的方法进行 TreeShaking，而对引入的第三方的包并不会 TreeShaking，这时候就需要 js 的优化

webpack4: webpack-deep-scope-plugin 深度 TreeShaking

在 webpack5 中已经默认集成 optimization.innerGraph

lodash-es 支持结构

CSS 的 TreeShaking
需要支持模块导入 css
对比 html 的 css，遍历所有的 dom，如果没有用到的就删了

一般的 CSS TreeShaking 是应用在 MPA 多页面应用中
SPA 的样式是给 VDOM 使用的
试下下面的插件的时候一定不要开启 Module

1、purgecss-webpack-plugin 使用这个插件可以进行 css TreeShaking
2、@wafflepie/purify-css-webpack

```javascript
module.exports = {
  module: {
    rules: [
      {
        loader: "css-loader",
        options: {
          modules: {
            compileType: "module",
            localIdentName: "[path][name]__[local]--[hash:base64:5]",
          },
        },
      },
    ]
  }
},
```

模块化编译后的 css .[fileName]-[className]-[hash] {}

### 环境区分

### JS 的优化

- 入口配置：entry 多入口

```javascript
const { ProvidePlugin } = require("webpack")
const commonConfig = {
  entry: {
    ...
    jquery: "jquery",
  },
  plugins: [
    new ProvidePlugin({
      $: "jquery",
      JQuery: "jquery",
    }),
  ],
}
```

- 抽取公共代码：splitchunks

```javascript
const commonConfig = {
  ...,
  optimization: {
    runtimeChunk: {
      name: "runtime",
    },
    splitChunks: {
      chunks: "async", // async sync all 配置对哪种引入文件进行代码分割
      minSize: 300000, // 当文件的大小大于这个的话就进行代码分割
      minChunks: 1, // 当一个模块被用了几次的时候就进行代码分割
      maxAsyncRequests: 30, // 同时加载的模块数 如果超过这个设置的数个的文件分割的时候就不会进行代码分割
      maxInitialRequests: 30, // 入口文件最大分割数 如果超过这个数就不会代码分割
      automaticNameDelimiter: "~", // 文件生成的时候名称中间加的字符串
      cacheGroups: {
        // 打包同步代码的时候下面的代码有效 设置分割的代码放到哪个文件
        // priority 如果符合的项有几个的话 会根据这个值的大小来判断优先级
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10, // 优先级配置
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true, // 复用之前已经被打包过的模块
        },
        // styles: {
        //   // 入口函数多个的时候，配置这个就可以将多个入口用到的相同样式只打包一个
        //   name: "styles",
        //   test: /\.(css|scss|less)$/,
        //   chunks: "all",
        //   enforce: true, // 忽略默认参数
        // },
        // 如果想要一个入口文件打包一个css文件可以通过下面这种配置
        mainStyles: {
          name: "main",
          test: (m, c, entry = "main") =>
            m.constructor.name === "CssModule" && recursiveIssuer(m) === entry,
          chunks: "all",
          enforce: true,
        },
      },
    },
  },
}
```

- 动态加载：按需加载，懒加载

```javascript
import(/* webpackChunkName:'jquery' */ "jquery").then(({ default: $ }) => {
  console.error($)
})
```

js 代码压缩
terser-webpack-plugin

### CSS 的优化

css 代码分割
MiniCssExtractPlugin

css 压缩
optimize-css-assets-webpack-plugin

### 代码包分析工具

webpack-bundle-analyzer

### 环境变量

yargs

```bash
$ webpack serve --config ./build/webpack.prod.js --env prod
```

```javascript
const argv = require("yargs").argv
console.error(argv.env)
```

## MPA 配置

多页转单页

nuxt、next、nest

```javascript
Object.keys(config.entry).forEach((key) =>
  plugins.push(
    new HtmlWebpackPlugin({
      filename: `${key}.html`,
      template: defaultTemplatePath,
      chunks: ["runtime", "vendors", key],
    })
  )
)
```

## 性能优化

### 开发阶段

#### 检测打包速度

speed-measure-webpack-plugin

#### 多核压缩 css

#### 多核压缩 js

开启多核压缩
uglifyjs-webpack-plugin
或
webpack-parallel-uglify-plugin

#### 开启通知面板

webpack-build-notifier

#### 开启打包进度

ProgressPlugin
或
progress-bar-webpack-plugin

#### 打包面板

webpack-dashboard

### 上线阶段

#### ES6 不需要编译

https://cdn.polyfill.io/v2/polyfill.min.js?features=Map,Set,Reflect

#### 前端缓存小负载

localstorage

ajs -> a.xxx.js
a.xxx.js -> 代码 后台每次计算出当前包

webpack-nano webpack-manifest-plugin

#### 自动插入 loading...

```javascript
new HtmlWebpackPlugin({
  ...
  loading: {
    html: "加载中...",
  },
})
```

```html
<div id="app"><%= htmlWebpackPlugin.options.loading.html %></div>
```

真实 loading 可以通过编写插件，判断编译资源的进度

#### 多页转单页 性能 请求的数量 runtime 打进 html

html-inline-script-webpack-plugin

#### 分析打包结果

监控文件大小
bundlesize
或
https://github.com/alexkuz/webpack-chart
http://webpack.github.io/analyse

#### test（检测尾缀） excule include 非常重要

#### 压缩 JS CSS 多核打包

webpack-parallel-uglify-plugin
happypack
optimize-css-assets-webpack-plugin

#### devtool

#### cache-loader

#### 提高代码质量

code-metrics-loader
