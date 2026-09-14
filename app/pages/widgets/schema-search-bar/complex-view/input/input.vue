<template>
	<el-input
		v-model="inpValue"
		v-bind="schema.option"
		class="input"
	></el-input>
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
	inpValue.value = schema?.option?.default;
}

onMounted(()=>{
	reset();
	emit('load')
})

</script>


<style lang="less" scoped>

</style>