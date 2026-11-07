include(Resources.id("mtrsteamloco:scripts/display_helper.js"));
include(Resources.id("mtr:jr_east_e233.train_vision.config.js"));
function LCDResolveVehiclePanelConfig(vehicleId) {
    var base = infoPanelConfig;
    var variants = base.lcdPositions || {};
    var id = String(vehicleId == null ? "" : vehicleId);
    var exact = Object.prototype.hasOwnProperty.call(variants, id) ? variants[id] : null;
    var resolved = { version: base.version, texSize: base.texSize, slots: [] };
    base.slots.forEach(function (slot) {
        var copy = {};
        Object.keys(slot).forEach(function (key) { copy[key] = slot[key]; });
        var specific = exact && exact[slot.name] ? exact[slot.name] : {};
        ["pos", "offsets"].forEach(function (key) {
            if (Object.prototype.hasOwnProperty.call(specific, key)) copy[key] = specific[key];
        });
        resolved.slots.push(copy);
    });
    return { key: exact ? id : "default", config: resolved };
}
var infoPanelGenerators = {};
var e233VariantIds = Object.keys(infoPanelConfig.lcdPositions || {});
for (var i = 0; i < e233VariantIds.length; i++) {
    var id = e233VariantIds[i];
    infoPanelGenerators[id] = new DisplayHelper(LCDResolveVehiclePanelConfig(id).config);
}
infoPanelGenerators.default = new DisplayHelper(infoPanelConfig);
include(Resources.id("jsblock:scripts/train_vision/main.js"));
