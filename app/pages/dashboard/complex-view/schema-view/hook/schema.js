import {ref,watch,onMounted,nextTick} from 'vue'
import {useRoute} from 'vue-router'
import {useMenuStore} from '$store/menu.js'

export const useSchema = ()=>{
	const api = ref('');
	const tableConfig = ref({});
	const tableSchema = ref({});
	const searchSchema = ref({});
	const searchConfig = ref({});
	const components = ref({})
	const menuStore = useMenuStore();
	const route = useRoute();

	// 构造schemaConfig 相关配置，输送给schemaview
	const buildData = ()=>{
		const {key,sider_key} = route.query;
		const mItem = menuStore.findMenuItem({
			key:'key',
			value:sider_key??key
		})
		if(mItem&&mItem.schemaConfig){
			const { schemaConfig }=mItem;
			const configSchema = JSON.parse(JSON.stringify(schemaConfig.schema));

			api.value = schemaConfig.api??'';
			tableSchema.value = {};
			tableConfig.value = undefined;
			searchSchema.value = {};
			searchConfig.value = undefined;
			nextTick(()=>{
				// =====================构造 表格 相关==================================
				tableSchema.value = buildDtoSchema(configSchema,'table');
				tableConfig.value = configSchema.tableConfig;
				// =======================构造 搜索栏 相关==============================
				const dtoSearchSchema = buildDtoSchema(configSchema,'search');
				for(const prop in dtoSearchSchema.properties){
					if(route.query[prop]!==undefined){
						dtoSearchSchema.properties[prop].default = route.query[prop];
					}
				}
				searchSchema.value = dtoSearchSchema;
				searchConfig.value = configSchema.searchConfig
				// ============================构造 动态组件 相关========================
				const { componentConfig } = configSchema
				if(componentConfig&&Object.keys(componentConfig).length>0){
					let dtoComponent = {};
					for(const compKey in componentConfig){
						dtoComponent[compKey] = {
							schema:buildDtoSchema(configSchema,compKey),
							config:componentConfig[compKey]
						}
					}
					components.value = dtoComponent;
				}
			})
		}
	}
	// 通用 schema 构建方法
	const buildDtoSchema = (schema,commonName)=>{
		// 处理字段值
		if(!schema.properties) {return {};}
		const dtoSchema = {
			type: 'object',
			properties: {}
		}
		for(const key in schema.properties){
			const props = schema.properties[key];
			if(props[`${commonName}Option`]){
				let dtoProps = {};
				for(const propsKey in props){
					if(!propsKey.includes(Option)){
						dtoProps[propsKey] = props[propsKey];
					}
				}
				dtoProps.option = props[`${commonName}Option`];
				// 处理必填的字段值
				if(schema.required&&schema.required.find(prop=>prop===key)) {
					dtoProps.option.required = true
				 }
				dtoSchema.properties[key] = dtoProps;

			}
		}

		return dtoSchema;

	}

	watch([
		()=>route.query.key,
		()=>route.query.sider_key,
		()=>menuStore.menuList
	],()=>{buildData();},{deep:true})
	onMounted(()=>{
		buildData();
	})
	return {
		api,
		tableConfig,
		tableSchema,
		searchConfig,
		searchSchema,
		components
	}
}
