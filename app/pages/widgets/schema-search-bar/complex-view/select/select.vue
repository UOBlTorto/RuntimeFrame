<template>
	<el-select
		v-model="inpValue"
		v-bind="schema.option"
		class="select"
	>
		<el-option
			v-for="item in schema.option?.enumList"
			:key="item.value"
			:label="item.label"
			:value="item.value"
		></el-option>
	</el-select>
</template>


<script setup>
import {ref,onMounted} from 'vue';

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



function getValue(){
	return inpValue.value !== undefined
			? {[schemaKey]:inpValue.value}
			:{}
}
function reset(){
	inpValue.value = schema?.option?.default ?? schema.option?.enumList[0]?.value;
}

onMounted(()=>{
	reset();
	emit('load')
})

</script>


<style lang="less" scoped>

</style>