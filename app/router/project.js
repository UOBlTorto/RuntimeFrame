module.exports = (app,router) => {
    const {project: projectCtrl} = app.controller;
    router.get('/api/project/model_list', projectCtrl.getModelList.bind(projectCtrl));
    router.get('/api/project/list', projectCtrl.getProjectList.bind(projectCtrl));
    router.get('/api/project', projectCtrl.getProject.bind(projectCtrl));
}