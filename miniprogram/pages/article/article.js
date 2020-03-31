const db = require('../../util/db.js')
const app = getApp()
Page({
    /**
     * 页面的初始数据
     */
    data: {
        currentSwiperIndex: 0,
        articles: [],
        showQrcode: false,
        isAdmin: false,
        placard: {
            sharesignal: false,
            imgsrc: '',
            title: '',
            desc: ''
        }
    },
    //滑块视图加载状态(预定4个item)
    _p_SwiperCxt: {
        closed: true,  // 上下滑动切换文章功能开关
        itemNum: 5,  // 预设5个swiper-item
        triggerItemIndex: 0, //滑动触发item，每次滑动完成时候更新
        minSort: 0 // 数据源最小序号，在初次加载数据源的时候取第一个
    },
    doSwitchImags(e){
        this.setData({ currentImgIndex: e.detail.current })
    },
    doSwitchArticle(e) {
        if (e.detail.source != 'touch') {
            return
        }
        if (this._p_SwiperCxt.closed) {
            return
        }
        if (this.data.articles.length < this._p_SwiperCxt.itemNum) {
            return
        }
        // 计算滑动的方向，用1表示向左（后/上）滑， 用-1表示向右（前/下）滑
        var diff = e.detail.current - this._p_SwiperCxt.triggerItemIndex
        // LR: 1表示向左（上/后）滑， -1表示向右（下/前）滑
        var LR = (diff == 1 || diff == -(this._p_SwiperCxt.itemNum - 1)) ? 1 : -1;

        // 检查触发item是不是第一页
        const triggerSort = this.data.articles[this._p_SwiperCxt.triggerItemIndex].sort
        // 如果是在第一页上，则不可向右（下/前）滑
        if (triggerSort <= this._p_SwiperCxt.minSort && LR == -1) {
            this.setData({
                currentSwiperIndex: this._p_SwiperCxt.triggerItemIndex
            })
            return;
        }
        // 更新触发item记录
        this._p_SwiperCxt.triggerItemIndex = e.detail.current

        // sp: 下面处理数据，根据数据序号(sort)加载数据
        // 计算预加载的数据序号
        let readySort = parseInt(e.detail.currentItemId) + (LR * 2)
        // 如果计算出的预加载数据序号小于最小序号，则停止
        if (readySort < this._p_SwiperCxt.minSort) {
            return;
        }
        // 计算出要预加载的swiper-item索引，此索引和swiper数据源下标对应
        var perSwiperItemIndex = (e.detail.current + 2 * LR + this._p_SwiperCxt.itemNum) % this._p_SwiperCxt.itemNum
        // 如果已加载的数据里序号与预加载序号相同，则不再重复加载
        if (this.data.articles[perSwiperItemIndex].sort === readySort) {
            return;
        }
        // 调用数据加载函数，执行数据加载
        this._fn_LoadArticles(readySort)
            .then((res) => {
                this.setData({
                    ["articles[" + perSwiperItemIndex + "]"]: res
                })
            })
    },
    // 文章缓存列表
    _p_CacheArticles: [],
    // 从服务器请求数据
    _fn_LoadArticles(sortidx = 0) {
        const that = this
        return new Promise((resolve, reject) => {
            // 首先从缓存列表里取数据
            let cacheArticle = that._p_CacheArticles.find(c => c.sort === sortidx)
            if (cacheArticle) {
                resolve(cacheArticle)
            } else {
                // 如果缓存列表里没有则从服务器取
                db.db_query({
                    collection: 'article',
                    where: this._p_Filter,
                    sort: { uptime: 'desc' },
                    skip: sortidx,
                    limit: 5    // 每次取5笔记录，减少请求服务器次数
                }).then(res => {
                    // 从服务器取到数据后，放入缓存列表
                    let newArticles = that._fn_DataFormatShow(res.data, (c, i) => (sortidx + i))
                    that._p_CacheArticles = that._p_CacheArticles.concat(newArticles)
                    // 检查是否取到数据
                    cacheArticle = newArticles.find(c => c.sort === sortidx)
                    if (cacheArticle) {
                        resolve(cacheArticle)
                    }
                })
            }
        })
    },
    doWish(e) {
        let { wished, id, wish } = e.currentTarget.dataset
        if (app.globalData.USERINFO._id) {
            wx.cloud.callFunction({
                name: 'wish',
                data: { wished: !wished, aid: id, uid: app.globalData.USERINFO._id }
            }).then(res => {
                if (res.result.stats) {
                    app.globalData.USERINFO.wish = res.result.wish
                    const cacheIdx = this._p_CacheArticles.findIndex(c => c._id === id)
                    if (cacheIdx > -1) {
                        let nwish = wished ? wish - 1 : wish + 1
                        nwish = nwish < 0 ? 0 : nwish
                        this._p_CacheArticles[cacheIdx].wish = nwish
                        this._p_CacheArticles[cacheIdx].wishtxt = app._Fn_FormatNumber(nwish || 0)
                        this._p_CacheArticles[cacheIdx].wished = !wished

                        const itemIdx = this.data.articles.findIndex(c => c._id === id)
                        this.setData({
                            ["articles[" + itemIdx + "]"]: this._p_CacheArticles[cacheIdx]
                        })
                    }
                }
            }).catch(console.error)
        }
    },
    doChat() {
        this.setData({ showQrcode: !this.data.showQrcode })
    },
    doEdit(e) {
        wx.navigateTo({
            url: `/pages/cms/write/write?id=${e.currentTarget.dataset.id}`
        })
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        const that = this
        if (options.f === 'topbanner'
            || options.f === 'wished') {
            db.db_query_doc('article', options.id)
                .then(res => {
                    this._p_CacheArticles = this._fn_DataFormatShow([res.data], (c, i) => (options.sort || 0))
                    this.setData({
                        articles: this._p_CacheArticles
                    })
                })
        }
        if (options.f === 'share') {
            db.db_query_doc('article', { id: options.id })
            .then(res => {
                this._p_CacheArticles = this._fn_DataFormatShow(res.data, (c, i) => (options.sort || 0))
                this.setData({
                    articles: this._p_CacheArticles
                })
            })
        }
        if (options.f === 'tabpage') {
            this._p_Filter = { tab: options.tab }
            let sort = parseInt(options.sort)
            let startSort = sort < 5 ? 0 : sort - 5
            db.db_query({
                collection: 'article',
                where: { tab: options.tab },
                sort: { uptime: 'desc' },
                skip: startSort,
                limit: startSort + 7
            }).then(res => {
                this._p_CacheArticles = this._fn_DataFormatShow(res.data, (c, i) => (startSort + i))
                // 传入数据在取出的列表中的坐标
                const curIndex = this._p_CacheArticles.findIndex(c => c._id === options.id)
                if (curIndex > -1) {
                    // 计算首发数据的下标范围a,b
                    let a = curIndex - 2, b = curIndex + 2, L = this._p_CacheArticles.length - 1
                    if (a < 0) {
                        b = b - a
                        a = 0
                        b = b > L ? L : b
                    }
                    if (b > L) {
                        a = a + L - b
                        b = L
                        a = a < 0 ? 0 : a
                    }
                    // 过滤出首发数据
                    const sar = this._p_CacheArticles.filter((c, index) => index >= a && index <= b)
                    this.setData({
                        articles: sar,
                        currentSwiperIndex: sar.findIndex(c => c._id === options.id) // 传入数据所在的swiper坐标
                    })
                    this._p_SwiperCxt.triggerItemIndex = this.data.currentSwiperIndex
                }
            })
        }
        if (options.f === 'wishrank') {
            this._p_SwiperCxt.closed = true
            wx.getStorage({
                key: 'wishrank',
                success(res) {
                    that._p_CacheArticles = that._fn_DataFormatShow(res.data, (c, i) => (i))
                    that.setData({
                        articles: that._p_CacheArticles,
                        currentSwiperIndex: res.data.findIndex(c => c._id === options.id)
                    })
                }
            })
        }
    },
    _fn_DataFormatShow(data, fn_sort) {
        return data.map((c, index) => ({
            _id: c._id,
            id: c.id,
            desc: c.desc,
            imgUrls: c.imgUrls,
            tags: c.tags,
            title: c.title,
            wish: c.wish || 0,
            wishtxt: app._Fn_FormatNumber(c.wish || 0),
            wished: app.globalData.USERINFO.wish.includes(c._id),
            sort: fn_sort(c, index)
        }))
    },
    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        this.setData({
            isAdmin: app.globalData.UserIsAdmin || false
        })
    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {
        // 页面卸载时候，主动清理缓存
        this._p_CacheArticles = []
    },

    doShare(e) {
        const { id, title, desc, imgUrls } = e.currentTarget.dataset.item
        const imgindex = e.currentTarget.dataset.imgindex || 0
        this.setData({ 
            placard: { 
                imgsrc: imgUrls[imgindex], 
                title, 
                desc, 
                sense:{
                    id:id,
                    path: 'pages/article/article'
                }, 
                sharesignal: true 
            } 
        })
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function (e) {
        if (e.from === 'button') {
            return {
                title: `${e.target.dataset.title} ${e.target.dataset.desc}`,
                path: `/pages/article/article?id=${e.target.dataset.id}&f=share`,
                imageUrl: e.target.dataset.imgurl
            }
        }
    }
})