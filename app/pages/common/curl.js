import { ElMessage } from "element-plus";
const md5 = require('md5');
/**
 * 前端封装curl方法
 * @params
 */
const curl = ({
    url,
    method = 'post',
    headers={},
    query={},
    data={},
    responseType='json',
    timeout=60000,
    errorMessage='curl网络异常'
})=>{
    // 签名处理
    const signKey='asdfhdjfldflahfeufwnc';
    const st=Date.now();
    // 头部构造
    const dtoHeaders = {
        ...headers,
        s_t:st,
        s_sign: md5(`${signKey}_${st}`)
    }
    if(url.includes('/api/proj/')&&window.projKey){
        dtoHeaders.proj_key = window.projKey;
    }

    // 构造参数(把参数装换成axios参数)
    const ajaxSting={
        method,
        url,
        headers:dtoHeaders,
        params:query,
        data,
        responseType,
        timeout
    }
    return axios.request(ajaxSting).then((resp)=>{
        const resData = resp.data;
        // 失败处理
        const {success}=resData;
        if(!success){
            const {code,message}=resData;
            if(code===442){
                ElMessage.error('请求参数异常')
            }else if(code===445){
                ElMessage.error('请求不合法');
            }else if(code===50000){
                ElMessage.error(message);
            }else if(code===446){
                ElMessage.error('项目-缺少必要参数')
            }else{
                ElMessage.error(errorMessage);
            }
            return Promise.resolve({success,code,message});
        }
        // 成功处理
        const {data,metadata}=resData;
        return Promise.resolve({success,data,metadata});

    }).catch((e)=>{
        if(e.message.match(/timeout/)){
            return Promise.resolve({
                message: '请求超时',
                code: 504
            })
        }
        return Promise.resolve(e);
    })
}
export default curl;