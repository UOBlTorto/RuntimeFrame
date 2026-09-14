<template>
	<el-row align="middle" class="form-item">
		<!-- label -->
		<el-row class="item-label" justify="end">
			<el-row
				v-if="schema.option?.required"
				class="required"
			>*</el-row>
			{{schema.label}}
		</el-row>
		<!-- value -->
		<el-row class="item-value">
			<el-input-number
				:placeholder="placeHolder"
				v-model="dtoValue"
				v-bind="schema.option"
				class="component"
				:class="validTips?'valid-border':''"
				@focus="onFocus"
				@blur="onBlur"
				:controls="false"
			></el-input-number>
		</el-row>
		<!-- 错误信息 -->
		<el-row v-if="validTips" class="valid-tips">{{validTips}}</el-row>
	</el-row>
</template>

<script setup>
import {ref, toRefs, watch, inject, onMounted} from 'vue'

const ajv = inject('ajv')
const props = defineProps({
	schemaKey:String,
	schema:Object,
	model:Number
})
const name = ref('input-number');

const {schemaKey, schema } = props;
const {model } = toRefs(props);
const dtoValue = ref()
const validTips = ref(null);
const placeHolder = ref('');

function initData(argument) {
	dtoValue.value = model.value??schema.option?.default;
	validTips.value = null;

	const { minimum, maximum } = schema;
	const ruleList = [];
	if(schema.option?.placeholder){
		ruleList.push(schema.option.placeholder);
	}
	if(minimum){
		ruleList.push(`最小值为${minimum}`)
	}
	if(maximum){
		ruleList.push(`最大值为${maximum}`)
	}
	
	placeHolder.value = ruleList.join('|')
}
function validate(argument) {
	validTips.value = null;
	const {type} = schema;
	// 校验是否必填
	if(schema.option?.required&&!dtoValue.value) {
		validTips.value = '不能为空';
		return false;
	}
	// ajv校验schema
	if(dtoValue.value){
		const validate = ajv.compile(schema);
		const valid = validate(dtoValue.value);
		if(!valid&&validate.errors&&validate.errors[0]){
			const {keyword,params} = validate.errors[0];
			if(keyword==='type'){
				validTips.value = `类型必须为${type}`;
			}else if(keyword==='maximum'){
				validTips.value = `最大值为${params.limit}`
			}else if(keyword==='minimum'){
				validTips.value = `最小值为${params.limit}`
			}else if(keyword==='pattern'){
				validTips.value = '格式不正确'
			}else{
				console.log(validate.errs[0]);
				validTips.value = '不符合要求'
			}
			return false
		}
	}
	return true
}
function getValue(argument) {
	return dtoValue.value !==undefined 
			? { [schemaKey]:dtoValue.value }
			: {}
}
function onFocus(argument) {
	validTips.value = null;
}
function onBlur(argument) {
	validate()
}
onMounted(()=>{
	initData()
})
watch([model,schema],()=>{
	initData();
},{deep:true})
defineExpose({
	name,
	validate,
	getValue
})
</script>

<style lang="less" scoped>
	:deep(.el-input-number .el-input_inner){
		text-aligin: left
	}
</style>
