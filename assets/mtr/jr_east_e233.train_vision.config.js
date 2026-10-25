// JR East E233 side LCD overlays, aligned to the model's black side_display panels.
// Model element c7850190: from [20.02,33,0] to [28.02,35,0],
// rotated -90 degrees around Y at [24.02,34,0]. The face lies at X=24.02,
// spans Y=33..35 and Z=-4..4 model units. Coordinates below are /16 metres,
// with a 0.001m outward offset to prevent z-fighting.
// General positions follow the trailer's door positions. Exact vehicle ID
// overrides below use the door_interior positions from each variant's model properties.
var e233ForwardDoorOffsets = [
    [0, 0, -6.5],
    [0, 0, -2.5],
    [0, 0, 2.5],
    [0, 0, 7.5]
];
var e233MiddleDoorOffsets = [
    [0, 0, -7.5],
    [0, 0, -2.5],
    [0, 0, 2.5],
    [0, 0, 7.5]
];
var e233TailDoorOffsets = [
    [0, 0, 6.5],
    [0, 0, 2.5],
    [0, 0, -2.5],
    [0, 0, -7.5]
];

// IDs are exact MTR vehicle resource IDs. Only door offsets vary here;
// unmatched IDs keep the general slot pos/offsets and other fields untouched.
var e233LcdPositions = {};
function e233SetDoorVariant(vehicleId, offsets) {
    e233LcdPositions[vehicleId] = {
        "info-panel-l": { offsets: offsets },
        "info-panel-r": { offsets: offsets }
    };
}
["0", "1000", "3000", "5000", "6000", "7000", "8000"].forEach(function (series) {
    var prefix = "jr_east_e233-" + series + "_series_";
    e233SetDoorVariant(prefix + "cab_forwards_lcd", e233ForwardDoorOffsets);
    e233SetDoorVariant(prefix + "trailer_lcd", e233MiddleDoorOffsets);
    e233SetDoorVariant(prefix + "pantograph_trailer_lcd", e233MiddleDoorOffsets);
    e233SetDoorVariant(prefix + "cab_backwards_lcd", e233TailDoorOffsets);
});
var infoPanelConfig = {
    layout: { fontScale: 1.45, localStations: 5, fullMapStationsPerPage: 10, transferColumnsPerPage: 2 },
    version: 1,
    texSize: [1920, 960],
    lcdPositions: e233LcdPositions,
    slots: [
        {
            name: "info-panel-l",
            texArea: [0, 0, 1920, 480],
            pos: [[
                [1.50225, 2.1875, -0.25],
                [1.50225, 2.0625, -0.25],
                [1.50225, 2.0625, 0.25],
                [1.50225, 2.1875, 0.25]
            ]],
            offsets: e233MiddleDoorOffsets
        },
        {
            name: "info-panel-r",
            texArea: [0, 480, 1920, 480],
            pos: [[
                [-1.50225, 2.1875, 0.25],
                [-1.50225, 2.0625, 0.25],
                [-1.50225, 2.0625, -0.25],
                [-1.50225, 2.1875, -0.25]
            ]],
            offsets: e233MiddleDoorOffsets
        }
    ]
};
