module.exports = (app) => {
    const BaseController = require('./base')(app);
    return class projectController extends BaseController {
        // 获取  modelList  数据
        async getModelList(ctx) {
            const { project: projectService } = app.service;
            const result = await projectService.getModelList();
            // 构造关键返回结果
            const dtoModelList = result.reduce((preList,item) => {
                const { model,project}=item;
                // 构造model
                const {mKey,name,desc}=model;
                const dtoModel = { mKey, name, desc };
                // 构造project
                const dtoProject = Object.keys(project).reduce((pre,proj_Key)=>{
                    const {pKey,mKey,name,desc,homePage} = project[proj_Key];
                    pre[proj_Key] = { pKey, mKey, name, desc, homePage };
                    return pre;
                },{})
                preList.push({model:dtoModel,project:dtoProject});
                return preList;
            }, []);
            this.success(ctx, dtoModelList);
        }
        // 获取当前proj_key对应  projectList  数据，如果没有key则全量获取
        async getProjectList(ctx) {
            const { project: projectService } = app.service;
            const { proj_key } = ctx.request.query;
            const result = await projectService.getProjectList({proj_key});

            const dtoProjectList = [];
            result.forEach((item) => {
                const { pKey, mKey, name, desc, homePage } = item;
                dtoProjectList.push({ pKey, mKey, name, desc, homePage });
            });
            
            this.success(ctx, dtoProjectList);
        }
        // 获取  project  数据
        async getProject(ctx) {
            const { project: projectService } = app.service;
            const { proj_key } = ctx.request.query;
            const result = await projectService.getProject(proj_key);
            if (!result) {
                this.fail(ctx, '未找到对应的项目',5000);
                return;
            }
            this.success(ctx, result);
        }
    }
}