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
            LCDText(content, LCDLabel("platform_number", cjk, data.platformNumber), 960, 510, 60, 1700, "center");
            LCDText(content, LCDLabel("coming_soon", cjk), 960, 700, 105, 1740, "center", LCD_PALETTE.muted);
            DrawLCDConsist(content, data, carNumber, panelName, color);
        } else DrawLCDDoors(content, data, panelName, door, cjk);
        content.dispose();
    } else DrawLCDMap(g, data, page, panelName, cjk, layout);
    if (data.ready && !data.depot && page !== "doors" && door.side === "none") {
        LCDText(g, LCDLabel("doors_unknown", cjk), 960, layout.h - 18 * layout.fontScale, 25 * layout.fontScale, 1250, "center", LCD_PALETTE.muted);
    }
    g.dispose();
}

function DrawLCDHeader(g, data, stationText, carNumber, cjk, color, layout) {
    let k = layout.fontScale, y = layout.h / 1080;
    LCDRect(g, 0, 0, 1920, 115 * y, LCD_PALETTE.soft);
    if (data.ready && !data.depot) {
        if (data.type == null) LCDText(g, LCDLabel("wait", cjk), 45, 76 * y, 33 * k, 300, "left", LCD_PALETTE.muted);
        else if (data.type.length) {
            let background = LCDColor((LCD_LINES.type_colors || {})[data.type], "#808080");
            LCDRect(g, 30, 20 * y, 310, 75 * y, background, 10 * k);
            let ink = background.getRed() * 299 + background.getGreen() * 587 + background.getBlue() * 114 > 150000 ? LCD_PALETTE.ink : LCD_PALETTE.paper;
            LCDText(g, LCDCycle(data.type), 185, 75 * y, 45 * k, 280, "center", ink);
        }
        let destination = LCDLabel(data.terminating ? "terminus" : "destination", cjk, LCDCycle(data.terminating ? data.stationName : data.destination));
        LCDText(g, destination, 380, (data.through ? 62 : 78) * y, (data.through ? 46 : 55) * k, 1220, "left");
        if (data.through) {
            let text = LCDLabel("through", cjk, LCDCycle(data.throughName));
            if (data.throughType == null) text += " · " + LCDLabel("wait", cjk);
            else if (data.throughType && data.throughType !== data.type) text += " · " + LCDLabel("next_type", cjk, LCDCycle(data.throughType));
            LCDText(g, text, 380, 100 * y, 28 * k, 1220, "left", LCD_PALETTE.muted);
        }
    } else LCDText(g, LCDLabel(data.ready ? "out_of_service" : "wait", cjk), 45, 78 * y, 55 * k, 1500, "left");
    LCDRect(g, 1640, 14 * y, 255, 88 * y, LCD_PALETTE.ink, 16 * k);
    LCDText(g, LCDLabel("car", cjk, carNumber), 1767, 76 * y, 44 * k, 230, "center", LCD_PALETTE.paper);
    if (data.ready && !data.depot) {
        let status = data.docked ? "arrived" : data.hasArrived || data.approaching ? "arriving" : "next";
        LCDText(g, LCDLabel(status, cjk), 50, 195 * y, 48 * k, 320, "left", LCD_PALETTE.muted);
        if (data.stationConfig.num != null && String(data.stationConfig.num).length) LCDBadge(g, 150, 280 * y, 112 * k, data.line, data.stationConfig.num, color, false);
    }
    LCDText(g, data.ready ? stationText : LCDLabel("wait", cjk), 1100, 285 * y, 132 * k, 1470, "center");
    LCDRect(g, 0, 338 * y, 1920, 14 * y, color);
}

function DrawLCDSection(g, title, layout) {
    LCDRect(g, 0, layout.header, 1920, layout.section, LCD_PALETTE.soft);
    LCDText(g, title, 960, layout.header + layout.section * 0.72, 47 * layout.fontScale, 1770, "center");
}

function DrawLCDMessage(g, text, layout) {
    LCDText(g, text, 960, layout.bodyTop + layout.bodyHeight * 0.5, 105 * layout.fontScale, 1740, "center", LCD_PALETTE.muted);
}

function DrawLCDMap(g, data, page, panelName, cjk, layout) {
    let full = page.indexOf("full:") === 0;
    DrawLCDSection(g, LCDLabel(full ? "full_map" : "local_map", cjk), layout);
    if (!data.mapReady) { DrawLCDMessage(g, LCDLabel("wait", cjk), layout); return; }
    let total = data.stops.length;
    let limit = full ? LCD_CONFIG.fullMapStationsPerPage : LCD_CONFIG.localStations;
    let start = full ? Number(page.split(":")[1]) * limit : Math.max(0, Math.min(data.nextIndex - 2, total - limit));
    let end = Math.min(total, start + limit);
    let visible = data.stops.slice(start, end);
    let right = LCDTravelRight(LCD_CONFIG.panelSides[panelName], data.reversed);
    let gap = 1700 / Math.max(1, visible.length);
    function xFor(index) {
        return right ? 110 + gap * (index + 0.5) : 1810 - gap * (index + 0.5);
    }
    let k = layout.fontScale;
    let lineY = layout.bodyTop + layout.bodyHeight * 0.31;
    let lineHeight = 40 * k;
    visible.forEach(function (stop, i) {
        let passed = start + i < data.nextIndex;
        let color = passed ? LCD_PALETTE.muted : LCDColor(Number(stop.route.getColor()));
        let x = xFor(i);
        LCDRect(g, x - gap / 2, lineY, gap + 1, lineHeight, color);
        let routes = LCDTransfers(stop);
        // 局部图最多显示三个图标，剩余数量明确标注；完整列表留在换乘页面。
        routes.slice(0, full ? 1 : 3).forEach(function (route, j) {
            let y = lineY - (47 + j * 55) * k;
            LCDBadge(g, x - gap * 0.33, y - 8 * k, (full ? 30 : 38) * k, route.line, null, LCDColor(route.color), true);
            LCDText(g, LCDCycle(route.name), x - gap * 0.19, y, (full ? 17 : 24) * k, gap * 0.66, "left", passed ? LCD_PALETTE.muted : LCD_PALETTE.ink);
        });
        if (routes.length > (full ? 1 : 3)) LCDText(g, "+" + (routes.length - (full ? 1 : 3)), x, layout.bodyTop + 22 * k, 22 * k, gap * 0.8, "center", LCD_PALETTE.muted);
        let config = LCDStationConfig(String(stop.route.getName()), LCDStopName(stop));
        let numbered = config.num != null && String(config.num).length > 0;
        if (numbered) LCDBadge(g, x, lineY + 97 * k, (full ? 66 : 85) * k, LCDLine(String(stop.route.getName())), config.num, color, false);
        let nameY = lineY + (numbered ? (full ? 144 : 165) : 89) * k;
        let name = LCDCycle(LCDStopName(stop));
        LCDStationLabel(g, name, x, nameY, gap * 0.8, layout.h - 50 * k - nameY, (full ? 27 : 43) * k, Boolean(TextUtil.isCjk(name)), passed ? LCD_PALETTE.muted : LCD_PALETTE.ink);
        g.setStroke(new BasicStroke(5 * k));
        g.setColor(LCD_PALETTE.paper);
        g.fill(new Ellipse2D.Double(x - 13 * k, lineY + 7 * k, 26 * k, 26 * k));
        g.setColor(color);
        g.draw(new Ellipse2D.Double(x - 13 * k, lineY + 7 * k, 26 * k, 26 * k));
        if (LCD_CONFIG.showTravelMinutes && start + i >= data.nextIndex) {
            // WIP: 保留空白分钟数框，暂不绘制 LCDGetArrivalMinutes 返回值。
            LCDGetArrivalMinutes(data, stop);
            LCDRect(g, x + 22 * k, lineY + 6 * k, Math.min(gap * 0.3, 58 * k), 28 * k, LCD_PALETTE.paper, 3 * k);
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
    let max = LCD_CONFIG.transferColumnsPerPage * 5;
    // 连接车站优先放在上方，排序副本不改变 MTR 原始换乘数组。
    let ordered = data.transfers.filter(function(r) { return Boolean(r.stationName); })
        .concat(data.transfers.filter(function(r) { return !r.stationName; }));
    let routes = ordered.slice(pageIndex * max, (pageIndex + 1) * max);
    let cells = LCDTransferCells(routes.length), available = layout.bodyHeight - 55 * layout.fontScale;
    routes.forEach(function(route, i) {
        let cell = cells[i], width = 1800 / cell.columns, rowHeight = available / cell.rows;
        let x = cell.centered ? 960 - width / 2 : 60 + cell.column * width;
        let y = layout.bodyTop + cell.row * rowHeight;
        let size = Math.min(110, rowHeight * 0.56, width * 0.17);
        let centerY = y + rowHeight / 2;
        let color = LCDColor(route.color);
        LCDBadge(g, x + size / 2 + 12, centerY, size, route.line, null, color, true);
        let textX = x + size + 35, textWidth = width - size - 55;
        let connectionWidth = route.stationName ? textWidth * 0.42 : 0;
        let nameWidth = textWidth - connectionWidth - (connectionWidth ? 20 : 0);
        let name = TextUtil.getCjkParts(route.name), secondary = TextUtil.getNonCjkParts(route.name);
        let font = Math.min(48, rowHeight * 0.25, nameWidth * 0.12);
        LCDText(g, name || secondary, textX, centerY - font * 0.12, font, nameWidth, "left");
        if (name && secondary) LCDText(g, secondary, textX, centerY + font * 0.9, font * 0.64, nameWidth, "left", LCD_PALETTE.muted);
        if (route.stationName) {
            let connectionX = textX + nameWidth + 20;
            let badge = Math.min(size * 0.6, connectionWidth * 0.23);
            let numbered = route.station.num != null && String(route.station.num).length;
            if (numbered) LCDBadge(g, connectionX + badge / 2, centerY, badge, route.line, route.station.num, color, false);
            let stationX = connectionX + (numbered ? badge + 12 : 0);
            let stationWidth = connectionWidth - (numbered ? badge + 12 : 0);
            let primary = TextUtil.getCjkParts(route.stationName), other = TextUtil.getNonCjkParts(route.stationName);
            LCDText(g, primary || other, stationX, centerY - font * 0.1, font * 0.72, stationWidth, "left");
            if (primary && other) LCDText(g, other, stationX, centerY + font * 0.8, font * 0.5, stationWidth, "left", LCD_PALETTE.muted);
        }
    });
    if (ordered.length > max) LCDText(g, (pageIndex + 1) + " / " + Math.ceil(ordered.length / max), 1850, layout.h - 20 * layout.fontScale, 26 * layout.fontScale, 230, "right", LCD_PALETTE.muted);
}

function DrawLCDConsist(g, data, carNumber, panelName, color) {
    // 仅画编组/当前位置，不模拟尚未实现的站台图像与设施。
    let right = LCDTravelRight(LCD_CONFIG.panelSides[panelName], data.reversed);
    let width = Math.min(140, 1600 / Math.max(1, data.carCount));
    let start = 960 - width * data.carCount / 2;
    for (let i = 0; i < data.carCount; i++) {
        let number = right ? data.carCount - i : i + 1;
        let x = start + i * width;
        LCDRect(g, x + 4, 864, width - 8, 87, number === carNumber ? color : LCD_PALETTE.soft, 10);
        LCDText(g, number, x + width / 2, 925, Math.min(43, width * 0.45), width - 15, "center",
            number === carNumber ? LCD_PALETTE.paper : LCD_PALETTE.ink);
    }
    LCDArrow(g, right ? start + width * data.carCount + 35 : start - 35, 907, right, color, 22);
}

function DrawLCDDoors(g, data, panelName, door, cjk) {
    let physical = LCD_CONFIG.panelSides[panelName];
    let side = data.reversed ? (physical === "left" ? "right" : "left") : physical;
    let opensHere = door.side === side || door.side === "both";
    let key = door.side === "none" ? "doors_unknown" : door.side === "both" ? "doors_both" : opensHere ? "doors_this" : "doors_other";
    let color = door.side === "none" ? LCD_PALETTE.muted : opensHere ? LCD_PALETTE.blue : LCD_PALETTE.red;
    LCDText(g, LCDLabel(key, cjk), 960, 530, 67, 1760, "center", color);
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
    } else LCDText(g, "?", 960, 817, 135, 160, "center", color);
    LCDText(g, LCDLabel("notice", cjk), 960, 1030, 36, 1790, "center", LCD_PALETTE.muted);
}
