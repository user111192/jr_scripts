// JR East E233 side LCD overlays, aligned to the model's black side_display panels.
// Model element c7850190: from [20.02,33,0] to [28.02,35,0],
// rotated -90 degrees around Y at [24.02,34,0]. The face lies at X=24.02,
// spans Y=33..35 and Z=-4..4 model units. Coordinates below are /16 metres,
// with a 0.001m outward offset to prevent z-fighting.
var infoPanelConfig = {
    layout: {fontScale: 1.45, localStations: 5, fullMapStationsPerPage: 10, transferColumnsPerPage: 2},
    version: 1,
    texSize: [1920, 960],
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
            offsets: [[0, 0, 0]]
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
            offsets: [[0, 0, 0]]
        }
    ]
};
