const db = require('../../util/db.js')
const app = getApp()
Page({

    /**
     * 页面的初始数据
     */
    data: {
        loadingProgressSignal: 0,
        notices:[]
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this.setData({ loadingProgressSignal: 10 })
        const data = wx.getStorageSync('placard')
        if(data){
            this.setData({ 
                notices: this._fn_DataFormatShow(data),
                loadingProgressSignal: 30
            })
        }
        this.doReLoad()
    },
    // 上次请求数据到时间戳
    _p_LastLoadingTimeStamp:0,
    doReLoad(){
        const nowSp = (new Date().getTime() - this._p_LastLoadingTimeStamp)/1000/60
        // 每隔5分钟可刷新一次
        if( nowSp < 1){
            return
        }
        this._p_LastLoadingTimeStamp = new Date().getTime()
        if(this.data.loadingProgressSignal === 0){
            this.setData({ loadingProgressSignal: 30 })
        }

        db.db_query({
            collection: 'placard',
            sort: { uptime: 'desc' },
            limit: 20
        }).then(res => {
            this.setData({
                notices: this._fn_DataFormatShow(res.data),
                loadingProgressSignal: 100
            })
            wx.setStorage({ key: 'placard', data: res.data })
        })
    },
    _fn_DataFormatShow(data){
        return data.map((c, index) => ({
            _id: c._id,
            title: c.title,
            text: c.text.substring(0, 60),
            readed: Array.isArray(c.reader) && c.reader.includes(app.globalData.OPENID),
            date: c.date,
            img: c.imgs[0] || ''
        }))
    },
    doView(e){
        const { id } = e.currentTarget.dataset
        if(id){
            wx.navigateTo({
                url:`/pages/notice/view?id=${id}&f=noticelist`
            })
        }
    },
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({
                curTab: 'notice'
            })
        }
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
})