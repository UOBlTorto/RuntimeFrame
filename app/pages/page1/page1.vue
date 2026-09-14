<template>
    <div>
        page1{{content}}
        <input v-model="content"/>
        <el-card></el-card>
        <el-button>click</el-button>
    </div>
</template>

<script setup>
    import {ref,onMounted} from 'vue'
    import $curl from '$common/curl.js'
    import {useMenuStore} from '$store/menu.js'
import {useProjectStore} from '$store/project.js'

    const content=ref('Tony');





    onMounted(()=>{
        const menuStore = useMenuStore();
const projectStore = useProjectStore();
    getProjectList();
    getProjectConfig();
})

// 请求/api/project/list,并缓存到project-store
async function getProjectList(){
    const res = await $curl({
        method: 'get',
        url: '/api/project/list',
        query: { proj_key: 'pdd'}
    });
    if(!res || !res.success || !res.data) return;
    projectStore.setProjectList(res.data);
}
// 请求/api/project,并缓存到menu-store
async function getProjectConfig(){
    const res = await $curl({
        method: 'get',
        url: '/api/project',
        query: {proj_key: 'pdd'}
    });
    if(!res || !res.success || !res.data) return;
    const {menu,name} = res.data;
    projName.value = name;
    menuStore.setMenuList(menu);
}
</script>

<style lang="less" scoped>
    div{
        color: red
    }
</style>