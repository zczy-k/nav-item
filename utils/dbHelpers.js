const db = require('../db');

/**
 * 分页查询辅助函数
 * @param {string} table - 表名
 * @param {object} options - 查询选项
 * @param {number} options.page - 页码
 * @param {number} options.pageSize - 每页数量
 * @param {string} options.orderBy - 排序字段（可选）
 * @param {string} options.where - WHERE 条件（可选）
 * @param {array} options.whereParams - WHERE 参数（可选）
 * @param {string} options.select - SELECT 字段（可选，默认 *）
 * @returns {Promise} - 返回分页结果
 */
function paginateQuery(table, options = {}) {
  const {
    page,
    pageSize,
    orderBy = 'id',
    where = '',
    whereParams = [],
    select = '*'
  } = options;

  return new Promise((resolve, reject) => {
    // 如果没有分页参数，返回所有结果
    if (!page && !pageSize) {
      const query = `SELECT ${select} FROM ${table}${where ? ' WHERE ' + where : ''} ORDER BY ${orderBy}`;
      db.all(query, whereParams, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    } else {
      // 分页查询
      const pageNum = parseInt(page) || 1;
      const size = parseInt(pageSize) || 10;
      const offset = (pageNum - 1) * size;

      // 获取总数
      const countQuery = `SELECT COUNT(*) as total FROM ${table}${where ? ' WHERE ' + where : ''}`;
      db.get(countQuery, whereParams, (err, countRow) => {
        if (err) return reject(err);

        // 获取分页数据
        const dataQuery = `SELECT ${select} FROM ${table}${where ? ' WHERE ' + where : ''} ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
        db.all(dataQuery, [...whereParams, size, offset], (err, rows) => {
          if (err) return reject(err);

          resolve({
            total: countRow.total,
            page: pageNum,
            pageSize: size,
            data: rows
          });
        });
      });
    }
  });
}

/**
 * 简单查询辅助函数（Promise 封装）
 * @param {string} sql - SQL 语句
 * @param {array} params - 参数
 * @returns {Promise} - 返回查询结果
 */
function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

/**
 * 查询单条记录（Promise 封装）
 */
function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

/**
 * 执行写操作（Promise 封装）
 */
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

/**
 * 标准化错误响应
 */
function handleError(res, error, message = '操作失败') {
  console.error(message + ':', error);
  res.status(500).json({ error: message, details: error.message });
}

module.exports = {
  paginateQuery,
  dbAll,
  dbGet,
  dbRun,
  handleError
};
