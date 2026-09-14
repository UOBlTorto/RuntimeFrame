module.exports = (app) =>{
    return class BaseController {
        constructor() {
            this.app = app;
            this.config = app.config;
        }
        /**
         * api处理成功返回
         */
        success(ctx, data, metadata = {}) {
            ctx.status = 200;
            ctx.body = {
                success: true,
                data,
                metadata
            };
        }
        /**
         * api处理失败返回
         */
        fail(ctx, message, code) {
            ctx.body = {
                success: false,
                message,
                code
            };
        }
    }
}