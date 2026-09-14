const path = require('path');
const glob = require('glob');
/**
 * @param {app} app实例
 * 加载 根目录/extend/.js 中的扩展方法
 * app:{
 *    xxx: require('app/extend/xxx.js'),
 *    其他中间件
 * }
 */
module.exports = (app) => {
    // 获取扩展方法目录
    const extendDir = path.join(app.businessDir, 'extend');
    // 使用 glob 匹配扩展方法文件
    const extendFiles = glob.sync(path.join(extendDir, '**', '*.js'));
    // 加载扩展方法
    extendFiles.forEach((file) => {
        // file: D:\work\vscode4w\elpis\extend\xxx.js  -> name: xxx 
        let name = file.substring(extendDir.length + 1, file.lastIndexOf('.js'))
                        .replace(/[_-][a-z]/ig,s=>s.substring(1).toUpperCase()); 
        // 过滤重名扩展方法
        for (const existingName in app) {
            if (existingName === name) {
                console.warn(`Warning: Duplicate extension method name '${name}' found in file '${file}'. This will overwrite the existing method.`);
                return;
            }
        }
        app[name] = require(file)(app);
    })
}