const path = require('path');
/**
 * @param {app} app实例
 * 加载 app/config/*.js
 * config:{
 *  require(config.default.js)+环境配置
 * }
 */
module.exports = (app) => {
    // 获取配置目录
    const configDir = path.join(app.baseDir, 'config');
    let defaultConfig = {};
    try {
        // 加载默认配置
         defaultConfig = require(path.join(configDir, 'config.default.js'));
    } catch (error) {
        console.error('No default config found.');
    }
    // 根据环境变量加载相应的配置
    let envConfig = {};
    try {
        // 获取环境配置文件
        if (app.env.getEnv() === 'local') {
            envConfig = require(path.join(configDir, 'config.local.js'));
        }
        if (app.env.getEnv() === 'beta') {
            envConfig = require(path.join(configDir, 'config.beta.js'));
        }
        if (app.env.getEnv() === 'prod') {
            envConfig = require(path.join(configDir, 'config.prod.js'));
        }
    } catch (error) {
        console.error('No environment config found.');
    }

    // 合并配置
    app.config = Object.assign({}, defaultConfig, envConfig);
}