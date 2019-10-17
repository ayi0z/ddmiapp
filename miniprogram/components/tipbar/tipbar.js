// components/tipbar/tipbar.js
Component({
    options: {
        styleIsolation: 'apply-shared'
    },
    /**
     * 组件的属性列表
     */
    properties: {
        start: {
            type: Boolean,
            value: false
        },
        text: {
            type: String,
            value: '操作完成'
        },
        color:{
            type:String,
            value:'blue'
        },
        duration: {
            type: Number,
            value: 3000
        },
        inClass:{
            type:String,
            value:'animation-slide-left'
        },
        outClass:{
            type:String,
            value:'animation-reverse animation-slide-right'
        }
    },
    lifetimes:{
        created(){
            this.in= 0  // 进入
            this.out= 1 // 消失
            this.status = this.out // 初始状态
        }
    },
    observers: {
        'start': function (e) {
            if(e){
                if(this.status === this.out){
                    this.status = this.in
                    this.setData({ action: this.data.inClass})
                    setTimeout(()=>{ 
                        this.status = this.out
                        this.setData({ action: this.data.outClass}) 
                    }, this.data.duration)
                }
            }
        }
    },
    /**
     * 组件的初始数据
     */
    data: {
    },

    /**
     * 组件的方法列表
     */
    methods: {
    }
})
