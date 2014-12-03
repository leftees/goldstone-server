/**
 * Copyright 2014 Solinea, Inc.
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

var renderCharts = function() {
    var self = this;

    new GlobalLookbackRefreshButtonsView({
        el: ".global-range-refresh-container"
    });

    //----------------------------
    // instantiate charts via
    // backbone collection / views


    //---------------------------
    // instantiate goldstone topology chart

    var topologyTreeView = new TopologyTreeView({
        blueSpinnerGif: blueSpinnerGif,
        chartHeader: ['#goldstone-discover-r2-c1', 'Cloud Topology', 'discoverCloudTopology'],
        data: data,
        el: '#goldstone-discover-r2-c1',
        frontPage: true,
        h: 600,
        multiRsrcSpinner: '#multi-rsrc-loading-indicator',
        singleRsrcLocation: '#single-rsrc-table',
        singleRsrcSpinner: '#single-rsrc-loading-indicator',
        spinner: '#goldstone-topology-spinner',
        width: $('#goldstone-discover-r2-c1').width(),
        leafDataUrls: {
            "services-leaf": "/services",
            "endpoints-leaf": "/endpoints",
            "roles-leaf": "/roles",
            "users-leaf": "/users",
            "tenants-leaf": "/tenants",
            "agents-leaf": "/agents",
            "aggregates-leaf": "/aggregates",
            "availability-zones-leaf": "/availability_zones",
            "cloudpipes-leaf": "/cloudpipes",
            "flavors-leaf": "/flavors",
            "floating-ip-pools-leaf": "/floating_ip_pools",
            "hosts-leaf": "/hosts",
            "hypervisors-leaf": "/hypervisors",
            "networks-leaf": "/networks",
            "secgroups-leaf": "/security_groups",
            "servers-leaf": "/servers",
            "images-leaf": "/images",
            "volumes-leaf": "/volumes",
            "backups-leaf": "/backups",
            "snapshots-leaf": "/snapshots",
            "transfers-leaf": "/transfers",
            "volume-types-leaf": "/volume_types"
        }
    });


    //---------------------------
    // instantiate event timeline chart

    // fetch url is set in eventTimelineCollection
    var eventTimelineChart = new EventTimelineCollection({});

    var eventTimelineChartView = new EventTimelineView({
        collection: eventTimelineChart,
        el: '#goldstone-discover-r1-c1',
        chartTitle: 'Event Timeline',
        width: $('#goldstone-discover-r1-c1').width()
    });

    //---------------------------
    // instantiate Node Availability chart

    var nodeAvailChart = new NodeAvailCollection({
        url: "/logging/nodes?page_size=100"
    });

    var nodeAvailChartView = new NodeAvailView({
        collection: nodeAvailChart,
        h: {
            "main": 450,
            "swim": 50
        },
        el: '#goldstone-discover-r2-c2',
        chartTitle: 'Node Availability',
        width: $('#goldstone-discover-r2-c2').width()
    });
};
