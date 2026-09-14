/**
 * 参数校验
 * @param {app} app 
 * @returns 
 */
const Ajv = require('ajv');
const ajv=new Ajv();
module.exports=(app)=>{
    const $schema="http://json-schema.org/draft-07/schema#";
    return async (ctx,next)=>{
        //非API请求不处理
        if(!ctx.path.includes('/api/')){
            return await next();
        }
        //处理API请求
        const { body ,query, headers}=ctx.request;
        const {params, path,method}=ctx;

        const schema = app.routerSchema[path]?.[method.toLowerCase()];
        if(!schema){
            return await next();
        }
        let valid=true;
        let validate;
        if(valid&& headers&& schema.headers){
            schema.headers.$schema=$schema;
            validate=ajv.compile(schema.headers);
            valid=validate(headers);
        }
        if(valid&& body&& schema.body){
            schema.body.$schema=$schema;
            validate=ajv.compile(schema.body);
            valid=validate(body);
        }
        if(valid&& query&& schema.query){
            schema.query.$schema=$schema;
            validate=ajv.compile(schema.query);
            valid=validate(query);
        }
        if(valid&& params&& schema.params){
            schema.params.$schema=$schema;
            validate=ajv.compile(schema.params);
            valid=validate(params);
        }

        if(!valid){
            ctx.status=200;
            ctx.body={
                success: false,
                message: '请求参数错误',
                code: 442
            }
            return;
        }
        await next();

    }
}