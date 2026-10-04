# JR Scripts Resource Pack

这是一个 Minecraft Java Edition 资源包的基础骨架，目标版本为 **1.20.1**。

## 使用方式

1. 将本文件夹压缩为 ZIP（压缩包内应直接包含 `pack.mcmeta` 和 `assets`，不要多嵌套一层文件夹）。
2. 把 ZIP 放入 Minecraft 的 `resourcepacks` 文件夹。
3. 在游戏的“选项 → 资源包”中启用它。

## 添加资源

将资源放入 `assets/minecraft/` 下，并使用与原版资源相同的路径。例如：

- 物品纹理：`assets/minecraft/textures/item/`
- 方块纹理：`assets/minecraft/textures/block/`
- 语言文件：`assets/minecraft/lang/`
- 模型文件：`assets/minecraft/models/`

`pack.mcmeta` 中的 `pack_format` 为 15；如果要支持其他 Minecraft 版本，请按对应版本更新该数值。
