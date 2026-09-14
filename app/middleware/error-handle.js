/**
 * 错误处理中间件
 * @param {app} app 
 * @returns 
 */
module.exports = (app) => {
    return async (ctx, next) => {
        try {
            return await next();
        } catch (err) {
            const { status, message } = err;
            app.logger.info(JSON.stringify(err));
            app.logger.info('错误信息：', message);
            app.logger.info('错误状态码：', status);

            if(message && message.includes('not found')) {
                ctx.status = 302;
                ctx.redirect('/404.html');
                return;
            }
        }
    }
}