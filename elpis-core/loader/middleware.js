const path = require('path');
const glob = require('glob');
/**
 * 
 * @param {app} app实例
 * 加载 app/middleware/任意目录 a-d/b/c.js 
 * middleware:{
 *   aD: {
 *     b: {
 *       c: require('app/middleware/a-d/b/c.js')
 *     }
 *   }
 * }
 */
module.exports = (app) => {
    const middleware={};
    // 获取中间件目录
    const middlewareDir = path.join(app.baseDir, 'app', 'middleware');
    // 使用 glob 匹配中间件文件
    const middlewareFiles = glob.sync(path.join(middlewareDir, '**', '*.js'));
    // 加载中间件
    middlewareFiles.forEach((file) => {
        // file: D:\work\vscode4w\elpis\app\middleware\a-d\b\c.js  -> name: aD/b/c  -> nameParts: ['aD', 'b', 'c']
        let name = file.substring(middlewareDir.length + 1, file.lastIndexOf('.js'))
                        .replace(/[_-][a-z]/ig,s=>s.substring(1).toUpperCase()); 
        let nameParts = name.split(path.sep); 

        // 将中间件注册到 middleware 对象中
        let current = middleware;
        for (let i = 0; i < nameParts.length; i++) {
            const part = nameParts[i];

            if (i === nameParts.length - 1) {
                // 最后一个部分，加载中间件模块
                current[part] = require(file)(app);
            } else {
                // 创建嵌套对象
                current[part] = {};
                current = current[part];
            }
        }

    });

    app.middlewares = middleware;
}