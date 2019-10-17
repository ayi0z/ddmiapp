// components/loadingprogress/loadingprogress.js
Component({
    options: {
        styleIsolation: 'apply-shared'
    },
    /**
     * 组件的属性列表
     */
    properties: {
        progress: {
            type: Number,
            value: 0
        },
        // 自动前进到更新速度，毫秒
        interval: {
            type: Number,
            value: 100
        },
        /**
         * 信号:
         * 0-重置、待机
         * signal >10 - 自定进度到 signal
         */
        signal: {
            type: Number,
            value: 0
        },
        color:{
            type:String,
            value:'#00e600'
        }
    },
    observers: {
        'signal': function () {
            if (this.data.signal === 0) {
                // this.setData({ progress:0 })
            } else if(this.data.signal > 9){
                this._run_over(this.data.signal)
            }
        },
        'progress': function () {
            if (this.data.progress > 100) {
                this.setData({ progress: 100 })
            } else if (this.data.progress === 100) {
                setTimeout(() => {
                    this.setData({ progress: 0 })
                }, 500)
            }
        }
    },
    /**
     * 组件的初始数据
     */
    data: {
        // step:3
    },

    /**
     * 组件的方法列表
     */
    methods: {
        _run_over(pr = 100) {
            this.data.progress = this.data.progress + 5
            this.data.progress = this.data.progress > pr ? pr : this.data.progress
            this.setData({ progress: this.data.progress + 5 })
            if (this.data.progress < pr) {
                setTimeout(() => { this._run_over(pr) }, this.data.interval)
            }
        }
    }
})
