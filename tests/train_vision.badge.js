// Rhino/AWT regression: custom resource lookup, caching, aspect ratio and fallback.
var root=arguments[0], parsing=true, reads=0, paths=[], labels=[];
var fixture=new java.awt.image.BufferedImage(80,40,java.awt.image.BufferedImage.TYPE_INT_ARGB);
var fg=fixture.createGraphics();
fg.setColor(java.awt.Color.BLUE);fg.fillRect(10,0,70,40);fg.dispose();
var Resources={
    getSystemFont:function(){return new java.awt.Font('SansSerif',0,40);},
    idr:function(path){if(!parsing)throw new Error('runtime resource lookup');paths.push(String(path));return path;},
    exist:function(path){return String(path)!=='resources/missing.png';},
    readBufferedImage:function(path){reads++;if(String(path)==='resources/broken.png')throw new Error('bad image');return fixture;}
};
var LCD_LINES={
    first:{style:{shape:'custom:sub/test.png'}},
    duplicate:{style:'{"shape":"custom:sub/test.png"}'},
    missing:{code:'JK',style:'custom:missing.png'},
    broken:{style:{shape:'custom:broken.png'}},
    invalid:{style:{shape:'custom:../outside.png'}}
};
load(root+'/config.js',root+'/formatting.js');
parsing=false;
if(paths.length!==3||paths[0]!=='resources/sub/test.png'||reads!==2)throw new Error('load/cache regression');
var im=new java.awt.image.BufferedImage(400,200,java.awt.image.BufferedImage.TYPE_INT_RGB);
var g=im.createGraphics();g.setColor(java.awt.Color.WHITE);g.fillRect(0,0,400,200);
var originalText=LCDText;
LCDText=function(){labels.push(String(arguments[1]));return originalText.apply(null,arguments);};
LCDBadge(g,100,100,100,LCD_LINES.first,null,java.awt.Color.RED,true);
LCDBadge(g,250,100,100,LCD_LINES.first,'03',java.awt.Color.RED,false);
LCDBadge(g,350,100,60,LCD_LINES.missing,null,java.awt.Color.RED,true);
LCDBadge(g,350,30,40,LCD_LINES.broken,null,java.awt.Color.RED,true);
g.dispose();
if(im.getRGB(100,90)!==java.awt.Color.BLUE.getRGB())throw new Error('custom image not drawn');
if(im.getRGB(100,60)!==java.awt.Color.WHITE.getRGB())throw new Error('image aspect ratio lost');
if(im.getRGB(53,90)!==java.awt.Color.WHITE.getRGB())throw new Error('image transparency lost');
if(labels.indexOf('03')<0||labels.indexOf('JK')<0)throw new Error('station number or fallback code missing');
if(reads!==2||paths.length!==3)throw new Error('render performed resource IO');
if(arguments.length>1)javax.imageio.ImageIO.write(im,'png',new java.io.File(arguments[1]));
print('PASS: custom badges without code, nested path, cache, aspect ratio, transparency, station number and missing/broken fallback');
