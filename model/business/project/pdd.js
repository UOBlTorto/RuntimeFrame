module.exports={
    name:'拼多多',
    desc:'拼多多电商平台',
    homePage:'/schema?proj_key=pdd&key=product',
    menu:[
      {
        key:'product',
        name:'商品管理（拼多多）'
      },
      {
        key:'client',
        name:'客户管理(拼多多）',
        // moduleType: 'schema',
        // schemaConfig: {
        //   api:'/api/client',
        //   schema: {}
        // }
      },
      {
        key:'data',
        name:'数据分析',

        menuType:'module',
        moduleType:'sider',
        siderConfig:{
          menu:[
            {
              key:'analysis',
              name:'电商罗盘',
              menuType:'module',
              moduleType: 'schema',
              schemaConfig: {
                api:'/api/client',
                schema: {}
              }
            },
            {
              key:'sider-search',
              name:'信息查询',
              menuType:'module',
              moduleType:'iframe',
              iframeConfig:{
                path:'http://www.baidu.com'
              }
            }
          ]
        }
      },
      {
        key:'sider-search',
        name:'信息查询',
        
        menuType: 'module',
        moduleType:'iframe',
        iframeConfig:{
          path:'http://www.baidu.com'
        }
      }
    ]
}