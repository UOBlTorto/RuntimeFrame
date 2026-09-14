<template>
	<el-form
		v-if="schema&&schema.properties"
		:inline="true"
		class="schema-search-bar"
	>
		<!-- 动态组件 -->
		<el-form-item
			v-for="(schemaItem,key) in schema.properties"
			:key="key"
			:label="schemaItem.label"
		>
			<component
				:ref="searchCompListF"
				:is=SearchItemConfig[schemaItem.option?.comType]?.component
				:schemaKey="key"
				:schema="schemaItem"
				@load="handleLoaded"
			></component>
		</el-form-item>
		<!-- 操作区域 -->
		<el-form-item>
			<el-button
				type="primary"
				plain
				class="search-btn"
				@click="search"
			>搜索</el-button>
			<el-button
				type="primary"
				plain
				class="reset-btn"
				@click="reset"
			>重置</el-button>
		</el-form-item>
	</el-form>
</template>


<script setup>
import {ref,toRefs,watch,onMounted} from 'vue';
import SearchItemConfig from './schema-item-config.js'
defineExpose({
	reset,
	getValue
})
const prop = defineProps({
	schema:Object
})
const {schema} = toRefs(prop);
const emit =defineEmits(['load','search','reset']);
const searchCompList = ref([]);
function searchCompListF(e){
	searchCompList.value.push(e);
}


function search(){
	const res = getValue();
	console.log('schema-search-bar.vue:',res);
	emit('search',getValue());
}
function reset(){
	searchCompList.value.forEach(comp=>comp?.reset())
	emit('reset');
}

let childComp = 0;
const handleLoaded = ()=>{
	childComp++;
	if(childComp>=Object.keys(schema.value?.properties).length){
		emit('load',getValue());
	}
}
function getValue() {
	let dtoObj = {};
	searchCompList.value.forEach(comp=>{
		dtoObj = {
			...dtoObj,
			...comp.getValue()
		}
	})
	return dtoObj;
}

</script>

<style lang="less">
.schema-search-bar{
	min-width:500px;
	.search-btn{
		width:100px;
	}
	.reset-btn{
		width:100px;
	}
	.input{
		width:280px;
	}

	.select{
		width:100px;
	}
	.dynamic{
		width:120px;
	}
	.dynamicSelect{
		width:100px;
	}
}
</style>