/**
 * project处理
 * */
module.exports = (app)=>{
	return async (ctx,next)=>{
		// 对非业务路径放行
		if(!ctx.path.includes('/api/proj/')){
			return await next();
		}
		const {proj_key} = ctx.request.headers;
		if(!proj_key){
			ctx.status =200;
			ctx.body = {
				success:false,
				message:'未携带proj_key',
				code:446
			};
			return ;
		}
		ctx.projKey = proj_key;
		await next();
	}
}