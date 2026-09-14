const md5 = require("md5");

/**
 * api签名验证中间件
 */
module.exports = (app) =>{
    return async (ctx, next) => {
        // 非API请求不用校验
        if(!ctx.path.includes('/api/')) {
            return await next();
        }
        //校验API请求
        const {path,method}=ctx;
        const {headers}=ctx.request;

        const {s_sign:sSign,s_t:sTime}=headers;
        const signKey='asdfhdjfldflahfeufwnc';
        const signture=md5(`${signKey}_${sTime}`);

        if(!sSign || !sTime || signture!==sSign || Date.now()-sTime>600000){
            ctx.status=200;
            ctx.body={
                success: false,
                message: '签名错误',
                code: 445
            }
            return;
        }
        await next();
    }
}