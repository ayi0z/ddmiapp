const db = require('../../util/db.js')
const app = getApp()
Page({

    /**
     * 页面的初始数据
     */
    data: {
        loadingProgressSignal:0,
        articles: [],
        limit:20
    },
    doViewArticle(e) {
        wx.navigateTo({ url: `/pages/article/article?id=${e.currentTarget.dataset.id}&f=wishrank` })
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this.setData({ loadingProgressSignal: 10 })
        const data = wx.getStorageSync('wishrank')
        if(data){
            this.setData({ 
                articles: this._fn_DataFormatShow(data),
                loadingProgressSignal: 30
            })
        }
        
        db.db_query({
            collection: 'article',
            sort: { wish: 'desc', uptime: 'desc' },
            limit: this.data.limit
        }).then(res => {
            this.setData({
                articles: this._fn_DataFormatShow(res.data),
                loadingProgressSignal: 100
            })
            wx.setStorage({ key: 'wishrank', data: res.data })
        })
    },
    _fn_DataFormatShow(data){
        return data.map((c, index) => ({
            _id: c._id,
            title: c.title,
            imgUrls: c.imgUrls[0],
            desc: c.desc,
            wish: c.wish || 0,
            tab: app.globalData.tabnavs.find(n => n.key === c.tab).view.text,
            tags: c.tags,
            sort: index
        }))
    },
    
    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({
                curTab: 'wishrank'
            })
        }
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
})