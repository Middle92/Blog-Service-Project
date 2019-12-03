const router = require('koa-router')()
const body = require('koa-body')
const fs = require('fs')
const path = require('path')
const mysql_shell = require('../config/mysql_config')
// 工具
const utils = require('../utils')
router
  // 获取 导航数据
  .get('/get_navigation_list', async (ctx, next) => {
    console.log(1)
    // 获取mysql数据
    const navigation_list = await mysql_shell('SELECT * FROM blog.navigation_list;')
    // 转换tree数据格式
    const change_navigation_list = utils.composeTree(navigation_list)
    
    ctx.body = {
      code: 200,
      data: change_navigation_list,
      massage: '查询成功'
    }
  })
  // 上传图片
  .post('/upload', body({
    multipart: true
  }), async (ctx, next) => {
    // 上传的文件
    const file = ctx.request.files.files || ctx.request.files.file
    // 上传的文件名称
    const name = file.name
    // 转换数组
    const fileNameArr = name.split('.')
    // 添加时间戳，作为版本号
    fileNameArr.splice(-1, 0, new Date().getTime())
    // 合并数据
    const fileName = fileNameArr.join('.')
    // 创建可读流
    const render = fs.createReadStream(file.path);
    // 文件路径
    let filePath = path.join('./static/images', fileName).replace(/\\/g,"/");
    // 是否有static/images文件夹，没有就创建
    if (!fs.existsSync('./static/images')) {
      fs.mkdirSync('./static/images', err => {
        console.log(err)
        console.log('创建失败')
      });
    }
    // 创建可写流
    const upStream = fs.createWriteStream(filePath);
    // 创建文件/图片
    render.pipe(upStream);
    ctx.body = {
      code: 200,
      data: {
        render,
        filePath
      },
      massage: '上传成功'
    }
  })
  // 提交博客文章
  .post('/post_submit_blog', async (ctx, next) => {
    const { select_id, article_content, article_id } = ctx.request.body
    // mysql 表格
    const mysql_table = 'blog.article_list'
    // 文章标题 文章简介 数组
    let article_array = article_content.match(/>([^<]+)</ig).splice(0, 2).map(item => item.replace(/>|</ig, ''))
    // 文章标题
    let article_title = article_array[0]
    // 文章简介
    let article_subtitle = article_array[1]
    // 文章图片
    let article_image = article_content.match(/<img[^>]*src[=\'\"\s]+([^\"\']*)[\"\']?[^>]*>/si)
    article_image && (article_image = article_image[1])
    // 判断是否是编辑
    if(!article_id) {
      // 文件名称
      const fileName = 'text' + new Date().getTime() + '.txt'
      // 文件路径
      const filePath = path.join('./static/texts/', fileName).replace(/\\/g,"/")
      // mysql shell
      const mysql_keys = 'navigation_id, article_title, article_subtitle, article_image, article_file_path'
      // mysql shell
      const mysql_values = `'${select_id}', '${article_title}', '${article_subtitle}', '${article_image}', '${filePath}'`
      // 写入文件
      fs.writeFileSync(filePath, article_content)
      // 插入数据库
      const shell = `INSERT INTO ${mysql_table} (${mysql_keys}) VALUES (${mysql_values});`
      const article = await mysql_shell(shell)
      if(article.affectedRows > 0) {
        ctx.body = {
          code: 200,
          data: {},
          massage: '保存成功'
        }
      }
    } else {
      const query_shell = `SELECT * FROM blog.article_list where id = '${article_id}';`
      const article = await mysql_shell(query_shell)
      // 文件路劲
      const filePath = article[0].article_file_path
      await fs.writeFileSync(filePath, article_content)
      // 跟新数据库
      const value = [
        `navigation_id='${select_id}'`, 
        `article_title='${article_title}'`, 
        `article_subtitle='${article_subtitle}'`, 
        `article_image='${article_image}'`, 
      ].join(',')
      const update_shell = `UPDATE ${mysql_table} SET ${value} WHERE (id='${article_id}');`
      const update_state = await mysql_shell(update_shell)
      if(update_state.affectedRows > 0) {
        ctx.body = {
          code: 200,
          data: {},
          massage: "更新成功"
        }
      }
    }
  })
  // 获取文章列表
  .get('/get_blog_article', async (ctx, next) => {
    const navigation_id = ctx.request.query.navigation_id
    const mysql_table = 'blog.article_list'
    const shell = `SELECT * FROM ${mysql_table} where navigation_id = ${navigation_id};`
    const navigation_list = await mysql_shell(shell)
    const new_navigation_list = navigation_list.map(list => {
      const content = fs.readFileSync(list.article_file_path, 'utf-8')
      delete list.article_file_path
      list.content = content
      return list
    })
    ctx.body = {
      code: 200,
      data: new_navigation_list,
      massage: '查询成功'
    }
  })
  // 删除文章
  .post('/delete_blog_article', async (ctx, next) => {
    const { article_id } = ctx.request.body;
    // mysql 表格
    const mysql_table = 'blog.article_list'
    const delete_shell = `DELETE FROM ${mysql_table} WHERE (id='${article_id}');`
    const delete_state = await mysql_shell(delete_shell)
    if(delete_state.affectedRows > 0) {
      ctx.body = {
        code: 200,
        data: {},
        massage: '删除成功'
      }
    }
  })

module.exports = router