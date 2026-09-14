const path = require('path');
module.exports = (app) => {
    //解析params参数
    const koaBodyParser = require('koa-bodyparser');
    app.use(koaBodyParser({
        enableTypes: ['json', 'form', 'text'],
        formLimit: '10mb',
        jsonLimit: '10mb',
        textLimit: '10mb',
    }));
    //静态根目录
    const koaStatic = require('koa-static');
    app.use(koaStatic(path.join(app.baseDir, 'app', 'public')));
    //渲染模板引擎
    const koaNunjucks = require('koa-nunjucks-2');
    app.use(koaNunjucks({
        ext: 'html', // 模板文件后缀名
        path: path.join(app.baseDir, 'app', 'public'), // 模板文件目录
        nunjucksConfig: {
            trimBlocks: true, // 自动删除块标签前后换行符
            noCache: true, // 是否开启缓存
        }
    }));
    //错误处理
        app.use(app.middlewares.errorHandle);

    // 签名校验
        app.use(app.middlewares.apiSignVerify);

    //参数校验
        app.use(app.middlewares.apiParamsVerify);

    // proj处理
    app.use(app.middlewares.projectHandle);
}