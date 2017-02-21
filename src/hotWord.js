/**
 * @Author:      zhanghq
 * @DateTime:    2017-02-20 21:52:27
 * @Description: 热词
 * @Last Modified By:   zhanghq
 * @Last Modified Time:    2017-02-20 21:52:27
 */

define(function(require){

  
  /**
  * 引入公用的文件
  */
  require('lodash')
  var $ = require('jquery')
  var ALLDATA = []
  var domW = 0
  var domH = 0
  var tags = {}
  var cfg = {
    size: 42  //字体大小（随机数0——1*size）
  }

  var hotWord = {


    /**
     *  [renderData 渲染数据]
     *  @param     {[object]}    data [热词数据]
     *  @param     {[string]}    id   [容器id]
     */
    renderData: function(data, id){
      var _self = this
      console.log(data)
      ALLDATA = data
      //打乱顺序，随机显示颜色
      data.sort(function(a, b) {
        return a.name < b.name
      })
      domW = Math.ceil($(id).width()) //热词容器的宽
      domH = Math.ceil($(id).height()) //热词容器的高
      console.log(domW, domH)

      var hotWords = ''
      for(var i=0, len = data.length; i<len; i++){
        var words = data[i].name
        var source = parseInt(data[i].ssbFlag)
        console.log(source)
        var str = ''
        //判断类型，添加不同的颜色
        switch(source){
          case 1:
            str = '<a class="tagc1" type='+source+'>'+words+'</a>'
            break;
          case 2:
            str = '<a class="tagc3" type='+source+'>'+words+'</a>'
            break;
          case 3:
            str = '<a class="tagc2" type='+source+'>'+words+'</a>'
            break;
        } 
        hotWords += str
      }
      $(id).html(hotWords)
      tags = $(document).find(''+id+' a')
      //热词数量太少调整调用时间
      if(data.length<=40){
        if (window.navigator.userAgent.indexOf("MSIE")>=1) {
          _self.setTimes(cfg, 1000)
        }else{
          _self.setTimes(cfg, 1000)
        } 
      }else{
        //判断ie
        if (window.navigator.userAgent.indexOf("MSIE")>=1) {
          _self.setTimes(cfg, 100)
        }else{
          _self.setTimes(cfg, 300)
        } 
      }
      _self.bindEvent(id)
    },

    setTimes: function(cfg, time){
      setTime = setInterval(function(){
        var len = Math.floor(Math.random() * ALLDATA.length)

        var size = Math.floor(Math.random() * cfg.size)
        var top = Math.floor(Math.random() * domH)

        var left = Math.floor(Math.random() * domW) 
        console.log('top', top, 'domH', 'domH', 'left', left, 'domW',  domW)
          if(size<12 && size > 6){
            size = size * 5
          }
          if(size<6){
            size = size * 8
          }
          // tags.eq(len).addClass('scale2')
          // tags.eq(len+1).addClass('scale2')
          var hasClass = tags.hasClass('scale')
          if(hasClass){
            tags.eq(len+1).addClass('scale2')
          }else{
            tags.eq(len).addClass('scale')
          }
          var hasClass2 = tags.hasClass('scale2')
          if(hasClass2){
            tags.eq(len).addClass('scale')
          }else{
            tags.eq(len+1).addClass('scale2')
          }
          tags.eq(len).css({'top': top+'px', 'left': left+'px', 'font-size': size+'px'})

      },time)
    },

    //事件绑定
    bindEvent: function(id){
      $(id).on('mouseenter', 'a', function(e){
        var $this = $(this)
        stopAnima($this)
        
      })
      $(id).on('mouseleave', 'a', function(e){
        var $this = $(this) 
        setInterval(function(){
          $this.addClass('scale')
        }, 1500)
      })

      //停止动画 animation
      function stopAnima(cur){
        cur.removeClass('scale')
        cur.removeClass('scale2')
        cur.addClass('stop')
      }
    },

    init: function(data, id){
      var _self = this
      console.log(data)
      _self.renderData(data, id)
    }

  }

  return hotWord
})