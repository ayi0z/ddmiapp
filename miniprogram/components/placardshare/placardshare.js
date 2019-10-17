// components/placardshare/placardshare.js
Component({
    options: {
        styleIsolation: 'apply-shared'
    },
    /**
     * 组件的属性列表
     */
    properties: {
        imgsrc: String,
        title: String,
        desc: String,
        sense: Object,
        sharesignal: {
            type: Boolean,
            value: true
        }
    },
    /**
     * 组件的初始数据
     */
    data: {
        placardSrc: '',
        buildsignal: false,
        width: 0,
        height: 0,
        show: false,
        readyShare: false,
        loadingBase64: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pZFlNaWQiIGNsYXNzPSJsZHMtYmFsbDIiIHN0eWxlPSJhbmltYXRpb24tcGxheS1zdGF0ZTpydW5uaW5nO2FuaW1hdGlvbi1kZWxheTowcztiYWNrZ3JvdW5kOjAgMCI+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAtNy41KSIgc3R5bGU9ImFuaW1hdGlvbi1wbGF5LXN0YXRlOnJ1bm5pbmc7YW5pbWF0aW9uLWRlbGF5OjBzIj48Y2lyY2xlIGN4PSI1MCIgcj0iNi4xOTkiIGN5PSI0MSIgZmlsbD0iI2VjMWMyNCIgc3R5bGU9ImFuaW1hdGlvbi1wbGF5LXN0YXRlOnJ1bm5pbmc7YW5pbWF0aW9uLWRlbGF5OjBzIiB0cmFuc2Zvcm09InJvdGF0ZSg3Ny40NzggNTAgNTApIj48YW5pbWF0ZVRyYW5zZm9ybSBhdHRyaWJ1dGVOYW1lPSJ0cmFuc2Zvcm0iIHR5cGU9InJvdGF0ZSIgY2FsY01vZGU9ImxpbmVhciIgdmFsdWVzPSIwIDUwIDUwOzM2MCA1MCA1MCIga2V5VGltZXM9IjA7MSIgZHVyPSIxcyIgYmVnaW49IjBzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIvPjxhbmltYXRlIGF0dHJpYnV0ZU5hbWU9InIiIGNhbGNNb2RlPSJzcGxpbmUiIHZhbHVlcz0iMDsxNTswIiBrZXlUaW1lcz0iMDswLjU7MSIgZHVyPSIxIiBrZXlTcGxpbmVzPSIwLjIgMCAwLjggMTswLjIgMCAwLjggMSIgYmVnaW49IjBzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIvPjwvY2lyY2xlPjxjaXJjbGUgY3g9IjUwIiByPSI4LjgwMSIgY3k9IjQxIiBmaWxsPSIjZmRiZDEwIiBzdHlsZT0iYW5pbWF0aW9uLXBsYXktc3RhdGU6cnVubmluZzthbmltYXRpb24tZGVsYXk6MHMiIHRyYW5zZm9ybT0icm90YXRlKDI1Ny40NzggNTAgNTApIj48YW5pbWF0ZVRyYW5zZm9ybSBhdHRyaWJ1dGVOYW1lPSJ0cmFuc2Zvcm0iIHR5cGU9InJvdGF0ZSIgY2FsY01vZGU9ImxpbmVhciIgdmFsdWVzPSIxODAgNTAgNTA7NTQwIDUwIDUwIiBrZXlUaW1lcz0iMDsxIiBkdXI9IjFzIiBiZWdpbj0iMHMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PGFuaW1hdGUgYXR0cmlidXRlTmFtZT0iciIgY2FsY01vZGU9InNwbGluZSIgdmFsdWVzPSIxNTswOzE1IiBrZXlUaW1lcz0iMDswLjU7MSIgZHVyPSIxIiBrZXlTcGxpbmVzPSIwLjIgMCAwLjggMTswLjIgMCAwLjggMSIgYmVnaW49IjBzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIvPjwvY2lyY2xlPjwvZz48L3N2Zz4='
    },
    lifetimes: {
        created() {
            this.signature = ''
        },
        attached() {
            const sysinfo = wx.getSystemInfoSync()
            const scale = 0.8
            this.setData({
                width: sysinfo.screenWidth * scale,
                height: sysinfo.screenHeight * scale * 0.75
            })
        }
    },
    observers: {
        'sharesignal': function (e) {
            if (e) {
                const { sense, title, desc, imgsrc } = this.data
                const tsign = Array.from(`${JSON.stringify(sense)}${title}${desc}${imgsrc}`).reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0)
                if (this.signature != tsign) {
                    this.signature = tsign
                    this.setData({ show: true, readyShare: false, placardSrc: '', buildsignal: true })
                } else {
                    this.setData({ show: true })
                }
            }
        }
    },
    /**
     * 组件的方法列表
     */
    methods: {
        doPlacardBuilded(e) {
            const { errmsg, imgTempPath } = e.detail
            if (errmsg === 'ok') {
                this.setData({ placardSrc: imgTempPath, buildsignal: false })
            }
        },
        doClose() {
            this.setData({ show: false, buildsignal: false })
        },
        onPlacardLoaded() {
            if (this.data.placardSrc) {
                this.setData({ readyShare: true })
            }
        },
        doSave(e) {
            const that = this
            wx.getSetting({
                success:(res) =>{
                    if (!res.authSetting['scope.writePhotosAlbum']) {
                        wx.authorize({
                            scope: 'scope.writePhotosAlbum',
                            success() {
                                that.doSaveImgToPhotosAlbum(e)
                            },
                            fail(err) {
                                console.log('auth fail', err)
                            }
                        })
                    }else{
                        this.doSaveImgToPhotosAlbum(e)
                    }
                }
            })
        },
        doSaveImgToPhotosAlbum(e){
            wx.saveImageToPhotosAlbum({
                filePath: e.currentTarget.dataset.imgurl,
                success(res) {
                    wx.showToast({
                        title: '图片已保存至相册',
                        icon: 'success',
                        duration: 2000
                    })
                }
            })
        }
    }
})
