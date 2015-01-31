/**
 * Copyright 2015 Solinea, Inc.
 *
 * Licensed under the Solinea Software License Agreement (goldstone),
 * Version 1.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at:
 *
 *     http://www.solinea.com/goldstone/LICENSE.pdf
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Author: Alex Jacobs
 */

// define collection and link to model

var DiskResourceCollection = Backbone.Collection.extend({

    defaults: {},

    parse: function(data) {
        return this.dummyData;
        // return data;
    },

    model: DiskResourceModel,

    initialize: function(options) {
        this.options = options || {};
        this.defaults = _.clone(this.defaults);
        this.defaults.urlPrefix = this.options.urlPrefix;
        this.defaults.reportParams = {};
        this.defaults.globalLookback = $('#global-lookback-range').val();
        this.urlGenerator();
        this.fetch();
    },

    urlGenerator: function() {

        var ns = this.defaults;

        ns.reportParams.end = +new Date();
        ns.reportParams.start = (+new Date()) - (ns.globalLookback * 1000 * 60);
        ns.reportParams.interval = '' + Math.round(1 * ns.globalLookback) + "s";
        this.url = ns.urlPrefix +  '?start=' + Math.floor(ns.reportParams.start / 1000) + '&end=' + Math.floor(ns.reportParams.end / 1000) + '&interval=' + ns.reportParams.interval + '&render=false';
    },

    dummyData: {"1422518400000": [49.0, 0.0], "1422519840000": [49.0, 0.0], "1422535680000": [49.0, 0.0], "1422558720000": [49.0, 0.0], "1422525600000": [49.0, 0.0], "1422557280000": [49.0, 0.0], "1422550080000": [49.0, 0.0], "1422538560000": [49.0, 0.0], "1422528480000": [49.0, 0.0], "1422541440000": [49.0, 0.0], "1422563040000": [49.0, 0.0], "1422531360000": [49.0, 0.0], "1422548640000": [49.0, 0.0], "1422521280000": [49.0, 0.0], "1422534240000": [49.0, 0.0], "1422555840000": [49.0, 0.0], "1422547200000": [49.0, 0.0], "1422561600000": [49.0, 0.0], "1422554400000": [49.0, 0.0], "1422568800000": [98.0, 4.0], "1422564480000": [49.0, 0.0], "1422537120000": [49.0, 0.0], "1422527040000": [49.0, 0.0], "1422540000000": [49.0, 0.0], "1422567360000": [49.0, 1.0], "1422560160000": [49.0, 0.0], "1422552960000": [49.0, 0.0], "1422522720000": [49.0, 0.0], "1422524160000": [49.0, 0.0], "1422529920000": [49.0, 0.0], "1422542880000": [49.0, 0.0], "1422532800000": [49.0, 0.0], "1422565920000": [49.0, 0.0], "1422551520000": [49.0, 0.0], "1422544320000": [49.0, 0.0], "1422545760000": [49.0, 0.0]}
});
