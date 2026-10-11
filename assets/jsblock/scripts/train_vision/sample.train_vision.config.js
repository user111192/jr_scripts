// DisplayHelper 屏幕安装配置；在 main.js 前加载。
var infoPanelConfig = {
    // fontScale 为字体倍率；减少每页站数可以给大字留出空间。
    layout: {fontScale: 1.45, localStations: 5, fullMapStationsPerPage: 10, transferColumnsPerPage: 2},
    "version": 1,
    "texSize": [
        1920,
        2160
    ],
    "slots": [
        {
            "name": "info-panel-l",
            "texArea": [
                0,
                0,
                1920,
                1080
            ],
            "pos": [
                [
                    [
                        0.6595,
                        2.088,
                        -0.4
                    ],
                    [
                        0.7775,
                        2.02,
                        -0.4
                    ],
                    [
                        0.7775,
                        2.02,
                        0.4
                    ],
                    [
                        0.6595,
                        2.088,
                        0.4
                    ]
                ]
            ],
            "offsets": [
                [
                    0,
                    0,
                    7.5
                ],
                [
                    0,
                    0,
                    2.5
                ],
                [
                    0,
                    0,
                    -2.5
                ],
                [
                    0,
                    0,
                    -7.5
                ]
            ]
        },
        {
            "name": "info-panel-r",
            "texArea": [
                0,
                1080,
                1920,
                1080
            ],
            "pos": [
                [
                    [
                        -0.6595,
                        2.088,
                        0.4
                    ],
                    [
                        -0.7775,
                        2.02,
                        0.4
                    ],
                    [
                        -0.7775,
                        2.02,
                        -0.4
                    ],
                    [
                        -0.6595,
                        2.088,
                        -0.4
                    ]
                ]
            ],
            "offsets": [
                [
                    0,
                    0,
                    7.5
                ],
                [
                    0,
                    0,
                    2.5
                ],
                [
                    0,
                    0,
                    -2.5
                ],
                [
                    0,
                    0,
                    -7.5
                ]
            ]
        }
    ]
};
