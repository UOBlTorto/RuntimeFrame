<template>
	<el-drawer
		v-model="isShow"
		direction="rtl"
		:destory-on-close="true"
		:size="550"
	>
		<template #header>
			<h3>{{title}}</h3>
		</template>
		<template #default>
			<el-card v-loading="loading" shadow="always" class="detail-panel">
				<el-row
					v-for="(item,key) in components[name]?.schema?.properties"
					:key="key"
					type="flex"
					aligin="middle"
					class="row-item"
				>
					<el-row class="item-label">{{item.label}}</el-row>
					<el-row class="item-value">{{dtoModel[key]}}</el-row>
				</el-row>
			</el-card>
		</template>
		
	</el-drawer>
</template>

<script setup>
import { ref ,inject } from 'vue'
import $curl from '$common/curl.js'

const {
	api,
	components
} = inject('schemaViewData');
const loading = ref(false);
const title = ref('');
const mainKey = ref('');
const mainValue = ref();
const dtoModel = ref({})
const isShow = ref(false);
const name = ref('detailPanel')

function show(rowData) {
	const { config } = components.value[name.value];
	title.value = config.title;
	mainKey.value = config.mainKey;
	mainValue.value = rowData[config.mainKey]
	dtoModel.value = mainValue.value;
	isShow.value = true;

	fetchFormData()
}
async function fetchFormData() {
	if(loading.value) return

	loading.value = true;
	const res = await $curl({
		method:'get',
		url:api.value,
		query:{
			[mainKey.value]: mainValue.value
		}
	});
	loading.value = false;

	if(!res|| !res.success || !res.data) return

	dtoModel.value = res.data;
}
defineExpose({
	name,
	show
})
</script>

<style lang="less">
	.detail-panel{
		border: 1px solid black;
		padding: 30px;
		.row-item{
			height:40px;
			line-height:40px;
			font-size:20px;
			item-label{
				margin-right:120px;
				width:120px;
				color:#ffffff;
			}
			.item-value{
				color:#d2dae4;
			}
		}
	}
</style>