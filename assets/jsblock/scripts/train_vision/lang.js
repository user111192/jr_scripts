// _cjk 用于当前语言轮播内容包含 CJK 时。可把这些文本改成日文、中文等。
// %s 为替换值；无 _cjk 后缀的是非 CJK 固定文本。
var LCD_LANG = {
    next_cjk: "下一站", next: "Next",
    arriving_cjk: "即将到达", arriving: "Arriving",
    arrived_cjk: "本站", arrived: "Now at",
    destination_cjk: "%s行", destination: "for %s",
    terminus_cjk: "%s止", terminus: "Terminates at %s",
    depot_cjk: "车厂", depot: "Depot",
    out_of_service_cjk: "回送", out_of_service: "Out of service",
    car_cjk: "%s 号车", car: "Car %s",
    transfer_cjk: "换乘", transfer: "Transfer",
    via_cjk: "经 %s 换乘", via: "Change via %s",
    through_cjk: "直通 %s", through: "Through to %s",
    next_type_cjk: "直通后 %s", next_type: "Then %s",
    local_map_cjk: "沿途停靠站", local_map: "Upcoming stops",
    full_map_cjk: "全线图", full_map: "Route overview",
    platform_cjk: "站台信息", platform: "Platform information",
    platform_number_cjk: "%s 站台", platform_number: "Platform %s",
    doors_cjk: "下车方向", doors: "Exit side",
    doors_this_cjk: "本侧车门开启", doors_this: "Doors open on this side",
    doors_other_cjk: "对侧车门开启", doors_other: "Doors open on the other side",
    doors_both_cjk: "两侧车门开启", doors_both: "Doors open on both sides",
    doors_unknown_cjk: "车门状态未知", doors_unknown: "Door status unknown",
    notice_cjk: "请勿倚靠车门 · 下车时留意站台间隙",
    notice: "Keep clear of the doors · Mind the gap",
    wait_cjk: "PLEASE WAIT", wait: "PLEASE WAIT",
    unavailable_cjk: "NOT AVAIL", unavailable: "NOT AVAIL",
    coming_soon_cjk: "COMING SOON", coming_soon: "COMING SOON"
};

function LCDLabel(key, cjk, value) {
    let text = LCD_LANG[key + (cjk ? "_cjk" : "")];
    if (text == null) text = LCD_LANG[key] || key;
    return value == null ? String(text) : String(text).replace("%s", String(value));
}

function LCDName(name) {
    return name == null ? "" : String(TextUtil.getNonExtraParts(String(name)));
}

// 不维护自己的语言计时器，直接跟随 MTR/JCM 的内置语言轮播。
function LCDCycle(name) {
    return String(TextUtil.cycleString(LCDName(name)));
}

function LCDTransferLabel(route) {
    return LCDCycle(route.name) + (route.stationName ? " [" + LCDCycle(route.stationName) + "]" : "");
}
