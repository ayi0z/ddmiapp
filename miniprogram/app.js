//app.js
App({
    onLaunch: function () {
        if (!wx.cloud) {
            console.error('请使用 2.2.3 或以上的基础库以使用云能力')
        } else {
            wx.cloud.init({
                traceUser: true,
            })
        }
        const that = this
        const userinfo = wx.getStorageSync('userinfo')
        if (userinfo) {
            that.globalData.OPENID = userinfo.OPENID
            that.globalData.APPID = userinfo.APPID
            that.globalData.USERINFO = userinfo.USERINFO
            that.globalData.UserIsAdmin = userinfo.USERINFO.role === 1    // role：0普通用户，1管理员
        }
        wx.cloud.callFunction({
            name: 'login'
        }).then(res => {
            that.globalData.OPENID = res.result.OPENID
            that.globalData.APPID = res.result.APPID
            that.globalData.USERINFO = res.result.USERINFO
            that.globalData.UserIsAdmin = res.result.USERINFO.role === 1    // role：0普通用户，1管理员
            if (that.callback_Index_UserInfo_Wish) {
                that.callback_Index_UserInfo_Wish(res.result)
            }
            if (that.callback_TabBar_IsAdmin) {
                that.callback_TabBar_IsAdmin(res.result)
            }
            wx.setStorage({
                key: 'userinfo',
                data: {
                    OPENID: res.result.OPENID,
                    APPID: res.result.APPID,
                    USERINFO: res.result.USERINFO
                }
            })
        })

        wx.getSystemInfo({
            success: e => {
                this.globalData.StatusBar = e.statusBarHeight;
                let custom = wx.getMenuButtonBoundingClientRect();
                this.globalData.Custom = custom;
                this.globalData.CustomBar = custom.bottom + custom.top - e.statusBarHeight;
            }
        })
        // 创建临时目录
        const fs = wx.getFileSystemManager()
        fs.stat({
            path: that.globalData.ShareFolder,
            fail(res) {
                fs.mkdir({
                    dirPath: that.globalData.ShareFolder,
                    recursive: true
                })
            }
        })
    },
    _Fn_IsTmpFile(url) {
        return url.startsWith('wxfile://tmp') || url.startsWith('http://tmp/')
    },
    _Fn_FormatNumber(num) {
        if (num > 10000) {
            return (num / 10000).toFixed(1) + 'w'
        }
        return num
    },
    _Fn_GeneratorPromiseNext(gen, fun) {
        gen.next().then(res => {
            if (fun) {
                fun(res)
            }
            if (!res.done) {
                this._Fn_GeneratorPromiseNext(gen, fun)
            }
        })
    },
    globalData: {
        ShareFolder: `${wx.env.USER_DATA_PATH}` + '/share/qrcode',
        NowDate: new Date().getDate(),
        ImgBedKey: 'picp',
        ImgBedDownload: 'https://picp.bsswhg.com/download.php?url=',
        USERINFO: {
            wish: []
        },
        tagList: [{ tag: '面霜' }, { tag: '保湿' }, { tag: '美白' }, { tag: '外用' }, { tag: '淑女' }, { tag: '时尚' }],
        tabnavs: [
            {
                key: 'tab01',
                queryArgs: {
                    collection: 'article',
                    where: {},
                    orderby: {}
                },
                view: {
                    icon: 'footprint',
                    color: 'red',
                    text: '精致护肤'
                }
            }, {
                key: 'tab02',
                queryArgs: {
                    collection: '',
                    where: {},
                    orderby: {}
                },
                view: {
                    icon: 'discover',
                    color: 'red',
                    text: '丽人美妆'
                }
            }, {
                key: 'tab03',
                queryArgs: {
                    collection: '',
                    where: {},
                    orderby: {}
                },
                view: {
                    icon: 'friendfavor',
                    color: 'red',
                    text: '时尚装备',
                }
            }, {
                key: 'tab04',
                queryArgs: {
                    collection: '',
                    where: {},
                    orderby: {}
                },
                view: {
                    icon: 'magic',
                    color: 'red',
                    text: '家居日用',
                }
            }, {
                key: 'tab05',
                queryArgs: {
                    collection: '',
                    where: {},
                    orderby: {}
                },
                view: {
                    icon: 'evaluate',
                    color: 'red',
                    text: '猜你喜欢',
                }
            }, {
                key: 'tab06',
                queryArgs: {
                    collection: '',
                    where: {},
                    orderby: {}
                },
                view: {
                    icon: 'like',
                    color: 'red',
                    text: '种草套装',
                }
            }
        ]
    }
})
