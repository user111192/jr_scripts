// 绘图工具仅保留局部可变值，避免不同车辆实例互相影响。
importPackage(java.awt);
importPackage(java.awt.geom);

var LCD_FONT = Resources.getSystemFont(LCD_CONFIG.font);
var LCD_PALETTE = {
    ink: Color.decode("#202832"), muted: Color.decode("#8b939c"),
    paper: Color.decode("#ffffff"), soft: Color.decode("#eef1f4"),
    blue: Color.decode("#147bd1"), red: Color.decode("#d33b37")
};

function LCDColor(value, fallback) {
    if (typeof value === "number") return new Color(value & 0xffffff);
    let text = String(value == null ? "" : value);
    return /^#[0-9a-fA-F]{6}$/.test(text) ? Color.decode(text) : Color.decode(fallback || "#808080");
}

function LCDText(g, text, x, y, size, width, align, color) {
    text = String(text == null ? "" : text);
    if (!text.length) return;
    g.setFont(LCD_FONT.deriveFont(0, size));
    g.setColor(color || LCD_PALETTE.ink);
    let measured = g.getFontMetrics().stringWidth(text);
    let transform = g.getTransform();
    let scale = width > 0 && measured > width ? width / measured : 1;
    g.translate(x, y);
    g.scale(scale, 1);
    let offset = align === "center" ? -measured / 2 : align === "right" ? -measured : 0;
    g.drawString(text, offset, 0);
    g.setTransform(transform);
}

function LCDRect(g, x, y, width, height, color, radius) {
    g.setColor(color);
    if (radius) g.fillRoundRect(x, y, width, height, radius, radius);
    else g.fillRect(x, y, width, height);
}

function LCDArrow(g, x, y, right, color, size) {
    let direction = right ? 1 : -1;
    g.setColor(color);
    g.fillPolygon([x - direction * size, x + direction * size, x - direction * size],
        [y - size, y, y + size], 3);
}

function LCDBadgeStyle(line) {
    let style = line.style || {};
    if (typeof style === "string") {
        try { style = JSON.parse(style); }
        catch (error) { style = {shape: style}; }
    }
    return style != null && typeof style === "object" ? style : {};
}

// 无线路代码的换乘图标始终是空心圆；站号只在 lines.json 配置后绘制。
function LCDBadge(g, x, y, size, line, number, color, transfer) {
    line = line || {};
    let code = String(line.code || "");
    let style = code.length ? LCDBadgeStyle(line) : {};
    let shape = style.shape || "circle";
    let filled = Boolean(style.filled) && !(transfer && !code.length);
    let stroke = new BasicStroke(Math.max(3, size * 0.06));
    g.setStroke(stroke);
    g.setColor(color);
    let px = x - size / 2, py = y - size / 2;
    if (shape === "square" || shape === "jr") {
        if (filled) g.fillRect(px, py, size, size); else g.drawRect(px, py, size, size);
    } else if (shape === "rounded") {
        if (filled) g.fillRoundRect(px, py, size, size, size * 0.25, size * 0.25);
        else g.drawRoundRect(px, py, size, size, size * 0.25, size * 0.25);
    } else if (shape === "diamond") {
        let xs = [x, x + size / 2, x, x - size / 2], ys = [y - size / 2, y, y + size / 2, y];
        if (filled) g.fillPolygon(xs, ys, 4); else g.drawPolygon(xs, ys, 4);
    } else {
        if (filled) g.fillOval(px, py, size, size); else g.drawOval(px, py, size, size);
    }
    let ink = filled ? ((color.getRed() * 299 + color.getGreen() * 587 + color.getBlue() * 114) > 150000 ? LCD_PALETTE.ink : LCD_PALETTE.paper) : LCD_PALETTE.ink;
    if (number != null && String(number).length) {
        if (code.length) LCDText(g, code, x, y - size * 0.09, size * 0.24, size * 0.65, "center", ink);
        LCDText(g, number, x, y + size * (code.length ? 0.29 : 0.15), size * 0.35, size * 0.65, "center", ink);
    } else if (code.length) LCDText(g, code, x, y + size * 0.16, size * 0.4, size * 0.7, "center", ink);
}

function LCDStationLabel(g, name, x, y, width, height, size, cjk, color) {
    if (cjk) {
        let chars = Array.from(name);
        let step = Math.min(size * 1.16, height / Math.max(1, chars.length));
        chars.forEach(function (ch, i) {
            LCDText(g, ch, x, y + size + i * step, Math.min(size, step), width, "center", color);
        });
    } else {
        // 英文整串旋转，不逐个竖排字母。
        let transform = g.getTransform();
        g.translate(x + size * 0.35, y);
        g.rotate(Math.PI / 2);
        LCDText(g, name, 0, 0, size, height, "left", color);
        g.setTransform(transform);
    }
}
