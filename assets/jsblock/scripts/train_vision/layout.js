// 按各 slot 的画布尺寸布局；横向统一缩放，纵向重排，字体和图标保持比例。
function LCDLayout(width, height) {
    width = Number(width) || 1920;
    height = Number(height) || 1080;
    let h = 1920 * height / width;
    return {width: width, height: height, h: h, scale: width / 1920,
        header: h * 352 / 1080, section: h * 87 / 1080,
        bodyTop: h * 439 / 1080, bodyHeight: h * 641 / 1080,
        fontScale: Math.min(1.4, h / 1080), compact: h < 720};
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
