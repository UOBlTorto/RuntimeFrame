module.exports = (app,router)=>{
	const {business:businessCtl}= app.controller;
	router.get('/api/proj/product/list',businessCtl.getList.bind(businessCtl));
	router.delete('/api/proj/product',businessCtl.delete.bind(businessCtl));
	router.get('/api/proj/product_enum/list',businessCtl.getTestEmun.bind(businessCtl));
		router.post('/api/proj/product',businessCtl.create.bind(businessCtl));
		router.put('/api/proj/product',businessCtl.update.bind(businessCtl));
		router.get('/api/proj/product',businessCtl.get.bind(businessCtl));

}