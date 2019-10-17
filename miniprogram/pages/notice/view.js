const db = require('../../util/db.js')
const app = getApp()
Page({

    /**
     * 页面的初始数据
     */
    data: {
        title: '',
        date: '',
        id: '',
        isAdmin: false,
        loadingProgressSignal: 0
    },
    onEditorReady() {
        const that = this
        wx.createSelectorQuery().select('#editor')
            .context(function (res) {
                that.editorCtx = res.context
                if (that._p_Options_Id) {
                    var results = db.dbh_query_doc('placard', that._p_Options_Id)
                    app._Fn_GeneratorPromiseNext(results, (res) => {
                        if (res.done) {
                            const { progress, data } = res.value
                            if (data) {
                                that.editorCtx.setContents({ delta: data.delta })
                                that.setData({
                                    title: data.title || '',
                                    date: data.date,
                                    id: data._id,
                                    isAdmin: app.globalData.UserIsAdmin || false,
                                    loadingProgressSignal: progress
                                })
                                that.doRead(data._id, data.reader)
                            } else {
                                wx.navigateBack({ delta: 1 })
                            }
                        } else {
                            that.setData({ loadingProgressSignal: res.value.progress })
                        }
                    })
                }
            }).exec()
    },
    doEdit(e) {
        const { id } = e.currentTarget.dataset
        if (id) {
            wx.redirectTo({ url: `/pages/cms/placard/placard?id=${id}&f=view` })
        }
    },
    doRead(id, reader) {
        if (id) {
            let isReaded = false
            if (reader) {
                isReaded = reader.includes(app.globalData.OPENID)
            }
            if (!isReaded) {
                wx.cloud.callFunction({
                    name: 'readplacard',
                    data: { aid: id }
                })
            }
        }
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this._p_Options_Id = options.id
    },
    _p_Options_Id: undefined,
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function (e) {
        return {
            title: this.data.title,
            path: `/pages/notice/view?id=${this.data.id}&f=share`
        }
    }
})