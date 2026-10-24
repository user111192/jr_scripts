// 日式 LCD：固定顶部、局部/全线图、换乘、站台占位和开门侧提示。
function DrawInfoPanel(graphics, state, data, carNumber, panelName, door, page, width, height) {
    let layout = LCDLayout(width, height), g = graphics.create();
    g.scale(layout.scale, layout.scale);
    let stationText = LCDCycle(data.depot ? LCD_LANG.depot_cjk + "|" + LCD_LANG.depot : data.stationName || LCD_LANG.depot_cjk + "|" + LCD_LANG.depot);
    let cjk = Boolean(TextUtil.isCjk(stationText)), color = LCDColor(data.routeColor, "#808080");
    LCDRect(g, 0, 0, 1920, layout.h, LCD_PALETTE.paper);
    DrawLCDHeader(g, data, stationText, carNumber, cjk, color, layout);
    if (!data.ready || data.depot) {
        DrawLCDMessage(g, LCDLabel(data.ready ? "unavailable" : "wait", cjk), layout);
    } else if (page.indexOf("transfer:") === 0) {
        DrawLCDTransfers(g, data, Number(page.split(":")[1]), cjk, layout);
    } else if (page === "platform" || page === "doors") {
        DrawLCDSection(g, LCDLabel(page === "platform" ? "platform" : "doors", cjk), layout);
        let content = LCDContentGraphics(g, layout);
        if (page === "platform") {
            LCDText(content, LCDLabel("platform_number", cjk, data.platformNumber), 960, 510, 60 * layout.options.fontScale, 1700, "center");
            LCDText(content, LCDLabel("coming_soon", cjk), 960, 700, 105 * layout.options.fontScale, 1740, "center", LCD_PALETTE.muted);
            DrawLCDConsist(content, data, carNumber, panelName, color, layout.options.fontScale);
            DrawLCDPlatformTransfers(content, data, cjk, layout.options.fontScale);
        } else DrawLCDDoors(content, data, panelName, door, cjk, layout.options.fontScale);
        content.dispose();
    } else DrawLCDMap(g, data, page, panelName, cjk, layout);
    if (data.ready && !data.depot && page !== "doors" && door.side === "none") {
        LCDText(g, LCDLabel("doors_unknown", cjk), 960, layout.h - 18 * layout.fontScale, 25 * layout.fontScale, 1250, "center", LCD_PALETTE.muted);
    }
    g.dispose();
}

function DrawLCDPlatformTransfers(g, data, cjk, fontScale) {
    let routes = data.transfers || [];
    LCDRect(g, 45, 965, 1830, 3, LCD_PALETTE.soft);
    LCDText(g, LCDLabel("transfer", cjk), 55, 1040, 34 * fontScale, 230, "left", LCD_PALETTE.muted);
    if (!routes.length) {
        LCDText(g, "—", 325, 1040, 34 * fontScale, 1500, "left", LCD_PALETTE.muted);
        return;
    }
    let shown = routes.slice(0, 4), cellWidth = 1500 / shown.length;
    shown.forEach(function (route, index) {
        let x = 315 + index * cellWidth, color = LCDColor(route.color);
        let badgeSize = Math.min(42 * fontScale, cellWidth * 0.18);
        LCDBadge(g, x + badgeSize / 2, 1024, badgeSize, LCDTransferLine(route), null, color, true);
        let label = LCDTransferLabel(route);
        if (index === shown.length - 1 && routes.length > shown.length) label += " +" + (routes.length - shown.length);
        LCDText(g, label, x + badgeSize + 14, 1034, Math.min(30 * fontScale, cellWidth * 0.15), cellWidth - badgeSize - 22, "left");
    });
}

function DrawLCDHeader(g, data, stationText, carNumber, cjk, color, layout) {
    let k = layout.fontScale, top = layout.topHeight, band = layout.stationHeight;
    LCDRect(g, 0, 0, 1920, top, LCD_PALETTE.soft);
    let tagSize = Math.min(54 * k, top * 0.52);
    if (data.ready && !data.depot) {
        if (data.type == null) LCDText(g, LCDLabel("wait", cjk), 40, top * 0.67, tagSize * 0.75, 330, "left", LCD_PALETTE.muted);
        else if (data.type.length) {
            let background = LCDColor((LCD_LINES.type_colors || {})[data.type], "#808080");
            LCDRect(g, 25, top * 0.13, 345, top * 0.74, background, 10 * k);
            let ink = background.getRed() * 299 + background.getGreen() * 587 + background.getBlue() * 114 > 150000 ? LCD_PALETTE.ink : LCD_PALETTE.paper;
            LCDText(g, LCDCycle(data.type), 197, top / 2 + tagSize * 0.33, tagSize, 315, "center", ink);
        }
        let destination = LCDLabel(data.terminating ? "terminus" : "destination", cjk, LCDCycle(data.terminating ? data.stationName : data.destination));
        let destinationSize = Math.min(65 * k, top * (data.through ? 0.48 : 0.60));
        LCDText(g, destination, 410, data.through ? top * 0.53 : top / 2 + destinationSize * 0.33, destinationSize, 1175, "left");
        if (data.through) {
            let text = LCDLabel("through", cjk, LCDCycle(data.throughName));
            if (data.throughType == null) text += " · " + LCDLabel("wait", cjk);
            else if (data.throughType && data.throughType !== data.type) text += " · " + LCDLabel("next_type", cjk, LCDCycle(data.throughType));
            LCDText(g, text, 410, top * 0.86, Math.min(34 * k, top * 0.24), 1175, "left", LCD_PALETTE.muted);
        }
    } else LCDText(g, LCDLabel(data.ready ? "out_of_service" : "wait", cjk), 40, top * 0.68, Math.min(65 * k, top * 0.60), 1530, "left");
    LCDRect(g, 1630, top * 0.13, 265, top * 0.74, LCD_PALETTE.ink, 16 * k);
    let carSize = Math.min(49 * k, top * 0.50);
    LCDText(g, LCDLabel("car", cjk, carNumber), 1762, top / 2 + carSize * 0.33, carSize, 235, "center", LCD_PALETTE.paper);
    if (data.ready && !data.depot) {
        let status = data.docked ? "arrived" : data.hasArrived || data.approaching ? "arriving" : "next";
        LCDText(g, LCDLabel(status, cjk), 45, top + band * 0.30, Math.min(46 * k, band * 0.26), 315, "left", LCD_PALETTE.muted);
        if (data.stationConfig.num != null && String(data.stationConfig.num).length) LCDBadge(g, 150, top + band * 0.70, Math.min(112 * k, band * 0.46), data.line, data.stationConfig.num, color, false);
    }
    LCDText(g, data.ready ? stationText : LCDLabel("wait", cjk), 1100, top + band * 0.72, Math.min(132 * k, band * 0.64), 1470, "center");
    LCDRect(g, 0, layout.header - 10 * k, 1920, 10 * k, color);
}

function DrawLCDSection(g, title, layout) {
    LCDRect(g, 0, layout.header, 1920, layout.section, LCD_PALETTE.soft);
    LCDText(g, title, 960, layout.header + layout.section * 0.72, Math.min(47 * layout.fontScale, layout.section * 0.65), 1770, "center");
}

function DrawLCDMessage(g, text, layout) {
    LCDText(g, text, 960, layout.bodyTop + layout.bodyHeight * 0.5, 105 * layout.fontScale, 1740, "center", LCD_PALETTE.muted);
}

function DrawLCDMap(g, data, page, panelName, cjk, layout) {
    let full = page.indexOf("full:") === 0;
    DrawLCDSection(g, LCDLabel(full ? "full_map" : "local_map", cjk), layout);
    if (!data.mapReady) { DrawLCDMessage(g, LCDLabel("wait", cjk), layout); return; }
    let total = data.stops.length;
    let limit = full ? layout.options.fullMapStationsPerPage : layout.options.localStations;
    let start = full ? Number(page.split(":")[1]) * limit : Math.max(0, Math.min(data.nextIndex - 2, total - limit));
    let end = Math.min(total, start + limit);
    let visible = data.stops.slice(start, end);
    let right = LCDTravelRight(LCD_CONFIG.panelSides[panelName], data.reversed);
    let gap = 1700 / Math.max(1, visible.length);
    function xFor(index) {
        return right ? 110 + gap * (index + 0.5) : 1810 - gap * (index + 0.5);
    }
    let k = Math.min(layout.fontScale, Math.max(0.1, (layout.bodyHeight - 100) / 350));
    let lineY = layout.bodyTop + Math.max(layout.bodyHeight * (full ? 0.20 : 0.28), (full ? 90 : 135) * k);
    let lineHeight = 40 * k;
    visible.forEach(function (stop, i) {
        let passed = start + i < data.nextIndex;
        let color = passed ? LCD_PALETTE.muted : LCDColor(Number(stop.route.getColor()));
        let x = xFor(i);
        LCDRect(g, x - gap / 2, lineY, gap + 1, lineHeight, color);
        let routes = LCDTransfers(stop);
        // 局部图最多显示两个图标，剩余数量明确标注；完整列表留在换乘页面。
        routes.slice(0, full ? 1 : 2).forEach(function (route, j) {
            let y = lineY - (60 + j * 44) * k;
            LCDBadge(g, x - gap * 0.33, y - 8 * k, (full ? 30 : 38) * k, LCDTransferLine(route), null, LCDColor(route.color), true);
            LCDText(g, LCDTransferLabel(route) + (j === (full ? 0 : 1) && routes.length > (full ? 1 : 2) ? " +" + (routes.length - (full ? 1 : 2)) : ""), x - gap * 0.19, y, (full ? 17 : 24) * k, gap * 0.66, "left", passed ? LCD_PALETTE.muted : LCD_PALETTE.ink);
        });
        let config = LCDStationConfig(String(stop.route.getName()), LCDStopName(stop));
        let numbered = config.num != null && String(config.num).length > 0;
        if (numbered) LCDBadge(g, x, lineY + 97 * k, (full ? 66 : 85) * k, LCDLine(String(stop.route.getName())), config.num, color, false);
        let nameY = lineY + (numbered ? (full ? 144 : 165) : 65) * k;
        let name = LCDCycle(LCDStopName(stop));
        let labelHeight = layout.h - 50 * k - nameY;
        let labelColor = passed ? LCD_PALETTE.muted : LCD_PALETTE.ink;
        if (!full && visible.length <= 5) LCDStationHorizontal(g, name, x, nameY, gap * 0.86, labelHeight, 50 * k, labelColor);
        else LCDStationLabel(g, name, x, nameY, gap * 0.8, labelHeight, (full ? 27 : 43) * k, Boolean(TextUtil.isCjk(name)), labelColor);
        if (LCDMapMarker(data, start + i) === "minutes") {
            // WIP: 到站时间框替代圆点，暂不绘制分钟数字。
            LCDGetArrivalMinutes(data, stop);
            let boxWidth = Math.min(gap * 0.45, 64 * k);
            LCDRect(g, x - boxWidth / 2, lineY + 5 * k, boxWidth, 30 * k, LCD_PALETTE.paper, 3 * k);
        } else {
            g.setStroke(new BasicStroke(5 * k));
            g.setColor(LCD_PALETTE.paper);
            g.fill(new Ellipse2D.Double(x - 13 * k, lineY + 7 * k, 26 * k, 26 * k));
            g.setColor(color);
            g.draw(new Ellipse2D.Double(x - 13 * k, lineY + 7 * k, 26 * k, 26 * k));
        }
    });
    let arrowX = right ? 1825 : 95;
    let lastColor = visible.length ? LCDColor(Number(visible[visible.length - 1].route.getColor())) : LCD_PALETTE.muted;
    LCDArrow(g, arrowX, lineY + 20 * k, right, lastColor, 29 * k);
    // 行进位置依据实际 railProgress 在线段中插值，站台停靠时固定在目标站。
    let target = Math.min(data.nextIndex, total - 1);
    if (target >= start && target < end) {
        let x = xFor(target - start);
        if (!data.hasArrived && target > start) {
            let from = Number(data.stops[target - 1].distance), to = Number(data.stops[target].distance);
            let ratio = to > from ? Math.max(0, Math.min(1, (data.progress - from) / (to - from))) : 1;
            x = xFor(target - 1 - start) + (x - xFor(target - 1 - start)) * ratio;
        }
        LCDArrow(g, x, lineY - 17 * k, right, LCD_PALETTE.blue, 22 * k);
    }
    if (full && total > limit) LCDText(g, (Math.floor(start / limit) + 1) + " / " + Math.ceil(total / limit), 1835, layout.h - 20 * k, 26 * k, 220, "right", LCD_PALETTE.muted);
}

function DrawLCDTransfers(g, data, pageIndex, cjk, layout) {
    DrawLCDSection(g, LCDLabel("transfer", cjk), layout);
    let max = layout.options.transferColumnsPerPage * 5;
    // 连接车站优先放在上方，排序副本不改变 MTR 原始换乘数组。
    let ordered = data.transfers.filter(function (r) { return Boolean(r.stationName); })
        .concat(data.transfers.filter(function (r) { return !r.stationName; }));
    let routes = ordered.slice(pageIndex * max, (pageIndex + 1) * max);
    let cells = LCDTransferCells(routes.length), available = layout.bodyHeight - 55 * layout.fontScale;
    routes.forEach(function (route, i) {
        let cell = cells[i], width = 1800 / cell.columns, rowHeight = available / cell.rows;
        let x = cell.centered ? 960 - width / 2 : 60 + cell.column * width;
        let y = layout.bodyTop + cell.row * rowHeight;
        let size = Math.min(110 * layout.fontScale, rowHeight * 0.60, width * 0.17);
        let centerY = y + rowHeight / 2;
        let color = LCDColor(route.color);
        LCDBadge(g, x + size / 2 + 12, centerY, size, LCDTransferLine(route), null, color, true);
        let textX = x + size + 35, textWidth = width - size - 55;
        let connectionWidth = route.stationName ? textWidth * 0.42 : 0;
        let nameWidth = textWidth - connectionWidth - (connectionWidth ? 20 : 0);
        let name = TextUtil.getCjkParts(route.name), secondary = TextUtil.getNonCjkParts(route.name);
        let font = Math.min(60 * layout.fontScale, rowHeight * 0.30, nameWidth * 0.20);
        LCDText(g, name || secondary, textX, centerY - font * 0.12, font, nameWidth, "left");
        if (name && secondary) LCDText(g, secondary, textX, centerY + font * 0.9, font * 0.64, nameWidth, "left", LCD_PALETTE.muted);
        if (route.stationName) {
            let connectionX = textX + nameWidth + 20;
            let badge = Math.min(size * 0.6, connectionWidth * 0.23);
            let numbered = route.station.num != null && String(route.station.num).length;
            if (numbered) LCDBadge(g, connectionX + badge / 2, centerY, badge, LCDTransferLine(route), route.station.num, color, false);
            let stationX = connectionX + (numbered ? badge + 12 : 0);
            let stationWidth = connectionWidth - (numbered ? badge + 12 : 0);
            let primary = TextUtil.getCjkParts(route.stationName), other = TextUtil.getNonCjkParts(route.stationName);
            LCDText(g, primary || other, stationX, centerY - font * 0.1, font * 0.72, stationWidth, "left");
            if (primary && other) LCDText(g, other, stationX, centerY + font * 0.8, font * 0.5, stationWidth, "left", LCD_PALETTE.muted);
        }
    });
    if (ordered.length > max) LCDText(g, (pageIndex + 1) + " / " + Math.ceil(ordered.length / max), 1850, layout.h - 20 * layout.fontScale, 26 * layout.fontScale, 230, "right", LCD_PALETTE.muted);
}

function DrawLCDConsist(g, data, carNumber, panelName, color, fontScale) {
    // 仅画编组/当前位置，不模拟尚未实现的站台图像与设施。
    let right = LCDTravelRight(LCD_CONFIG.panelSides[panelName], data.reversed);
    let width = Math.min(140, 1600 / Math.max(1, data.carCount));
    let start = 960 - width * data.carCount / 2;
    for (let i = 0; i < data.carCount; i++) {
        // 编组编号沿屏幕方向固定递增；折返只影响行进箭头，不反转车厢顺序。
        let number = (LCD_CONFIG.panelSides[panelName] === "left") ? data.carCount - i : i + 1;
        let x = start + i * width;
        LCDRect(g, x + 4, 864, width - 8, 87, number === carNumber ? color : LCD_PALETTE.soft, 10);
        LCDText(g, number, x + width / 2, 925, Math.min(58, 43 * fontScale, width * 0.55), width - 15, "center",
            number === carNumber ? LCD_PALETTE.paper : LCD_PALETTE.ink);
    }
    LCDArrow(g, right ? start + width * data.carCount + 35 : start - 35, 907, right, color, 22);
}

function DrawLCDDoors(g, data, panelName, door, cjk, fontScale) {
    let physical = LCD_CONFIG.panelSides[panelName];
    let side = data.reversed ? (physical === "left" ? "right" : "left") : physical;
    let opensHere = door.side === side || door.side === "both";
    let key = door.side === "none" ? "doors_unknown" : door.side === "both" ? "doors_both" : opensHere ? "doors_this" : "doors_other";
    let color = door.side === "none" ? LCD_PALETTE.muted : opensHere ? LCD_PALETTE.blue : LCD_PALETTE.red;
    LCDText(g, LCDLabel(key, cjk), 960, 530, 67 * fontScale, 1760, "center", color);
    // 分别绘制两片门扇；使用实际开门值或到站前循环提示动画。
    let opening = opensHere ? (door.actual ? data.doorValue : (Math.sin(Timing.elapsed() * 1.6) + 1) / 2) : 0;
    let offset = Math.round(opening * 160);
    LCDRect(g, 590 - offset, 586, 360, 340, LCD_PALETTE.soft, 12);
    LCDRect(g, 970 + offset, 586, 360, 340, LCD_PALETTE.soft, 12);
    LCDRect(g, 620 - offset, 623, 290, 150, Color.decode("#c9d4dd"), 10);
    LCDRect(g, 1000 + offset, 623, 290, 150, Color.decode("#c9d4dd"), 10);
    if (opensHere) {
        LCDArrow(g, 475, 754, false, color, 48);
        LCDArrow(g, 1445, 754, true, color, 48);
    } else if (door.side !== "none") {
        g.setStroke(new BasicStroke(18));
        g.setColor(color);
        g.drawOval(880, 676, 160, 160);
        g.drawLine(904, 702, 1016, 812);
    } else LCDText(g, "?", 960, 817, 135 * fontScale, 160, "center", color);
    LCDText(g, LCDLabel("notice", cjk), 960, 1030, 36 * fontScale, 1790, "center", LCD_PALETTE.muted);
}
