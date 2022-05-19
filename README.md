# Dawn-Image-Host

从个人网站的API拆分出的简易图床服务, 支持缩放, 旋转, 翻转和叠加水印

由于是拆分出的演示项目, 本项目移除了鉴权等非主要功能

每次请求图像变换后结果都会存到缓存中以便下次使用, 缓存的有效期为3h

# API文档

完整的API文档请见: [Dawncraft API](https://www.apifox.cn/apidoc/project-936942/api-20143188)

## GET 获取图片

GET /image/{name}

通过id获取图片, 如果进行变换或转码则结果会存入缓存, 便于下次快速获取, 缓存时间为3小时

可用格式:
- jpg
- png

可用变换:
- w_{pixel}: 宽度设为指定像素, 高度按比例缩放
- h_{pixel}: 高度设为指定像素, 宽度按比例缩放
- s_{ratio}: 按比例缩放
- r_{90|180|270}: 按指定角度旋转
- f_{h|v}: h为水平翻转, v为垂直翻转
- wm_{text}: 水印文本, 默认位置(0, 0)位于左上角
- wms_{pixel}: 水印字号, 默认为24px
- wmx_{pixel}: 水印x坐标
- wmy_{pixel}: 水印y坐标

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|name|path|string| 是 |图像名称, 格式为"id.后缀名", 后缀名用于选择图片格式, 支持jpg和png|
|transform|query|string| 否 |图像变换参数, 具体值见接口说明|

> 返回示例

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|成功|图片|

## POST 上传图片

POST /image

上传分辨率小于8000*8000的图片, 支持bmp, jpg(jpeg)和png格式

> Body 请求参数

```yaml
image: file://C:\Users\****\Pictures\2.jpg
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|object| 否 |none|
|» image|body|string(binary)| 是 |要上传的图片, 分辨率小于8000*8000, 支持bmp, jpg(jpeg)和png格式|

> 返回示例

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|成功|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|说明|
|---|---|---|---|---|
|» id|string|true|none|图片id|

## DELETE 删除图片

DELETE /image/{id}

通过id删除图片

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |要删除的图片id, 不包括后缀名|

> 返回示例

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|成功|None|
