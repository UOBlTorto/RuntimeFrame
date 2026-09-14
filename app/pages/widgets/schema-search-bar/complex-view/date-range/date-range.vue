<template>
	<el-date-picker
		v-model="inpValue"
		v-bind="schema.option"
		type="daterange"
		range-separator="-"
		:start-placeholder="schema.label+'开始'"
		:end-placeholder="schema.label+'结束'"
		class="date-range"
	></el-date-picker>
</template>


<script setup>
import {ref,onMounted} from 'vue';
import moment from 'moment'
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
	return inpValue.value.length===2
			? {
				[`${schemaKey}_start`]:moment(inpValue.value[0]).format('YYYY-MM-DD'),
				[`${schemaKey}_end`]:moment(inpValue.value[1]).format('YYYY-MM-DD')
			  }
			:{}
}
function reset(){
	inpValue.value = []
}

onMounted(async ()=>{
	reset();
	emit('load')
})

</script>


<style lang="less" scoped>

</style>