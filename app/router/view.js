module.exports = (app,router) => {
    const {view: viewController} = app.controller;
    router.get('/view/:page', viewController.renderPage.bind(viewController));
    router.get('/view/:page/*', viewController.renderPage.bind(viewController));
}