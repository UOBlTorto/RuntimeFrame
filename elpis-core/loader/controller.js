const path = require('path');
const glob = require('glob');
/**
 * @param {app} app实例
 * 加载 app/controller/任意目录 a-d/b/c.js 
 * controller:{
 *     aD: {
 *         b: {
 *             c: new require('app/controller/a-d/b/c.js')
 *         }
 *     }
 * }
 */
module.exports = (app) => {
    const controller={};
    // 获取controller目录
    const controllerDir = path.join(app.baseDir, 'app', 'controller');
    // 使用 glob 匹配controller文件
    const controllerFiles = glob.sync(path.join(controllerDir, '**', '*.js'));
    // 加载controller
    controllerFiles.forEach((file) => {
        const name = file.substring(controllerDir.length + 1, file.lastIndexOf('.js'))
                        .replace(/[_-][a-z]/ig,s=>s.substring(1).toUpperCase()); 
        const nameParts = name.split(path.sep);
        // 将controller注册到 controller 对象中
        let current = controller;
        for (let i = 0; i < nameParts.length; i++) {
            const part = nameParts[i];
            if (i === nameParts.length - 1) {
                // 最后一个部分，加载controller模块
                current[part] = new (require(file)(app));
            } else {
                // 创建嵌套对象
                current[part] = {};
                current = current[part];
            }
        }
    });
    app.controller=controller;
}