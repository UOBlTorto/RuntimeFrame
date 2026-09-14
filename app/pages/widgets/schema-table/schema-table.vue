<template>
	<div class="schema-table">
		<el-table
			v-if="schema&&schema.properties"
			v-loading="loading"
			:data="tableData"
			class="table"
		>
			<template v-for="(schemaItem,key) in schema.properties" :key="key">
				<el-table-column
					v-if="schemaItem.option!==false"
					:prop="key"
					:label="schemaItem.label"
					v-bind="schemaItem.option"
				></el-table-column>
			</template>
			<!-- 列按钮 -->
			<el-table-column
				v-if="buttons?.length>0"
				label="操作"
				fixed="right"
				:width="operationWidth"
			>
				<template #default="scope">
					<el-button
						v-for="item in buttons"
						link
						v-bind="item"
						@click="operationHandler({btnConfig:item,rowData:scope.row})"
					>
						{{item.label}}
					</el-button>
				</template>
			</el-table-column>
		</el-table>
		<el-row class="pagination">
			<el-pagination
				v-model:current-page="curPage"
				v-model:page-size="pageSize"
				:total="total"
				:page-sizes="[10, 20, 50, 100]"
				layout="total,sizes,prev, pager, next,jumper"
				@size-change="onPageSizeChange"
				@current-change="onCurrentPageChange"
			/>
		</el-row>
	</div>

</template>

<script setup>
import {ref,toRefs,onMounted,watch,nextTick,computed} from 'vue';
import $curl from '$common/curl.js'

defineExpose({
	initData,
	loadTableData,
	showLoading,
	hideLoading,
})
const emit = defineEmits(['operate'])
const props = defineProps({
	// 表格数据源
	api: String,
	schema: Object,
	// buttons相关
	buttons: Array,
	// api请求参数
	apiParams:Object
})
const {schema,api,buttons,apiParams} = toRefs(props);
const loading = ref(false);
const tableData = ref([]);
const curPage = ref(1);
const pageSize = ref(50);
const total =ref(0);
// 把所有“操作按钮”的总宽度算出来
const operationWidth = computed(()=>{
	return buttons.value?.length>0
			?buttons.value.reduce((pre,cur)=>{
				return pre+cur.label.length*18;
			},50)
			:50;
});

function initData(){
	curPage.value = 1;
	pageSize.value = 50;
	nextTick(async ()=>{
		await loadTableData();
	})
};
// 防抖
let timeId = null;
async function loadTableData(){
	clearTimeout(timeId);
	timeId = setTimeout(async ()=>{
		await fetchTableData();
		timeId =  null;
	},100);
}

async function fetchTableData(){
	if(!api.value) return;
	showLoading();
	// 请求table数据
	const res = await $curl({
		method: 'get',
		url: `${api.value}/list`,
		query: {
			...apiParams.value,
			pageSize: pageSize.value,
			curPage: curPage.value
		}
	})
	hideLoading();
	if(!res||!res.success||!Array.isArray(res.data)){
		tableData.value = [];
		total.value = 0;
		return;
	}
	tableData.value = buildTableData(res.data);
	total.value = res.metadata.total;
}
// 对后端返回的数据进行处理
function buildTableData(tableData){
	if(!schema.value?.properties){
		return tableData;
	}
	return tableData.map(tableItem=>{
		for(const propName in tableItem){
			const item = tableItem[propName],
				  schemaItem = schema.value.properties[propName];
			// 处理其中一个配置
			if(schemaItem?.option?.toFixed){
				item = item.toFixed && item.toFixed(schemaItem.option.toFixed);
			}
		}
		return tableItem;
	})
}
function showLoading(){
	loading.value = true;
}
function hideLoading(){
	loading.value = false;
}
function operationHandler({btnConfig,rowData}){
	// 点击按钮的时候发出去，和点击菜单的时候发出去给dashboard类似
	emit('operate',{btnConfig,rowData});
}
async function onPageSizeChange(value){
	pageSize.value = value;
	await loadTableData();
}
async function onCurrentPageChange(value){
	curPage.value = value;
	await loadTableData();
}
watch([schema,api,apiParams],()=>{
	initData();
},{deep:true});

onMounted(()=>{
	initData();
})
</script>

<style lang="less" scoped>
	.schema-table{
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow:auto;
		.table{
			flex: 1;

		}
		.pagination{
			margin:10px 0;
			text-align:right;
		}
	}
</style>