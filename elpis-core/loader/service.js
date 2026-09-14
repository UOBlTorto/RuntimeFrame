const path = require('path');
const glob = require('glob');
/**
 * @param {app} app实例
 * 加载 app/service/任意目录 a-d/b/c.js
 * service:{
 *     aD: {
 *         b: {
 *            c: new require('app/service/a-d/b/c.js')}
 *     }
 * }
 */
module.exports = (app) => {
    const service={};
    // 获取service目录
    const serviceDir = path.join(app.businessDir, 'service');
    // 使用 globy 匹配service文件
    const serviceFiles = glob.sync(path.join(serviceDir, '**', '*.js'));
    // 加载service
    serviceFiles.forEach((file) => {
        // file: D:\work\vscode4w\elpis\app\service\a-d\b\c.js  -> name: aD/b/c  -> nameParts: ['aD', 'b', 'c']
        let name = file.substring(serviceDir.length + 1, file.lastIndexOf('.js'))
                        .replace(/[_-][a-z]/ig,s=>s.substring(1).toUpperCase());
        let nameParts = name.split(path.sep);
        // 将service注册到 service 对象中
        let current = service;
        for (let i = 0; i < nameParts.length; i++) {
            const part = nameParts[i];
            if (i === nameParts.length - 1) {
                // 最后一个部分，加载service模块
                current[part] = new (require(file)(app));
            } else {
                // 创建嵌套对象
                current[part] = {};
                current = current[part];
            }
        }
    })
    app.service=service;
}