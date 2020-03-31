const db = require('../../util/db.js')
const _ = db.db.command
const app = getApp()
Page({
    /**
     * 页面的初始数据
     */
    data: {
        loadingProgressSignal:0,
        articles: []
    },
    // 浏览文章
    doViewArticle(e) {
        wx.navigateTo({ url: `/pages/article/article?id=${e.currentTarget.dataset.id}&f=wished` })
    },
    // 喜欢 / 取消喜欢
    doWish(e){
        if (app.globalData.USERINFO._id) {
            let { wished, id, pidx } = e.currentTarget.dataset
            this.setData({ loadingProgressSignal: 60 })
            wx.cloud.callFunction({
                name: 'wish',
                data: { wished: !wished, aid: id, uid: app.globalData.USERINFO._id }
            }).then(res => {
                if(res.result.stats){
                    this.setData({ loadingProgressSignal: 80 })

                    app.globalData.USERINFO.wish = res.result.wish
                    let articles = this.data.articles[pidx]
                    const itemIdx = articles.findIndex(c => c._id === id)
                    articles[itemIdx].wished = !wished
                    this.setData({
                        ["articles[" + pidx + "][" + itemIdx + "]"]: articles[itemIdx],
                        loadingProgressSignal: 100
                    })
                }
                this.setData({ loadingProgressSignal: 100 })
            }).catch(err=>{
                this.setData({ loadingProgressSignal: 100 })
                console.error(err)
            })
        }
    },
    // 刷新
    doReLoad(){
        const nowSp = (new Date().getTime() - this._p_LastLoadingTimeStamp)/1000/60
        // 每隔5分钟可刷新一次
        if( nowSp < 1){
            return
        }
        this.setData({ loadingProgressSignal: 10 })
        this._fn_LoadWish(0)
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this.setData({ loadingProgressSignal: 10 })
        const data = wx.getStorageSync('wished')
        if(data){
            this.setData({["articles"]: [this._fn_DataFormatShow(data)] })
        }
        this.setData({ loadingProgressSignal: 30 })
        this._fn_LoadWish(0)
    },
    // 数据页码
    _fn_PageIndex:0,
    // 上次请求数据到时间戳
    _p_LastLoadingTimeStamp:0,
    // 从数据库加载数据
    _fn_LoadWish(sortidx = 0){
        this._p_LastLoadingTimeStamp = new Date().getTime()
        db.db_query({
            collection: 'article',
            where: { id: _.in(app.globalData.USERINFO.wish) },
            sort: { uptime: 'desc' },
            skip:sortidx,
            limit:20
        }).then(res => {
            if(res.data.length > 0){
                if(sortidx===0){
                    this.setData({ ["articles"]: [this._fn_DataFormatShow(res.data)], loadingProgressSignal:100 })
                    wx.setStorage({ key: 'wished', data: res.data })
                }else{
                    this.setData({ ["articles["+ (++this._fn_PageIndex) +"]"]: this._fn_DataFormatShow(res.data), loadingProgressSignal:100 })
                }
            }else{
                this.setData({ loadingProgressSignal: 100 })
            }
        }).catch(()=>{
            this.setData({ loadingProgressSignal: 100 })
        })
    },
    // 显示数据清洗
    _fn_DataFormatShow(data){
        return data.map((c, index) => ({
            _id: c._id,
            title: c.title,
            imgUrls: c.imgUrls[0],
            desc: c.desc,
            wished:true,
            tab: app.globalData.tabnavs.find(n => n.key === c.tab).view.text,
            tags: c.tags,
            sort: index
        }))
    },
    // 上滑加载更多
    doLoadMore(){
        const nowSp = (new Date().getTime() - this._p_LastLoadingTimeStamp)/1000/60
        // 每隔1分钟可加载一次更多
        if( nowSp < 1){
            return
        }
        this.setData({ loadingProgressSignal: 10 })
        let len = 0;
        for(let art of this.data.articles){
            len += art.length
        }
        this.setData({ loadingProgressSignal: 30 })
        this._fn_LoadWish(len)
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({
                curTab: 'wish'
            })
        }
    },
})