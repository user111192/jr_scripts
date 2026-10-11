// Node only supplies test doubles; production scripts run under JCM/Rhino.
const fs = require('fs');
const vm = require('vm');
const assert = require('node:assert/strict');
const base = 'assets/jsblock/scripts/train_vision/';
let tick = 0;
const c = {
    print: () => { },
    Resources: { idr: x => x, exist: () => false },
    TextUtil: {
        getNonExtraParts: s => s.split('||')[0],
        cycleString: s => s.split('|')[tick % s.split('|').length],
        isCjk: s => /[\u3040-\u30ff\u3400-\u9fff]/.test(s)
    }
};
vm.createContext(c);
['config.js', 'lang.js', 'data.js', 'layout.js'].forEach(file => vm.runInContext(fs.readFileSync(base + file, 'utf8'), c));
const json = x => JSON.parse(JSON.stringify(x));
const list = items => ({
    size: () => items.length, get: i => items[i], iterator: () => {
        let i = 0; return { hasNext: () => i < items.length, next: () => items[i++] };
    }
});
const map = object => ({ entrySet: () => list(Object.entries(object).map(([k, v]) => ({ getKey: () => k, getValue: () => v }))) });
const route = (id, name, type) => ({
    getId: () => id, getName: () => name, getColor: () => 0x1576bc,
    getRouteNumber: () => type
});
const r1 = route(1, '本线|Main||extra', '普通|Local');
const r2 = route(2, '直通线|Through', '急行|Express');
const stop = (id, name, distance, route, destination = '终点|Terminus') => ({
    station: { getName: () => name }, route,
    platform: { getId: () => id, getName: () => '2', routes: list([route]) },
    distance, destinationName: destination, routeInterchanges: list([]), connectingInterchanges: map({})
});
let stops = [stop(1, '始发|Start', 100, r1), stop(2, '中间|Middle', 1000, r1), stop(3, '交接|Junction', 2000, r1)];
let upcoming = [stop(3, '交接|Junction', 2000, r2), stop(4, '终点|Terminus', 3000, r2)];
let progress = 750, fetched = true, onRoute = true, speed = 50;
let nextIndex = 1;
const train = {
    getCarCount: () => 3, getLength: i => [20, 22, 24][i], isReversed: () => false,
    getSpeedKmh: () => speed, getDoorValue: () => 0,
    isOnRoute: () => onRoute, isStopsDataFetched: () => fetched,
    getThisRouteStops: () => list(stops), getNextRouteStops: () => list(upcoming),
    getStops: () => list(stops.concat(upcoming.slice(1))),
    getNextStopIndex: () => nextIndex, getRailProgress: () => progress,
    getMtrVehicle: () => ({
        vehicleExtraData: {
            getPreviousRouteId: () => 0, getPreviousRouteNumber: () => '',
            getThisRouteId: () => 1, getThisRouteNumber: () => '普通|Local',
            getNextRouteId: () => 1, getNextRouteNumber: () => '普通|Local'
        }
    }),
    doorLeftOpen: [false, false, false], doorRightOpen: [false, false, false]
};
const state = { routeTypes: {}, pageKey: null, pageStarted: 0 };
let d = c.BuildLCDData(state, train);
assert.equal(d.trainLength, 66);
assert.equal(d.hasArrived, false);
assert.equal(d.through, true);
assert.equal(d.stops.length, 4); // shared junction is not duplicated
assert.equal(d.type, '普通|Local');
assert.equal(d.throughType, '急行|Express');
progress = 935;
d = c.BuildLCDData(state, train);
assert.equal(d.hasArrived, true); // 65m away: old 50m rule would fail
progress = 933;
assert.equal(c.BuildLCDData(state, train).hasArrived, false);

c.LCD_LINES = {
    '本线|Main': { code: 'M', style: '{}', stations: { '中间|Middle': { num: '02', door: { '2': 'right' } } } },
    '连接线|Link': { code: 'L', stations: { '连接站|Link Station': { num: '09' } } }, type_colors: {}
};
d = c.BuildLCDData(state, train);
assert.equal(d.stationConfig.num, '02');
assert.equal(c.LCDLine('本线|Main||different').code, 'M');
assert.equal(c.LCDStationConfig('本线|Main', '不存在|Absent').num, undefined);
assert.equal(c.LCDDoorState(d, train, 1).side, 'right');
train.doorRightOpen[0] = true;
assert.equal(c.LCDDoorState(d, train, 0).side, 'left'); // actual overrides right prediction
assert.equal(c.LCDDoorState(d, train, 1).side, 'none'); // another car opening must not use prediction
assert.equal(c.LCDDoorState({ ...d, reversed: true }, train, 0).side, 'right');
train.doorRightOpen[0] = false;
assert.deepEqual([c.LCDTravelRight('left', false), c.LCDTravelRight('right', false), c.LCDTravelRight('left', true), c.LCDTravelRight('right', true)], [true, false, false, true]);

stops[1].routeInterchanges = list(Array.from({ length: 7 }, (_, i) => ({ name: '线' + i + '|Line ' + i, color: i })));
stops[1].connectingInterchanges = map({ '连接站|Link Station': list([{ name: '连接线|Link', color: 12 }]) });
d = c.BuildLCDData(state, train);
assert.equal(d.transfers.length, 8);
assert.equal(d.transfers[7].station.num, '09');
assert.equal(c.LCDSelectPage(state, d, 'info-panel-l', { side: 'none' }, 0), 'platform'); // approaching
assert.equal(c.LCDSelectPage(state, d, 'info-panel-l', { side: 'none' }, 6), 'doors');
progress = 600;
d = c.BuildLCDData(state, train);
assert.equal(c.LCDSelectPage(state, d, 'info-panel-l', { side: 'none' }, 10), 'local');
assert.equal(c.LCDSelectPage(state, d, 'info-panel-l', { side: 'none' }, 16), 'transfer:0');
assert.equal(c.LCDSelectPage(state, d, 'info-panel-l', { side: 'none' }, 22), 'platform');
assert.equal(c.LCDSelectPage(state, d, 'info-panel-l', { side: 'none' }, 28), 'full:0');
assert.equal(c.LCDSelectPage(state, d, 'info-panel-l', { side: 'none' }, 34), 'local');
const many = { ...d, transfers: Array.from({ length: 17 }, (_, i) => i), stops: Array(35).fill(stops[0]) };
assert.deepEqual(json(c.LCDPagePlan(many)), ['local', 'transfer:0', 'transfer:1', 'platform', 'full:0', 'full:1', 'full:2']);
assert.deepEqual(json(c.LCDPagePlan({ ...d, transfers: [] })), ['local', 'platform', 'full:0']);

progress = 1000; speed = 0;
d = c.BuildLCDData(state, train);
assert.equal(c.LCDSelectPage(state, d, 'info-panel-r', { side: 'right' }, 50), 'platform');
assert.equal(c.LCDSelectPage(state, d, 'info-panel-l', { side: 'right' }, 50), 'local');
upcoming[0].destinationName = '不同终点|Different';
assert.equal(c.BuildLCDData(state, train).through, false);
assert.equal(c.BuildLCDData(state, train).stops.length, 3);
upcoming[0].destinationName = '终点|Terminus';
stops[1].destinationName = '自定义|Custom';
assert.equal(c.BuildLCDData(state, train).destination, '自定义|Custom');
nextIndex = 2; progress = 2000; upcoming = [];
d = c.BuildLCDData(state, train);
assert.equal(d.terminating, true);
nextIndex = 3; progress = 2010; speed = 40;
assert.equal(c.BuildLCDData(state, train).depot, true);
fetched = false;
assert.equal(c.BuildLCDData(state, train).ready, false);
onRoute = false;
assert.equal(c.BuildLCDData(state, train).depot, true);
onRoute = true; fetched = true; nextIndex = 1;
stops[1].station = null;
assert.equal(c.BuildLCDData(state, train).ready, false);
stops[1].station = { getName: () => '中间|Middle' };
stops[1].route = null;
assert.equal(c.BuildLCDData(state, train).ready, false);
stops[1].route = r1;
upcoming = [stop(4, '下一线|Next line', 3000, r2)];
upcoming[0].station = null;
d = c.BuildLCDData(state, train);
assert.equal(d.ready, true);
assert.equal(d.mapReady, false);
assert.equal(c.LCDLabel('destination', true, '终点'), '终点行');
assert.equal(c.LCDLabel('destination', false, 'Terminus'), 'for Terminus');
tick = 0; assert.equal(c.LCDCycle('站|Station||hidden'), '站');
tick = 1; assert.equal(c.LCDCycle('站|Station||hidden'), 'Station');
console.log('PASS: train length, arrival, ALL readiness, destinations, through service, route numbers, config keys, transfers, doors, reverse, language and six-second page sequencing');

assert.strictEqual(c.LCD_CONFIG.showTravelMinutes, true);
assert.strictEqual(c.LCDGetArrivalMinutes({}, {}), null);
assert.deepStrictEqual(json(c.LCDTransferCells(4)).map(x => [x.column, x.row]), [[0,0],[1,0],[0,1],[1,1]]);
assert.strictEqual(c.LCDTransferCells(5)[4].centered, true);
assert.deepStrictEqual(json(c.LCDTransferCells(8)).map(x => [x.column, x.row]), [[0,0],[0,1],[0,2],[0,3],[0,4],[1,0],[1,1],[1,2]]);
for (const [w,h] of [[640,360],[1920,480],[1080,1080]]) {
    const l=c.LCDLayout(w,h);
    assert.strictEqual(l.h*l.scale,h);
    assert.ok(Math.abs((l.bodyTop+l.bodyHeight)*l.scale-h)<0.001);
}
console.log('PASS: responsive layout, transfer placement and WIP minutes toggle');

// 安装面的比例/倾角/重复位置必须与真实车辆模型及各车型定义一致。
const panelScope={};
vm.runInNewContext(fs.readFileSync('assets/mtr/jr_kyushu_305_v2.train_vision.config.js','utf8'),panelScope);
const panelConfig=json(panelScope.infoPanelConfig);
for (const slot of panelConfig.slots) {
    const [top,bottom,other]=slot.pos[0];
    const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
    assert.ok(Math.abs(distance(bottom,other)/distance(top,bottom)-4)<0.0001);
    assert.ok(Math.abs(Math.atan2(Math.abs(top[0]-bottom[0]),top[1]-bottom[1])*180/Math.PI-15)<0.001);
    assert.strictEqual(slot.texArea[2]/slot.texArea[3],4);
}
const registration=JSON.parse(fs.readFileSync('assets/mtr/mtr_custom_resources.json','utf8'));
for (const vehicle of registration.vehicles) {
    const model=vehicle.models[0];
    const properties=JSON.parse(fs.readFileSync('assets/mtr/'+model.modelPropertiesResource.split(':')[1],'utf8'));
    const definitions=JSON.parse(fs.readFileSync('assets/mtr/'+model.positionDefinitionsResource.split(':')[1],'utf8'));
    const part=properties.parts.find(p=>p.names.includes('door_interior'));
    const definition=definitions.positionDefinitions.find(d=>d.name===part.positionDefinitions[0]);
    assert.deepStrictEqual(panelConfig.slots[0].offsets.map(p=>p[2]).sort((a,b)=>a-b),definition.positions.map(p=>p.z/16).sort((a,b)=>a-b));
}
console.log('PASS: 305 screen aspect, slope and door positions for all four vehicle variants');
