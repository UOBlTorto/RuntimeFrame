const Koa = require('koa');
const port = process.env.PORT || 8080;
const host = process.env.HOST || '0.0.0.0';
const path = require('path');
const env = require('./env');
const middlewareLoader = require('./loader/middleware');
const routerSchemaLoader = require('./loader/router-schema');
const controllerLoader = require('./loader/controller');
const serviceLoader = require('./loader/service');
const configLoader = require('./loader/config');
const extendLoader = require('./loader/extend');
const routerLoader = require('./loader/router');

module.exports = {
    /**
     * 项目启动
     * @param options 项目配置
     */
    start(options) {
        // app实例
        const app = new Koa();
        // 设置项目根目录
        app.baseDir = process.cwd();
        // 设置项目业务路径
        app.businessDir = path.join(app.baseDir, 'app');
        // 设置项目配置环境
        app.env=env(app);
        // 加载中间件
        middlewareLoader(app);
        console.log(`--------app.middlewares----------`);
        // 加载路由schema
        routerSchemaLoader(app);
        console.log(`--------app.routerSchema----------`);
        // 加载controller
        controllerLoader(app);
        console.log(`--------app.controller----------`);
        // 加载service
        serviceLoader(app);
        console.log(`--------app.service----------`);
        // 加载配置
        configLoader(app);
        console.log(`--------app.config----------`);
        // 加载扩展方法
        extendLoader(app);
        // 自定义中间件
        try {
            require(path.join(app.baseDir, 'app','middleware.js'))(app);
        }catch (error) {
            console.warn('[Warning]: No custom middleware found or error loading custom middleware:');
        }
        // 加载路由
        routerLoader(app);

        try {
            app.listen(port, host);
            console.log(`Server: is running on http://${host}:${port}`);
        } catch (error) {
            console.error('[Error starting server]:', error);
        }
    return app;
    }
}
