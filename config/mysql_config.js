const mysql = require('mysql')

let env = process.env.NODE_ENV
console.log('env', env)

const mysql_config = {
  host: 'localhost',
  user: 'root',
  password: "123456"
}

const createPool = mysql.createPool(mysql_config)

const mysql_shell = (sql) => {
  return new Promise((resolve, reject) => {
    // 连接数据库
    createPool.getConnection((err, connection) => {
      if(err) throw err // 无法连接
      // 连接成功， 执行sql语句
      connection.query(sql, (error, results, fields) => {
        resolve(results)
        // 完成执行后，释放
        connection.release();
        // 释放后处理错误。
        if (error) throw error;
        // 不要在这里使用连接，它已经返回到池中。
      })
    })
  })
}

module.exports = mysql_shell