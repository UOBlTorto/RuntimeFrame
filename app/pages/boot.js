import { createApp } from "vue";
import ElementUI from 'element-plus';
import 'element-plus/theme-chalk/index.css';
import './asserts/custom.css'
import pinia from '$store/index.js';
import { createRouter ,createWebHistory} from 'vue-router';

/**
 * vue页面主入口，启动VUE
 * @params compon 入口组件
 * @params routes 路由列表
 * @params libs 第三方库
 * */
export default (compon,{routes,libs}={})=>{
    const app = createApp(typeof compon === 'function' ? compon() : compon);
    app.use(ElementUI);
    app.use(pinia);
    // 第三方包注册
    if(libs&&libs.length){
        for(let i=0;i<libs.length;i++){
            app.use(libs[i]);
        }
    }
    // 页面路由
    if(routes&&routes.length>0){
        const router=createRouter({
            history: createWebHistory(),
            routes: routes
        })
        app.use(router);
        router.isReady().then(()=>{
            app.mount('#root')
        })
    }else{
        app.mount('#root')

    }

    
}