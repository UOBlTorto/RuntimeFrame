const path = require('path');
const glob = require('glob');
/**
 * @param {app} app实例
 * 加载 app/router-schema/任意目录 a-d/b/c.js 
 * routerSchema:{
 *     api1: {}
 *     api2: {}
 *     ...
 * }
 */
module.exports = (app) => {
    let routerSchema={};
    // 获取路由schema目录
    const routerSchemaDir = path.join(app.baseDir, 'app', 'router-schema');
    // 使用 glob 匹配路由schema文件
    const routerSchemaFiles = glob.sync(path.join(routerSchemaDir, '**', '*.js'));
    // 加载路由schema
    routerSchemaFiles.forEach((file) => {
        routerSchema={
            ...routerSchema,
            ...require(file)
        }
    });
    app.routerSchema=routerSchema;
}