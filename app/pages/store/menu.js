import { defineStore } from 'pinia';
import { ref } from 'vue'
 
export const useMenuStore = defineStore('menu',()=>{

    const menuList = ref([]);

    const setMenuList = function(list){
        menuList.value = list;
    }
    // 找出本地白名单菜单
    const findMenuItem =function({key,value},mList=menuList.value){
        for(let i=0;i<mList.length;i++){
            const mItem = mList[i];
            if(!mItem) continue;

            const {menuType, moduleType} = mItem;
            if(mItem[key]===value){
                return mItem;
            }

            if(menuType==='group'&&mItem.subMenu){
                const item = findMenuItem({key,value},mItem.subMenu);
                if(item) {return item;}
            }

            if(moduleType==='sider' && mItem.siderConfig && mItem.siderConfig.menu){
                const item = findMenuItem({key,value},mItem.siderConfig.menu);
                if(item) {return item;}
            }
        }
    }

    // 查找菜单第一项
    const findFirstMenuItem = function (mList=menuList.value) {
        if(!mList||!mList[0]) return;
        let firstMenuItem = mList[0];
        // 如果item的类型是group
        if(firstMenuItem.subMenu){
            firstMenuItem = findMenuItem(firstMenuItem.subMenu)
        }
    }

    return {
        menuList,
        setMenuList,
        findMenuItem,
        findFirstMenuItem
    }
})