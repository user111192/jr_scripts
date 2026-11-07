include(Resources.id("mtrsteamloco:scripts/display_helper.js"));
include("jr_kyushu_305_v2.train_vision.config.js");
var infoPanelGenerators = { default: new DisplayHelper(infoPanelConfig) };
include(Resources.id("jsblock:scripts/train_vision/main.js"));
