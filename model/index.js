const path = require('path');
const glob = require('glob');
const _ = require('lodash');



// 项目继承model
function projectExtendModel(model,project){
    return _.mergeWith({}, model, project,(mVal,pVal)=>{
        if(Array.isArray(mVal) && Array.isArray(pVal)){
            // 开始处理数组
            let res = [];
            // 重载与继承
            for(let i=0;i<mVal.length;i++){
                const mItem = mVal[i];
                const pItem = pVal.find(p=>p.key===mItem.key);
                if(pItem){
                    res.push(projectExtendModel(mItem, pItem));
                }else{
                    res.push(mItem);
                }
            }
            // 新增
            for(let i=0;i<pVal.length;i++){
                const pItem = pVal[i];
                const mItem = mVal.find(m=>m.key===pItem.key);
                if(!mItem){
                    res.push(pItem);
                }
            }
            
            return res;
        }

    });
}




/**
 * 读取model配置
 * [{
 *  model: {}
 *  peoject:{
 *      ${projKey}:{}
 *      ${projKey}:{}
 *  }
 * },...]
 */

module.exports=(app)=>{
    const modelList = [];
    // 获取模型路径
    const modelDir = path.join(app.baseDir,'model');
    // 获取模型列表
    const modelFiles = glob.sync(path.join(modelDir,'**','*.js'));
    // 读取并配置model和project
    modelFiles.forEach(file=>{
        if(file.includes('index')) return;
        
        // 构造project
        if(file.includes('project')){
            const modelKey = file.match(/\/model\/(.*?)\/project/)?.[1];
            const projKey = file.match(/\/project\/(.*?)\.js/)?.[1];

            let modelItem = modelList.find(item=>item.model?.mKey===modelKey);
            if(!modelItem){
                modelItem={};
                modelList.push(modelItem);
            }
            if(!modelItem.project){
                modelItem.project={};
            }
            modelItem.project[projKey]=require(file);
            modelItem.project[projKey].pKey=projKey;
            modelItem.project[projKey].mKey=modelKey;
        }
        // 构造model
        else{
            const modelKey = file.match(/\/model\/(.*?)\/model\.js/)?.[1];
            let modelItem = modelList.find(item => item.model?.key === modelKey);
            if(!modelItem){
                modelItem={};
                modelList.push(modelItem);
            }
            modelItem.model=require(file);
            modelItem.model.mKey=modelKey;
        }

    })
    // 数据进一步整理：project继承model
    modelList.forEach(item=>{
        const {model,project}=item;
        for(const projKey in project){
            project[projKey]=projectExtendModel(model,project[projKey]);
        }
    })
    return modelList;
}
