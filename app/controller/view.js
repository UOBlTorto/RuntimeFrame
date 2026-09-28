module.exports = (app) => {
    return class viewController {
        async renderPage(ctx) {
            await ctx.render(`dist/entry.${ctx.params.page}`,{
                projKey:ctx.query?.proj_key,
                name: 'elpis',
            });
        }
    }
}