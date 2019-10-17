// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
    const { wished, aid, uid } = event

    // 更新user.wish
    let user = await db.collection('user').doc(uid).get()
    user = user.data
    user.wish = user.wish || []
    const haswish = user.wish.includes(aid)
    let wishn = 0
    if (wished && !haswish) {
        user.wish.push(aid)
        wishn = 1
    } else if (!wished && haswish) {
        user.wish.splice(user.wish.indexOf(aid), 1)
        wishn = -1
    }

    let stats = 0
    if (wishn != 0) {
        const res = await db.collection('user').doc(user._id)
            .update({ data: { wish: user.wish } })
            .catch(console.error);
        console.log(res)
        stats = res.stats.updated
        if (stats > 0) {
            db.collection('article').doc(aid)
                .update({ data: { wish: _.inc(wishn) } })
                .catch(console.error);
        }
    }

    return {
        stats: stats,
        wish: user.wish
    }
}