<template>
    <header-container :title="projName">
        <template #menu-content>
            <!-- 根据menuList渲染 -->
            <el-menu
                :default-active="activeKey"
                :ellipsis="false"
                mode="horizontal"
                @select="onMenuSelect"
            >
                <template v-for="item in menuStore.menuList">
                    <sub-menu
                        v-if="item.subMenu && item.subMenu.length>0"
                        :menuItem="item"
                    ></sub-menu>
                    <el-menu-item
                        v-else
                        :index="item.key"
                    >{{ item.name }}</el-menu-item>
                </template>
            </el-menu>
        </template>
        <template #setting-content>
            <!-- 根据projectConfig渲染 -->
            <el-dropdown @command="handleProjectCommand">
                <span class="project-list">
                    {{projName}}<el-icon v-if="projectStore.projectList.length>1" class="el-icon-right"><ArrowDown/></el-icon>
                </span>
                <template #dropdown v-if="projectStore.projectList.length>1">
                  <el-dropdown-menu>
                    <el-dropdown-item
                        v-for="item in projectStore.projectList"
                        :key="item.pKey"
                        :command="item.pKey"
                        :disabled="item.name===projName"
                        >{{item.name}}</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
            </el-dropdown>
        </template>
        <template #main-content>
            <slot name="main-content"></slot>
        </template>
    </header-container>
</template>

<script setup>
import { ref , onMounted,watch} from 'vue';
import HeaderContainer from '$widgets/header-container/header-container.vue';
import SubMenu from './complex-view/sub-menu/sub-menu.vue';
import {ArrowDown} from '@element-plus/icons-vue'
import {useMenuStore} from '$store/menu.js'
import {useProjectStore} from '$store/project.js'
import {useRoute} from 'vue-router'
defineProps({
    projName: String
});
const emit = defineEmits(['menu-select']);
const activeKey = ref('');
const menuStore= useMenuStore();
const projectStore = useProjectStore();
const route = useRoute();



const onMenuSelect = (menuKey)=>{
    const menuItem = menuStore.findMenuItem({
        key: 'key',
        value: menuKey
    });
    emit('menu-select',menuItem);
}
const setActiveKey = ()=>{
    const menuItem = menuStore.findMenuItem({
        key: 'key',
        value: route.query.key
    });
    activeKey.value = menuItem?.key;
}
const handleProjectCommand = (command)=>{
    const pItem = projectStore.projectList.find(item=>{return item.pKey===command});
    if(!pItem||!pItem.homePage) return;
    // hash模式的跳转
    // const {origin,pathname} = window.location;
    // window.location.replace(`${origin}${pathname}#${pItem.homePage}`);
    // history模式的跳转
    const {host} = window.location;
    window.location.replace(`http://${host}/view/dashboard${pItem.homePage}`);
}


watch(()=>[route.query.key,menuStore.menuList],()=>{
    setActiveKey();
})
onMounted(()=>{
    setActiveKey();
})
</script>

<style lang="less" scoped>

</style>