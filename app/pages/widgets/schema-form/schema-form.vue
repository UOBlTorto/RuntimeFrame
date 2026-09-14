<template>
	<el-row v-if="schema&&schema.properties" class="schema-form">
		<template v-for="(itemSchema,key) in schema.properties">
			<component
				:is="FormItemConfig[itemSchema.option?.comType]?.component"
				:ref="formCoListF"
				v-show="itemSchema.option.visible!==false"
				:schema="itemSchema"
				:schemaKey="key"
				:model="model?model[key]:undefined"
			></component>
		</template>
	</el-row>
</template>


<script setup>
import {ref,toRefs,provide} from 'vue';
import FormItemConfig from './form-item-config.js'


import Ajv from 'ajv'

const ajv = new Ajv()
provide('ajv', ajv) // ✅ 不是字符串
const formCoList = ref([]);
function formCoListF(e){
	formCoList.value.push(e);
}
const prop = defineProps({
	schema:Object,
	// 表单数据
	model:String
})
defineExpose({
	validate,
	getValue,
})
const {schema} = toRefs(prop);
// 表单校验
function validate() {
 	return formCoList.value.every(comp=>comp.validate())
 }
 // 获取表单值
 function getValue() {
 	return formCoList.value.reduce((pre,curComp)=>{
 		pre = {
 			...pre,
 			...curComp.getValue()
 		};
 		return pre;
 	},{})
 }


</script>

<style lang="less">
.schema-form{
	.form-item{
		margin-bottom:20px;
		min-width:500px;

		.item-label{
			margin-right:15px;
			min-width:70px;
			text-align:right;
			font-size:14px;
			color:black;
			word-break:break-all;

			.required{
				top:2px;
				padding-left:4px;
				color:#f56c6c;
				font-size:20px;
			}
		}
		.item-value{
			.component{
				width:320px;
			}
			.valid-border{
				.el-input__wrapper{
					border:1px solid #F93F3F;
					box-shadow:0;
				}
				.el-select__wrapper{
					border:1px solid #F93F3F;
					box-shadow:0;
				}
			}
		}

		.valid-tips{
			margin-left:10px;
			height:36px;
			line-height:36px;
			overflow:hidden;
			font-size:12px;
			color:#F93F3F;
		}
	}
	
}
</style>