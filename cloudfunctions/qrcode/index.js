// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
    try {
        const { id, path } = event
        if(path && id){
            const result = await cloud.openapi.wxacode.getUnlimited({
                scene: `id=${id}&f=share`,
                path: path,
                width:280,
                isHyaline:true
            })
            return result
        }
    } catch (err) {
        console.log(err)
        return err
    }
}