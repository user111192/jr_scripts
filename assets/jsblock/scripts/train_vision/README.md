# Train Vision LCD

此脚本以 MTR 4 / JCM v2.2 车辆脚本为目标，使用 Rhino 和 Java AWT 绘制。入口为 `main.js`，注册项是 `assets/mtr/mtr_custom_resources.json` 内的 `jr_kyushu_305_series_lcd`，已设置 `dataFetchMode: "ALL"`。

## 页面与数据

- 换乘页参照附件：1～4 条按左上、右上、左下、右下排列，5 条时末条居中；CJK 线路名在上、非 CJK 名在下，连接站的名称和已配置的站号图标放在右侧，连接站条目优先。
- 默认每页 6 秒：局部图 → 换乘 → 站台占位 → 全线图。无换乘跳过换乘页；换乘超过 5 条按每列 5 条排列，超过 15 条继续分页；全线图超过 16 站分页，避免无限压缩站名。
- 语言由 `TextUtil.cycleString` 控制，读取 `||` 前的名称。当前大站名含 CJK 时，固定文本使用 `lang.js` 中的 `_cjk` 项，否则使用无后缀项。可把 CJK 固定文本改成日文。不要把语言选择改成独立计时器。
- 到站前先显示一次站台页，再重复开门侧提示；停站时本侧开门显示站台占位，本侧不开门显示局部图。无车门配置显示“车门状态未知”，不猜测下车方向。
- 站台图像与设施未实现，显示 `COMING SOON`，附编组与当前车厢；无路线/回送显示车厂及 `NOT AVAIL`。
- `ALL` 的 stops、车站、路线、站台仍可能延迟到达；依赖缺失的数据会显示 `PLEASE WAIT`，随后自动恢复。
- 目的地直接使用 `Stop.destinationName`，遵循 MTR 对自定义目的地和默认终点的规则。当前路线末站目的地与下一路线首站目的地相等时显示直通并连接线路图，共用交接站只画一次。终到显示 `%s 止`。
- 种别只来自 MTR 路线号码，不从名称 `||` 附加内容猜测。`SimplifiedRoute` 不携带号码：当前/前后站的路线号码由 `VehicleExtraData` 提供，未来路线由已有完整 `Platform.routes` 补充；数据尚未提供时显示 `PLEASE WAIT`，已知空号码则留白。
- 车厢编号为 `ctx.getMyCars()` 的全列索引加 1，反向运行仍保持编号。`DrawInfoPanel` 的 `data.carCount`、`data.trainLength` 提供全列编组节数及总长度（米），`carNumber` 是当前车厢号。
- `hasArrived` 使用 `[停车点 - 全列总长, 停车点]` 的距离窗口。页面状态另区分接近、实际停站与站间运行。

## 配置

`config.js` 控制时长、刷新率、站数/换乘分页上限及屏幕安装侧。左右屏拥有独立纹理区域，每节车厢拥有独立纹理；纹理节流上传，模型每帧绘制，卸载时释放纹理。

同目录 `lines.json` 默认只有空的 `type_colors`，所以默认不显示站号。线路键必须包括所有语言但去掉 `||` 及其后附加内容；车站键用 MTR 完整车站名称精确匹配。种别颜色键用完整路线号码。

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
- 换乘线路未配置/没有 `code` 时使用空心圆，内部不显示字母。连接车站显示名字；配置了该线路该站的 `num` 时补充站号图标。线路色仍来自 MTR 数据。
- `door` 的键为站台 `getName()` 返回的站台号，值为 `none|left|right|both`。左右按当前行进方向定义；`none` 表示未知，不能用来推断安全的开门侧。
- 只在全列实际车门关闭时使用预测配置，实际开门时使用当前车厢的 JCM 车门数组。无当前车厢实际开门信息时显示未知。
- `panelSides` 按 DisplayHelper 模型坐标定义，`+X` 左侧、`-X` 右侧。`actualDoorSides` 对应已核对的 JCM 源码：`doorRightOpen` 检测 `+X`，`doorLeftOpen` 检测 `-X`，先映射为模型侧，再处理 reversed。若目标 JCM 版本改变数组坐标定义，可在这里调整。

### 画布和模型安装配置

`main.js` 不再内嵌 `infoPanelConfig`。未提供车辆配置时，默认加载同目录 `sample.train_vision.config.js`，包含 DisplayHelper 的 `version`、`texSize`、`slots`、`texArea`、`pos`、`offsets`。车辆专用前置 JS 直接定义 `var infoPanelConfig = {...};`；305 注册入口先加载其配置 JS，再加载 `main.js`，示例配置不会覆盖车辆配置。

`jr_kyushu_305_v2.train_vision.config.js` 直接保存屏幕安装配置。模型没有独立命名的 LCD 面，因此使用 `door_interior` 门楣倾斜面：Blockbench 的 `(18,32,-12)`～`(18,38,12)`，绕 `(18,32,11)` 旋转 15°，坐标除以 16。屏幕上下留 0.3、前后留 1.2 个模型单位，向车内偏移 0.001 米以避免重叠。屏幕为 4:1，每侧画布 1920×480，纹理总高 960；屏幕偏移按四套车型的门内饰安装定义取 Z=±7.5、±2.5 米，右侧镜像。

`layout.js` 从每个 slot 的 `texArea` 宽高计算布局，独立重排标题、站名、路线图和换乘区域。横向统一缩放，字体/圆形图标保持比例；车门与编组图案在内容区等比适配。不要使用 DisplayHelper 的 `paintingSize`（当前 helper 的纵向缩放下标有误）。

`config.js` 中 `showTravelMinutes: true` 显示路线带内的空白分钟数框，设为 `false` 隐藏这些框。`LCDGetArrivalMinutes(data, stop)` 保留为 **WIP** 接口，目前返回 `null`，尚未接入停站时间与速度曲线；不会显示估算数字。

## 验证

```sh
node tests/train_vision.test.js
# 项目 tools/rhino/rhino-1.7.15.jar 已准备，可用真实 Java AWT 生成预览。
java -Djava.awt.headless=true -cp tools/rhino/rhino-1.7.15.jar \
  org.mozilla.javascript.tools.shell.Main -version 200 \
  tests/train_vision.preview.js assets/jsblock/scripts/train_vision /tmp/lcd-preview /path/to/cjk-font.ttf
```

最后一个字体参数可省略（使用 Java 系统字体，某些系统可能缺少 CJK 字形）。预览使用虚构行程，不表示任何真实 MTR 数据；它同时验证 AWT 绘制、左右纹理不覆盖、按车厢分配及资源释放。游戏内还需检查目标 JCM 版本、模型安装面、实际站台和 turnback 的最终效果。

接口依据：[JCM 车辆脚本](https://jcm.joban.org/v2.2/dev/scripting/type/vehicle/)、[语言工具](https://jcm.joban.org/v2.2/dev/scripting/utilities/)、[TSC 类型](https://jcm.joban.org/v2.2/dev/scripting/tsc/)、[DisplayHelper](https://jcm.joban.org/v2.2/dev/scripting/builtin/display_helper/)、[原 LCD 模板](https://hibiya.hannnari.com/material/lcd/lcd.html)。
