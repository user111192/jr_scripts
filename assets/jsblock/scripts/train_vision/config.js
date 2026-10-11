// Train Vision LCD：时间单位为秒。路线图文字语言使用 JCM 的 TextUtil.cycleString。
var LCD_CONFIG = {
    pageSeconds: 6,
    refreshSeconds: 0.1,
    // WIP: 显示所需分钟数占位框；到站时间尚未计算，框内不显示数字。
    showTravelMinutes: true,
    localStations: 8,
    fullMapStationsPerPage: 16,
    transferColumnsPerPage: 3,
    approachMeters: 300,
    font: "Noto Sans CJK TC Medium",
    // left/right 为车辆模型坐标下的安装侧；反向运行时自动翻转。
    panelSides: {"info-panel-l": "left", "info-panel-r": "right"},
    // JCM VehicleWrapper 源码中 doorRightOpen 检测 +X，doorLeftOpen 检测 -X。
    // 将实际数组转为上述 DisplayHelper 的模型左右，配置车门侧则按行进方向。
    actualDoorSides: {left: "doorRightOpen", right: "doorLeftOpen"}
};
