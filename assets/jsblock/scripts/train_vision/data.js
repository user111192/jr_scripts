// 仅在资源包加载时读取配置，render 中不访问磁盘。
var LCD_LINES = LoadLCDLines();

function LoadLCDLines() {
    let id = Resources.idr("lines.json");
    if (!Resources.exist(id)) return {};
    try {
        let value = JSON.parse(String(Resources.readString(id)));
        if (value == null || typeof value !== "object" || Array.isArray(value)) throw new Error("expected an object");
        return value;
    } catch (error) {
        print("[Train Vision] lines.json: " + error);
        return {};
    }
}

function LCDArray(list) {
    let result = [];
    if (list == null) return result;
    if (Array.isArray(list)) return list.slice();
    let iterator = list.iterator();
    while (iterator.hasNext()) result.push(iterator.next());
    return result;
}

function LCDMapEntries(map) {
    let result = [];
    if (map == null) return result;
    let iterator = map.entrySet().iterator();
    while (iterator.hasNext()) {
        let entry = iterator.next();
        result.push([String(entry.getKey()), entry.getValue()]);
    }
    return result;
}

function LCDLine(routeName) {
    let name = LCDName(routeName);
    let value = Object.prototype.hasOwnProperty.call(LCD_LINES, name) ? LCD_LINES[name] : null;
    return value != null && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function LCDStationConfig(routeName, stationName) {
    let stations = LCDLine(routeName).stations || {};
    // 车站配置按完整名称匹配，不以已轮播的局部名称匹配。
    let value = Object.prototype.hasOwnProperty.call(stations, String(stationName)) ? stations[String(stationName)] : null;
    return value != null && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function LCDRouteId(route) {
    return route == null ? "" : String(route.getId());
}

function LCDStopName(stop) {
    return stop != null && stop.station != null ? String(stop.station.getName()) : "";
}

function LCDStopReady(stop) {
    return stop != null && stop.station != null && stop.route != null && stop.platform != null;
}

function LCDDestination(stop, routeStops) {
    // destinationName 已包含 MTR 对先前自定义目的地的传播和默认终点规则。
    if (stop == null) return "";
    let destination = LCDName(stop.destinationName);
    if (destination.length) return destination;
    return routeStops.length ? LCDName(LCDStopName(routeStops[routeStops.length - 1])) : "";
}

function LCDSameStop(a, b) {
    return a != null && b != null && a.platform != null && b.platform != null &&
        String(a.platform.getId()) === String(b.platform.getId()) && Number(a.distance) === Number(b.distance);
}

function LCDTransfers(stop) {
    let result = [], seen = {};
    if (!LCDStopReady(stop)) return result;
    function add(route, stationName) {
        let name = LCDName(route.name);
        // MTR 可能返回同色同名线路的重复方向，去重但保留异名连接站。
        let key = name + "\n" + stationName;
        if (seen[key]) return;
        seen[key] = true;
        result.push({
            name: name, color: Number(route.color), stationName: stationName,
            line: LCDLine(name), station: stationName ? LCDStationConfig(name, stationName) : {}
        });
    }
    LCDArray(stop.routeInterchanges).forEach(function (route) { add(route, ""); });
    LCDMapEntries(stop.connectingInterchanges).forEach(function (entry) {
        LCDArray(entry[1]).forEach(function (route) { add(route, entry[0]); });
    });
    return result;
}

function LCDExtraData(train) {
    // JCM 的 VehicleWrapper.getMtrVehicle 和 TSC Vehicle.vehicleExtraData 均有公开文档。
    // SimplifiedRoute 不传输路线号码，因此用车辆实时数据补充，不把 || 附加文本当种别。
    let vehicle = train.getMtrVehicle();
    return vehicle == null ? null : vehicle.vehicleExtraData;
}

function LCDUpdateRouteTypes(state, extra) {
    if (extra == null) return;
    ["Previous", "This", "Next"].forEach(function (prefix) {
        let id = String(extra["get" + prefix + "RouteId"]());
        if (id !== "0") state.routeTypes[id] = String(extra["get" + prefix + "RouteNumber"]());
    });
}

function LCDRouteType(state, route, stops) {
    let id = LCDRouteId(route);
    if (Object.prototype.hasOwnProperty.call(state.routeTypes, id)) return state.routeTypes[id];
    // 完整 Route（如附近站台数据包含它）也可以提供号码。
    for (let i = 0; i < stops.length; i++) {
        let platform = stops[i].platform;
        if (platform == null || platform.routes == null) continue;
        let routes = LCDArray(platform.routes);
        for (let j = 0; j < routes.length; j++) {
            if (LCDRouteId(routes[j]) === id && typeof routes[j].getRouteNumber === "function") {
                let type = String(routes[j].getRouteNumber());
                state.routeTypes[id] = type;
                return type;
            }
        }
    }
    return null; // 未传输和空种别不同，前者显示 PLEASE WAIT，后者留白。
}

function BuildLCDData(state, train) {
    let data = {
        ready: false, depot: false, stops: [], transfers: [], through: false,
        carCount: train.getCarCount(), trainLength: 0, reversed: train.isReversed(),
        speed: Number(train.getSpeedKmh()), doorValue: Number(train.getDoorValue())
    };
    for (let i = 0; i < data.carCount; i++) data.trainLength += Number(train.getLength(i));
    LCDUpdateRouteTypes(state, LCDExtraData(train));
    if (!train.isOnRoute()) { data.ready = true; data.depot = true; return data; }
    // ALL 仍会在车站/路线到达之前调用 render，必须先检查 stops 本身。
    if (!train.isStopsDataFetched()) return data;
    let rawStops = train.getThisRouteStops();
    let stops = LCDArray(rawStops);
    if (!stops.length) { data.ready = true; data.depot = true; return data; }
    if (!stops.every(LCDStopReady)) return data;
    let nextIndex = Number(train.getNextStopIndex(rawStops, 0));
    let progress = Number(train.getRailProgress());
    data.progress = progress;
    data.nextIndex = Math.max(0, Math.min(nextIndex, stops.length));
    data.stop = stops[Math.min(data.nextIndex, stops.length - 1)];
    let distance = Number(data.stop.distance);
    // 原逻辑中的 50 改成全列总长度（米）。到站窗口兼容列车已经停在站台的状态。
    data.hasArrived = distance >= 0 && progress >= distance - data.trainLength && progress <= distance;
    data.docked = data.hasArrived && (data.speed < 0.5 || data.doorValue > 0);
    data.approaching = !data.hasArrived && distance >= progress &&
        distance - progress <= Math.max(LCD_CONFIG.approachMeters, data.trainLength * 2);
    data.route = data.stop.route;
    data.stationName = LCDStopName(data.stop);
    data.routeName = String(data.route.getName());
    data.routeColor = Number(data.route.getColor());
    data.type = LCDRouteType(state, data.route, stops);
    data.destination = LCDDestination(data.stop, stops);
    data.platformNumber = String(data.stop.platform.getName());
    data.stationConfig = LCDStationConfig(data.routeName, data.stationName);
    data.line = LCDLine(data.routeName);
    data.transfers = LCDTransfers(data.stop);
    data.stops = stops.slice();
    data.mapReady = true;
    data.throughReady = true;

    // getNextRouteStops 在部分 JCM 版本的数据未齐时会解引用 route=null。
    // 先检查 allStops，未齐时让依赖完整图的区域等待。
    let allStops = LCDArray(train.getStops());
    let allReady = allStops.every(LCDStopReady);
    let upcoming = allReady ? LCDArray(train.getNextRouteStops()) : [];
    if (!allReady || !upcoming.every(LCDStopReady)) {
        data.mapReady = false;
        data.throughReady = false;
    } else if (upcoming.length) {
        let last = stops[stops.length - 1];
        let first = upcoming[0];
        // 交接站使用下一路线的 roundUpRoute 信息，不能比较同一个旧路线 Stop。
        if (first.isRouteSwitchoverStop && first.roundUpRoute != null) first = first.roundUpRoute;
        let a = LCDDestination(last, stops), b = LCDDestination(first, upcoming);
        data.through = a.length > 0 && a === b;
        if (data.through) {
            data.throughRoute = first.route;
            data.throughName = String(first.route.getName());
            data.throughType = LCDRouteType(state, first.route, upcoming);
            let start = LCDSameStop(last, upcoming[0]) ? 1 : 0;
            data.stops = stops.concat(upcoming.slice(start));
        }
    }
    data.terminating = !data.through && data.hasArrived && data.nextIndex >= stops.length - 1;
    if (data.nextIndex >= stops.length && !data.docked) data.depot = true;
    data.ready = true;
    return data;
}

function LCDTravelRight(panelSide, reversed) {
    return (panelSide === "left") !== Boolean(reversed);
}

function LCDDoorState(data, train, carIndex) {
    let leftArray = train[LCD_CONFIG.actualDoorSides.left];
    let rightArray = train[LCD_CONFIG.actualDoorSides.right];
    let left = leftArray != null && Boolean(leftArray[carIndex]);
    let right = rightArray != null && Boolean(rightArray[carIndex]);
    let anyOpen = false;
    for (let i = 0; i < data.carCount; i++) {
        anyOpen = anyOpen || (train.doorLeftOpen != null && Boolean(train.doorLeftOpen[i])) ||
            (train.doorRightOpen != null && Boolean(train.doorRightOpen[i]));
    }
    if (anyOpen || data.doorValue > 0) {
        // JCM 实际车门数组是模型坐标；转为行进方向下的左右，供屏幕与配置一致使用。
        if (data.reversed) { let temp = left; left = right; right = temp; }
        return { side: left && right ? "both" : left ? "left" : right ? "right" : "none", actual: true };
    }
    let doors = data.stationConfig == null ? {} : data.stationConfig.door || {};
    let side = doors[data.platformNumber];
    if (["left", "right", "both", "none"].indexOf(side) < 0) side = "none";
    return { side: side, actual: false };
}

function LCDPagePlan(data) {
    let pages = ["local"];
    let count = Math.ceil(data.transfers.length / (5 * LCD_CONFIG.transferColumnsPerPage));
    for (let i = 0; i < count; i++) pages.push("transfer:" + i);
    pages.push("platform");
    let maps = Math.max(1, Math.ceil(data.stops.length / LCD_CONFIG.fullMapStationsPerPage));
    for (let i = 0; i < maps; i++) pages.push("full:" + i);
    return pages;
}

function LCDSelectPage(state, data, panelName, door, now) {
    if (!data.ready || data.depot) return "local";
    let mode = data.docked ? "docked" : data.hasArrived || data.approaching ? "approach" : "running";
    let key = LCDRouteId(data.route) + ":" + String(data.stop.platform.getId()) + ":" + data.stop.distance + ":" + mode;
    if (state.pageKey !== key) { state.pageKey = key; state.pageStarted = now; }
    let elapsed = Math.max(0, now - state.pageStarted);
    let slot = Math.floor(elapsed / LCD_CONFIG.pageSeconds);
    let physicalSide = LCD_CONFIG.panelSides[panelName];
    let side = data.reversed ? (physicalSide === "left" ? "right" : "left") : physicalSide;
    let thisSide = door.side === "both" || door.side === side;
    if (mode === "docked") return thisSide ? "platform" : "local";
    if (mode === "approach") return slot === 0 ? "platform" : "doors";
    let pages = LCDPagePlan(data);
    return pages[slot % pages.length];
}

// WIP: 未接入停站时间/速度曲线。保留到站时间接口，不返回虚构分钟数。
function LCDGetArrivalMinutes(data, stop) {
    return null;
}
