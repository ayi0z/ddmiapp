// miniprogram/pages/index/index.js
const app = getApp()
const db = require('../../util/db.js')
Page({
    /**
     * 页面的初始数据
     */
    data: {
        tabNavs: app.globalData.tabnavs.map(c => ({ key: c.key, ...c.view })),
        loadingProgressSignal: 0,
        topBanners: [],
        navbarClass: '',
        navbarHiddenClass: 'navbar-hidden',
        tabScrollLeft: 0,
        tabCurKey: app.globalData.tabnavs[0].key,
        articles: []
    },
    _p_PageScrollTop: 157,
    _p_ArticlesPageIndex: 0,
    _p_PerLoadLimit: 20,
    doTabSwitch: function (e) {
        if (this.data.tabCurKey != e.currentTarget.dataset.tabkey) {
            this.setData({
                tabCurKey: e.currentTarget.dataset.tabkey,
                tabScrollLeft: (e.currentTarget.dataset.index - 1) * 60,
                articles: [],
                loadingProgressSignal: 10
            });
            if (this.data.navbarClass === 'navbar-fixed') {
                wx.pageScrollTo({ scrollTop: this._p_PageScrollTop })
            }
            this._p_ArticlesPageIndex = 0
            this._fn_LoadArticles(this.data.tabCurKey)
        }
    },
    // 加载article
    _fn_LoadArticles(tidx) {
        var that = this
        var pidx = this._p_ArticlesPageIndex
        let where = [{ tab: tidx }]
        if(this._p_SearchFilter){
            let search_strs = this._p_SearchFilter.split(' ').filter(c=>c).reduce((t,n)=>(t+'.*'+n))
            if(search_strs){
                const re = db.db.RegExp({ regexp: `^.*${search_strs}.*$`, options: 'ims' })
                where.push(db._.or([ {title: re}, {desc: re} ]))
            }
        }
        db.db_query({
            collection: 'article',
            sort: { uptime: 'desc' },
            where: where,
            limit: that._p_PerLoadLimit,
            skip: pidx * that._p_PerLoadLimit
        }).then((res) => {
            this.setData({ loadingProgressSignal: 80 })
            let artdata = res.data.map((c, index) => ({
                _id: c._id,
                url: c.imgUrls[0],
                type: 'img',
                title: c.title,
                desc: c.desc,
                wish: c.whish || 0,
                wishtxt: app._Fn_FormatNumber(c.wish || 0),
                sort: pidx * that._p_PerLoadLimit + index
            }))
            if (artdata.length > 0) {
                var long = 0, short = 1
                if (that.data.articles[0]) {
                    var _pidx = (pidx - 1) < 0 ? 0 : (pidx - 1)
                    long = that.data.articles[0][_pidx].length >= that.data.articles[1][_pidx] ? 0 : 1
                    short = 1 - long;
                }
                that.setData({
                    ['articles[' + long + '][' + pidx + ']']: artdata.filter(c => c.sort % 2 === 0),
                    ['articles[' + short + '][' + pidx + ']']: artdata.filter(c => c.sort % 2 === 1),
                    loadingProgressSignal: 100
                });
                if (tidx === app.globalData.tabnavs[0].key && pidx === 0) {
                    wx.setStorage({ key: tidx + '_0', data: artdata })
                }
            } else {
                that._p_ArticlesPageIndex--
                this.setData({ loadingProgressSignal: 100 })
            }
        }).catch((err) => {
            this.setData({ loadingProgressSignal: 100 })
            console.error("从云端读取数据失败：", err, { collection, where: { tab: tidx }, orderby: { uptime: 'desc' }, pageIndex: pidx, pageSize: that._p_PerLoadLimit })
        });
    },
    doViewArticle: function (e) {
        wx.navigateTo({
            url: `/pages/article/article?id=${e.currentTarget.dataset.id}&sort=${e.currentTarget.dataset.sort}&tab=${this.data.tabCurKey}&f=tabpage`
        });
    },
    _p_SearchFilter: undefined,
    doSearch(e) {
        const kw = e.detail.value.trim()
        if (this._p_SearchFilter != kw) {
            this.setData({ articles: [], loadingProgressSignal: 10 })
            this._p_SearchFilter = kw
            this._p_ArticlesPageIndex = 0
            this._fn_LoadArticles(this.data.tabCurKey)
        }
    },
    // doAuthReject() {
    //     this.setData({ authing: '' })
    // },
    // doAuthConfirm(e) {
    //     this.setData({ authing: '' })
    //     console.log(e)
    // },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this.setData({ loadingProgressSignal: 20 })
        this._fn_Init_LoadArticles()
    },
    _fn_Init_LoadArticles() {
        const that = this
        // 首先从缓存加载数据
        const data = wx.getStorageSync(that.data.tabCurKey + '_0')
        if (data) {
            this.setData({
                ['articles[0][0]']: data.filter(c => c.sort % 2 === 0),
                ['articles[1][0]']: data.filter(c => c.sort % 2 === 1),
                loadingProgressSignal: 30
            });
        }
        // 加载今日新数据
        this._fn_LoadArticles(this.data.tabCurKey)
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
                curTab: 'index'
            })
        }
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    // /**
    //  * 页面相关事件处理函数--监听用户下拉动作
    //  */
    // onPullDownRefresh: function () {
    //     wx.stopPullDownRefresh()
    // },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        this._p_ArticlesPageIndex++
        this._fn_LoadArticles(this.data.tabCurKey)
    },

    onPageScroll: function (e) {
        if (e.scrollTop >= this._p_PageScrollTop && this.data.navbarClass != 'navbar-fixed') {
            this.setData({
                navbarClass: 'navbar-fixed',
                navbarHiddenClass: ''
            });
        } else if (e.scrollTop < this._p_PageScrollTop && this.data.navbarClass != '') {
            this.setData({
                navbarClass: '',
                navbarHiddenClass: 'navbar-hidden'
            });
        }
    }
})