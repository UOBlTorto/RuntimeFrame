const log4js = require('log4js');
/**
 * 日志工具
 */
module.exports = (app) => {
    let logger;
    if(app.env.isLocal()) {
        // 本地环境使用控制台输出
        logger = console;
    }else{
        log4js.configure({
            appenders: {
                console: {
                    type: 'console',
                },
                dateFile: {
                    type: 'dateFile',
                    filename: './logs/elpis.log',
                    pattern: '.yyyy-MM-dd',
                }

            },
            categories: {
                default: {
                    appenders: ['console', 'dateFile'],
                    level: 'trace',
                }
            }
        });
        logger = log4js.getLogger();
    }
    return logger;
}