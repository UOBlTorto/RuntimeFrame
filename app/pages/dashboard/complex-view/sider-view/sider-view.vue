<template>
	<sider-container>
		<template #menu-content>
			<el-menu
				:default-active="activeKey"
				:ellipsis="false"
				@select="onMenuSelect"
			>
				<template v-for="item in menuList">
					<sub-menu
						v-if="item.subMenu&&item.subMenu.length>0"
						:menu-item="item"
					></sub-menu>
					<el-menu-item
						v-else
						:key="item.key"
					>{{item.name}}</el-menu-item>
				</template>
			</el-menu>
		</template>
		<template #main-content>
			<router-view></router-view>
		</template>
	</sider-container>

</template>

<script setup>
import { ref , onMounted,watch} from 'vue';
import SubMenu from './complex-view/sub-menu/sub-menu.vue';
import SiderContainer from '$widgets/sider-container/sider-container.vue';
import {useMenuStore} from '$store/menu.js'
import {useProjectStore} from '$store/project.js'
import {useRouter,useRoute} from 'vue-router'

const route = useRoute();
const router = useRouter();
const menuStore= useMenuStore();
const projectStore = useProjectStore();
const activeKey = ref('');
const menuList = ref([])


const setActiveKey = ()=>{
    let siderMenuItem = menuStore.findMenuItem({
    	key:'key',
    	value: route.query.sider_key
    })
    // 如果首次加载sider-view相关路由，用户未点击左侧菜单，需要默认选择第一个
    if(!siderMenuItem){
    	const headMenuItem = menuStore.findMenuItem({
    		key:'key',
    		value:route.query.key
    	})
    	if(headMenuItem&& headMenuItem.siderConfig&&headMenuItem.siderConfig.menu){
    		const defaultSideMenuList = headMenuItem.siderConfig.menu
    		siderMenuItem = menuStore.findFirstMenuItem(defaultSideMenuList);
    		if(siderMenuItem){
    			// 处理选中默认第一个后的逻辑
    			handleMenuSelect(siderMenuItem.key);
    		}
    	}
    }
    activeKey.value=siderMenuItem?.key
}
const setMenuList = ()=>{
    const mItem = menuStore.findMenuItem({
    	key: 'key',
    	value: route.query.key
    })
    if(mItem&&mItem.siderConfig&&mItem.siderConfig.menu){
    	menuList.value = mItem.siderConfig.menu    	
    }
}
const onMenuSelect = (mKey)=>{
	handleMenuSelect(mKey);
}
function handleMenuSelect(mKey){
	const mItem = menuStore.findMenuItem({
		key:'key',
		value: mKey
	})
	const {moduleType,key,customConfig} = mItem;
	// 当前页面不做处理
	if(key===route.query.key) return;

	const pathMap = {
		'schema':'/schema',
		'custom': customConfig?.path,
		'iframe':'/iframe'
	} 
	router.push({
		path:`/view/dashboard/sider${pathMap[moduleType]}`,
		query: {
			key: route.query.key,
			sider_key:mKey,
			proj_key:route.query.proj_key
		}
	})
}
watch(()=>[route.query.key,menuStore.menuList],()=>{
    setActiveKey();
    setMenuList();
})
onMounted(()=>{
    setActiveKey();
    setMenuList();
})

</script>

<style lang="less" scoped>
	

</style>