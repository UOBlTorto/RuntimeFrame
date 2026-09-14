<template>
	<el-card class="search-panel">
		<schema-search-bar
			:schema="searchSchema"
			@load="onLoad"
			@search="onSearch"
			@reset="onReset"
		></schema-search-bar>
	</el-card>

</template>


<script setup>
import {ref,inject} from 'vue';
import $curl from '$common/curl.js';
import SchemaSearchBar from '$widgets/schema-search-bar/schema-search-bar.vue'

const {
	searchSchema
} = inject('schemaViewData')
const emit = defineEmits(['search']);


function onLoad(searchObj){
	emit('search',searchObj);
}
function onSearch(searchObj){
	emit('search',searchObj);
}
function onReset(){
	emit('search',{})
}
</script>

<style lang="less" scoped>
.search-panel{
	margin:10px 10px 0 10px;
}
:deep(.el-card__body){
		padding-bottom:2px;
	}
</style>