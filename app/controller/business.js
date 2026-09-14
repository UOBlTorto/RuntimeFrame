module.exports = (app)=>{
	const sleep = async (time) => {
		return new Promise(resolve => {
			setTimeout(()=>{
				resolve();
			},time);
		});
	}
	const BaseController = require('./base')(app);
	return class BusinessController extends BaseController{
		// /api/proj/product/list
		async getList(ctx){

			const {product_name,page,size} = ctx.request.query;
			const metadata = {total:3};
			let data = [
				{
					product_id: '1',
					product_name: `${ctx.projKey}-宝典1`,
					price: 39.9,
					inventory:9999,
					create_time:'2023'
				},
				{
					product_id: '2',
					product_name: `${ctx.projKey}-宝典2`,
					price: 669.9,
					inventory:9999,
					create_time:'2023'
				},
				{
					product_id: '3',
					product_name: `${ctx.projKey}-宝典3`,
					price: 69.9,
					inventory:9999,
					create_time:'2023'
				}
			];
			if(product_name&&product_name!=='all'){
				data=data.filter(i=>{
					return i.product_name===product_name
				})
			}
			await sleep(500);

			this.success(ctx,data,metadata)
		}
		// /api/proj/product
		getProjectList(ctx){
			return [
				{
					product_id: '1',
					product_name: `${ctx.projKey}-宝典1`,
					price: 39.9,
					inventory:9999,
					create_time:'2023'
				},
				{
					product_id: '2',
					product_name: `${ctx.projKey}-宝典2`,
					price: 669.9,
					inventory:9999,
					create_time:'2023'
				},
				{
					product_id: '3',
					product_name: `${ctx.projKey}-宝典3`,
					price: 69.9,
					inventory:9999,
					create_time:'2023'
				}
			];
		}
		async delete(ctx){

			const {product_id}=ctx.request.body;
			await sleep(500);

			this.success(ctx,{
				projKey:ctx.projKey,
				product_id
			})
		}
		async create(ctx){

			const {
				product_name,
				price,
				inventory
			} = ctx.request.body;
			await sleep(500);

			this.success(ctx,{
				product_id:Date.now(),
				product_name,
				price,
				inventory
			});
		}
		async update(ctx){
			const {
				product_id,
				product_name,
				price,
				inventory
			} = ctx.request.body;
			await sleep(500);

			this.success(ctx,{
				product_id,
				product_name,
				price,
				inventory
			});
		}
		async get(ctx){
			const {product_id} = ctx.request.query;
			await sleep(500);
			
			const productList = this.getProjectList(ctx);
			const productItem =  productList.find(i=>i.product_id === product_id);
			this.success(ctx,productItem)
		}
		// /api/proj/product_enum/list
		getTestEmun(ctx){
			let data = [{
				label:'全部',
				value:'all'
			},{
				label:`${ctx.projKey}-宝典1`,
				value:`${ctx.projKey}-宝典1`
			},{
				label:`${ctx.projKey}-宝典2`,
				value:`${ctx.projKey}-宝典2`,
			},{
				label:`${ctx.projKey}-宝典3`,
				value:`${ctx.projKey}-宝典3`,

			}]
			
			this.success(ctx,data)
		}
	}
}