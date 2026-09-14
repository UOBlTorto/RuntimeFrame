import boot from '../boot.js'
import dashboard from './dashboard.vue'

const routes = [];
// 头部菜单
routes.push({
	path:'/view/dashboard/iframe',
	component:()=>import('./complex-view/iframe-view/iframe-view.vue')
});
routes.push({
	path:'/view/dashboard/schema',
	component:()=>import('./complex-view/schema-view/schema-view.vue')
})
routes.push({
	path:'/view/dashboard/todo',
	component:()=>import('./todo/todo.vue')
})
// 侧边菜单
routes.push({
	path:'/view/dashboard/sider',
	component:()=>import('./complex-view/sider-view/sider-view.vue'),
	children: [
		{
			path:'/iframe',
			component:()=>import('./complex-view/iframe-view/iframe-view.vue')
		},
		{
			path:'/schema',
			component:()=>import('./complex-view/schema-view/schema-view.vue')
		},
		{
			path:'/todo',
			component:()=>import('./todo/todo.vue')
		}
	]
})
// 路由兜底
routes.push({
	path:'/sider/:chapters+',
	component:()=>import('./complex-view/sider-view/sider-view.vue')
})
boot(dashboard,{routes});
