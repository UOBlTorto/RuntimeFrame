<template>
	<el-row class="schema-view">
		<search-panel
			v-if="searchSchema?.properties&&Object.keys(searchSchema.properties).length>0"
			@search="onSearch"
		></search-panel>
		<table-panel
			ref="tablePanelRef"
			@operate="onTableOperate"
		></table-panel>
		<component
			v-for="(item,key) in components"
			:key="item"
			:is="ComponentConfig[key]?.component"
			ref="comListRef"
			@command="onComponentCommand"
		></component>
	</el-row>

</template>


<script setup>
import ComponentConfig from './components/component-config.js'
import SearchPanel from './complex-view/search-panel/search-panel.vue'
import TablePanel from './complex-view/table-panel/table-panel.vue'
import {useSchema} from './hook/schema.js'
import { ref , onMounted,watch,provide} from 'vue';

const tablePanelRef = ref(null);
const comListRef = ref([])
const apiParams = ref({});
const {
	api,
	tableSchema,
	tableConfig,
	searchConfig,
	searchSchema,
	components
} = useSchema();
provide('schemaViewData',{
	api,
	tableSchema,
	tableConfig,
	searchConfig,
	searchSchema,
	apiParams,
	components
})


function onSearch(searchObj) {
	apiParams.value = searchObj;
}

const EventHandleMap = {
	showComponent: showComponent
}
function onTableOperate({btnConfig,rowData}){
	const { eventKey } = btnConfig;
	if(EventHandleMap[eventKey]){
	console.log('eventKey:',eventKey)

		EventHandleMap[eventKey]({btnConfig,rowData});
	}
}
// 展示动态组件
function showComponent({btnConfig,rowData}) {
	const { compName } = btnConfig.eventOption;
	if(!compName){
		console.error(`找不到 ${compName}`);
		return
	}
	const comRef = comListRef.value.find(item=>item.name===compName);
	if(!comRef||typeof comRef.show!=='function') return;

	comRef.show(rowData);
}
// 响应组件事件
function onComponentCommand(data) {
	const { event } = data;
	if(event==='loadTableData'){
		tablePanelRef.value.loadTableData()
	}
}
</script>

<style lang="less" scoped>
	.schema-view{
		display:flex;
		flex-direction:column;
		height:100%;
		width:100%;
	}
</style>