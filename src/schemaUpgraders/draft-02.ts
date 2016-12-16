/*! *****************************************************************************
 *
 * StoryPlaces
 *

 This application was developed as part of the Leverhulme Trust funded
 StoryPlaces Project. For more information, please visit storyplaces.soton.ac.uk

 Copyright (c) $today.year
 University of Southampton
 Charlie Hargood, cah07r.ecs.soton.ac.uk
 Kevin Puplett, k.e.puplett.soton.ac.uk
 David Pepper, d.pepper.soton.ac.uk

 All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:
 * Redistributions of source code must retain the above copyright
 notice, this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright
 notice, this list of conditions and the following disclaimer in the
 documentation and/or other materials provided with the distribution.
 * The name of the Universities of Southampton nor the name of its
 contributors may be used to endorse or promote products derived from
 this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 ARE DISCLAIMED. IN NO EVENT SHALL THE ABOVE COPYRIGHT HOLDERS BE LIABLE FOR ANY
 DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

 ***************************************************************************** */

import {isNullOrUndefined} from "util";
export class v2 {
    private data;

    upgrade(sourceData) {
        this.data = Object.assign({}, sourceData);

        this.renameDeckToPages();
        this.renameCardToPage();
        this.removeDeckviewmode();
        this.correctConditionsCasing();
        this.correctSpellingOfComparison();
        this.fixKeysInPages();
        this.moveLocationsToTopLevel();
        this.changeLocationsToNumericValues();
        this.changeFunctionFormat();
        this.convertNamesToId();
        this.addAudienceToTopLevel();

        return this.data;
    }


    private renameDeckToPages() {
        v2.renameKey(this.data, 'deck', 'pages');
        v2.renameKey(this.data, 'deckMapViewSettings', 'pagesMapViewSettings')
    }


    private removeDeckviewmode() {
        delete this.data.deckviewmode;
    }

    private renameCardToPage() {
        if (this.data.pagesMapViewSettings) {
            v2.renameKey(this.data.pagesMapViewSettings, 'cardArrows', 'pageArrows');
            v2.renameKey(this.data.pagesMapViewSettings, 'cardDistance', 'pageDistance');
        }
    }


    private correctSpellingOfComparison() {
        if (this.data.conditions) {
            this.data.conditions = this.data.conditions.map(this.changeComparisonSpelling);
        }
    }


    private changeComparisonSpelling(originalCondition) {
        let condition = Object.assign({}, originalCondition);

        if (condition.type == "comparisson") {
            condition.type = "comparison";
        }

        return condition;
    }


    private correctConditionsCasing() {
        if (this.data.functions) {
            this.data.functions = this.data.functions.map(this.changeConditionsCase);
        }

        if (this.data.pages) {
            this.data.pages = this.data.pages.map(this.changeConditionsCase);
        }

        this.data = this.changeConditionsCase(this.data);
    }


    private changeConditionsCase(originalItem) {
        let item = Object.assign({}, originalItem);

        v2.renameKey(item, 'Conditions', 'conditions');
        return item;
    }


    private fixKeysInPages() {
        if (this.data.pages) {
            this.data.pages = this.data.pages.map(this.fixKeyInPage);
        }
    }


    private fixKeyInPage(originalPage) {
        let page = Object.assign({}, originalPage);

        v2.renameKey(page, 'label', 'name');
        v2.renameKey(page, 'footerButtonMode', 'pageTransition');

        if (page.hint) {
            v2.renameKey(page.hint, 'location', 'locations');
        }

        return page;
    }


    private static renameKey(array, oldKey, newKey) {
        if (oldKey in array) {
            array[newKey] = array[oldKey];
            delete array[oldKey];
        }
    }


    private locationIdExists(locationId) {
        if (!this.data.locations) {
            return false;
        }

        return this.data.locations.some(location => location.id == locationId);
    }


    private generateLocationId() {
        let locationId;

        do {
            locationId = this.generateRandomHexString(24);
        } while (this.locationIdExists(locationId));

        return locationId;
    }


    private generateRandomHexString(length) {
        let output = '';

        for (let i = 1; i <= length; i++) {
            let value = Math.round(Math.random() * 15);
            output = output.concat(value.toString(16));
        }

        return output;
    }


    private moveConditionLocationsToTopLevel() {
        if (!this.data.conditions) {
            return;
        }

        this.data.conditions = this.data.conditions.map(
            originalCondition => {
                let condition = Object.assign({}, originalCondition);

                if (condition.type != "location") {
                    return condition;
                }

                if (condition.locationType) {


                    let location = Object.assign({type: condition.locationType}, condition.locationData);

                    condition.location = this.addLocationToTopLevelAndReturnId(location);
                    if (!condition.location) {
                        throw Error("Error modifying location for condition " + condition.id);
                    }
                }
                delete condition.locationType;
                delete condition.locationData;

                return condition;
            }
        );
    }


    private locationsMatch(foundLocation, newLocation) {

        if (newLocation.type == "point") {
            return this.pointLocationMatch(foundLocation, newLocation);
        }

        if (foundLocation.type != newLocation.type) {
            return false;
        }

        switch (newLocation.type) {
            case "circle" :
                return (newLocation.lat == foundLocation.lat)
                    && (newLocation.lon == foundLocation.lon)
                    && (newLocation.radius == foundLocation.radius);
        }

        return false;
    }


    private addLocationToTopLevelAndReturnId(providedLocation) {
        let newLocation = Object.assign({}, providedLocation);

        if (!this.data.locations) {
            this.data.locations = [];
        }

        let existingLocation = this.data.locations.find(foundLocation => {
            return this.locationsMatch(foundLocation, newLocation);
        });

        if (existingLocation && existingLocation.id) {
            return existingLocation.id;
        }

        let id = this.generateLocationId();

        let locationToAdd = Object.assign({id: id}, newLocation);

        if (locationToAdd.type == "point") {
            this.convertPointLocationToCircle(locationToAdd);
        }

        if (!this.validateLocation(locationToAdd)) {
            return false;
        }

        this.data.locations.push(locationToAdd);

        return id;
    }

    private convertPointLocationToCircle(locationToAdd) {
        locationToAdd.type = "circle";
        locationToAdd.radius = 0;
    }

    private movePageHintLocationsToTopLevel() {

        if (!this.data.pages) {
            return;
        }

        this.data.pages = this.data.pages.map(
            originalPage => {
                let page = Object.assign({}, originalPage);

                if (!page.hint || !page.hint.locations) {
                    return page;
                }

                page.hint.locations = page.hint.locations.map(originalLocation => {
                    let location = Object.assign({}, originalLocation);

                    if (!location.type) {
                        return false;
                    }

                    return this.addLocationToTopLevelAndReturnId(location);
                });

                // Removes anything which was set as false from above
                page.hint.locations = page.hint.locations.filter(value => value);

                return page;
            }
        );
    }

    private moveLocationsToTopLevel() {
        this.moveConditionLocationsToTopLevel();
        this.movePageHintLocationsToTopLevel();
    }

    private changeLocationsToNumericValues() {
        if (!this.data.locations) {
            return;
        }

        this.data.locations = this.data.locations.map(
            foundLocation => {
                let location = Object.assign({}, foundLocation);

                if (location.lat) {
                    location.lat = parseFloat(location.lat);
                }

                if (location.lon) {
                    location.lon = parseFloat(location.lon);
                }

                if (location.radius) {
                    location.radius = parseFloat(location.radius);
                }

                return location;
            }
        );
    }

    private changeFunctionFormat() {
        if (!this.data.functions) {
            return;
        }

        this.data.functions = this.data.functions.map(
            foundFunction => {
                let func = Object.assign({}, foundFunction);

                if (func.type == "set" || func.type == "increment") {
                    func.variable = func.arguments[0];
                    func.value = func.arguments[1];
                    delete func.arguments;
                }

                if (func.type == "settimestamp") {
                    func.variable = func.arguments[0];
                    delete func.arguments;
                }

                return func;
            }
        )
    }

    /**
     * Work out if this point is centered at the same location as an existing circle - if so reuse it.
     * @param foundLocation
     * @param newLocation
     * @returns {boolean}
     */
    private pointLocationMatch(foundLocation: any, newLocation: any): boolean {
        return foundLocation.type == "circle" && newLocation.lat == foundLocation.lat && newLocation.lon == foundLocation.lon;
    }

    private validateLocation(locationToAdd) {
        if (locationToAdd.type == "circle") {
            return this.validateCircleLocation(locationToAdd);
        }

        return false;
    }

    private validateCircleLocation(location) {
        if (isNullOrUndefined(location.lat) || location.lat === "") {
            return false;
        }

        if (isNullOrUndefined(location.lon) || location.lon === "") {
            return false;
        }

        if (isNullOrUndefined(location.radius) || location.radius === "") {
            return false;
        }

        return true;
    }

    private convertNamesToId() {
        if (this.data.functions) {
            this.data.functions = this.data.functions.map(
                foundFunction => {
                    let func = Object.assign({}, foundFunction);
                    v2.renameKey(func, 'name', 'id')
                    return func;
                }
            );
        }

        if (this.data.conditions) {
            this.data.conditions = this.data.conditions.map(
                foundCondition => {
                    let condition = Object.assign({}, foundCondition);
                    v2.renameKey(condition, 'name', 'id')
                    return condition;
                }
            );
        }
    }

    private addAudienceToTopLevel() {
        this.data.audience = "general";
    }
}