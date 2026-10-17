将自定义线路图标放在此目录，例如 `odakyu_hakone.png`。

在同级 `lines.json` 的线路配置中设置：

```json
{"style":{"shape":"custom:odakyu_hakone.png"}}
```

也支持 `style` 的 JSON 字符串格式及 `"style":"custom:odakyu_hakone.png"`。
图片不要求配置线路代码，等比缩放并保留透明度，不额外叠加代码或轮廓。
有站号时图片显示在上方，站号显示在下方。
路径相对此目录，可含子目录；文件名必须包含扩展名。
图片在脚本加载时缓存，添加或修改后需重新加载资源包/脚本。
文件缺失或无法读取时回退圆形图标，并在日志提示。
