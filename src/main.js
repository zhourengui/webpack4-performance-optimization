import "./assets/styles/index.scss"

setTimeout(() => {
  import(/* webpackChunkName: "utils" */ "./utils")
}, 3000)

console.error(styles)
