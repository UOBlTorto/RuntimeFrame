<template>
	<iframe :src="path" class="iframe"></iframe>
</template>

<script setup>
import {ref,watch,onMounted} from 'vue'
import {useRoute} from 'vue-router'
import {useMenuStore} from '$store/menu.js'


const route = useRoute();
const menuStore = useMenuStore();
const path = ref('');
const setPath = ()=>{
	const {key,sider_key} = route.query;
	const mItem = menuStore.findMenuItem({
		key: 'key',
		value: sider_key??key
	})
	path.value = mItem?.iframeConfig?.path??'';
}

watch(()=>[route.query.key,menuStore.menuList],()=>{
    setPath();
})
onMounted(()=>{
    setPath();
})

</script>

<style lang="less" scoped>
	.iframe{
		border: 0;
		width: 100%;
		height: 100%;
	}

</style>