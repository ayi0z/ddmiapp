// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()
// 云函数入口函数
exports.main = async (event, context) => {
    const { aid } = event
    const { OPENID } = cloud.getWXContext()

    let placard = await db.collection('placard').doc(aid).get()
    placard = placard.data
    placard.reader = placard.reader || []
    const isReaded = placard.reader.includes(OPENID)
    let stats = 0
    if (!isReaded) {
        placard.reader.push(OPENID)
        const res = await db.collection('placard').doc(aid)
            .update({ data: { reader: placard.reader } })
            .catch(console.error);
        stats = res.stats.updated
    }
    return {
        stats: stats,
        reader: placard.reader
    }
}