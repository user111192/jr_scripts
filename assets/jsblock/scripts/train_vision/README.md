# Train Vision LCD

此脚本以 MTR 4 / JCM v2.2 车辆脚本为目标，使用 Rhino 和 Java AWT 绘制。入口为 `main.js`，注册项是 `assets/mtr/mtr_custom_resources.json` 内的 `jr_kyushu_305_series_lcd`，已设置 `dataFetchMode: "ALL"`。

## 页面与数据

- 换乘页参照附件：1～4 条按左上、右上、左下、右下排列，5 条时末条居中；CJK 线路名在上、非 CJK 名在下，连接站的名称和已配置的站号图标放在右侧，连接站条目优先。
- 默认每页 6 秒：局部图 → 换乘 → 站台占位 → 全线图。无换乘跳过换乘页；换乘超过 5 条按每列 5 条排列，超过当前车型每页容量继续分页；全线图按当前车型每页站数分页，避免无限压缩站名。
- 语言由 `TextUtil.cycleString` 控制，读取 `||` 前的名称。当前大站名含 CJK 时，固定文本使用 `lang.js` 中的 `_cjk` 项，否则使用无后缀项。可把 CJK 固定文本改成日文。不要把语言选择改成独立计时器。
- 到站前先显示一次站台页，再重复开门侧提示；停站时本侧开门显示站台占位，本侧不开门显示局部图。无车门配置显示“车门状态未知”，不猜测下车方向。
- 站台图像与设施未实现，显示 `COMING SOON`，附编组与当前车厢；无路线/回送显示车厂及 `NOT AVAIL`。
- `ALL` 的 stops、车站、路线、站台仍可能延迟到达；依赖缺失的数据会显示 `PLEASE WAIT`，随后自动恢复。
- 目的地优先读取该路线 `SimplifiedRoutePlatform.getDestination()`，不可用时回退 `Stop.destinationName`，遵循 MTR 对自定义目的地和默认终点的规则。当前路线末站目的地与下一路线首站目的地相等时显示直通并连接线路图，共用交接站只画一次。终到显示 `%s 止`。
- 种别只来自 MTR 路线号码，不从名称 `||` 附加内容猜测。`SimplifiedRoute` 不携带号码：当前/前后站的路线号码由 `VehicleExtraData` 提供，未来路线由已有完整 `Platform.routes` 补充；数据尚未提供时显示 `PLEASE WAIT`，已知空号码则留白。
- 车厢编号为 `ctx.getMyCars()` 的全列索引加 1，反向运行仍保持编号。`DrawInfoPanel` 的 `data.carCount`、`data.trainLength` 提供全列编组节数及总长度（米），`carNumber` 是当前车厢号。
- `hasArrived` 使用 `[停车点 - 全列总长, 停车点]` 的距离窗口。页面状态另区分接近、实际停站与站间运行。

## 配置

`config.js` 控制时长、刷新率、站数/换乘分页上限及屏幕安装侧。左右屏拥有独立纹理区域，每节车厢拥有独立纹理；纹理节流上传，模型每帧绘制，卸载时释放纹理。

同目录 `lines.json` 默认只有空的 `type_colors`，所以默认不显示站号。线路键按文件中的先后顺序匹配：`||` 前的主要部分必须与实际线路名的主要部分完全相同；`||` 后的次要部分必须是实际次要部分的前缀。省略 `||` 等同于次要部分为空，可匹配该主要部分的任意次要部分。首个匹配项生效，因此专用键应放在通用键之前。车站键用 MTR 完整车站名称精确匹配。种别颜色键用完整路线号码。

```json
{
  "有楽町線|Yurakucho Line": {
    "style": "{\"shape\":\"circle\",\"filled\":false}",
    "code": "Y",
    "stations": {
      "飯田橋|Iidabashi": {
        "num": "13",
        "door": {"2": "right", "3": "left"}
      }
    }
  },
  "type_colors": {"各駅停車|Local": "#47769d"}
}
```

- `style` 支持 JSON 字符串（含默认 `"{}"`）或对象；`shape` 支持 `circle`、`square`、`rounded`、`diamond`、`jr`（方框字母），`filled` 控制填色。也可直接写形状名。未配置形状使用圆圈。
- `shape: "custom:odakyu_hakone.png"` 使用 `train_vision/resources/odakyu_hakone.png` 的图片，支持子目录。图片等比居中、保留透明度，替代代码和几何形状，不要求非空 `code`；有站号时站号显示在图片下方。图片在加载阶段缓存；缺失或损坏时回退圆形。添加图片或修改配置后需重新加载。
- 换乘线路配置非空 `code` 时，换乘指南与线路图的图标均显示该代码（例如 `JK`），形状按 `style` 绘制；未配置/没有 `code` 时使用空心圆，内部不显示字母。配置键示例：`"京浜東北線|Keihin-Tohoku Line": {"code":"JK","style":"{}"}`；需要匹配特定次要部分时可写成 `"京浜東北線|Keihin-Tohoku Line||支线"`，仅匹配实际次要部分以 `支线` 开头的线路。匹配按 `lines.json` 顺序优先。
- 连接车站换乘在线路图显示为 `线路名 [站名]`，两者跟随 MTR/JCM 语言轮播；换乘指南保留单独的连接站名称区域，配置了该线路该站的 `num` 时补充站号图标。线路色仍来自 MTR 数据。
- `door` 的键为站台 `getName()` 返回的站台号，值为 `none|left|right|both`。左右按当前行进方向定义；`none` 表示未知，不能用来推断安全的开门侧。
- 只在全列实际车门关闭时使用预测配置，实际开门时使用当前车厢的 JCM 车门数组。无当前车厢实际开门信息时显示未知。
- `panelSides` 按 DisplayHelper 模型坐标定义，`+X` 左侧、`-X` 右侧。`actualDoorSides` 对应已核对的 JCM 源码：`doorRightOpen` 检测 `+X`，`doorLeftOpen` 检测 `-X`，先映射为模型侧，再处理 reversed。若目标 JCM 版本改变数组坐标定义，可在这里调整。

### 画布和模型安装配置

`main.js` 不再内嵌 `infoPanelConfig`。未提供车辆配置时，默认加载同目录 `sample.train_vision.config.js`，包含 DisplayHelper 的 `version`、`texSize`、`slots`、`texArea`、`pos`、`offsets`。车辆专用前置 JS 直接定义 `var infoPanelConfig = {...};`；305 注册入口先加载其配置 JS，再加载 `main.js`，示例配置不会覆盖车辆配置。

`jr_kyushu_305_v2.train_vision.config.js` 直接保存屏幕安装配置。LCD 贴合原模型 `door_interior` 饰板 west 面上的两个黑屏区域，不覆盖整块饰板。模型纹理为 2416×2416，UV 单位分辨率为 604×604；两块黑屏的纹理像素边界分别为 `(2170,1591)`～`(2193,1604)`、`(2204,1591)`～`(2227,1604)`（右下边界不包含）。对应 UV 为 `[542.5,397.75,548.25,401]` 和 `[551,397.75,556.75,401]`。

饰板绕 `(18,32,11)` 旋转 15°。黑屏在未旋转饰板上为 Y=33～36.25、Z=-8.75～-3 与 -0.25～5.5，旋转后再除以 16，并向车内偏移 0.001 米避免重叠。顶边低于 Y=37 的内侧天花板。每侧两个屏幕共用一块 1840×1040 画布（23:13），左右纹理总高 2080；按四套车型门内饰定义在 Z=±7.5、±2.5 米重复，右侧镜像，每节车厢共 16 个屏幕。

`layout.js` 从每个 slot 的 `texArea` 宽高计算布局，独立重排标题、站名、路线图和换乘区域。横向统一缩放，字体/圆形图标保持比例；车门与编组图案在内容区等比适配。不要使用 DisplayHelper 的 `paintingSize`（当前 helper 的纵向缩放下标有误）。

车辆配置 JS 的 `infoPanelConfig.layout` 可控制字号和每页密度：

```js
layout: {
    fontScale: 1.45,              // 字号倍率，范围 0.5～2；超出可用区域时适配
    localStations: 5,
    fullMapStationsPerPage: 10,
    transferColumnsPerPage: 2     // 每列 5 项，此配置每页最多 10 项
}
```

305 和示例配置默认使用以上设置。未设置 layout 的车型沿用 `config.js` 的分页参数及 1 倍字号。顶部按字号预留种别、目的地和直通信息的高度；文字过长时等比缩小，不横向压扁；站名按剩余高度适配。局部图最多 5 站时横排站名，长名字最多两行，减少小屏英文旋转后缩得过小的问题。局部图最多显示两个换乘图标，额外数量另行标记，完整列表在换乘页显示。

JCM 当前服务端会把前一线末站 Stop 复制到下一线共享首站，这个复制值可能携带上一线的目的地。因此直通比较优先使用下一路线自身第一站的 `getDestination()`。无自定义目的地的 A:1→2、B:2→1 不再连接，真正同目的地的直通仍然连接。

`config.js` 中 `showTravelMinutes: true` 显示路线带内的空白分钟数框，设为 `false` 隐藏这些框。同一站点只画分钟框或圆点之一，框位于原圆点位置；已过站和已到达的本站显示圆点，其余目标/未来站显示分钟框。`LCDGetArrivalMinutes(data, stop)` 保留为 **WIP** 接口，目前返回 `null`，尚未接入停站时间与速度曲线；不会显示估算数字。

## 验证

```sh
node tests/train_vision.test.js
python3 tools/preview_train_vision.py
```

启动器自动定位项目、已准备的 `tools/rhino/rhino-1.7.15.jar` 和可用的 CJK 字体，输出目录默认为系统临时目录下的 `train-vision-preview`，完成后打印 `preview.png` 的完整路径。生成完成后自动打开 `preview.png`；使用 `--no-open` 可只生成图片。启动器也可以通过绝对路径从其他工作目录运行。

总览包含直通示例：有楽町線经小竹向原进入西武線，直通后种别变为急行，线路图以不同颜色连续显示两段，交接站只出现一次。该虚构行程通过 `BuildLCDData` 实际合并。单图为 `through-local-cjk.png`、`through-local-en.png` 和 `through-full-map.png`，使用 305 的 1840×1040 画布。

`preview.png` 按单页原始像素尺寸拼接，目前为 3840×4512，不缩小页面。单页 PNG 保持 1920×1080 或 305 的 1840×1040；总览放大到 100% 可检查文字细节。

可指定输出目录或字体（字体参数必须是实际存在的 TTF 文件）：

```sh
python3 tools/preview_train_vision.py /tmp/lcd-preview
python3 tools/preview_train_vision.py --font '/Library/Fonts/Arial Unicode.ttf'
```

也可在项目根目录直接运行 Rhino，无需字体参数：

```sh
java -Djava.awt.headless=true -cp tools/rhino/rhino-1.7.15.jar \
  org.mozilla.javascript.tools.shell.Main -version 200 \
  tests/train_vision.preview.js assets/jsblock/scripts/train_vision /tmp/lcd-preview
```

未找到 CJK 字体时使用 Java 系统字体，中文/日文字形可能缺失，可通过 `--font` 指定字体。预览使用虚构行程，不表示任何真实 MTR 数据；它同时验证 AWT 绘制、左右纹理不覆盖、按车厢分配及资源释放。游戏内还需检查目标 JCM 版本、模型安装面、实际站台和 turnback 的最终效果。

共享站复制行为核对：[JCM RequestStopsDataC2SPacket 源码](https://github.com/DistrictOfJoban/Joban-Client-Mod/blob/main/fabric/src/main/java/com/lx862/mtrscripting/mod/network/packet/data/RequestStopsDataC2SPacket.java)。

接口依据：[JCM 车辆脚本](https://jcm.joban.org/v2.2/dev/scripting/type/vehicle/)、[语言工具](https://jcm.joban.org/v2.2/dev/scripting/utilities/)、[TSC 类型](https://jcm.joban.org/v2.2/dev/scripting/tsc/)、[DisplayHelper](https://jcm.joban.org/v2.2/dev/scripting/builtin/display_helper/)、[原 LCD 模板](https://hibiya.hannnari.com/material/lcd/lcd.html)。
