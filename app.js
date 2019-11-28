// 引入包
let Koa = require('koa')
let static = require('koa-static')
let route = require('./route')
let bodyParser = require('koa-bodyparser')
// 创建实例
let app = new Koa()
// post获取参数
app.use(bodyParser({
  formLimit: '5mb'
}))
// 配置静态文件
app.use(static('./'))
// 设置
app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*')
  ctx.set('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild, token')
  ctx.set('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS')

  if (ctx.method == 'OPTIONS') {
    ctx.body = 200; 
    return
  }

  await next()
})
// 路由
app.use(route.routes())
// 错误事件
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

module.exports = app