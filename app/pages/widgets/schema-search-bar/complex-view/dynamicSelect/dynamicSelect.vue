<template>
	<el-select
		v-model="inpValue"
		v-bind="schema.option"
		class="dynamicSelect"
	>
		<el-option
			v-for="item in enumList"
			:key="item.value"
			:label="item.label"
			:value="item.value"
		></el-option>
	</el-select>
</template>


<script setup>
import {ref,onMounted} from 'vue';
import $curl from '$common/curl.js'
defineExpose({
	getValue,
	reset
})
const {schemaKey,schema} = defineProps({
	schemaKey:String,
	schema:Object
})
const emit = defineEmits(['load']);
const inpValue = ref();
const enumList = ref([]);

async function fetchEnumList(){
	const res = await $curl({
		method:'get',
		url:schema.option?.api,
		data:{}
	})
	if(res?.data?.length>0){
		enumList.value.push(...res?.data)
	}
}
function getValue(){
	return inpValue.value !== undefined
			? {[schemaKey]:inpValue.value}
			:{}
}
function reset(){
	inpValue.value = schema?.option?.default 
					?? enumList.value[0]?.value;
}

onMounted(async ()=>{
	await fetchEnumList();
	reset();
	emit('load')
})

</script>


<style lang="less" scoped>

</style>