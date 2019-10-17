// miniprogram/pages/home/home.js
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
  },
  doGo(e){
    wx.navigateTo({
      url:`/pages/${e.currentTarget.dataset.url}`
    });
  }, 
  doGoTab(e){
    wx.switchTab({
      url:`/pages/${e.currentTarget.dataset.url}`
    });
  },
  doGoBack(){
    wx.navigateBack({ delta:1 })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  },
})