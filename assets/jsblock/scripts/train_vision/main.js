// MTR模组M-Train资趣台v2.2
// 2026年-当前 仙芳佳全域通达铁路、乐文彩雨 版权所有
// 作者b站：https://space.bilibili.com/104383166
// 使用时请遵守MIT开源协议

// 资源包介绍及下载链接
// https://modrinth.com/resourcepack/mtr-mod-m-train-with-infopanels

// Train Vision：模型安装位置、车辆生命周期与数据/绘图的连接。
include(Resources.id("mtrsteamloco:scripts/display_helper.js"));
include("config.js");
include("lang.js");
include("data.js");
include("formatting.js");
include("layout.js");
include("info-panel.js");

// 左右屏使用不同的纹理区域；同一侧重复安装的屏幕共用内容。
// DisplayHelper 模型坐标中 +X 是左侧，+Z 是后方。
// 车辆前置配置直接定义 infoPanelConfig；未提供时使用示例 JS 配置。
if (typeof infoPanelConfig === "undefined") include("sample.train_vision.config.js");
var panelList = infoPanelConfig.slots.map(function(slot) { return slot.name; });
var infoPanelGenerator = new DisplayHelper(infoPanelConfig);

function create(ctx, state, train) {
    // mtr_custom_resources.json 中此 script 的 dataFetchMode 必须是 ALL。
    state.refreshRate = new RateLimit(LCD_CONFIG.refreshSeconds);
    state.routeTypes = {};
    state.pageKey = null;
    state.pageStarted = Timing.elapsed();
    state.infoPanels = {};
    for (let carIndex of ctx.getMyCars()) {
        state.infoPanels[carIndex] = infoPanelGenerator.create();
    }
}

function render(ctx, state, train) {
    if (state.refreshRate.shouldUpdate()) {
        let data = BuildLCDData(state, train);
        let now = Timing.elapsed();
        for (let carIndex of ctx.getMyCars()) {
            let infoPanel = state.infoPanels[carIndex];
            let door = LCDDoorState(data, train, carIndex);
            for (let panelName of panelList) {
                let g = infoPanel.graphicsFor(panelName).create();
                let slot = infoPanelConfig.slots.filter(function(s) { return s.name === panelName; })[0];
                g.setClip(0, 0, slot.texArea[2], slot.texArea[3]);
                g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                let page = LCDSelectPage(state, data, panelName, door, now);
                DrawInfoPanel(g, state, data, carIndex + 1, panelName, door, page, slot.texArea[2], slot.texArea[3]);
                // 只释放 create() 生成的副本，保留 DisplayHelper 的共享 Graphics2D。
                g.dispose();
            }
            infoPanel.upload();
        }
    }
    // 模型每帧绘制，纹理只在刷新时上传。
    for (let carIndex of ctx.getMyCars()) {
        let manager = ctx.getCarRenderManager(carIndex);
        if (manager != null) manager.drawModel(state.infoPanels[carIndex].model, null);
    }
}

function dispose(ctx, state, train) {
    for (let carIndex in state.infoPanels) state.infoPanels[carIndex].close();
}
