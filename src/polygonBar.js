/**
 * 六边形组合柱状图组件
 * @autor zhanghq
 * @date 2016-1-5
 */

define(function(require) {
  /**
   * 引入公用的文件
   */
  require('lodash')
  require('d3')
  var $ = require('jquery')

  var polygonBar = {
    /**
     * 柱状图默认配置项
     */
    defaultSetting: function() {
      var width = 450
      var height = 400
      return {
        width: width,
        height: height,
        min: 1,
        zoom: 8,
        color: ['#d63200', '#9936e8'],
        coordinate: ['130,20, 20,40, 20,220, 130,200, 220,220, 220,40', '60,20, 20,90, 60,160, 140,160, 180,90, 140,20'] , //正六边形的六个坐标点
        pointStyle: 1,
        itemStyle:{
          strokeWidth: 1,
          stroke: '#06b7c7',
          margin: {
            left: 0,
            bottom:8,
          }
        },
        xText: {
          size: 14,
          color: '#fff',
          textAnchor: 'start',
          padding:{
            bottom: 0
          }
        },
        yAxis: {
          show: true
        },
        xAxis: {
          color: '#fff'
        },
        grid: {  //文字离左右两边的距离
          x: 50,
          x2: 20,
          y: 45
        }
      }
    },
    /**
     * 绘制柱状图
     */
    drawPolygonBar: function(svg, data, opt) {
      var config = _.assign({}, this.defaultSetting(), opt)
      var dataset = []
      for(var i = 0, len = data.length; i<len; i++){
        dataset.push(data[i].value)
      }
      var pointStyle = config.pointStyle
      var oPoints = []
      var polygonW = 0
      console.log(pointStyle)
      if(pointStyle==1){
          polygonW = 200/config.zoom
          oPoints = config.coordinate[0]
        
       }else{
          polygonW = 140/config.zoom
          oPoints = config.coordinate[1]
       }
       oPoints = oPoints.split(',')


      var dataLen = data.length

      var width = config.width
      var height = config.height
      var dataWidth = height - config.grid.y
      var max = Math.floor(dataWidth/polygonW)   
       svg.html('') 
       /**
       * 获取update部分
       */
      var update = svg.selectAll(".areas")
        .data(data)
      
      //获取enter部分
      var enter = update.enter()

      //获取exit部分
      var exit = update.exit()

      //处理exit部分
       exit.remove()

      //定义一个线性渐变
      var color = config.itemStyle.color
      var emphasis = config.itemStyle.emphasis.color
      
      
      colorFill(color)
      //渐变色填充
      function colorFill(color){
        var a = d3.hcl(color[0]);    
        var b = d3.hcl(color[1]);    
        compute = d3.interpolate(a,b); 
      }
      //填充比例尺
      var linear = d3.scale.linear()  
          .domain([0, max])  
          .range([0, 1.5])
      //定义y轴标尺
      var yScale = d3.scale.linear()
        .domain([0, d3.max(dataset)])
        .range([height-config.grid.y, 0])
      //定义纵轴  
      var yAxis=d3.svg.axis()
        .scale(yScale)
        .orient("left")
        .ticks(10)

      //添加y轴
      if(config.yAxis.show){
        var yBar=svg.append("g")
          .attr('class','axis axis-y')
          .attr('transform', 'translate('+config.grid.x+', '+config.grid.y/2+')')
          .call(yAxis)
      }
      //添加六边形的area
      var itemStyle = config.itemStyle
      var spacing  = (width - config.grid.x - polygonW)/dataLen
      var areas = enter.append('g')
        .attr('transform',function(d,i){
          i++
          var x = i*spacing+itemStyle.margin.left+config.grid.x/2
          return 'translate('+x+', '+(height-config.grid.y)+')'
        })
        .attr('class', 'areas')
        .on('mouseenter', function(d, i){
          var $this = d3.select(this)
          $this.style('cursor', 'pointer')
          var txt = '<p>'+data[i].name+'<br /></p><p>数量：'+data[i].value+'</p>'
          var tooltip = d3.select('body')
            .append('div')
            .attr('class', 'tooltip')
            .html(txt)
          var height = $('.tooltip').height()
          var width = $('.tooltip').width()
          var top = event.offsetY - height - height/2
          var left = event.offsetX - width/2
          tooltip
            .style('top', top+'px')
            .style('left', left+'px')

          colorFill(emphasis) //调用颜色
          $this.selectAll('.polygon')
            .style("fill",function(d){  
              return compute(linear(d)) 
          })
        })
        .on('mouseleave', function(){
          var $this = d3.select(this)
          d3.selectAll('.tooltip').remove()
          //渐变色填充
          colorFill(color)
          $this.selectAll('.polygon')
            .style("fill",function(d){  
              return compute(linear(d)) 
          })
        })

        var unit = Math.floor(d3.max(dataset) / max)


        var points = []
        for(var i = 0;i<oPoints.length;i++){
          
          points.push(oPoints[i]/config.zoom)
        }
        var index = 0
        var textPosi = []
        areas.selectAll(".polygon")
           .data(function(d,i){
              var range = Math.floor(dataset[i] / unit)
              if(range==0){
                range = config.min
              }
             if(range>max){
               range = max
             }  
              textPosi.push(range)
              return d3.range(0, range)
           })
           .enter()
           .append("polygon")
           .style("stroke-width", itemStyle.strokeWidth)
           .style("stroke", itemStyle.stroke)
           .attr("points", points)
           //渐变色
           .style("fill",function(d){  
              return compute(linear(d));  
           })
          .attr('transform',function(d,i){
              return 'translate(0,'+-(i*polygonW+itemStyle.margin.bottom)+')'
           })
          .attr('class', 'polygon')

          //x轴文字
          var xText = config.xText
          areas.append('text')
          .attr('fill', xText.color)
          .attr('font-size', xText.size)
          .attr('text-anchor', xText.textAnchor)
          .attr('x', function(d, i){
            return  0
          })
          .attr('y', (config.grid.y-xText.padding.bottom))
          .text(function(d,i){
            return data[i].name
          })
          
          //添加value
          // areas.append('text')
          //   .attr('fill', xText.color)
          //   .attr('font-size', xText.size)
          //   .attr('text-anchor', xText.textAnchor)
          //   .attr('x', polygonW/4)
          //   .attr('y', function(d,i){
          //     console.log(textPosi[i]*-polygonW)
          //     return textPosi[i]*-polygonW+25
          //   })
          //   .text(function(d,i){
          //     return data[i].value
          //   });
         
          //x轴线
          var xAxis = config.xAxis
          svg.append('rect')
            .attr('width', width- config.grid.x)
            .attr('height', 1)
            .attr('fill', xAxis.color)
            .attr('x', config.grid.x)
            .attr('y', (height - config.grid.y/2))

    }
  }

  return polygonBar
})