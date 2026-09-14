module.exports = {
    model: 'dashboard',
    name: '教育系统',
    menu: [
        {
            key: 'video',
            name: '视频管理',

            menuType: 'module',
            moduleType: 'custom',
            customConfig: {
                path: '/todo'
            }
        },
         {
            key: 'user',
            name: '用户管理',
            
            menuType: 'module',
            moduleType: 'custom',
            customConfig: {
                path: '/todo'
            }
        }
    ]
}