const app = getApp()
Component({
    options: {
        styleIsolation: 'apply-shared'
    },
    /**
     * 组件的属性列表
     */
    properties: {

    },

    /**
     * 组件的初始数据
     */
    data: {
        curTab: 'index',
        isAdmin:false,
        openCmenu:false
    },

    lifetimes: {
        created(){
            this._p_router = {
                index: '/pages/index/index',
                wish: '/pages/wish/wish',
                wishrank: '/pages/wishrank/wishrank',
                notice: '/pages/notice/notice',
                cmsnotice: '/pages/cms/placard/placard',
                cmsarticle: '/pages/cms/write/write',
                cmsprofile: '/pages/cms/profile/profile'
            }
            app.callback_TabBar_IsAdmin = res => {
                this.setData({
                    isAdmin: res.USERINFO.role === 1
                })
            }
        },
        attached() {
            this.setData({
                isAdmin: app.globalData.UserIsAdmin || false
            })
        }
    },
    /**
     * 组件的方法列表
     */
    methods: {
        doSwitchTab(e) {
            const newtab = e.currentTarget.dataset.tab
            if (this.data.curTab != newtab) {
                this.setData({ curTab: newtab, openCmenu:false })
                wx.switchTab({ url: this._p_router[newtab] });
            }else if(this.data.openCmenu){
                this.setData({openCmenu:false})
            }
        },
        doOpenCmenu() {
            this.setData({openCmenu:!this.data.openCmenu})
        },
        doTapCmenu(e) {
            this.setData({openCmenu:false})
            wx.navigateTo({ url: this._p_router[e.currentTarget.dataset.tab] });
        },
        doCloseCmenu(){
            this.setData({openCmenu:false})
        }
    }
})
