// 每个车型的 infoPanelConfig.layout 可以覆盖字号与分页密度。
function LCDDisplayOptions() {
    let profile = typeof infoPanelConfig === "undefined" ? {} : infoPanelConfig.layout || {};
    function positive(key, fallback, integer) {
        let value = Number(profile[key]);
        if (!isFinite(value) || value <= 0) value = fallback;
        return integer ? Math.max(1, Math.floor(value)) : value;
    }
    return {fontScale: Math.max(0.5, Math.min(2, positive("fontScale", 1, false))),
        localStations: positive("localStations", LCD_CONFIG.localStations, true),
        fullMapStationsPerPage: positive("fullMapStationsPerPage", LCD_CONFIG.fullMapStationsPerPage, true),
        transferColumnsPerPage: positive("transferColumnsPerPage", LCD_CONFIG.transferColumnsPerPage, true)};
}

function LCDLayout(width, height) {
    width = Number(width) || 1920;
    height = Number(height) || 1080;
    let h = 1920 * height / width, options = LCDDisplayOptions();
    let base = Math.min(1.4, h / 1080), fontScale = base * options.fontScale;
    let top = Math.min(h * 0.21, 120 * base * options.fontScale);
    let station = Math.min(h * 0.24, 225 * base);
    let section = Math.min(h * 0.10, 75 * base);
    let header = top + station;
    return {width: width, height: height, h: h, scale: width / 1920,
        topHeight: top, stationHeight: station, header: header, section: section,
        bodyTop: header + section, bodyHeight: h - header - section,
        fontScale: fontScale, compact: h < 720, options: options};
}

// 分钟数框与站点圆点严格互斥；停靠在本站时仍用站点标记。
function LCDMapMarker(data, index) {
    return LCD_CONFIG.showTravelMinutes && index >= data.nextIndex &&
        !(data.hasArrived && index === data.nextIndex) ? "minutes" : "dot";
}

// 1..4 项为双列，5 项最后一项居中；超过 5 项遵守每列 5 项。
function LCDTransferCells(count) {
    let cells = [], columns = count <= 5 ? (count === 1 ? 1 : 2) : Math.ceil(count / 5);
    let rows = count <= 5 ? Math.ceil(count / columns) : 5;
    for (let i = 0; i < count; i++) {
        let col = count <= 5 ? i % columns : Math.floor(i / 5);
        let row = count <= 5 ? Math.floor(i / columns) : i % 5;
        cells.push({column: col, row: row, columns: columns, rows: rows,
            centered: count === 5 && i === 4});
    }
    return cells;
}

function LCDContentGraphics(g, layout) {
    // 图像类页面按内容区域等比缩放，避免车门/编组变形。
    let child = g.create(), scale = Math.min(1, layout.bodyHeight / 641);
    child.translate((1920 - 1920 * scale) / 2, layout.bodyTop);
    child.scale(scale, scale);
    child.translate(0, -439);
    return child;
}
