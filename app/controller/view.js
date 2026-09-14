const path = require('path');
module.exports = (app) => {
    return class viewController {
        async renderPage(ctx) {
            app.logger.info(`[viewController] query: ${JSON.stringify(ctx.query)}`);
            app.logger.info(`[viewController] query: ${JSON.stringify(ctx.params)}`);
            await ctx.render(`dist/entry.${ctx.params.page}`,{
                projKey:ctx.query?.proj_key,
                name: 'elpis',
            });
        }
    }
}