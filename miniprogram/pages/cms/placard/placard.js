const db = require('../../../util/db.js')
const ImgBed = require('../../../util/imgbed.js')
const app = getApp()
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		loadingProgressSignal: 0,
		recomdImgUrl: '',
		formats: {},
		bottom: 0,
		_focus: false,
		tipStart:false,
		tipText:'操作完成'
	},
	onEditorReady() {
		const that = this
		wx.createSelectorQuery().select('#editor')
			.context(function (res) {
				that.editorCtx = res.context
				if (that._p_Options_Id) {
					var results = db.dbh_query_doc_withrecomd('placard', that._p_Options_Id)
					app._Fn_GeneratorPromiseNext(results, (res) => {
						if (res.done) {
							const { progress, data, recomd } = res.value
							that._p_EditingPlacard = data
							if (that._p_EditingPlacard) {
								that.editorCtx.setContents({ delta: that._p_EditingPlacard.delta })
								that._p_EditingRecomd = recomd || {}
								that.setData({
									title: data ? data.title : '',
									recomdImgUrl: that._p_EditingRecomd.imgurl || '',
									loadingProgressSignal: progress
								})
							} else {
								that.setData({ loadingProgressSignal: res.value.progress })
							}
						} else {
							that.setData({ loadingProgressSignal: res.value.progress })
						}
					})
				}
			}).exec()
	},
	onStatusChange(e) {
		const formats = e.detail
		this.setData({ formats })
	},
	onEditorBlur(e){
		wx.pageScrollTo({ scrollTop: 0, duration: 300 })
	},
	doFormat(e) {
		let { name, value } = e.target.dataset
		if (!name) return
		this.editorCtx.format(name, value)
	},
	doUndo() {
		this.editorCtx.undo()
	},
	doRedo() {
		this.editorCtx.redo()
	},
	doInsertDivider() {
		this.editorCtx.insertDivider()
	},
	doClear() {
		this.editorCtx.clear()
	},
	doRemoveFormat() {
		this.editorCtx.removeFormat()
	},
	doInsertImage() {
		const that = this
		wx.chooseImage({
			count: 1,
			success: function (res) {
				const tmppath = res.tempFilePaths[0]
				if (tmppath) {
					that.setData({ loadingProgressSignal: 10 })
					ImgBed.upload[app.globalData.ImgBedKey]([tmppath])
						.then(upres => {
							const res = upres[0]
							if (res && res.code === 'success') {
								that.editorCtx.insertImage({
									src: res.data.url,
									alt: res.data.url,
									complete(ee) {
										that._fn_Tip('图片成功')
									}
								})
							}
						}).catch((err) => {
							console.error(err)
							that._fn_Tip('图片上传失败')
						})
				}
			}
		})
	},
	doFormSubmit(e) {
		if (!e.detail.value.title) {
			return
		}
		const that = this
		this.setData({ loadingProgressSignal: 10 })
		this.editorCtx.getContents({
			success(res) {
				that._p_EditingPlacard.title = e.detail.value.title
				that._p_EditingPlacard.delta = res.delta
				that._p_EditingPlacard.html = res.html
				that._p_EditingPlacard.text = res.text
				that._p_EditingPlacard.imgs = that._fn_RegImg(res.html)
				that._p_EditingPlacard.date = new Date().toLocaleDateString()
				that._p_EditingPlacard.reader = []
				that.setData({ loadingProgressSignal: 20 })
				db.db_set('placard', that._p_EditingPlacard)
					.then(res => {
						that._p_EditingPlacard._id = that._p_EditingPlacard._id || res._id
						that.setData({ loadingProgressSignal: 60 })
						that._p_EditingRecomd.lid = that._p_EditingPlacard._id
						that._p_EditingRecomd.key = 'placard'
						that._p_EditingRecomd.imgurl = that.data.recomdImgUrl
						that._fn_SaveRecomd(that._p_EditingRecomd)
					}).catch(err=>{
						console.error(err)
						that._fn_Tip('数据保持失败')
					})
			}
		})
	},
	doFormReset(e) {
		this._p_EditingPlacard = {}
		this._p_EditingRecomd = {}
		this.editorCtx.clear()
		this.setData({ recomdImgUrl: '' })
	},
	_fn_Tip(text){
		this.setData({ tipStart: true, tipText:text, loadingProgressSignal: 100 })
	},
	_fn_RegImg(html) {
		let srcs = []
		const regImg = /<img.*?(?:>|\/>)/gi
		const regSrc = /src=[\'\"]?([^\'\"]*)[\'\"]?/i
		const imgs = html.match(regImg)
		if (imgs) {
			for (const img of imgs) {
				const src = img.match(regSrc)
				if (src && src[1]) {
					srcs.push(src[1])
				}
			}

		}
		return srcs
	},
	_p_EditingRecomd: {},
	_p_EditingPlacard: {},
	doRecomdImgUrlsSync(e) {
		this.setData({ recomdImgUrl: e.detail[0] || '' })
	},// 上传recomd到服务器
	_fn_SaveRecomd(data) {
		if (data.imgurl) {
			if (app._Fn_IsTmpFile(data.imgurl)) {
				ImgBed.upload[app.globalData.ImgBedKey]([data.imgurl])
					.then(upres => {
						if (upres[0] && upres[0].code === 'success') {
							data.imgurl = upres[0].data.url
							db.db_set('recomd', data)
								.then(res => {
									this._p_EditingRecomd._id = this._p_EditingRecomd._id || res._id
									this._fn_Tip('数据保存成功，已成功推荐')
								}).catch(err => {
									console.error(err)
									this._fn_Tip('数据保存成功，推荐失败')
								})
						} else {
							this._fn_Tip('数据保存成功，推荐封面上传失败')
						}
					}).catch((err) => {
						console.error(err)
						this._fn_Tip('数据保存成功，推荐封面上传失败')
					})
			} else {
				this._fn_Tip('数据保存成功')
			}
		} else if (data._id) {
			// 删除
			db.db_remove_doc('recomd', data._id)
				.then(res => {
					this._fn_Tip('数据保存成功，已取消推荐')
				}).catch(err => {
					console.error(err)
					this._fn_Tip('数据保存成功，推荐无法取消')
				})
		} else {
			this._fn_Tip('数据保存成功')
		}
	},
	_p_Options_Id: undefined,
	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {
		this._p_Options_Id = options.id
	},
})