const app = getApp()
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
        buildsignal: {
            type: Boolean,
            value: false
        },
        showLoading: {
            type: Boolean,
            value: false
        }
    },

    /**
     * 组件的初始数据
     */
    data: {
        canvasWidth: 0,
        canvasHeight: 0,
        canvasLeft: 0
    },
    lifetimes: {
        created() {
            this.isbuilding = false
            this.canvasHeightScaleRatio = 0.75
        }
    },
    observers: {
        'buildsignal': function (e) {
            if (e) {
                if (!this.isbuilding) {
                    this._Run()
                }
            }
        }
    },
    /**
     * 组件的方法列表
     */
    methods: {
        _Ready() {
            const sysinfo = wx.getSystemInfoSync()
            this.screenDpr = sysinfo.pixelRatio
            this.screenWidth = sysinfo.screenWidth
            this.screenHeight = sysinfo.screenHeight * this.canvasHeightScaleRatio
            this.screenAR = this.screenWidth / this.screenHeight
            this.setData({ canvasLeft: this.screenWidth })  // 将canvase移出视界
        },
        _Run() {
            if (this.isbuilding) return
            if (!this.data.imgsrc) return
            if (this.data.showLoading) {
                wx.showLoading({
                    title: '正在绘制海报',
                    mask: true
                })
            }
            this.isbuilding = true
            const ctx = wx.createCanvasContext('piccanvas', this)
            const that = this

            function getImageInfo(src) {
                return new Promise((resolve, reject) => {
                    wx.getImageInfo({
                        src: src,
                        success: function (res) { resolve(res) },
                        fail: function (res) { reject(res) }
                    })
                })
            }

            const imgsrc = `${app.globalData.ImgBedDownload}${that.data.imgsrc}`
            getImageInfo(imgsrc)
                .then(res => {
                    that._Ready()
                    ctx.save()
                    const imgWidth = res.width,
                        imgHeight = res.height,
                        imgPath = res.path
                    // 剪裁并绘制图片到画布
                    const cutWidth = imgWidth   // 图片剪裁宽度 == 图片原本宽度
                    let cutHeight = cutWidth / that.screenAR  // 根据屏幕宽高比计算出图片的等比例剪裁高度
                    cutHeight = cutHeight * 3 / 4  // 预定图片最大高度为屏幕的3/5
                    cutHeight = cutHeight > imgHeight ? imgHeight : cutHeight    // 修正绘制高度，如果绘制高度高于图片原本高度，则绘制出图片原本高度
                    // 计算画布尺寸, 和图片的绘制高度
                    let canvasWidth = cutWidth,
                        canvasHeight = that.screenHeight / that.screenWidth * canvasWidth,
                        imgDrawHeight = cutHeight
                    // 修正画布尺寸， 如果原图小于屏幕尺寸，则放大以提高图片质量
                    if (canvasWidth <= that.screenWidth) {
                        canvasWidth = canvasWidth * that.screenDpr
                        canvasHeight = canvasHeight * that.screenDpr
                        imgDrawHeight = imgDrawHeight * that.screenDpr
                    }

                    // 绘制背景
                    ctx.fillStyle = 'white'
                    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
                    // 绘制图像
                    ctx.drawImage(imgPath, 0, 0, cutWidth, cutHeight, 0, 0, canvasWidth, imgDrawHeight)
                    // 设置画布尺寸
                    that.setData({ canvasWidth, canvasHeight })
                    // 画布与屏幕比例
                    const canvasScreenRatio = canvasWidth / that.screenWidth

                    // 绘制十字线
                    const qrCanvasWidth = 100 * canvasScreenRatio   // 二维码区域宽度
                    const lineOffset = 10 * canvasScreenRatio,  // 十字线纵线右测偏移量（padding）
                        lineVX = canvasWidth - qrCanvasWidth - lineOffset
                    ctx.strokeStyle = 'white'
                    ctx.shadowColor = 'black'
                    ctx.shadowOffsetX = -10
                    ctx.shadowOffsetY = -10
                    ctx.moveTo(lineVX, imgDrawHeight - 20 * canvasScreenRatio)
                    ctx.lineTo(lineVX, imgDrawHeight + 80 * canvasScreenRatio)
                    ctx.stroke()
                    ctx.moveTo(lineVX - 60 * canvasScreenRatio, imgDrawHeight)
                    ctx.lineTo(lineVX + 30 * canvasScreenRatio, imgDrawHeight)
                    ctx.stroke()

                    // 绘制文字
                    ctx.restore()
                    // 设置文本的基础边距和字体大小
                    const basePaddingX = 10, basePaddingY = 20, baseFontSize = 14
                    // 根据画布和屏幕比，设置文本边距、坐标和字体大小
                    const paddingX = basePaddingX * canvasScreenRatio,
                        paddingY = basePaddingY * canvasScreenRatio,
                        textFontSize = baseFontSize * canvasScreenRatio

                    // 绘制标题
                    if (that.data.title) {
                        const titleX = paddingX,
                            titleCanvasWidth = canvasWidth - titleX - paddingX
                        const titleLines = that._fn_CtxTextWrap(ctx, that.data.title, textFontSize, titleCanvasWidth)
                        ctx.fillStyle = 'white'
                        ctx.shadowColor = 'black'
                        ctx.shadowBlur = 2
                        let textY = imgDrawHeight - titleLines.height + 10 * canvasScreenRatio
                        for (const line of titleLines.lines) {
                            ctx.fillText(line.text, titleX, textY)
                            textY = textY + line.lineheight
                        }
                    }

                    // 绘制描述
                    if (that.data.desc) {
                        ctx.fillStyle = 'black'
                        ctx.shadowColor = 'white'
                        ctx.shadowBlur = 2
                        let textY = imgDrawHeight + paddingY
                        const canvasTextWidth = lineVX - paddingX * 2,
                            canvasTextHeight = canvasHeight - imgDrawHeight
                        const descLines = that._fn_CtxTextWrap(ctx, that.data.desc, textFontSize * 0.9, canvasTextWidth, canvasTextHeight)
                        for (const line of descLines.lines) {
                            ctx.fillText(line.text, paddingX, textY)
                            textY = textY + line.lineheight
                        }
                    }

                    // 绘制二维码
                    ctx.restore()
                    let qr_name = Array.from(JSON.stringify(that.data.sense)).reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0)
                    qr_name = `${app.globalData.ShareFolder}/qr${qr_name}.jpg`
                    getImageInfo(qr_name)
                        .then(res => { drawQrCode(res) })
                        .catch(res => {
                            wx.cloud.callFunction({
                                name: 'qrcode',
                                data: that.data.sense
                            }).then(res => {
                                const fs = wx.getFileSystemManager()
                                fs.writeFile({
                                    filePath: qr_name,
                                    data: res.result.buffer,
                                    encoding: 'binary',
                                    success(res) {
                                        // 绘制二维码
                                        getImageInfo(qr_name)
                                            .then(res => { drawQrCode(res) })
                                            .catch(err => {
                                                console.error(err)
                                                that.isbuilding = false
                                                that.triggerEvent('listener', { errmsg: 'fail: 二维码绘制失败' })
                                            })
                                    },
                                    fail(err) {
                                        console.error(err)
                                        that.isbuilding = false
                                        that.triggerEvent('listener', { errmsg: 'fail: 二维码写入失败' })
                                    }
                                })
                            }).catch(err => {
                                console.error(err)
                                that.isbuilding = false
                                that.triggerEvent('listener', { errmsg: 'fail: 二维码读取失败' })
                            })
                        })

                    // 绘制二维码
                    function drawQrCode(res) {
                        let qrWidth = res.width, qrHeight = res.height, path = res.path
                        const qrX = canvasWidth - qrCanvasWidth - lineOffset,
                            qrY = imgDrawHeight + lineOffset - 5 * canvasScreenRatio,
                            qrCanvasHeight = qrCanvasWidth / qrWidth * qrHeight
                        ctx.drawImage(path, qrX, qrY, qrCanvasWidth, qrCanvasHeight)

                        ctx.draw(true, (e) => {
                            wx.canvasToTempFilePath({
                                canvasId: 'piccanvas',
                                x: 0,
                                y: 0,
                                width: canvasWidth,
                                height: canvasHeight,
                                destWidth: canvasWidth * that.screenDpr,
                                destHeight: canvasHeight * that.screenDpr,
                                success(trs) {
                                    if (that.data.showLoading) {
                                        wx.hideLoading()
                                    }
                                    that.isbuilding = false
                                    that.triggerEvent('listener', {
                                        errmsg: 'ok',
                                        imgTempPath: trs.tempFilePath
                                    })
                                },
                                fail(err) {
                                    console.error(err)
                                    that.isbuilding = false
                                    that.triggerEvent('listener', { errmsg: 'fail: 导出图片到临时文件失败' })
                                }
                            }, that)
                        })
                    }
                }).catch(err => {
                    console.error(err)
                    that.isbuilding = false
                    that.triggerEvent('listener', { errmsg: 'fail: 原图读取失败' })
                })
        },
        /**
         * 计算文本绘制信息，自动换行
         * @param {CanvasContext} ctx 画布上下文
         * @param {String} text 待绘制的字符串
         * @param {Number} fontSize 字体大小，默认60
         * @param {Number} canvasWidth 可绘制区域宽度，默认100
         * @param {Number} canvasHeight 可绘制区域高度，默认100
         * @param {Number} lineHeight 行距，默认1.5
         */
        _fn_CtxTextWrap(ctx, text, fontSize = 60, canvasWidth = undefined, canvasHeight = undefined, lineHeight = 1.5, font = 'sans-serif') {
            ctx.setFontSize(fontSize)
            // ctx.font = `${fontSize}px ${font}`
            lineHeight = fontSize * lineHeight
            let textLines = []
            let lineCtx = {
                width: 0,
                text: '',
                lineheight: lineHeight
            }
            const textMaxIndex = text.length - 1
            for (let textIdx in text) {
                const char = text[textIdx]
                const mt = ctx.measureText(char)
                if (canvasWidth && lineCtx.width + mt.width > canvasWidth) {
                    textLines.push(lineCtx)
                    if (canvasHeight) {
                        if ((textLines.length * lineHeight + lineHeight) > canvasHeight) {
                            break
                        }
                    }

                    lineCtx = {
                        width: mt.width,
                        text: char,
                        lineheight: lineHeight
                    }
                } else {
                    lineCtx.width += mt.width
                    lineCtx.text += char
                }

                if (parseInt(textIdx) === textMaxIndex) {
                    textLines.push(lineCtx)
                }
            }
            return {
                lines: textLines,
                height: textLines.length * lineHeight
            }
        }
    }
})
