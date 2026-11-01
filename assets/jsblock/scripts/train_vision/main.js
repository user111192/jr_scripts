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
// 每节车厢按 VehicleWrapper.getVehicleId 精确选择 LCD 几何；未匹配时沿用 slot 通用位置。
if (typeof infoPanelConfig === "undefined") include("sample.train_vision.config.js");

function LCDResolveVehiclePanelConfig(vehicleId) {
    let base = infoPanelConfig;
    let variants = base.lcdPositions || {};
    let id = String(vehicleId == null ? "" : vehicleId);
    let exact = Object.prototype.hasOwnProperty.call(variants, id) ? variants[id] : null;
    let profileKey = exact ? id : "default";
    let resolved = {version: base.version, texSize: base.texSize, slots: []};

    base.slots.forEach(function(slot) {
        let copy = {};
        Object.keys(slot).forEach(function(key) { copy[key] = slot[key]; });
        let specific = exact && exact[slot.name] ? exact[slot.name] : {};
        ["pos", "offsets"].forEach(function(key) {
            if (Object.prototype.hasOwnProperty.call(specific, key)) copy[key] = specific[key];
        });
        resolved.slots.push(copy);
    });
    return {key: profileKey, config: resolved};
}

function create(ctx, state, train) {
    // mtr_custom_resources.json 中此 script 的 dataFetchMode 必须是 ALL。
    state.refreshRate = new RateLimit(LCD_CONFIG.refreshSeconds);
    state.routeTypes = {};
    state.pageKey = null;
    state.pageStarted = Timing.elapsed();
    state.infoPanels = {};
    state.infoPanelGenerators = {};
    LCDSyncCarPanels(ctx, state, train);
}

// Car indexes may not be populated yet when create() runs, and can change
// during consist updates. Keep DisplayHelper instances aligned with live cars.
function LCDSyncCarPanels(ctx, state, train) {
    let activeCars = {};
    for (let carIndex of ctx.getMyCars()) {
        activeCars[carIndex] = true;
        if (state.infoPanels[carIndex] != null) continue;
        let vehicleId = null;
        try {
            if (typeof train.getVehicleId === "function") vehicleId = train.getVehicleId(carIndex);
        } catch (error) { print("[Train Vision] Cannot read vehicle id for car " + carIndex + ": " + error); }
        let profile = LCDResolveVehiclePanelConfig(vehicleId);
        if (state.infoPanelGenerators[profile.key] == null) {
            state.infoPanelGenerators[profile.key] = new DisplayHelper(profile.config);
        }
        let display = state.infoPanelGenerators[profile.key].create();
        state.infoPanels[carIndex] = {
            display: display,
            config: profile.config,
            panelList: profile.config.slots.map(function(slot) { return slot.name; })
        };
    }
    for (let carIndex in state.infoPanels) {
        if (!activeCars[carIndex]) {
            state.infoPanels[carIndex].display.close();
            delete state.infoPanels[carIndex];
        }
    }
}

function render(ctx, state, train) {
    LCDSyncCarPanels(ctx, state, train);
    if (state.refreshRate.shouldUpdate()) {
        let data = BuildLCDData(state, train);
        let now = Timing.elapsed();
        for (let carIndex of ctx.getMyCars()) {
            let carPanel = state.infoPanels[carIndex];
            // Vehicle composition can change while this script instance is alive.
            // create() only builds panels for cars present at initialization.
            if (carPanel == null || carPanel.display == null) continue;
            let infoPanel = carPanel.display;
            let door = LCDDoorState(data, train, carIndex);
            for (let panelName of carPanel.panelList) {
                let g = infoPanel.graphicsFor(panelName).create();
                let slot = carPanel.config.slots.filter(function(s) { return s.name === panelName; })[0];
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
        let carPanel = state.infoPanels[carIndex];
        if (manager != null && carPanel != null && carPanel.display != null) manager.drawModel(carPanel.display.model, null);
    }
}

function dispose(ctx, state, train) {
    for (let carIndex in state.infoPanels) state.infoPanels[carIndex].display.close();
}
