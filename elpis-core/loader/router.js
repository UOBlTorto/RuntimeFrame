const path = require('path');
const glob = require('glob');
const Router = require('koa-router');
const router = new Router();
/**
 * @param {app} app实例
 * 加载app/router/任意目录 a-d/b/c.js
 * 完成注册路由
 */
module.exports = (app) => {
    // 获取路由目录
    const routerDir = path.join(app.baseDir, 'app', 'router');
    // 使用 glob 匹配路由文件
    const routerFiles = glob.sync(path.join(routerDir, '**', '*.js'));
    // 加载路由文件
    routerFiles.forEach((file) => {
        require(file)(app, router);
    });
    app.use(router.routes())
       .use(router.allowedMethods());
}