{
    mode:'dashboard',//模板类型，不同类型对于不同数据结构
    name:'',
    desc:'',
    ifcon:'',
    homePage:'',
      
    menu:[{
      key:'',//菜单唯一描述
      name:'',//菜单名称
      menuType:'',//枚举值，group/module，group只是一个分类标题，module是一个可跳转页面
    
      subMenu:[{
        可递归menuItem
      },...],
      
      moduleType:'',//枚举值，sider/iframe/custom/schema，决定点击菜单后中间区域渲染什么组件
      siderConfig:{
        menu:[{}]
      },
      iframeConfig:{
        path:'',
      },
      customConfig:{
        path:'',
      },
      schemaConfig:{
            api:'/api/user',
            schema:{
                type: 'object',
                properties:{
                  key:{
                    ...schema,// 标准schema配置
                    type: '',// 字段类型
                    label: '',// 字段名称
                    //=========================字段在table相关配置=====================
                    tableOption:{ 
                      ...elTableColumnConfig, //标准el-table-column 配置，用v-bind绑定
                      toFixed: 2,
                      visible: true, // 是否展示  ，  默认展示
                    },
                    //===========================字段在search框的相关配置====================================
                    searchOption:{ 
                      ...elComponentConfig,
                      comType: '',// input/select
                      default: ''

                      enumList: []// comType===select
                      api:''//comType===dynamicSelect
                    },
                    // ============================字段在不同动态组件中的配置，前缀对应componentConfig的键====================
                    createFormOption:{
                      ...elComponentConfig,
                      comType: '',
                      visible: true,
                      disabled: false,
                      default: '',

                      enumList: [], // comType==='select'
                    },
                    editFormOption:{
                      ...elComponentConfig,
                      comType: '',
                      visible: true,
                      disabled: false,
                      default: '',

                      enumList: [], // comType==='select'
                    },
                    detailPanelOption:{
                      ...elComponentConfig,
                    }
                  },
                  ...//other Key
                },
                required:[],//标记哪些字段必填 

                tableConfig: {
                  headerButtons: [
                    {
                      label: '',//按钮名称
                      eventKey: '',// 按钮事件名称
                      eventOption: {// 按钮具体配置
                        // eventKey==='showComponent'
                        compName:''
                      },
                      ...elButtonConfig//标准的 el-button
                    },...
                  ],
                  rowButtons: [
                    {
                      label: '',
                      eventKey: '',
                      eventOption: {
                        // eventKey==='showComponent'
                        compName:''
                        // 当eventKey==='remove'
                        params:{
                          paramKey:rowValueKey
                        }
                      },
                      ...elButtonConfig
                    },...
                  ]
                },
                searchConfig:{},
                componentConfig:{
                  createForm:{
                    title: '',//组件标题
                    saveBtnText:'',//保存按钮文案
                  },
                  editForm:{
                    mainKey:'',//表单主题，修改的数据的对象的唯一标识
                    title:'',
                    saveBtnText:'',

                  },
                  detailPanel:{
                    mainKey:'',
                    title:'',
                    saveBtnText:'',
                  }
                }
            },
        }
    },...]
}