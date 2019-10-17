
const Max_Limit = 20
const db = wx.cloud.database()
const _ = db.command

/**
 * @param { Object } option 
 */
function db_query(option) {
    const opt = {
        collection: undefined,
        field: undefined,
        where: undefined,
        sort: undefined,
        skip: 0,
        limit: Max_Limit
    }
    const options = Object.assign({}, opt, option)
    if (typeof (options.collection) != 'string' || !option.collection) {
        console.warn('fn::db_query collection必须是string,且不能为空')
        return false
    }

    let dbmc = db.collection(options.collection)

    if(options.where){
        const where = Array.isArray(options.where) ? options.where : [options.where]
        for(let wh of where){
            dbmc = dbmc.where(wh)
        }
    }

    for (let key in options.sort) {
        dbmc = dbmc.orderBy(key, options.sort[key] === 'desc' ? 'desc' : 'asc')
    }

    if (options.skip > 0) {
        dbmc = dbmc.skip(options.skip)
    }

    if (options.field) {
        dbmc = dbmc.field(options.field)
    }

    return dbmc.limit(options.limit).get();
}

function db_query_doc(collection, arg) {
    if (typeof (collection) != 'string') {
        console.warn('fn::db_query_doc 第一个参数(collection)必须是string')
        return false
    }
    if (typeof (arg) === 'string') {
        if (!arg) {
            console.warn('fn::db_query_doc::_id必须是string,不能是空字符串')
            return false
        } else {
            return db.collection(collection).doc(arg).get()
        }
    } else if (Object.prototype.toString.call(arg) === '[object Object]') {
        return db.collection(collection).where(arg).limit(1).get()
    }
}

function db_add(collection, data) {
    if (typeof (collection) != 'string') {
        console.warn('fn::db_add 第一个参数(collection)必须是string')
        return false
    }
    const now = new Date().getTime()
    data = { uptime: now, id: now.toString(), ...data }
    delete data._id
    delete data._openid
    return db.collection(collection).add({ data })
}

function db_update_doc(collection, data) {
    if (typeof (collection) != 'string') {
        console.warn('fn::db_update_doc 第一个参数(collection)必须是string')
        return false
    }
    const _id = data._id
    if (!_id) {
        console.warn('fn::db_update_doc::data必须含有_id，且必须是string')
        return false
    }
    data = { ...data, uptime: new Date().getTime() }
    delete data._id
    delete data._openid
    return db.collection(collection).doc(_id).update({ data })
}

function db_remove_doc(collection, _id) {
    if (typeof (collection) != 'string') {
        console.warn('fn::db_remove_doc 第一个参数(collection)必须是string')
        return false
    }
    if (!_id || typeof (_id) != 'string') {
        console.warn('fn::db_remove_doc::_id必须是string,且不能为空')
        return false
    }
    return db.collection(collection).doc(_id).remove()
}

function db_set(collection, data) {
    if (typeof (collection) != 'string') {
        console.warn('fn::db_set 第一个参数(collection)必须是string')
        return false
    }
    if (data._id) {
        return db_update_doc(collection, data)
    } else {
        return db_add(collection, data)
    }

}
module.exports.db = db
exports._ = _
exports.db_query = db_query
exports.db_query_doc = db_query_doc
exports.db_add = db_add
exports.db_update_doc = db_update_doc
exports.db_remove_doc = db_remove_doc
exports.db_set = db_set

// dbh: db 辅助方法,封装了一些业务逻辑
/**
 * 根据 _id 获取doc.
 * @param {String} collection 集合名称
 * @param {String} _id doc._id
 * @param {Boolean} with_recomd 标记是否同时取出recomd(true or false)
 * @returns {Object} 
 *  progress:Number, 
 *  data:Object, 
 *  recomd:Object
 */
async function* dbh_query_doc(collection, _id, with_recomd = false) {
    if (typeof (collection) != 'string') {
        console.warn('fn::db_update_doc 第一个参数(collection)必须是string')
        return false
    }
    if (!_id || typeof (collection) != 'string') {
        console.warn('fn::db_update_doc::data必须含有_id，且必须是string')
        return false
    }

    yield { progress: 10 }
    try {
        const res = await db_query_doc(collection, _id)
        if (with_recomd) {
            yield { progress: 70 }
            const recomd = await db_query_doc("recomd", { key: collection, lid: _id })
            return {
                progress: 100,
                data: res.data,
                recomd: recomd.data[0]
            }
        } else {
            return { progress: 100, data: res.data }
        }
    } catch (err) {
        console.error(err)
        return { progress: 100 }
    }
}
/**
 * 根据 _id 获取doc，如果有关联的recomd，则一起取出recomd.
 * @param {String} collection 集合名称
 * @param {String} _id doc._id
 * @returns {Object} 
 *  progress:Number, 
 *  data:Object, 
 *  recomd:Object
 */
async function* dbh_query_doc_withrecomd(collection, _id) {
    if (typeof (collection) != 'string') {
        console.warn('fn::db_update_doc 第一个参数(collection)必须是string')
        return false
    }
    if (!_id || typeof (collection) != 'string') {
        console.warn('fn::db_update_doc::data必须含有_id，且必须是string')
        return false
    }

    yield { progress: 10 }
    try {
        const res = await db_query_doc(collection, _id)
        yield { progress: 70 }
        const recomd = await db_query_doc("recomd", { key: collection, lid: _id })
        return {
            progress: 100,
            data: res.data,
            recomd: recomd.data[0]
        }
    } catch (err) {
        console.error(err)
        return { progress: 100 }
    }
}
exports.dbh_query_doc = dbh_query_doc
exports.dbh_query_doc_withrecomd = dbh_query_doc_withrecomd