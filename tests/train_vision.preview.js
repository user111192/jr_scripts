// Rhino + Java AWT test/preview harness. Fixtures are fictional and not live MTR data.
var root = arguments.length > 0 ? arguments[0] : "assets/jsblock/scripts/train_vision";
var output = arguments.length > 1 ? arguments[1] : String(java.lang.System.getProperty("java.io.tmpdir")) + "/train-vision-preview";
var fontFile = arguments.length > 2 ? arguments[2] : null;
var previewTick = 0;
var Resources = {
    idr: function (x) { return x; }, exist: function () { return false; },
    getSystemFont: function () { return fontFile ? java.awt.Font.createFont(0, new java.io.File(fontFile)) : new java.awt.Font('SansSerif', 0, 40); }
};
var TextUtil = {
    getNonExtraParts: function (s) { return String(s).split('||')[0]; },
    cycleString: function (s) { var a = String(s).split('|'); return a[previewTick % a.length]; },
    isCjk: function (s) { return /[\u3040-\u30ff\u3400-\u9fff]/.test(String(s)); },
    getCjkParts: function (s) { return String(s).split('|').filter(function (t) { return TextUtil.isCjk(t); }).join(' '); },
    getNonCjkParts: function (s) { return String(s).split('|').filter(function (t) { return !TextUtil.isCjk(t); }).join(' '); }
};
var Timing = { elapsed: function () { return 10; } };
load(root + '/../../../mtr/jr_kyushu_305_v2.train_vision.config.js');
load(root + '/config.js', root + '/lang.js', root + '/data.js', root + '/formatting.js', root + '/layout.js', root + '/info-panel.js');
function route(id, name, color) { return { getId: function () { return id; }, getName: function () { return name; }, getColor: function () { return color; } }; }
var r1 = route(1, '有楽町線|Yurakucho Line', 0xd6ae53), r2 = route(2, '西武線|Seibu Line', 0xc8813e);
var names = ['池袋|Ikebukuro', '東池袋|Higashi-ikebukuro', '護国寺|Gokokuji', '江戸川橋|Edogawabashi', '飯田橋|Iidabashi', '市ケ谷|Ichigaya', '麹町|Kojimachi', '永田町|Nagatacho', '桜田門|Sakuradamon', '有楽町|Yurakucho', '銀座一丁目|Ginza-itchome', '新富町|Shintomicho', '月島|Tsukishima', '豊洲|Toyosu', '辰巳|Tatsumi', '新木場|Shin-kiba'];
var lineNames = ['丸ノ内線|Marunouchi Line', '南北線|Namboku Line', '半蔵門線|Hanzomon Line', '銀座線|Ginza Line', '都営大江戸線|Oedo Line', '東西線|Tozai Line', '山手線|Yamanote Line', '京浜東北線|Keihin-Tohoku Line'];
var colors = [0xd93a38, 0x24a887, 0x936fb8, 0xe8a32e, 0xb52e79, 0x28a2c0, 0x84b34a, 0x5ca5d0];
LCD_LINES = { type_colors: { '各駅停車|Local': '#47769d' } };
LCD_LINES[r1.getName()] = { code: 'Y', style: '{"shape":"circle"}', stations: {} };
LCD_LINES[lineNames[7]] = { code: 'JK', style: '{}' };
var stops = names.map(function (name, i) {
    LCD_LINES[r1.getName()].stations[name] = { num: String(i + 9), door: { '2': 'right' } };
    return {
        station: { getName: function () { return name; } }, route: i < 13 ? r1 : r2, platform: { getId: function () { return i + 1; }, getName: function () { return '2'; } }, distance: i * 1000,
        destinationName: '新木場|Shin-kiba', routeInterchanges: [], connectingInterchanges: null
    };
});
var transfers = lineNames.map(function (name, i) { return { name: name, color: colors[i], stationName: i === 0 ? '赤坂見附|Akasaka-mitsuke' : '', line: i === 1 ? { code: 'N', style: '{"shape":"rounded"}' } : {}, station: i === 0 ? { num: '06' } : {} }; });
stops[3].routeInterchanges = [{ name: lineNames[0], color: colors[0] }];
stops[3].connectingInterchanges = new java.util.HashMap();
var connectingRoutes = new java.util.ArrayList();
connectingRoutes.add({ name: lineNames[7], color: colors[7] });
stops[3].connectingInterchanges.put('赤坂見附|Akasaka-mitsuke', connectingRoutes);
stops[4].routeInterchanges = [{ name: lineNames[3], color: colors[3] }, { name: lineNames[1], color: colors[1] }];
var data = { ready: true, depot: false, route: r1, stationName: names[4], routeName: r1.getName(), routeColor: r1.getColor(), type: '各駅停車|Local', through: true, throughName: '西武線|Seibu Line', throughType: '急行|Express', destination: '新木場|Shin-kiba', terminating: false, hasArrived: false, approaching: false, docked: false, stationConfig: { num: '13' }, line: LCD_LINES[r1.getName()], platformNumber: '2', transfers: transfers, stops: stops, nextIndex: 4, progress: 3700, mapReady: true, carCount: 10, trainLength: 200, reversed: false, doorValue: 0.8 };
function render(name, page, changes, tick, side, door, dimensions) {
    previewTick = tick || 0;
    var d = {}; Object.keys(data).forEach(function (k) { d[k] = data[k]; });
    Object.keys(changes || {}).forEach(function (k) { d[k] = changes[k]; });
    dimensions = dimensions || [1920, 1080];
    var im = new java.awt.image.BufferedImage(dimensions[0], dimensions[1], java.awt.image.BufferedImage.TYPE_INT_RGB);
    var g = im.createGraphics();
    g.setRenderingHint(java.awt.RenderingHints.KEY_ANTIALIASING, java.awt.RenderingHints.VALUE_ANTIALIAS_ON);
    DrawInfoPanel(g, {}, d, 4, side || 'info-panel-l', door || { side: 'right', actual: true }, page, dimensions[0], dimensions[1]);
    g.dispose();
    javax.imageio.ImageIO.write(im, 'png', new java.io.File(output + '/' + name + '.png'));
}
new java.io.File(output).mkdirs();
// 记录真实 AWT 绘制调用，防止数据测试通过但图标文字没有绘制。
var originalLCDText = LCDText, drawnLabels = [];
LCDText = function () { drawnLabels.push(String(arguments[1])); return originalLCDText.apply(null, arguments); };
render('local-cjk', 'local');
if (drawnLabels.indexOf('京浜東北線 [赤坂見附]') < 0) throw new Error('connecting station missing from route map');
render('local-en', 'local', {}, 1);
if (drawnLabels.indexOf('Keihin-Tohoku Line [Akasaka-mitsuke]') < 0) throw new Error('connecting station language cycle regression');
render('full-map', 'full:0');
drawnLabels = [];
render('transfer', 'transfer:0');
if (drawnLabels.indexOf('JK') < 0) throw new Error('configured JK code not drawn in transfer guide');
LCDText = originalLCDText;
print('PASS: JK transfer guide badge and connecting-station map labels in both languages');
render('platform', 'platform');
render('doors-this', 'doors', {}, 0, 'info-panel-r');
render('doors-other', 'doors', {}, 1, 'info-panel-l');
render('wait', 'local', { ready: false });
render('depot', 'local', { depot: true });
render('reverse', 'local', { reversed: true });
print('PASS: real Rhino/AWT rendered 10 LCD pages');

// 虚构直通行程：有楽町線 → 小竹向原交接 → 西武線。
// 使用实际 BuildLCDData 合并两条路线，保证预览也验证直通判断及交接站去重。
var throughNames = ['千川|Senkawa', '小竹向原|Kotake-mukaihara', '新桜台|Shin-sakuradai', '練馬|Nerima', '中村橋|Nakamurabashi'];
var throughDestination = throughNames[4];
var throughCurrent = route(31, r1.getName(), 0xd6ae53);
var throughNext = route(32, r2.getName(), 0x277bc2);
throughCurrent.getRouteNumber = function () { return '各駅停車|Local'; };
throughNext.getRouteNumber = function () { return '急行|Express'; };
function throughStop(index, line) {
    return {
        station: { getName: function () { return throughNames[index]; } }, route: line,
        platform: { getId: function () { return 100 + index; }, getName: function () { return '2'; } },
        distance: index * 1000, destinationName: throughDestination, routeInterchanges: [], connectingInterchanges: null
    };
}
var throughCurrentStops = [throughStop(0, throughCurrent), throughStop(1, throughCurrent)];
var throughNextStops = [1, 2, 3, 4].map(function (i) { return throughStop(i, throughNext); });
function destinationPlatforms(count) {
    return Array.from({ length: count }, function () { return { getDestination: function () { return throughDestination; } }; });
}
throughCurrent.getPlatforms = function () { return destinationPlatforms(2); };
throughNext.getPlatforms = function () { return destinationPlatforms(4); };
LCD_LINES[throughNext.getName()] = { code: 'SI', style: '{"shape":"rounded"}', stations: {} };
throughNames.forEach(function (name, i) {
    var line = i <= 1 ? throughCurrent : throughNext;
    LCD_LINES[line.getName()].stations[name] = { num: String(i <= 1 ? 6 - i : i + 2) };
});
var throughTrain = {
    getCarCount: function () { return 10; }, getLength: function () { return 20; },
    getMtrVehicle: function () { return null; },
    isReversed: function () { return false; }, getSpeedKmh: function () { return 60; }, getDoorValue: function () { return 0; },
    isOnRoute: function () { return true; }, isStopsDataFetched: function () { return true; },
    getThisRouteStops: function () { return throughCurrentStops; }, getNextRouteStops: function () { return throughNextStops; },
    getStops: function () { return throughCurrentStops.concat(throughNextStops.slice(1)); },
    getNextStopIndex: function () { return 1; }, getRailProgress: function () { return 500; }
};
var throughData = BuildLCDData({ routeTypes: { '31': '各駅停車|Local', '32': '急行|Express' } }, throughTrain);
if (!throughData.through || throughData.stops.length !== 5 || throughData.throughType !== '急行|Express') throw new Error('through preview route merge regression');
render('through-local-cjk', 'local', throughData, 0, null, null, [1840, 1040]);
render('through-local-en', 'local', throughData, 1, null, null, [1840, 1040]);
render('through-full-map', 'full:0', throughData, 0, null, null, [1840, 1040]);
print('PASS: through-service preview uses merged routes, one junction and next-route type');

// 三列多换乘、超长名称、未编号和不同 style 也走真实 AWT 绘图。
render('no-number', 'local', { stationConfig: {} });
render('unknown-doors', 'doors', {}, 0, 'info-panel-l', { side: 'none', actual: false });
render('very-long-name', 'local', { stationName: '非常非常长的多语言换乘车站测试|A Very Long Interchange Station Name That Must Fit' });
var manyTransfers = [];
for (var i = 0; i < 17; i++) manyTransfers.push(transfers[i % transfers.length]);
render('many-transfers', 'transfer:0', { transfers: manyTransfers });
render('many-transfers-page-2', 'transfer:1', { transfers: manyTransfers }, 1);
render('badge-style', 'local', { line: { code: 'YY', style: '{"shape":"diamond","filled":true}' } });

render('transfer-four', 'transfer:0', { transfers: transfers.slice(0, 4) });
render('transfer-five', 'transfer:0', { transfers: transfers.slice(0, 5) });
render('small-canvas', 'local', {}, 0, null, null, [640, 360]);
render('wide-canvas', 'local', {}, 0, null, null, [1920, 480]);
render('square-canvas', 'local', {}, 1, null, null, [1080, 1080]);
render('wide-transfer', 'transfer:0', { transfers: transfers.slice(0, 4) }, 0, null, null, [1920, 480]);
LCD_CONFIG.showTravelMinutes = false;
render('minutes-hidden', 'local');
LCD_CONFIG.showTravelMinutes = true;

render('305-local', 'local', {}, 0, null, null, [1840, 1040]);
render('docked-markers', 'local', { hasArrived: true, docked: true });
var savedScale = infoPanelConfig.layout.fontScale;
infoPanelConfig.layout.fontScale = 2;
render('large-font', 'local');
render('large-font-wide', 'local', {}, 0, null, null, [1920, 480]);
infoPanelConfig.layout.fontScale = savedScale;

infoPanelConfig = undefined;

// DisplayHelper.graphicsFor 实际返回共享画笔；此替身复现该行为以检验生命周期。
var textures = [];
var DisplayHelper = function (cfg) {
    this.create = function () {
        var im = new java.awt.image.BufferedImage(cfg.texSize[0], cfg.texSize[1], java.awt.image.BufferedImage.TYPE_INT_RGB);
        var g = im.createGraphics(), closed = false, uploads = 0;
        var helper = {
            model: { id: textures.length }, graphicsFor: function (name) {
                var slot = cfg.slots.filter(function (s) { return s.name === name; })[0];
                g.setTransform(java.awt.geom.AffineTransform.getTranslateInstance(slot.texArea[0], slot.texArea[1]));
                return g;
            }, upload: function () { uploads++; }, close: function () { closed = true; g.dispose(); },
            image: im, isClosed: function () { return closed; }, uploads: function () { return uploads; }
        };
        textures.push(helper); return helper;
    };
};
var include = function (path) { if (String(path).indexOf('display_helper') < 0) load(root + '/' + path); };
Resources.id = function (path) { return path; };
var RateLimit = function () { this.shouldUpdate = function () { return true; }; };
load(root + '/main.js');
var draws = 0;
var ctx = { getMyCars: function () { return [0, 2]; }, getCarRenderManager: function () { return { drawModel: function () { draws++; } }; } };
var train = {
    getCarCount: function () { return 3; }, getLength: function () { return 20; }, isReversed: function () { return false; },
    getSpeedKmh: function () { return 0; }, getDoorValue: function () { return 0; }, isOnRoute: function () { return false; },
    getMtrVehicle: function () { return null; }
};
var state = {}; create(ctx, state, train); render(ctx, state, train); render(ctx, state, train);
if (textures.length !== 2 || draws !== 4 || textures[0].uploads() !== 2) throw new Error('lifecycle/render regression');
// 本测试在真实 AWT 下重复绘制两侧并读取图像，确认没有 dispose 掉共享画笔。
if (textures[0].image.getRGB(960, 700) === -16777216 || textures[0].image.getRGB(960, 1780) === -16777216) throw new Error('atlas region not painted');
dispose(ctx, state, train);
if (!textures.every(function (t) { return t.isClosed(); })) throw new Error('resource leak');
print('PASS: main.js lifecycle, two atlas regions, noncontiguous car indexes, upload and cleanup');
// 实际 305 配置也走前置 JS 加载与 1840x1040 双 slot 绘制。
textures = []; draws = 0;
load(root + '/../../../mtr/jr_kyushu_305_v2.train_vision.config.js', root + '/main.js');
state = {}; create(ctx, state, train); render(ctx, state, train);
if (infoPanelConfig.texSize[1] !== 2080 || draws !== 2) throw new Error('305 configuration not loaded');
if (textures[0].image.getRGB(920, 700) === -16777216 || textures[0].image.getRGB(920, 1740) === -16777216) throw new Error('305 atlas region not painted');
dispose(ctx, state, train);
print('PASS: 305 JavaScript configuration and responsive atlas rendering');


// 将直通段也加入默认打开的总览，无需单独查找 PNG。
var sheets = ['local-cjk', 'local-en', 'transfer', 'platform', 'doors-this', 'depot', 'through-local-cjk', 'through-local-en'];
var sheetImages = sheets.map(function (name) { return javax.imageio.ImageIO.read(new java.io.File(output + '/' + name + '.png')); });
// 原尺寸拼接，不将 1920×1080 页面缩成 640×360；不同尺寸的页面居中。
var cellWidth = 0, cellImageHeight = 0, titleHeight = 48;
sheetImages.forEach(function (im) { cellWidth = Math.max(cellWidth, im.getWidth()); cellImageHeight = Math.max(cellImageHeight, im.getHeight()); });
var cellHeight = cellImageHeight + titleHeight;
var sheetWidth = cellWidth * 2, sheetHeight = Math.ceil(sheets.length / 2) * cellHeight;
var sheet = new java.awt.image.BufferedImage(sheetWidth, sheetHeight, java.awt.image.BufferedImage.TYPE_INT_RGB);
var sg = sheet.createGraphics();
sg.setColor(java.awt.Color.decode('#202832')); sg.fillRect(0, 0, sheetWidth, sheetHeight);
sheets.forEach(function (name, i) {
    var x = (i % 2) * cellWidth, y = Math.floor(i / 2) * cellHeight;
    var source = sheetImages[i];
    sg.drawImage(source, x + Math.floor((cellWidth - source.getWidth()) / 2), y + titleHeight + Math.floor((cellImageHeight - source.getHeight()) / 2), null);
    sg.setColor(java.awt.Color.WHITE); sg.setFont(new java.awt.Font('SansSerif', 0, 28));
    sg.drawString(name, x + 24, y + 34);
});
sg.dispose(); javax.imageio.ImageIO.write(sheet, 'png', new java.io.File(output + '/preview.png'));
print('Preview resolution: ' + sheetWidth + ' x ' + sheetHeight + ' (native-size pages)');
