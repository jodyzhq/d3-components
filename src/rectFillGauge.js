define(function(require) {
    
    /**
     * 引入公用的文件
     */
    require('lodash')
    require('d3')

    var RectFillGauge = {
        /**
         * 默认配置项
         */
        defaultLiquidOpts: function() {
            return {
                minValue: 0, // The gauge minimum value.
                maxValue: 100, // The gauge maximum value.
                circleThickness: 0.05, // The outer circle thickness as a percentage of it's radius.
                circleFillGap: 0.05, // The size of the gap between the outer circle and wave circle as a percentage of the outer circles radius.
                circleColor: "#178BCA", // The color of the outer circle.
                waveHeight: 0.05, // The wave height as a percentage of the radius of the wave circle.
                waveCount: 1, // The number of full waves per width of the wave circle.
                waveRiseTime: 1000, // The amount of time in milliseconds for the wave to rise from 0 to it's final height.
                waveAnimateTime: 18000, // The amount of time in milliseconds for a full wave to enter the wave circle.
                waveRise: true, // Control if the wave should rise from 0 to it's full height, or start at it's full height.
                waveHeightScaling: true, // Controls wave size scaling at low and high fill percentages. When true, wave height reaches it's maximum at 50% fill, and minimum at 0% and 100% fill. This helps to prevent the wave from making the wave circle from appear totally full or empty when near it's minimum or maximum fill.
                waveAnimate: true, // Controls if the wave scrolls or is static.
                waveColor: "#178BCA", // The color of the fill wave.
                waveOffset: 0, // The amount to initially offset the wave. 0 = no offset. 1 = offset of one full wave.
                textVertPosition: .5, // The height at which to display the percentage text withing the wave circle. 0 = bottom, 1 = top.
                textSize: 1, // The relative height of the text to display in the wave circle. 1 = 50%
                valueCountUp: true, // If true, the displayed value counts up from 0 to it's final value upon loading. If false, the final value is displayed.
                displayPercent: false, // If true, a % symbol is displayed after the value.
                textColor: "#045681", // The color of the value text when the wave does not overlap it.
                waveTextColor: "#A4DBf8" // The color of the value text when the wave overlaps it.
            }
        },
        /**
         * @param {string} elementId 页面容器元素id
         * @param {number} value 当前值
         * @param {object} config 配置项
         */
        drawLiquidFillGauge: function(elementId, value, opt) {
            if(opt == null) {
                config = this.defaultLiquidOpts()
            } else {
                config = opt
            }
            
            var gauge = d3.select('#' + elementId);
            var radius = Math.min(parseInt(gauge.style("width")), parseInt(gauge.style("height")))/2;
            var locationX = parseInt(gauge.style("width"))/2 - radius;
            var locationY = parseInt(gauge.style("height"))/2 - radius;
            var fillPercent = Math.max(config.minValue, Math.min(config.maxValue, value))/config.maxValue;

            var waveHeightScale;
            if(config.waveHeightScaling){
                waveHeightScale = d3.scale.linear()
                    .range([0,config.waveHeight,0])
                    .domain([0,50,100]);
            } else {
                waveHeightScale = d3.scale.linear()
                    .range([config.waveHeight,config.waveHeight])
                    .domain([0,100]);
            }

            var textPixels = 25//(config.textSize*radius/2);
            var textFinalValue = parseFloat(value).toFixed(2);
            var textStartValue = config.valueCountUp?config.minValue:textFinalValue;
            var percentText = config.displayPercent?"%":"";
            var circleThickness = config.circleThickness * radius;
            var circleFillGap = config.circleFillGap * radius;
            var fillCircleMargin = circleThickness + circleFillGap;
            var fillCircleRadius = radius - fillCircleMargin;
            var waveHeight = fillCircleRadius*waveHeightScale(fillPercent*100);

            var waveLength = fillCircleRadius*2/config.waveCount;
            var waveClipCount = 1+config.waveCount;
            var waveClipWidth = waveLength*waveClipCount;

            // Rounding functions so that the correct number of decimal places is always displayed as the value counts up.
            var textRounder = function(value){ return Math.round(value); };
            if(parseFloat(textFinalValue) != parseFloat(textRounder(textFinalValue))){
                textRounder = function(value){ return parseFloat(value).toFixed(1); };
            }
            if(parseFloat(textFinalValue) != parseFloat(textRounder(textFinalValue))){
                textRounder = function(value){ return parseFloat(value).toFixed(2); };
            }

            // Data for building the clip wave area.
            var data = [];

            for(var i = 0; i <= 30*waveClipCount; i++){
                data.push({x: i/(30*waveClipCount), y: (i/(30))});
            }

            // Scales for drawing the outer circle.
            var gaugeCircleX = d3.scale.linear().range([0,2*Math.PI]).domain([0,1]);
            var gaugeCircleY = d3.scale.linear().range([0,radius]).domain([0,radius]);

            // Scales for controlling the size of the clipping path.
            var waveScaleX = d3.scale.linear().range([0,waveClipWidth]).domain([0,1]);
            var waveScaleY = d3.scale.linear().range([0,waveHeight]).domain([0,1]);

            // Scales for controlling the position of the clipping path.
            var waveRiseScale = d3.scale.linear()
                // The clipping area size is the height of the fill circle + the wave height, so we position the clip wave
                // such that the it will overlap the fill circle at all when at 0%, and will totally cover the fill
                // circle at 100%.
                .range([(fillCircleMargin+fillCircleRadius*2+waveHeight),(fillCircleMargin-waveHeight)])
                .domain([0,1]);
            var waveAnimateScale = d3.scale.linear()
                .range([0, waveClipWidth-fillCircleRadius*2]) // Push the clip area one full wave then snap back.
                .domain([0,1]);

            // Scale for controlling the position of the text within the gauge.
            var textRiseScaleY = d3.scale.linear()
                .range([fillCircleMargin+fillCircleRadius*2,(fillCircleMargin+textPixels*0.7)])
                .domain([0,1]);

            // Center the gauge within the parent SVG.
            var gaugeGroup = gauge.append("g")
                .attr('transform','translate('+locationX+','+locationY+')');
            
            var points = [
                [-radius, 0],
                [0, radius],
                [radius, 0],
                [0, -radius]
            ]
            gaugeGroup.append('polygon')
                .attr('points', points)
                .attr('fill', 'none')
                .attr('stroke', config.circleColor)
                .attr('stroke-width', '3')
                .attr('transform','translate('+radius+','+radius+')');

            // Text where the wave does not overlap.
            var text1 = gaugeGroup.append("text")
                .text(textRounder(textStartValue) + percentText)
                .attr("class", "liquidFillGaugeText")
                .attr("text-anchor", "middle")
                .attr("font-size", textPixels + "px")
                .style("fill", config.textColor)
                .attr('transform','translate('+(radius)+','+(textRiseScaleY(config.textVertPosition) + 35)+')');
            
            //添加百分号
            gaugeGroup.append("text")
                .text("%")
                .attr("class", "liquidFillGaugeText")
                .attr("text-anchor", "middle")
                .attr("font-size", "10px")
                .style("fill", config.textColor)
                .attr('transform','translate('+(radius + 35)+','+(textRiseScaleY(config.textVertPosition) + 35)+')');

            // The clipping wave area.
            var clipArea = d3.svg.area()
                .x(function(d) { return waveScaleX(d.x); } )
                .y0(function(d) { return waveScaleY(Math.sin(Math.PI*0.1*config.waveOffset*-1 + d.y*2*Math.PI));} )
                .y1(function(d) { return (fillCircleRadius*5 + waveHeight); } );
            var waveGroup = gaugeGroup.append("defs")
                .append("clipPath")
                .attr("id", "clipWave" + elementId);
            var wave = waveGroup.append("path")
                .datum(data)
                .attr("d", clipArea)
                //.attr('transform', 'rotate(-45deg)')
                .attr("T", 0);

            // The inner circle with the clipping wave attached.
            var fillCircleGroup = gaugeGroup.append("g")
                .attr("clip-path", "url(#clipWave" + elementId + ")");

            fillCircleGroup.append('polygon')
                .attr('points', points)
                .attr('fill', config.circleColor)
                .attr('stroke', config.circleColor)
                .attr('stroke-width', '3')
                .attr('transform','translate('+radius+','+radius+')');

            // Text where the wave does overlap.
            var text2 = fillCircleGroup.append("text")
                .text(textRounder(textStartValue) + percentText)
                .attr("class", "liquidFillGaugeText")
                .attr("text-anchor", "middle")
                .attr("font-size", textPixels + "px")
                .style("fill", config.waveTextColor)
                .attr('transform','translate('+(radius)+','+(textRiseScaleY(config.textVertPosition) + 35)+')');

            fillCircleGroup.append("text")
                .text('%')
                .attr("class", "liquidFillGaugeText")
                .attr("text-anchor", "middle")
                .attr("font-size",  "20px")
                .style("fill", config.waveTextColor)
                .attr('transform','translate('+(radius + 35)+','+(textRiseScaleY(config.textVertPosition) + 35)+')');

            // Make the value count up.
            if(config.valueCountUp){
                var textTween = function(){
                    var i = d3.interpolate(this.textContent, textFinalValue);
                    return function(t) { this.textContent = textRounder(i(t)) + percentText; }
                };
                text1.transition()
                    .duration(config.waveRiseTime)
                    .tween("text", textTween);
                text2.transition()
                    .duration(config.waveRiseTime)
                    .tween("text", textTween);
            }

            // Make the wave rise. wave and waveGroup are separate so that horizontal and vertical movement can be controlled independently.
            var waveGroupXPosition = fillCircleMargin+fillCircleRadius*2-waveClipWidth;
            if(config.waveRise){
                waveGroup.attr('transform','translate('+waveGroupXPosition+','+waveRiseScale(0)+')')
                    .transition()
                    .duration(config.waveRiseTime)
                    .attr('transform','translate('+waveGroupXPosition+','+waveRiseScale(fillPercent)+')')
                    .each("start", function(){ wave.attr('transform','translate(1,0)'); }); // This transform is necessary to get the clip wave positioned correctly when waveRise=true and waveAnimate=false. The wave will not position correctly without this, but it's not clear why this is actually necessary.
            } else {
                waveGroup.attr('transform','translate('+waveGroupXPosition+','+waveRiseScale(fillPercent)+')');
            }

            if(config.waveAnimate) animateWave();

            function animateWave() {
                wave.attr('transform','translate('+waveAnimateScale(wave.attr('T'))+',0)');
                wave.transition()
                    .duration(config.waveAnimateTime * (1-wave.attr('T')))
                    .ease('linear')
                    .attr('transform','translate('+waveAnimateScale(1)+',0)')
                    .attr('T', 1)
                    .each('end', function(){
                        wave.attr('T', 0);
                        animateWave(config.waveAnimateTime);
                    });
            }

            function GaugeUpdater(){
                this.update = function(value){
                    var newFinalValue = parseFloat(value).toFixed(2);
                    var textRounderUpdater = function(value){ return Math.round(value); };
                    if(parseFloat(newFinalValue) != parseFloat(textRounderUpdater(newFinalValue))){
                        textRounderUpdater = function(value){ return parseFloat(value).toFixed(1); };
                    }
                    if(parseFloat(newFinalValue) != parseFloat(textRounderUpdater(newFinalValue))){
                        textRounderUpdater = function(value){ return parseFloat(value).toFixed(2); };
                    }

                    var textTween = function(){
                        var i = d3.interpolate(this.textContent, parseFloat(value).toFixed(2));
                        return function(t) { this.textContent = textRounderUpdater(i(t)) + percentText; }
                    };

                    text1.transition()
                        .duration(config.waveRiseTime)
                        .tween("text", textTween);
                    text2.transition()
                        .duration(config.waveRiseTime)
                        .tween("text", textTween);

                    var fillPercent = Math.max(config.minValue, Math.min(config.maxValue, value))/config.maxValue;
                    var waveHeight = fillCircleRadius*waveHeightScale(fillPercent*100);
                    var waveRiseScale = d3.scale.linear()
                        // The clipping area size is the height of the fill circle + the wave height, so we position the clip wave
                        // such that the it will overlap the fill circle at all when at 0%, and will totally cover the fill
                        // circle at 100%.
                        .range([(fillCircleMargin+fillCircleRadius*2+waveHeight),(fillCircleMargin-waveHeight)])
                        .domain([0,1]);
                    var newHeight = waveRiseScale(fillPercent);
                    var waveScaleX = d3.scale.linear().range([0,waveClipWidth]).domain([0,1]);
                    var waveScaleY = d3.scale.linear().range([0,waveHeight]).domain([0,1]);
                    var newClipArea;
                    if(config.waveHeightScaling){
                        newClipArea = d3.svg.area()
                            .x(function(d) { return waveScaleX(d.x); } )
                            .y0(function(d) { return waveScaleY(Math.sin(Math.PI*2*config.waveOffset*-1 + Math.PI*2*(1-config.waveCount) + d.y*2*Math.PI));} )
                            .y1(function(d) { return (fillCircleRadius*2 + waveHeight); } );
                    } else {
                        newClipArea = clipArea;
                    }

                    var newWavePosition = config.waveAnimate?waveAnimateScale(1):0;
                    wave.transition()
                        .duration(0)
                        .transition()
                        .duration(config.waveAnimate?(config.waveAnimateTime * (1-wave.attr('T'))):(config.waveRiseTime))
                        .ease('linear')
                        .attr('d', newClipArea)
                        .attr('transform','translate('+newWavePosition+',0)')
                        .attr('T','1')
                        .each("end", function(){
                            if(config.waveAnimate){
                                wave.attr('transform','translate('+waveAnimateScale(0)+',0)');
                                animateWave(config.waveAnimateTime);
                            }
                        });
                    waveGroup.transition()
                        .duration(config.waveRiseTime)
                        .attr('transform','translate('+waveGroupXPosition+','+newHeight+')')
                }
            }

            return new GaugeUpdater();
        },
        /**
         * @param {string} container 容器class，且只能为class，或者通过修改源码改成ID或其他
         * @param {array} data 数据数组
         * @param {object} opt 配置项 
         */
        renderInvolvedCase: function(container, data, opt) {
            var config2 = _.assign({}, this.defaultLiquidOpts(), opt)
            if(d3.select('.' + container).selectAll('svg')) {
                d3.select('.' + container).selectAll('svg').remove()
            }
      
            var currentData = data

            var svgGroups = d3.select('.' + container)
                .selectAll('.circle-dynamic')
                .data(currentData)
                .enter()
                .append('svg')
                .attr('class', 'circle-dynamic')
                .attr('width', 161)
                .attr('height', 161)
                .style('left', function(d, i) {
                    return 31*i + 'px'
                })
                .attr('id', function(d, i) {
                    return 'circleDynamic' + i
                })
            
            var rectSvg = d3.select('.' + container)
                .append('svg')
                .attr('width', 1824)
                .attr('height', 115)

            rectSvg.selectAll('.circle-rect')
                .data(currentData)
                .enter()
                .append('rect')
                .attr('class', 'circle-rect')
                .attr('x', function(d, i) {
                    return i*165
                })
                .attr('y', 28)
                .attr('width', 122)
                .attr('height', 42)
                .attr('stroke', '#0c1faa')
                .attr('stroke-width', 3)
                .attr('fill', 'none')

            rectSvg.selectAll('.circle-text')
                .data(currentData)
                .enter()
                .append('text')
                .attr('class', 'circle-text')
                .attr('x', function(d, i) {
                    return 15 + i*165
                })
                .attr('y', 60)
                .attr('fill', '#f5c51e')
                .attr('font-size', '24px')
                .text(function(d) {
                    return d.name
                })

            for(var i = 0; i < currentData.length; i++) {
                var circle = currentData[i]
                if(i == 0) {
                    config2.circleColor = "#36125c";
                    config2.waveColor = "#36125c";
                    this.drawLiquidFillGauge("circleDynamic" + i, parseFloat(circle.rate).toFixed(1), config2);
                } else if( i == 1) {
                    config2.circleColor = "#3b0d9c";
                    config2.waveColor = "#3b0d9c";
                    this.drawLiquidFillGauge("circleDynamic" + i, parseFloat(circle.rate).toFixed(1), config2);
                } else {
                    config2.circleColor = "#0d0d8d";
                    config2.waveColor = "#0d0d8d";
                    this.drawLiquidFillGauge("circleDynamic" + i, parseFloat(circle.rate).toFixed(1), config2);
                }
            }
        }
    }

    return RectFillGauge
})