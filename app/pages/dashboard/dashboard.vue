<template>
    <el-config-provide :locale="zhCn">
        <header-view :proj-name="projName" @menu-select="onMenuSelect">
            <template #main-content>
                <router-view></router-view>
            </template>
        </header-view>
    </el-config-provide>
</template>

<script setup>
import { ref ,onMounted} from 'vue';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import HeaderView from './complex-view/header-view/header-view.vue';
import $curl from '$common/curl.js'
import {useMenuStore} from '$store/menu.js'
import {useProjectStore} from '$store/project.js'
import {useRouter,useRoute} from 'vue-router'

const route = useRoute();
const router = useRouter();
const projName = ref('');
const menuStore= useMenuStore();
const projectStore = useProjectStore();

onMounted(()=>{
    getProjectList();
    getProjectConfig();
})

// 请求/api/project/list,并缓存到project-store
async function getProjectList(){
    const res = await $curl({
        method: 'get',
        url: '/api/project/list',
        // query: { proj_key: 'pdd'}
    });
    if(!res || !res.success || !res.data) return;
    projectStore.setProjectList(res.data);
}
// 请求/api/project,并缓存到menu-store
async function getProjectConfig(){
    const res = await $curl({
        method: 'get',
        url: '/api/project',
        query: {proj_key: route.query.proj_key}
    });
    if(!res || !res.success || !res.data) return;
    const {menu,name} = res.data;
    projName.value = name;
    menuStore.setMenuList(menu);
}
const onMenuSelect =(mItem)=>{
    // 1、根据点击的菜单找到module type
    const {moduleType,key,customConfig} = mItem;
    if(key===route.query.key) return;
    // 2、路由表
    const pathMap = {
        sider:'/sider',
        schema: '/schema',
        custom: customConfig?.path,
        iframe: '/iframe'
    }
    // 3、根据moduletype和路由表进行匹配和跳转
    router.push({
        path: `/view/dashboard${pathMap[moduleType]}`,
        query:{
            proj_key: route.query.proj_key,
            key: key
        }
    })
}
</script>

<style lang="less" scoped>

</style>