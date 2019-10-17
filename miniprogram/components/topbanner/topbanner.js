const db = require('../../util/db.js')
Component({
    options: {
        styleIsolation: 'apply-shared'
    },
    /**
     * 组件的属性列表
     */
    properties: {

    },
    lifetimes: {
        attached() {
            const that = this
            // 首先尝试从本地缓存取数据
            const data = wx.getStorageSync('topbanner')
            if(data){
                that.setData({ topBanners: data })
            }
            // 从数据库获取最新的topbanner 然后更新
            db.db_query({
                collection: 'recomd',
                limit: 5,
                sort: { uptime: 'desc' }
            }).then(res => {
                const topbanner = res.data.filter(c => ({ key: c.key, lid: c.lid, imgurl: c.imgurl }))
                that.setData({ topBanners: topbanner })
                wx.setStorage({ key: 'topbanner', data: topbanner })
            }).catch(err => {
                console.error(err)
            })
        }
    },
    /**
     * 组件的初始数据
     */
    data: {
        topBanners: []
    },

    /**
     * 组件的方法列表
     */
    methods: {
        doViewBanner(e) {
            const {key, lid} = e.currentTarget.dataset
            if (key === 'article') {
                wx.navigateTo({
                    url: `/pages/article/article?id=${lid}&f=topbanner`
                });
            }else if(key === 'placard'){
                wx.navigateTo({
                    url: `/pages/notice/view?id=${lid}&f=topbanner`
                });
            }
        }
    }
})
