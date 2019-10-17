// components/imgupload/imgupload.js
Component({
    options:{
        styleIsolation:'apply-shared'
    },
    /**
     * 组件的属性列表
     */
    properties: {
        imgUrls:{
            type: Array,
            optionalTypes:[ String ],
            value:[]
        },
        sizeType:{
            type: Array,
            value:['original', 'compressed']
        },
        sourceType:{
            type: Array,
            value:['album', 'camera']
        },
        count:{
            type: Number,
            value: 9
        },
        title:{
            type: String,
            value: '图片'
        },
        showCount:{
            type: Boolean,
            value: false
        }
    },
    data:{
        Imgs:[]
    },
    observers:{
        'imgUrls'(){
            if(typeof(this.data.imgUrls) === 'string'){
                this.setData({
                    Imgs: this.data.imgUrls.length>0 ? [ this.data.imgUrls ] : []
                })
            }else{
                this.setData({
                    Imgs: this.data.imgUrls 
                })
            }
        }
    },
    /**
     * 组件的方法列表
     */
    methods: {
        doChooseImage() {
            wx.chooseImage({
                count: this.data.count, 
                sizeType: this.data.sizeType, //可以指定是原图还是压缩图，默认二者都有
                sourceType: this.data.sourceType    , //从相册选择
                success: (res) => {
                    const len = Math.min(this.data.count - this.data.Imgs.length, res.tempFilePaths.length)
                    this.setData({
                        Imgs: this.data.Imgs.concat(res.tempFilePaths.splice(0, len))
                    })
                    this._doTriggerEvent()
                }
            });
        },
        doViewImage(e) {
            wx.previewImage({
                urls: this.data.Imgs,
                current: e.currentTarget.dataset.url
            });
        },
        doDelImg(e) {
            this.data.Imgs.splice(e.currentTarget.dataset.index, 1);
            this.setData({ Imgs: this.data.Imgs })
            this._doTriggerEvent()
        },
        _doTriggerEvent(){
            this.triggerEvent('syncdata', this.data.Imgs, {  })
        }
    }
})
