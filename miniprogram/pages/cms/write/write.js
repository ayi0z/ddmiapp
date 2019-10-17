const app = getApp()
const db = require('../../../util/db.js')
const ImgBed = require('../../../util/imgbed.js')

Page({

    /**
     * 页面的初始数据
     */
    data: {
        loadingProgressSignal: 0,
        imgUrls: [],
        title: '',
        desc: '',
        tab: app.globalData.tabnavs[0].key,
        tagsList: app.globalData.tagList.map(c => ({ ...c })),
        tabnavs: app.globalData.tabnavs.map(c => ({ key: c.key, icon: c.view.icon, text: c.view.text })),
        isSubmitting: false,
        stepIndex: -1,
        recomdImgUrl: ''
    },
    doTabChange(e) {
        if (this.data.tab != e.detail.value) {
            this.setData({ tab: e.detail.value })
        }
    },
    doTagCheck(e) {
        var checked = e.detail.value
        var changed = {}
        for (var i = 0; i < this.data.tagsList.length; i++) {
            if (checked.indexOf(this.data.tagsList[i].tag) !== -1) {
                changed['tagsList[' + i + '].checked'] = true
            } else {
                changed['tagsList[' + i + '].checked'] = false
            }
        }
        this.setData(changed)
    },
    doEdit() {
        this.setData({ isSubmitting: false, stepIndex: -1 })
    },
    doFormReset(e) {
        this.setData({
            imgUrls: [],
            recomdImgUrl: '',
            stepIndex: -1,
            isSubmitting: false,
            tab: app.globalData.tabnavs[0].key,
            tagsList: app.globalData.tagList.map(c => ({ ...c }))
        })
        this._p_EditingArticle = {}
    },
    doFormSubmit: function (e) {
        if (this.data.imgUrls.length === 0) {
            return false
        }
        this.setData({ isSubmitting: true, stepIndex: 0 })

        let article = {
            ...this._p_EditingArticle,
            ...e.detail.value,
            imgUrls: this.data.imgUrls.filter(c => (!app._Fn_IsTmpFile(c)))
        }
        // 上传图片到图床
        ImgBed.upload[app.globalData.ImgBedKey](this.data.imgUrls.filter(c => (app._Fn_IsTmpFile(c))))
            .then(upres => {
                let newUploadedImgs = []
                for (let res of upres) {
                    if (res.code === 'success') {
                        newUploadedImgs.push(res.data.url)
                    } else {
                        break
                    }
                }
                this._fn_UpdateSaveProcess(newUploadedImgs.length === upres.length)
                // 如果所有图片都上传成功，则提交数据到服务器
                if (this.data.stepIndex === 1) {
                    article.imgUrls = article.imgUrls.concat(newUploadedImgs)
                    this._fn_SaveArticle(article)
                }
            }).catch((err) => {
                console.error(err)
                this._fn_UpdateSaveProcess(false)
            })
    },
    // 上传article到服务器
    async _fn_SaveArticle(article) {
        let lid = undefined
        delete article._openid
        if (article._id) {
            await db.db_update_doc('article', article)
                .then(res => {
                    lid = article._id
                    this._fn_UpdateSaveProcess(true)
                })
                .catch(err => {
                    console.error(err)
                    this._fn_UpdateSaveProcess(false)
                })
        } else {
            await db.db_add('article', article)
                .then(res => {
                    lid = res._id
                    this._p_EditingArticle._id = res._id
                    this._fn_UpdateSaveProcess(true)
                })
                .catch(err => {
                    console.error(err)
                    this._fn_UpdateSaveProcess(false)
                })
        }
        if (lid) {
            this._p_EditingRecomd.lid = lid
            this._p_EditingRecomd.key = this._p_RecomdKey
            this._p_EditingRecomd.imgurl = this.data.recomdImgUrl
            this._fn_SaveRecomd()
        }
    },
    // 上传recomd到服务器
    _fn_SaveRecomd() {
        if (this._p_EditingRecomd.imgurl) {
            if (app._Fn_IsTmpFile(this._p_EditingRecomd.imgurl)) {
                ImgBed.upload[app.globalData.ImgBedKey]([this._p_EditingRecomd.imgurl])
                    .then(upres => {
                        if (upres[0].code === 'success') {
                            this._p_EditingRecomd.imgurl = upres[0].data.url
                            if (this._p_EditingRecomd._id) {
                                // 更新
                                db.db_update_doc('recomd', this._p_EditingRecomd)
                                    .then(res => {
                                        this._fn_UpdateSaveProcess(true)
                                    })
                                    .catch(err => {
                                        console.error(err)
                                        this._fn_UpdateSaveProcess(false)
                                    })
                            }
                            else {
                                // 增加
                                db.db_add('recomd', this._p_EditingRecomd)
                                    .then(res => {
                                        this._fn_UpdateSaveProcess(true)
                                    })
                                    .catch(err => {
                                        console.error(err)
                                        this._fn_UpdateSaveProcess(false)
                                    })
                            }
                        } else {
                            this._fn_UpdateSaveProcess(false)
                        }
                    }).catch((err) => {
                        console.error(err)
                        this._fn_UpdateSaveProcess(false)
                    })
            } else {
                this._fn_UpdateSaveProcess(true)
            }
        } else if (this._p_EditingRecomd._id) {
            // 删除
            db.db_remove_doc('recomd', this._p_EditingRecomd._id)
                .then(res => {
                    this._fn_UpdateSaveProcess(true)
                })
                .catch(err => {
                    console.error(err)
                    this._fn_UpdateSaveProcess(false)
                })
        } else {
            this._fn_UpdateSaveProcess(true)
        }
    },
    _fn_UpdateSaveProcess(res) {
        let stp = res ? 1 : 0.5
        this.setData({ stepIndex: this.data.stepIndex + stp })
    },
    doImgUrlsSync(e) {
        this.setData({
            imgUrls: e.detail
        })
    },
    doRecomdImgUrlsSync(e) {
        this.setData({
            recomdImgUrl: e.detail[0] || ''
        })
    },
    _p_EditingArticle: {},
    _p_EditingRecomd: {},
    _p_RecomdKey: 'article',
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        if (options.id) {
            this.setData({ loadingProgressSignal: 10 })
            db.db_query_doc('article', options.id)
                .then(res => {
                    this.setData({ loadingProgressSignal: 40 })
                    this._p_EditingArticle = res.data
                    let artData = {
                        imgUrls: res.data.imgUrls,
                        title: res.data.title,
                        desc: res.data.desc,
                        tab: res.data.tab,
                        tagsList: app.globalData.tagList.map(c => {
                            if (res.data.tags.includes(c.tag)) {
                                return { ...c, checked: true }
                            } else {
                                return { ...c }
                            }
                        }),
                        loadingProgressSignal:100
                    }
                    if (this._p_EditingArticle._id) {
                        this.setData({ loadingProgressSignal: 80 })
                        db.db_query_doc("recomd", { key: this._p_RecomdKey, lid: this._p_EditingArticle._id })
                            .then(res => {
                                this._p_EditingRecomd = res.data[0] || {}
                                this.setData({ 
                                    ...artData,
                                    recomdImgUrl: this._p_EditingRecomd.imgurl || ''
                                })
                            })
                            .catch(err => {
                                console.error(err)
                                this.setData(artData)
                            })
                    }else{
                        this.setData(artData)
                    }
                }).catch(err => {
                    console.error(err)
                    this.setData({ loadingProgressSignal: 100 })
                })
        }
    }
})