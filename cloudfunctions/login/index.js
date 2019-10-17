// 云函数模板
// 部署：在 cloud-functions/login 文件夹右击选择 “上传并部署”

const cloud = require('wx-server-sdk')

// 初始化 cloud
cloud.init()

const db = cloud.database()
/**
 * 这个示例将经自动鉴权过的小程序用户 openid 返回给小程序端
 * 
 * event 参数包含小程序端调用传入的 data
 * 
 */
exports.main = async (event, context) => {
  const { OPENID, APPID } = cloud.getWXContext()

  let USERINFO = await db.collection('user')
                         .where({_openid:OPENID}).limit(1)
                         .get()
  
  if(USERINFO.data.length === 0){
    // role:0-普通用户，1-管理员
    USERINFO = { _openid: OPENID, wish:[], role:0 }
    await db.collection('user')
            .add({ data:USERINFO })
            .then(res=> {
                USERINFO._id = res._id
            }).catch((err) => {
                console.error('login.addnewuser.err:', err)
            });
  }else{
      USERINFO = USERINFO.data[0]
  }

  return  { OPENID, APPID, USERINFO }
}
