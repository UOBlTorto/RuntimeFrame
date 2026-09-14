module.exports = (app) => {
    const modelList = require('../../model/index.js')(app);
    const BaseService = require('./base')(app);
    return class projectService extends BaseService {
        // 获取  modelList  数据
        async getModelList() {
            return modelList;
        }
        // 获取当前proj_key对应  projectList  数据，如果没有key则全量获取
        async getProjectList({proj_key}) {
            const projectList = [];
            modelList.forEach((item) => {
                const { project } = item;
                if(proj_key && !project[proj_key]) {
                    return;
                }
                for (const pk in project) {
                    projectList.push(project[pk]);
                }
            });
            return projectList;
        }
        // 获取  project  数据
        async getProject(proj_key) {
            let project;
            
            modelList.forEach(item => {
                const { project: proj } = item;
                if(proj[proj_key]) {
                    project = proj[proj_key];
                }
            });
            
            return project;
        }
    }
}