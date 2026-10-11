// Rhino + Java AWT test/preview harness. Fixtures are fictional and not live MTR data.
var root = arguments[0];
var output = arguments[1];
var fontFile = arguments.length > 2 ? arguments[2] : null;
var previewTick = 0;
var Resources = {
    idr: function(x) { return x; }, exist: function() {return false;},
    getSystemFont: function() { return fontFile ? java.awt.Font.createFont(0, new java.io.File(fontFile)) : new java.awt.Font('SansSerif',0,40); }
};
var TextUtil = {
    getNonExtraParts: function(s) {return String(s).split('||')[0];},
    cycleString: function(s) { var a=String(s).split('|');return a[previewTick % a.length];},
    isCjk: function(s) {return /[\u3040-\u30ff\u3400-\u9fff]/.test(String(s));},
    getCjkParts: function(s) {return String(s).split('|').filter(function(t){return TextUtil.isCjk(t);}).join(' ');},
    getNonCjkParts: function(s) {return String(s).split('|').filter(function(t){return !TextUtil.isCjk(t);}).join(' ');}
};
var Timing = {elapsed:function(){return 10;}};
load(root+'/config.js',root+'/lang.js',root+'/data.js',root+'/formatting.js',root+'/layout.js',root+'/info-panel.js');
function route(id,name,color) {return {getId:function(){return id;},getName:function(){return name;},getColor:function(){return color;}};}
var r1=route(1,'有楽町線|Yurakucho Line',0xd6ae53), r2=route(2,'西武線|Seibu Line',0xc8813e);
var names=['池袋|Ikebukuro','東池袋|Higashi-ikebukuro','護国寺|Gokokuji','江戸川橋|Edogawabashi','飯田橋|Iidabashi','市ケ谷|Ichigaya','麹町|Kojimachi','永田町|Nagatacho','桜田門|Sakuradamon','有楽町|Yurakucho','銀座一丁目|Ginza-itchome','新富町|Shintomicho','月島|Tsukishima','豊洲|Toyosu','辰巳|Tatsumi','新木場|Shin-kiba'];
var lineNames=['丸ノ内線|Marunouchi Line','南北線|Namboku Line','半蔵門線|Hanzomon Line','銀座線|Ginza Line','都営大江戸線|Oedo Line','東西線|Tozai Line','山手線|Yamanote Line','京浜東北線|Keihin-Tohoku Line'];
var colors=[0xd93a38,0x24a887,0x936fb8,0xe8a32e,0xb52e79,0x28a2c0,0x84b34a,0x5ca5d0];
LCD_LINES={type_colors:{'各駅停車|Local':'#47769d'}};
LCD_LINES[r1.getName()]={code:'Y',style:'{"shape":"circle"}',stations:{}};
var stops=names.map(function(name,i){
    LCD_LINES[r1.getName()].stations[name]={num:String(i+9),door:{'2':'right'}};
    return {station:{getName:function(){return name;}},route:i<13?r1:r2,platform:{getId:function(){return i+1;},getName:function(){return '2';}},distance:i*1000,
      destinationName:'新木場|Shin-kiba',routeInterchanges:[],connectingInterchanges:null};
});
var transfers=lineNames.map(function(name,i){return {name:name,color:colors[i],stationName:i===0?'赤坂見附|Akasaka-mitsuke':'',line:i===1?{code:'N',style:'{"shape":"rounded"}'}:{},station:i===0?{num:'06'}:{}};});
stops[3].routeInterchanges=[{name:lineNames[0],color:colors[0]}];
stops[4].routeInterchanges=[{name:lineNames[3],color:colors[3]},{name:lineNames[1],color:colors[1]}];
var data={ready:true,depot:false,route:r1,stationName:names[4],routeName:r1.getName(),routeColor:r1.getColor(),type:'各駅停車|Local',through:true,throughName:'西武線|Seibu Line',throughType:'急行|Express',destination:'新木場|Shin-kiba',terminating:false,hasArrived:false,approaching:false,docked:false,stationConfig:{num:'13'},line:LCD_LINES[r1.getName()],platformNumber:'2',transfers:transfers,stops:stops,nextIndex:4,progress:3700,mapReady:true,carCount:10,trainLength:200,reversed:false,doorValue:0.8};
function render(name,page,changes,tick,side,door,dimensions) {
    previewTick=tick||0;
    var d={};Object.keys(data).forEach(function(k){d[k]=data[k];});
    Object.keys(changes||{}).forEach(function(k){d[k]=changes[k];});
    dimensions=dimensions||[1920,1080];
    var im=new java.awt.image.BufferedImage(dimensions[0],dimensions[1],java.awt.image.BufferedImage.TYPE_INT_RGB);
    var g=im.createGraphics();
    g.setRenderingHint(java.awt.RenderingHints.KEY_ANTIALIASING,java.awt.RenderingHints.VALUE_ANTIALIAS_ON);
    DrawInfoPanel(g,{},d,4,side||'info-panel-l',door||{side:'right',actual:true},page,dimensions[0],dimensions[1]);
    g.dispose();
    javax.imageio.ImageIO.write(im,'png',new java.io.File(output+'/'+name+'.png'));
}
new java.io.File(output).mkdirs();
render('local-cjk','local');
render('local-en','local',{},1);
render('full-map','full:0');
render('transfer','transfer:0');
render('platform','platform');
render('doors-this','doors',{},0,'info-panel-r');
render('doors-other','doors',{},1,'info-panel-l');
render('wait','local',{ready:false});
render('depot','local',{depot:true});
render('reverse','local',{reversed:true});
print('PASS: real Rhino/AWT rendered 10 LCD pages');

// 三列多换乘、超长名称、未编号和不同 style 也走真实 AWT 绘图。
render('no-number','local',{stationConfig:{}});
render('unknown-doors','doors',{},0,'info-panel-l',{side:'none',actual:false});
render('very-long-name','local',{stationName:'非常非常长的多语言换乘车站测试|A Very Long Interchange Station Name That Must Fit'});
var manyTransfers=[];
for(var i=0;i<17;i++) manyTransfers.push(transfers[i%transfers.length]);
render('many-transfers','transfer:0',{transfers:manyTransfers});
render('many-transfers-page-2','transfer:1',{transfers:manyTransfers},1);
render('badge-style','local',{line:{code:'YY',style:'{"shape":"diamond","filled":true}'}});

render('transfer-four','transfer:0',{transfers:transfers.slice(0,4)});
render('transfer-five','transfer:0',{transfers:transfers.slice(0,5)});
render('small-canvas','local',{},0,null,null,[640,360]);
render('wide-canvas','local',{},0,null,null,[1920,480]);
render('square-canvas','local',{},1,null,null,[1080,1080]);
render('wide-transfer','transfer:0',{transfers:transfers.slice(0,4)},0,null,null,[1920,480]);
LCD_CONFIG.showTravelMinutes=false;
render('minutes-hidden','local');
LCD_CONFIG.showTravelMinutes=true;

// DisplayHelper.graphicsFor 实际返回共享画笔；此替身复现该行为以检验生命周期。
var textures=[];
var DisplayHelper=function(cfg){
    this.create=function(){
        var im=new java.awt.image.BufferedImage(cfg.texSize[0],cfg.texSize[1],java.awt.image.BufferedImage.TYPE_INT_RGB);
        var g=im.createGraphics(),closed=false,uploads=0;
        var helper={model:{id:textures.length},graphicsFor:function(name){
            var slot=cfg.slots.filter(function(s){return s.name===name;})[0];
            g.setTransform(java.awt.geom.AffineTransform.getTranslateInstance(slot.texArea[0],slot.texArea[1]));
            return g;
        },upload:function(){uploads++;},close:function(){closed=true;g.dispose();},
        image:im,isClosed:function(){return closed;},uploads:function(){return uploads;}};
        textures.push(helper);return helper;
    };
};
var include=function(path){ if(String(path).indexOf('display_helper')<0)load(root+'/'+path); };
Resources.id=function(path){return path;};
var RateLimit=function(){this.shouldUpdate=function(){return true;};};
load(root+'/main.js');
var draws=0;
var ctx={getMyCars:function(){return [0,2];},getCarRenderManager:function(){return {drawModel:function(){draws++;}};}};
var train={getCarCount:function(){return 3;},getLength:function(){return 20;},isReversed:function(){return false;},
    getSpeedKmh:function(){return 0;},getDoorValue:function(){return 0;},isOnRoute:function(){return false;},
    getMtrVehicle:function(){return null;}};
var state={};create(ctx,state,train);render(ctx,state,train);render(ctx,state,train);
if(textures.length!==2||draws!==4||textures[0].uploads()!==2)throw new Error('lifecycle/render regression');
// 本测试在真实 AWT 下重复绘制两侧并读取图像，确认没有 dispose 掉共享画笔。
if(textures[0].image.getRGB(960,700)===-16777216||textures[0].image.getRGB(960,1780)===-16777216)throw new Error('atlas region not painted');
dispose(ctx,state,train);
if(!textures.every(function(t){return t.isClosed();}))throw new Error('resource leak');
print('PASS: main.js lifecycle, two atlas regions, noncontiguous car indexes, upload and cleanup');
// 实际 305 配置也走前置 JS 加载与 1920x480 双 slot 绘制。
textures=[];draws=0;
load('assets/mtr/jr_kyushu_305_v2.train_vision.config.js',root+'/main.js');
state={};create(ctx,state,train);render(ctx,state,train);
if(infoPanelConfig.texSize[1]!==960 || draws!==2)throw new Error('305 configuration not loaded');
if(textures[0].image.getRGB(960,320)===-16777216 || textures[0].image.getRGB(960,800)===-16777216)throw new Error('305 atlas region not painted');
dispose(ctx,state,train);
print('PASS: 305 JavaScript configuration and responsive atlas rendering');


// 六张代表性页面组成一个可分享的预览图。
var sheets=['local-cjk','local-en','transfer','platform','doors-this','depot'];
var sheet=new java.awt.image.BufferedImage(1280,1152,java.awt.image.BufferedImage.TYPE_INT_RGB);
var sg=sheet.createGraphics();
sg.setColor(java.awt.Color.decode('#202832'));sg.fillRect(0,0,1280,1152);
sg.setRenderingHint(java.awt.RenderingHints.KEY_INTERPOLATION,java.awt.RenderingHints.VALUE_INTERPOLATION_BICUBIC);
sheets.forEach(function(name,i){
    var x=(i%2)*640,y=Math.floor(i/2)*384;
    var source=javax.imageio.ImageIO.read(new java.io.File(output+'/'+name+'.png'));
    sg.drawImage(source,x,y+24,640,360,null);
    sg.setColor(java.awt.Color.WHITE);sg.setFont(new java.awt.Font('SansSerif',0,16));
    sg.drawString(name,x+12,y+18);
});
sg.dispose();javax.imageio.ImageIO.write(sheet,'png',new java.io.File(output+'/preview.png'));
