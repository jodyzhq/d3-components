##多边形柱状图说明文档

###1 使用说明
```
var hotWord = require('hotWord')
var config = {
      radius: 200,
      speed: 190
 }
var id = 'tagscloud'
hotWord.init(id, config)
```
###2 效果展示

![splitBar](img/hotWord.gif)

###3 接口说明
####3.1 接口调用
调用方式：`hotWord.init(id, config)`

参数说明：

- id:  容器id
- config：配置项

### 配置项参数说明

| 字段     | 含义      | 是否必选 | 默认值  | 备注   |
| ------ | ------- | ---- | ---- | ---- |
| radius | 显示区域的半径 | 否    | 200  |      |
| speed  | 文字速度    | 否    | 190  |      |


