<template>
	<el-drawer
		v-model="isShow"
		direction="rtl"
		:destory-on-close="true"
		:size="550"
	>
		<template #header>
			<h4 class="title">{{title}}</h4>
		</template>
		<template #default>
			<schema-form :schema="components[name]?.schema" ref="schemaFormRef" v-loading="loading"></schema-form>
		</template>
		<template #footer>
			<el-button @click="save" type="primary">{{saveBtnText}}</el-button>
		</template>
	</el-drawer>
</template>
<script setup>
import {ref,inject} from 'vue'
import SchemaForm from '$widgets/schema-form/schema-form.vue'
import $curl from '$common/curl.js'
import { ElNotification } from 'element-plus'

const {
	api,
	components
} = inject('schemaViewData');
const emit = defineEmits(['command']);
const name = ref('createForm');
const isShow = ref(false);
const title = ref('');
const saveBtnText = ref('');
const schemaFormRef = ref(null);
const loading = ref(false);


function show(rowData) {
	const { config } = components.value[name.value];
	title.value = config.title;
	saveBtnText.value = config.saveBtnText;
	isShow.value = true;
}
function close() {
	isShow.value = false;
}
async function save() {
	// 防止重复提交
	if(loading.value) return
	// 校验表单
	if(!schemaFormRef.value.validate()) return;
	loading.value = true;
	const res = await $curl({
		method: 'post',
		url:api.value,
		data:{
			...schemaFormRef.value.getValue()
		}
	})
	loading.value = false;
	if(!res||!res.success) return;

	ElNotification({
		title:'创建成功',
		message:'创建成功',
		type:'success'
	});
	close();
	emit('command',{
		event:'loadTableData'
	})
}
defineExpose({
	name,
	show
});
</script>
<style lang="less" scoped></style>