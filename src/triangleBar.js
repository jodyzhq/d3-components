/**
 * @Author:      zhq
 * @DateTime:    2017-01-10 20:12:27
 * @Description: Description
 * @Last Modified By:   zhq
 * @Last Modified Time:    2017-01-10 20:12:27
 */

define(function(require){
    /**
   * 引入公用的文件
   */
  require('lodash')
  require('d3')
  var $ = require('jquery')
  var linearGradient1 = ''
  var linearGradient2 = ''

  var triangleBar = {
    defaultSetting: function() {
      var width = 450
      var height = 280
      return {
        width: width,
        height: height,
        itemStyle: {
          barWidth: 6,
          color: ['#b3ff03', '#54a707'],
          borderColor: '#de2528',
          borderWidth: 1,
          emphasis: {  //强调样式
            color: ['#b3ff03', '#54a707'],
            borderColor: '#de2528'
          },
          circle:{
            color:'#fff',
            r: 3,
          }
        },
        xText:{
          fontSize: 12,
          color: '#a5cfe0',
          textAnchor: 'middle',
          margin:{
            top: 20
          }
        },
        xAxis: {
          color: '#2c668e'
        },
        grid:{
          x: 45,
          y: 60,
          y2:20
        }
      }
    },
    /**
     * 绘制柱状图
     */
    drawTriangleBar: function(svg, data, opt) {
      var cfg = _.assign({}, this.defaultSetting(), opt)
      var width = cfg.width
      var height = cfg.height
      var id = cfg.id
      var color = cfg.itemStyle.color
      var _slef = this
      var dataset = []
      var dataX = []
      for(var i = 0; i<data.length; i++){
        dataset.push(data[i].value)
        dataX.push(data[i].name)
      }

      //定义一个线性渐变     
        _slef.Gradient(svg, color, 'linearColor') 
        
       //定义y轴标尺
      var yScale = d3.scale.linear()
        .domain([0, d3.max(dataset)])
        .range([height-cfg.grid.y-cfg.grid.y2, 0])
      //定义纵轴  
      var yAxis=d3.svg.axis()
        .scale(yScale)
        .orient("left")

      //定义比例尺
      var linear = d3.scale.linear()  
            .domain([0,d3.max(dataset)])  
            .range([0, height-cfg.grid.y-cfg.grid.y2])
      //添加y轴
      var yBar=svg.append("g")
        .attr('class','axis axis-y')
        .attr('transform', 'translate('+cfg.grid.x+', '+cfg.grid.y2+')')
        .call(yAxis)

      //定义纵轴网格线
        var yInner = d3.svg.axis()
        .scale(yScale)
        .tickSize(-(width- cfg.grid.x-10),0)
        .tickFormat("")
        .orient("left")
        
        //添加纵轴网格线
        var yInnerBar=svg.append("g")
        .attr("class", "inner_line")
        .attr('transform', 'translate('+cfg.grid.x+', '+cfg.grid.y2+')')
        .call(yInner)  
      
        //x轴线
        svg.append('rect')
          .attr('width', width- cfg.grid.x-10)
          .attr('height', 1)
          .attr('fill', cfg.xAxis.color)
          .attr('x', cfg.grid.x)
          .attr('y', (height - cfg.grid.y))

        var itemStyle = cfg.itemStyle
        var dLen = dataset.length
        var dwidth = (width - cfg.grid.x - itemStyle.barWidth)/dLen
        var barWidth = itemStyle.barWidth
        var emphasis = itemStyle.emphasis
        
        var group =  svg.selectAll(".group")
           .data(data)
           .enter()
           .append('g')
           .attr('class', 'group')
           .attr('transform', function(d, i){
              var x= i*dwidth+cfg.grid.x+barWidth*2+itemStyle.margin.left
              var y = height - cfg.grid.y
              return 'translate('+x+', '+y+')'
           })


        group.append('polygon')  
          .attr('points', function(d, i){
            var p1 = -1

            var p2 = -linear(d.value)  
            if(p2==0){
              p2 = -itemStyle.min
            }
            var p3 = p1
            var points = ''+p1+', '+p2+'  '+(p1-barWidth)+',  '+p3+' '+(p1+barWidth)+' '+p3+' '
            console.log(points)
            return points
          })
        .attr("fill", function(d,i){
          return 'url(#' + linearGradient1.attr('id') + ')'
        })
        .attr('stroke-width', itemStyle.borderWidth)
        .attr('stroke', itemStyle.borderColor)
        //添加提示框
        .on('mouseenter', function(d, i){
          d3.select(this).style('cursor', 'pointer')
          var txt = '<p>'+data[i].name+'<br /></p><p>数量：'+data[i].value+'</p>'
          var tooltip = d3.select(id)
            .append('div')
            .attr('class', 'tooltip')
            .html(txt)
          var height = $('.tooltip').height()
          var width = $('.tooltip').width()
         
          var top = event.y - height - height/2
          var left = event.x - width/2
          tooltip
            .style('top', top+'px')
            .style('left', left+'px')

          //改变颜色
          var color = emphasis.color
          _slef.Gradient(svg, color, 'linearColor2')     
            d3.select(this)
            .attr("fill", function(d,i){
              return 'url(#' + linearGradient1.attr('id') + ')'
            })
            .attr('stroke', emphasis.borderColor)
         })
         //鼠标移开 
         .on('mouseleave', function(){
            var color = cfg.itemStyle.color
            _slef.Gradient(svg, color, 'linearColor') 

            d3.select(this) 
            .attr("fill", function(d,i){
              return 'url(#' + linearGradient1.attr('id') + ')'
            })
            .attr('stroke', itemStyle.borderColor)
            d3.selectAll('.tooltip').remove()
            d3.selectAll('.linearColor2').remove()

         })

        //添加上面小圆圈
        group.append('circle')
          .attr('r', itemStyle.circle.r)
          .attr('cx', function(d,i){
            var cx = i*dwidth+cfg.grid.x+barWidth*2
            return -1
          })
          .attr('cy', function(d,i){
            var cy =   linear(d.value) 
            if(cy==0){
              cy = itemStyle.min
            }
            return -cy
          })
          .attr('fill', itemStyle.circle.color) 

        var xText = cfg.xText  
        console.log(xText.fontSize)
      var textx = group.append('text')
          .attr('fill', xText.color)
          .attr('font-size', xText.fontSize)
          .attr('text-anchor', xText.textAnchor)
          .text(function(d,i){
            return dataX[i]
          })
        // .attr('transform','rotate(40 0,40)')
         .attr('transform','rotate(45)')
          .attr('x', function(d,i){
            var x = 0
            return x 
          })
          .attr('y', function(d,i){
            var y = (xText.margin.top )
            return y 
          })
          //.style('writing-mode','tb-rl')


          textx.selectAll("tspan")  
           .data(function(d,i){
            console.log(d.name)
            var tspandata = d.name.split('\n')
            console.log(tspandata)
            return tspandata
           })  
           .enter()  
           .append("tspan")  
           .attr("x",textx.attr("x"))  
           .attr("dy","1em")  
           .text(function(d,k){ 
                return d
           }) 
    },
    //定义线性渐变
    Gradient: function(svg, color, id){
      var a = d3.hcl(color[0])
      var b = d3.hcl(color[1])
      var defs = svg.append("defs")
        .attr('class', id)
      //添加渐变色
     linearGradient1 = defs.append("linearGradient")
          .attr("id", id)
          .attr("x1","0%")
          .attr("y1","60%")
          .attr("x2","0%")
          .attr("y2","60%")
  
      var stop1 = linearGradient1.append("stop")
              .attr("offset","100%")
              .style("stop-color",a.toString());
      
      var stop2 = linearGradient1.append("stop")
              .attr("offset","100%")
              .style("stop-color",b.toString());     

    }



  }

  return triangleBar
})