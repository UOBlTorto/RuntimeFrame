<template>
	<el-card class="table-panel">
		<!-- operation-panel -->
		<el-row
			v-if="tableConfig?.headerButtons?.length>0"
			justify="end"
			class="operation-panel"
		>
			<el-button
				v-for="item in tableConfig?.headerButtons"
				v-bind="item"
				@click="operationHandler({btnConfig:item})"
			>
				{{item.label}}
			</el-button>
		</el-row>
		<!-- schema-table (widget组件) -->
		<schema-table
			ref="schemaTableRef"
			@operate="operationHandler"
			:buttons="tableConfig?.rowButtons??[]"
			:api="api"
			:schema="tableSchema"
			:apiParams="apiParams"
		></schema-table>
	</el-card>

</template>


<script setup>
import {ref,inject} from 'vue';
import $curl from '$common/curl.js';
import {ElMessageBox,ElNotification} from 'element-plus';
import SchemaTable from '$widgets/schema-table/schema-table.vue';

const {
	api,
	tableSchema,
	tableConfig,
	apiParams
}=inject('schemaViewData');
const emit = defineEmits(['operate']);
const schemaTableRef =ref(null);
const EventKeyMap = {
	remove: removeData
}


function operationHandler({btnConfig,rowData}){
	const {eventKey} = btnConfig;
	if(EventKeyMap[eventKey]){
		EventKeyMap[eventKey]({btnConfig,rowData})
	}else{
		emit('operate',{btnConfig,rowData});
	}
}
function removeData({btnConfig,rowData}) {
	if(!btnConfig?.params){ return ;}
	const {params} = btnConfig;
	const removeKey = Object.keys(params)[0];
	let removeVal = params[removeKey];
	const removeValList = removeVal.split('::');
	if(removeValList[0]==='schema'&&removeValList[1]){
		removeVal = rowData[removeValList[1]]
	}
	ElMessageBox.confirm(
		`确认删除${removeKey}=${removeVal}的数据?`,
		'Warning',
		{
			confirmButtonText:'确认',
			cancelButtonText:'取消',
			type:'warning'
		}
	).then(async()=>{
		schemaTableRef.value.showLoading();
		const res = await $curl({
			method:'delete',
			url:api.value,
			data:{
				[removeKey]:removeVal
			},
			errorMessage: '删除失败'
		});
		schemaTableRef.value.hideLoading();
		if(!res||!res.success||!res.data) return;

		ElNotification({
			title: '删除成功',
			message: 'delete success',
			type: 'success'
		})
		await loadTableData();
	});
}
async function loadTableData (){
	await schemaTableRef.value.initData();
}
defineExpose({
	loadTableData,
})
</script>

<style lang="less" scoped>
.table-panel{
	flex: 1;
	margin:10px;
	.operation-panel{
		margin-bottom: 10px;
	}
}
:deep(.el-card_body){
	height: 98%;
	display: flex;
	flex-direction: column;
}
</style>