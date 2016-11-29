/*
 *  *****************************************************************************
 *  *
 *  * StoryPlaces
 *  *
 *
 * This application was developed as part of the Leverhulme Trust funded
 * StoryPlaces Project. For more information, please visit storyplaces.soton.ac.uk
 *
 * Copyright (c) 2016
 *   University of Southampton
 *     Charlie Hargood, cah07r.ecs.soton.ac.uk
 *     Kevin Puplett, k.e.puplett.soton.ac.uk
 * 	David Pepper, d.pepper.soton.ac.uk
 *
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * The name of the Universities of Southampton nor the name of its
 * 	  contributors may be used to endorse or promote products derived from
 * 	  this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE ABOVE COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ****************************************************************************
 */

"use strict";

const V2 = require('../../bin/schemaUpgraders/draft-02');
let v2 = undefined;

describe("V2 upgrader", function () {

    beforeEach(function () {
        v2 = new V2.v2();
    });

    afterEach(function () {
        v2 = undefined;
    });

    it("renames deck to pages at the top level of the schema", function () {
        let result = v2.upgrade({
            deck: [
                {test: true}
            ],
            other: true
        });

        expect(result).toEqual({
            pages: [
                {test: true}
            ],
            other: true
        });
    });

    it("renames deckMapViewSettings to pagesMapViewSettings", function () {
        let result = v2.upgrade({
            deckMapViewSettings: {test: true},
            other: true
        });

        expect(result).toEqual({
            pagesMapViewSettings: {test: true},
            other: true
        });
    });

    it("renames instances of card to page in deckMapViewSettings", function () {
        let result = v2.upgrade({
            deckMapViewSettings: {
                cardArrows: true,
                cardDistance: true
            },
            other: true
        });

        expect(result).toEqual({
            pagesMapViewSettings: {
                pageArrows: true,
                pageDistance: true
            },
            other: true
        });
    });

    it("removes instances of deckviewmode", function () {
        let result = v2.upgrade({
            deckviewmode: {test: true},
            other: true
        });

        expect(result).toEqual({
            other: true
        });
    });

    it("renames conditions to lower case in functions", function () {
        let result = v2.upgrade({
            functions: [
                {Conditions: [{test: true}]},
                {conditions: [{test: true}]}
            ]
        });

        expect(result).toEqual({
            functions: [
                {conditions: [{test: true}]},
                {conditions: [{test: true}]}
            ]
        });
    });

    it("renames conditions to lower case in pages", function () {
        let result = v2.upgrade({
            deck: [
                {Conditions: [{test: true}]},
                {conditions: [{test: true}]}
            ]
        });

        expect(result).toEqual({
            pages: [
                {conditions: [{test: true}]},
                {conditions: [{test: true}]}
            ]
        });
    });

    it("renames conditions to lower case at the top level", function () {
        let result = v2.upgrade({
            Conditions: [
                {thing: [{test: true}]},
                {thing: [{test: true}]}
            ]
        });

        expect(result).toEqual({
            conditions: [
                {thing: [{test: true}]},
                {thing: [{test: true}]}
            ]
        });
    });

    it("corrects comparisson to comparison in conditions", function () {
        let result = v2.upgrade({
            conditions: [
                {type: "comparison", other: true},
                {type: "comparisson", other: true}
            ]
        });

        expect(result).toEqual({
            conditions: [
                {type: "comparison", other: true},
                {type: "comparison", other: true}
            ]
        });
    });

    it("renames label to name in pages", function () {
        let result = v2.upgrade({
            deck: [
                {label: "label", other: true}
            ],
            other: true
        });

        expect(result).toEqual({
            pages: [
                {name: "label", other: true}
            ],
            other: true
        });
    });

    it("renames footerButtonMode to pageTransition in pages", function () {
        let result = v2.upgrade({
            deck: [
                {footerButtonMode: "label", other: true}
            ],
            other: true
        });

        expect(result).toEqual({
            pages: [
                {pageTransition: "label", other: true}
            ],
            other: true
        });
    });

    it("changes the format of set functions to have separate variable and values", function () {
        let result = v2.upgrade({
            functions: [
                {
                    "name": "test",
                    "type": "set",
                    "arguments": [
                        "aVariable",
                        "true"
                    ],
                    "conditions": [{test: true}]
                },
                {
                    "name": "shouldBeIgnored",
                    "type": "ignore",
                    "arguments": ["thing"],
                    "conditions": [{test: true}]
                }
            ],
            other: true
        });

        expect(result).toEqual({
            functions: [
                {
                    "name": "test",
                    "type": "set",
                    "variable": "aVariable",
                    "value": "true",
                    "conditions": [{test: true}]
                },
                {
                    "name": "shouldBeIgnored",
                    "type": "ignore",
                    "arguments": ["thing"],
                    "conditions": [{test: true}]
                }
            ],
            other: true
        });
    });

    it("renames location to locations in pages.hint", function () {
        let result = v2.upgrade({
            deck: [
                {
                    hint: {location: [{type: "point", lat: 0, lon: 0, radius: 0}], other: true},
                    other: true
                }
            ],
            other: true
        });

        expect(result.pages[0].hint.location).toBeUndefined();
        expect(result.pages[0].hint.locations).not.toBeUndefined();
        expect(result.pages[0].hint.other).toBeTruthy();
        expect(result.pages[0].other).toBeTruthy();
        expect(result.other).toBeTruthy();
    });

    it("moves locations from location conditions to a top level object changing the condition to point to new location", function () {
        let result = v2.upgrade({
            conditions: [
                {
                    type: 'location',
                    locationType: 'circle',
                    locationData: {
                        lat: "1.5",
                        lon: "2.5",
                        radius: "3.5"
                    }
                }
            ]
        });

        expect(result.conditions[0].location).not.toBeUndefined();
        expect(result.conditions[0].type).toEqual('location');

        expect(result.locations[0]).not.toBeUndefined();
        expect(result.locations[0].name).toEqual(result.conditions[0].location);
    });

    it("moves locations from location conditions to a top level converting the coordinates to numbers from strings", function () {
        let result = v2.upgrade({
            conditions: [
                {
                    type: 'location',
                    locationType: 'circle',
                    locationData: {
                        lat: "1.5",
                        lon: "2.5",
                        radius: "3.5"
                    }
                }
            ]
        });

        expect(result.locations[0].lat).toEqual(1.5);
        expect(result.locations[0].lon).toEqual(2.5);
        expect(result.locations[0].radius).toEqual(3.5);
        expect(result.locations[0].type).toEqual('circle');
    });

    it("moves locations from page hints to a top level object changing the page hint to point to new location", function () {
        let result = v2.upgrade({
            deck: [
                {
                    hint: {
                        location: [{
                            lat: "1.5",
                            lon: "2.5",
                            radius: "3.5",
                            type: "circle"
                        }]
                    }
                }
            ]
        });

        expect(result.pages[0].hint.locations.length).toEqual(1);

        expect(result.locations[0]).not.toBeUndefined();
        expect(result.locations[0].name).toEqual(result.pages[0].hint.locations[0]);
    });

    it("moves locations from page hints to a top level converting the coordinates to numbers from strings", function () {
        let result = v2.upgrade({
            deck: [
                {
                    hint: {
                        location: [
                            {
                                lat: "1.5",
                                lon: "2.5",
                                radius: "3.5",
                                type: "circle"
                            }
                        ]
                    }
                }
            ]
        });

        expect(result.locations[0].lat).toEqual(1.5);
        expect(result.locations[0].lon).toEqual(2.5);
        expect(result.locations[0].radius).toEqual(3.5);
        expect(result.locations[0].type).toEqual('circle');
    });

    it("moves point locations from page hints to a top level converting the coordinates to numbers from strings and resetting the radius if there isn't a matching circle location", function () {
        let result = v2.upgrade({
            deck: [
                {
                    hint: {
                        location: [
                            {
                                lat: "1.5",
                                lon: "2.5",
                                radius: "3.5",
                                type: "point"
                            }
                        ]
                    }
                }
            ]
        });

        expect(result.locations[0].lat).toEqual(1.5);
        expect(result.locations[0].lon).toEqual(2.5);
        expect(result.locations[0].radius).toEqual(0);
        expect(result.locations[0].type).toEqual('circle');
    });

    it("moves point locations from page hints to a top level reusing a circle location if it already exists", function () {
        let result = v2.upgrade({
            deck: [
                {
                    hint: {
                        location: [
                            {
                                lat: "1.5",
                                lon: "2.5",
                                radius: "3.5",
                                type: "circle"
                            }
                        ]
                    }
                },
                {
                    hint: {
                        location: [
                            {
                                lat: "1.5",
                                lon: "2.5",
                                radius: "3.5",
                                type: "point"
                            }
                        ]
                    }
                }
            ]
        });

        expect(result.locations[0].lat).toEqual(1.5);
        expect(result.locations[0].lon).toEqual(2.5);
        expect(result.locations[0].radius).toEqual(3.5);
        expect(result.locations[0].type).toEqual('circle');

        expect(result.locations[1]).toBeUndefined();

        expect(result.pages[0].hint.locations[0]).toEqual(result.locations[0].name);
        expect(result.pages[1].hint.locations[0]).toEqual(result.locations[0].name);
    });

    it("squashes two locations with the same data into one", function () {
        let result = v2.upgrade({
            conditions: [
                {
                    type: 'location',
                    locationType: 'circle',
                    locationData: {
                        lat: "1",
                        lon: "2",
                        radius: "3"
                    }
                },
                {
                    type: 'location',
                    locationType: 'circle',
                    locationData: {
                        lat: "1",
                        lon: "2",
                        radius: "3"
                    }
                }
            ]
        });

        expect(result.conditions[0].location).toEqual(result.locations[0].name);
        expect(result.conditions[1].location).toEqual(result.locations[0].name);
        expect(result.locations[1]).toBeUndefined();
    });

    it("disposes of any location hint locations which are malformed", function () {
        let result = v2.upgrade({
            deck: [
                {
                    hint: {
                        location: [
                            {
                                lat: "",
                                lon: "",
                                radius: "",
                                type: "circle"
                            }
                        ]
                    }
                }
            ]
        });

        expect(result).toEqual({
            pages: [
                {
                    hint: {
                        locations: []
                    }
                }
            ],
            locations: []
        })
    });

    it("disposes of any condition locations which are malformed", function () {
        let test = function() {
            v2.upgrade({
                conditions: [
                    {
                        type: 'location',
                        locationType: 'circle',
                        locationData: {
                            lat: "",
                            lon: "",
                            radius: ""
                        }
                    }
                ]
            })
        };

        expect(test).toThrow();
    });
});