/**
 * @Author:      zhq
 * @DateTime:    2017-03-01 08:52:27
 * @Description: 地图
 * @Last Modified By:   zhq
 * @Last Modified Time:    2017-03-01 08:52:27
 */

define(function(require) {

  /**
   * 引入公用的文件
   */

  require('d3')
  require('lodash')
  require('topojson')

  //配置项
  var width = 0
  var height = 0
  var cfg = {}
  var svg = ''
  var map = {
    /**
     * 地图默认配置项
     */
    defaultSetting: function(){
      var width = 400
      var height = 200
      return {
        width: width,
        height: height,
        id: 'map',
        area: 'chongqing',
        itemStyle: {
          fill: '#001e5a',
          stroke: '#2fb9f8',
          strokeWidth: 1,
          emphasis: {
            fill: '#04184b',
            stroke: '#2fb9f8',
            strokeWidth: 1
          },
          filters: {
            opacity: 0.4,
            fill: ['#023ac0', '#0232af'],
            stroke: '#011a53',
            strokeWidth: 2
          }
        },
        markPoint: {   
          symbol: 'circle', //circle, image
          fill: '#16b0f8',
          radius: 10

        },
        tooltip: {
          className: 'tooltip'
        }
      }
 
    },
     /**
     * 地图初始化
     * @param {object} svg svg对象
     * @param {object} data 数据
     * @param {object} config 图表配置项
     */
    init: function(svg, data, opt){
      var _self = this
      cfg = _.assign({}, this.defaultSetting(), opt)
      width = cfg.width
      height = cfg.height
      svg = svg
      markData = data
      var mapUrl = './../data/map/'+cfg.area+'.json' 
      _self.drawMap(svg, mapUrl, markData)
      
    },

    /**
     * 绘制地图
     * @param {string} mapUrl svg对象
     * @param {object} markData 标注点数据
     * @param {object} svg svg对象
     */
    drawMap: function(svg, mapUrl, markData){
      //清空svg
      svg.html('')
      var _self = this
 
      //给svg添加个id
      svg.attr('id', 'mapWrap')
      //请求地图json数据
      d3.json(mapUrl, function(error, root){

       // var root = topojson.feature(toporoot, toporoot.objects.chongqing)

        var features = root.features
        //控制地图缩放的大小
        var scale = _self.getZoomScale(features, width, height),
            center = _self.getCenters(features);
      
        var projection = d3.geo.mercator()  //球形墨卡托投影
           .scale(scale * 50)
           .center(center)
           .translate([width / 2, (height/2 )])
        
        var path = d3.geo.path()  //创建一个地理路径生成器
              .projection(projection)  //取得或设置地理投影

        var mainMap = svg.append('g')
          .classed('mainMap', true) 

        //地图配置项
        var itemStyle = cfg.itemStyle  
        var tooltipCfg  = cfg.tooltip
        var emphasis = itemStyle.emphasis

         //绘制地图路径  
        var mapPath  = mainMap.selectAll('.mapPath')
          .data(features)
          .enter()
          .append('path')
          .attr('fill', itemStyle.fill)
          .attr('stroke', itemStyle.stroke)  
          .attr('stroke-width', itemStyle.strokeWidth)
          .attr('d', path )
          .attr('cursor', 'pointer')
          .attr('class', 'mapPath')
          //添加mouseover事件
          .on('mouseover', function(d, i){
            //当前区域改变颜色
            d3.select(this)
              .attr('fill', emphasis.fill)
              .attr('stroke', emphasis.stroke)
              .attr('stroke-width', emphasis.strokeWidth)
            //获取当前区域中心坐标点，用于计算提示框top,left的位置  
            var posi = path.centroid(d)
            //获取当前区域名
            var areaName = d.properties.MC
            //添加提示框
            var tooltip = d3.select('#'+cfg.id)
              .append('div')
              .attr('class', tooltipCfg.className)
              .style('left', ''+(posi[0])+'px')
              .style('top', ''+(posi[1]-60)+'px')
              .html(areaName)
          }) 
          .on('mouseout', function(d, i){
            //当前区域改变颜色
            d3.select(this)
              .attr('fill', itemStyle.fill)
              .attr('stroke', itemStyle.stroke)
              .attr('stroke-width', itemStyle.strokeWidth)
            //移出提示框
            d3.selectAll('.'+tooltipCfg.className).remove()
          })
          //地图点击事件
          .on('click', function(d, i){
            //移出提示框
            d3.selectAll('.'+tooltipCfg.className).remove() 
            //获取地区id，通过id获取到相应的json数据
            var areaId = d.properties.ZZJGDM  
            var mapUrl = './../data/map/fenju/'+areaId+'.json' 
            var markData = []
            //调用绘制地图的方案
            _self.drawMap(svg, mapUrl, markData)  
            //显示返回按钮
            d3.select('.back').style('display', 'block')    
            //调用返回按钮点击事件
             _self.clickBack(svg)    

          })

        //标注点
         _self.markPoint(projection, markData, "#mapWrap")  

        //添加滤镜效果 
        _self.filter(svg, features, path)   
      })
    },


    /**
     * 地图打点
     * @param {function} projection 计算点位置的一个算法
     * @param {Object} markData 点的经纬度数据
     * @param {Object} markData 容器id
     */
    markPoint: function(projection, markData, id){
      //标注点配置
      var markCfg = cfg.markPoint
      //标注点
      var markPoint = d3.select(id)
        .insert('g', id)
        .attr('class', 'markPoint')
        .attr('width', width)
        .attr('height', height)

      //添加点
      var symbol = markCfg.symbol

      if(symbol=='circle'){
        markPoint.selectAll('.circle')
        .data(markData)
        .enter()
        .append('circle')
        .attr('fill', markCfg.fill)
        .attr('r', markCfg.radius)
        .attr("cx", function(d){
          var coor = projection(d.geoCoord)
          return coor[0]
        })
        .attr("cy",function(d){
          var coor = projection(d.geoCoord)
          return coor[1]
        })
      }
    },

    /**
     * 点击返回
     */
    clickBack: function(svg){
      var _self = this
      d3.select('.back')
        .on('click', function(){
          d3.select(this).style('display', 'none')  //隐藏返回按钮
          //返回一级地图
          var mapUrl = './../data/map/'+cfg.area+'.json' 
          _self.drawMap(svg, mapUrl, markData)
        })
    },

    /**
     * 给地图添加滤镜效果
     * @param {Object} mapSvg 存放地图的svg容器
     * @param {Object} features 地图各区域块的数据
     * @param {function} path 取得或设置地理投影,D3的一个方法函数
     */
    filter: function(mapSvg, features, path){
      //滤镜配置项
      var fCfg = cfg.itemStyle.filters
      //添加一个滤镜效果
      var filter = mapSvg.append("defs").append("filter")
          .attr("id", "gaussinaBlur")
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', '100%')
          .attr('height', '100%')
  
      filter.append("feGaussianBlur")
          .attr("result", "blurOut")
          .attr("in", "offOut")
          .attr("stdDeviation", "8")
            
      //底部添加一个地图并加阴影效果
      mapSvg.insert('g', '.mainMap')
         .classed('filterG2', true)
         .selectAll('path')
         .data(features)  
         .enter().append('path')
         .attr('d', path)
         .attr('transform','translate(0,24)')
         .attr('filter', 'url(#gaussinaBlur)')
         .attr('fill', fCfg.fill[0])  
         .attr('opacity', fCfg.opacity)
             
     var filterG = mapSvg.insert('g', '.mainMap')
         .classed('filterG', true)
         .selectAll('path')
         .data(features)  
         .enter()
         .append('path')
         .attr('d', path)
         .attr('transform', 'translate(0,12)')
         .attr('fill', fCfg.fill[1])
         .attr('stroke', fCfg.stroke)  
         .attr('stroke-width', fCfg.strokeWidth)      
            
    },

    /**
     *  @getZoomScale  [地图缩放]
     *  @param     {[object]}    features [地图数据]
     *  @param     {[number]}    width    [容器width]
     *  @param     {[number]}    height   [容器height]
     */
    getZoomScale: function(features, width, height) {
      var longitudeMin = 100000; //最小经度
      var latitudeMin = 100000; //最小维度
      var longitudeMax = 0; //最大经度
      var latitudeMax = 0; //最大纬度
      features.forEach(function(e) {
        var a = d3.geo.bounds(e); //[[最小经度，最小维度][最大经度，最大纬度]]
        if (a[0][0] < longitudeMin) {
          longitudeMin = a[0][0];
        }
        if (a[0][1] < latitudeMin) {
          latitudeMin = a[0][1];
        }
        if (a[1][0] > longitudeMax) {
          longitudeMax = a[1][0];
        }
        if (a[1][1] > latitudeMax) {
          latitudeMax = a[1][1];
        }
      });

      var a = longitudeMax - longitudeMin;
      var b = latitudeMax - latitudeMin;
      /*if(a > b) {//按照宽度进行缩放
        return width/a;
      } else {
        return height/b;
      }*/

      return Math.min(width / a, height / b)
    },

    /**
     *  @getZoomScale  [获取中心点]
     *  @param     {[object]}    features [地图数据]
     */
    getCenters: function(features) {
      var longitudeMin = 100000;
      var latitudeMin = 100000;
      var longitudeMax = 0;
      var latitudeMax = 0;
      features.forEach(function(e) {
        var a = d3.geo.bounds(e);
        if (a[0][0] < longitudeMin) {
          longitudeMin = a[0][0];
        }
        if (a[0][1] < latitudeMin) {
          latitudeMin = a[0][1];
        }
        if (a[1][0] > longitudeMax) {
          longitudeMax = a[1][0];
        }
        if (a[1][1] > latitudeMax) {
          latitudeMax = a[1][1];
        }
      });
      var a = (longitudeMax + longitudeMin) / 2;
      var b = (latitudeMax + latitudeMin) / 2;
      return [a, b];
    }

  }

  return map
})