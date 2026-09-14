const webpack = require('webpack')
const wB = require('./config/webpack.base.js')

console.log('\nbuilding... \n');

webpack(wB,(err,stats)=>{
    if(err){
        console.error(err.stack || err)
        return
    }
    process.stdout.write(`${stats.toString({
        colors: true,
        modules:false,
        children:false,
        chunks:false,
        chunkModules: true
    })}\n`)
});