Date.prototype.addMinutes = function (m) {
    this.setTime(this.getTime() + (m * 60 * 1000));
    return this;
}

Date.prototype.addHours = function (h) {
    this.setTime(this.getTime() + (h * 60 * 60 * 1000));
    return this;
}

Date.prototype.addDays = function (d) {
    this.setTime(this.getTime() + (d * 24 * 60 * 60 * 1000));
    return this;
}

Date.prototype.addWeeks = function (d) {
    this.setTime(this.getTime() + (d * 7 * 24 * 60 * 60 * 1000));
    return this;
}

function convertDateToUTC(date) {
    return new Date(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds());
}


function bad_event_histogram_panel(interval, location, end) {
    $("#log-loading-indicator").show();
    end = typeof end !== 'undefined' ? new Date(Number(end) * 1000) : new Date();

    var xUnitInterval = function (interval) {
        if (interval == 'minute') {
            return d3.time.seconds;
        } else if (interval == 'hour') {
            return d3.time.minutes;
        } else if (interval == 'day') {
            return d3.time.hours;
        } else if (interval == 'month') {
            return d3.time.days;
        } else {
            raiseDanger("Valid intervals are 'month', 'day', " +
                "'hour', and 'minute'");
            return d3.time.seconds;
        }
    }

    var click_renderlet = function (_chart) {

        _chart.selectAll("rect.bar")
            .on("click", function (d) {
                // load the log search page with chart and table set
                // to this range.
                var start = new Date(d.data.key);
                var end = new Date(start);
                var new_interval;

                if (interval === 'hour') {
                    end.addMinutes(1);
                    new_interval = 'minute';
                } else if (interval === 'day') {
                    end.addHours(1);
                    new_interval = 'hour';
                } else if (interval === 'month') {
                    end.addDays(1);
                    new_interval = 'day';
                } else if (interval === 'minute') {
                    new_interval = 'seconds';
                    end.addMinutes(1);
                }

                var uri = '/intelligence/search?start_time='.
                    concat(String(Math.round(start.getTime() / 1000)),
                        "&end_time=", String(Math.round(end.getTime() / 1000)),
                        "&interval=", new_interval);
                window.location.assign(uri);
            });
        };

        var panelWidth = $(location).width();
        var panelHeight = 300;
        var margin = {top: 30, right: 30, bottom: 30, left: 40};


        var logChart = dc.barChart(location);

        var start = new Date(end);
        if (interval === 'hour') {
            start.addHours(-1);
        } else if (interval === 'day') {
            start.addDays(-1);
        } else if (interval === 'month') {
            start.addWeeks(-4);
        } else if (interval === 'minute') {
            start.addMinutes(-1);
        }
        console.log("end = " + end + ", start = " + start)
        var uri = "/intelligence/log/cockpit/data?start_time=".
            concat(String(Math.round(start.getTime() / 1000)),
                "&end_time=", String(Math.round(end.getTime() / 1000)),
                "&interval=", interval);

        d3.json(uri, function (error, events) {
            console.log("data = " + JSON.stringify(events.data))
            events.data.forEach(function (d) {
                d.time = new Date(d.time);
                d.fatal = +d.fatal;
                d.warning = +d.warning;
                d.error = +d.error;
            });

            var xf = crossfilter(events.data);
            var timeDim = xf.dimension(function (d) {
                return d.time;
            });

            var eventsByTime = timeDim.group().reduce(
                function (p, v) {
                    p.errorEvents += v.error;
                    p.warnEvents += v.warning;
                    p.fatalEvents += v.fatal;
                    return p;
                },
                function (p, v) {
                    p.errorEvents -= v.error;
                    p.warnEvents -= v.warning;
                    p.fatalEvents -= v.fatal;
                    return p;
                },
                function () {
                    return {
                        errorEvents: 0,
                        warnEvents: 0,
                        fatalEvents: 0
                    };
                }
            );

            var minDate = timeDim.bottom(1)[0].time;
            var maxDate = timeDim.top(1)[0].time;

            logChart
                .width(panelWidth)
                .height(panelHeight)
                .margins(margin)
                .dimension(timeDim)
                .group(eventsByTime, "Warning Events")
                .valueAccessor(function (d) {
                    return d.value.warnEvents;
                })
                .stack(eventsByTime, "Error Events", function (d) {
                    return d.value.errorEvents;
                })
                .stack(eventsByTime, "Fatal Events", function (d) {
                    return d.value.fatalEvents;
                })
                .x(d3.time.scale().domain([minDate, maxDate]))
                .xUnits(xUnitInterval(interval))
                .renderHorizontalGridLines(true)
                .centerBar(true)
                .elasticY(true)
                .brushOn(false)
                .renderlet(click_renderlet)
                .legend(dc.legend().x(100).y(0).itemHeight(13).gap(5))
                .title(function (d) {
                    return d.key
                        + "\n\n" + d.value.fatalEvents + " FATALS"
                        + "\n\n" + d.value.errorEvents + " ERRORS"
                        + "\n\n" + d.value.warnEvents + " WARNINGS";
                });

            logChart.render();
            $("#log-loading-indicator").hide();
        });
    }

    function vcpu_graph(interval, location, end, start) {
        $("#vcpu-loading-indicator").show();
        interval = typeof interval !== 'undefined' ?
            interval :
            'day';

        end = typeof end !== 'undefined' ?
            new Date(Number(end) * 1000) :
            new Date();

        if (typeof start === 'undefined') {
            start = new Date(end);

            if (interval === 'day') {
                start.addWeeks(-4);
            } else if (interval === 'hour') {
                start.addDays(-1);
            } else if (interval === 'minute') {
                start.addHours(-1);
            }
        } else {
            start = new Date(Number(start) * 1000);
        }


        var panelWidth = $(location).width();
        var panelHeight = 300;
        var margin = {top: 30, right: 30, bottom: 60, left: 50};

        var uri = "/intelligence/compute/vcpu_stats?start_time=".
            concat(String(Math.round(start.getTime() / 1000)),
                "&end_time=", String(Math.round(end.getTime() / 1000)),
                "&interval=", interval);

        var xUnitInterval, timeDimInterval = (function (interval) {
            if (interval == 'second') {
                return d3.time.seconds, d3.time.minutes;
            } else if (interval == 'minute') {
                return d3.time.minutes, d3.time.hours;
            } else if (interval == 'hour') {
                return d3.time.hours, d3.time.days;
            } else if (interval == 'day') {
                return d3.time.days, d3.time.months;
            }
        })(interval);

        var vcpuChart = dc.lineChart(location);

        d3.json(uri, function (error, data) {
            data.forEach(function (d) {
                d.time = +d.time;
                d.total_configured_vcpus = +d.total_configured_vcpus;
                d.total_inuse_vcpus = +d.total_inuse_vcpus;
            });
            var xf = crossfilter(data);
            var timeDim = xf.dimension(function (d) {
                return d.time;
            });

            // this is our X-axis data
            var vcpuGroup = timeDim.group().reduce(
                function (p, v) {
                    p.total_configured_vcpus = v.total_configured_vcpus;
                    p.total_inuse_vcpus = v.total_inuse_vcpus;
                    return p;
                },
                function (p, v) {
                    return p;
                },
                function () {
                    return {'total_configured_vcpus': 0, 'total_inuse_vcpus': 0};
                });

            // get the date boundaries for the chart
            var minDate = timeDim.bottom(1)[0].time;
            var maxDate = timeDim.top(1)[0].time;

            vcpuChart
                .renderArea(true)
                .width(450)
                .height(panelHeight)
                .margins(margin)
                .transitionDuration(1000)
                .dimension(timeDim)
                .x(d3.time.scale().domain([minDate, maxDate]))
                .xUnits(xUnitInterval)
                .elasticY(true)
                .renderHorizontalGridLines(true)
                .legend(dc.legend().x(100).y(0).itemHeight(13).gap(5))
                .brushOn(false)
                .group(vcpuGroup, "Total vCPUs")
                .valueAccessor(function (d) {
                    return d.value.total_inuse_vcpus;
                })
                .stack(vcpuGroup, "Active vCPUs", function (d) {
                    return (d.value.total_configured_vcpus - d.value.total_inuse_vcpus);
                })
            ;

            vcpuChart.render();

            $("#vcpu-loading-indicator").hide();

        });
    }


    function draw_search_table(location, interval, end, start) {
        $("#log-table-loading-indicator").show();
        interval = typeof interval !== 'undefined' ?
            interval :
            'month';

        end = typeof end !== 'undefined' ?
            new Date(Number(end) * 1000) :
            new Date();

        if (typeof start === 'undefined') {
            start = new Date(end);

            if (interval === 'month') {
                start.addWeeks(-4);
            } else if (interval === 'day') {
                start.addDays(-1)
            } else if (interval === 'hour') {
                start.addHours(-1);
            } else if (interval === 'minute') {
                start.addMinutes(-1);
            } else {
                start = new Date(Number(start) * 1000);
            }
        } else {
            start = new Date(Number(start) * 1000);
        }

        //TODO rework this url to use params
        var uri = '/intelligence/log/search/data/'.
            concat(String(Math.round(start.getTime() / 1000)), "/",
                String(Math.round(end.getTime() / 1000)));
        //var uri = "/intelligence/log/search/data/".concat(String(start), "/", String(end));

        if ($.fn.dataTable.isDataTable(location)) {
            var oTable = $(location).dataTable();
            oTable.fnReloadAjax(uri);
        } else {
            var oTableParams = {
                "bProcessing": true,
                "bServerSide": true,
                "sAjaxSource": uri,
                "bPaginate": true,
                "bFilter": true,
                "bSort": true,
                "bInfo": false,
                "bAutoWidth": true,
                "bLengthChange": true,
                "aoColumnDefs": [
                    { "bVisible": false, "aTargets": [ 5, 6, 7, 8, 9, 10 ] },
                    { "sName": "timestamp", "aTargets": [ 0 ] },
                    { "sType": "date", "aTargets": [0] },
                    { "sName": "loglevel", "aTargets": [ 1 ] },
                    { "sName": "component", "aTargets": [ 2 ] },
                    { "sName": "host", "aTargets": [ 3 ] },
                    { "sName": "message", "aTargets": [ 4 ] },
                    { "sName": "location", "aTargets": [ 5 ] },
                    { "sName": "pid", "aTargets": [ 6 ] },
                    { "sName": "source", "aTargets": [ 7 ] },
                    { "sName": "request_id", "aTargets": [ 8 ] },
                    { "sName": "type", "aTargets": [ 9 ] },
                    { "sName": "received", "aTargets": [ 10 ] },
                    { "sType": "date", "aTargets": [10] }
                ]
            }

            var oTable = $(location).dataTable(oTableParams);

            $(window).bind('resize', function () {
                oTable.fnAdjustColumnSizing();
            });
        }
        $("#log-table-loading-indicator").hide();
    }

    function draw_host_presence_table(location, lookbackQty, lookbackUnit,
                                      comparisonQty, comparisonUnit) {

        $("#host-presence-table-loading-indicator").show();
        // defaults to comparing the last 5 minutes to the last 60 minutes
        // starting now.
        lookbackQty = typeof lookbackQty !== 'undefined' ?
            lookbackQty :
            60;
        comparisonQty = typeof comparisonQty !== 'undefined' ?
            comparisonQty :
            5;
        lookbackUnit = typeof lookbackUnit !== 'undefined' ?
            lookbackUnit :
            'minutes';
        comparisonUnit = typeof comparisonUnit !== 'undefined' ?
            comparisonUnit :
            'minutes';

        console.log("in draw_host_presence_table, lookbackNum="+String(lookbackNum)+", lookbackUnit="+lookbackUnit)
        console.log("in draw_host_presence_table, comparisonNum="+String(comparisonNum)+", comparisonUnit="+comparisonUnit);
        var uri = '/intelligence/host_presence_stats'.concat(
            '?lookbackQty=', String(lookbackQty),
            '&lookbackUnit=', lookbackUnit,
            '&comparisonQty=', String(comparisonQty),
            '&comparisonUnit=', comparisonUnit);
        console.log("in draw_host_presence_table, uri="+uri);
        if ($.fn.dataTable.isDataTable(location)) {
            var oTable = $(location).dataTable();
            console.log("in draw_host_presence_table, calling fnReloadAjax");
            oTable.fnReloadAjax(uri);
        } else {
            var oTableParams = {
                "bProcessing": true,
                "bServerSide": true,
                "sAjaxSource": uri,
                "bPaginate": false,
                "sScrollY": "150px",
                "bFilter": false,
                "bSort": false,
                "bInfo": false,
                "bAutoWidth": true,
                "bLengthChange": true,
                "aoColumnDefs": [
                    { "sName": "host", "aTargets": [ 0 ] },
                    { "sName": "status", "aTargets": [ 1 ] }
                    /* TODO GOLD-241 add support for time last seen to JS
                    ,
                    { "bVisible": false, "aTargets": [ 2 ] },
                    { "sName": "lastSeen", "aTargets": [ 2 ] },
                    { "sType": "date", "aTargets": [2] }
                    */
                ]
            }

            var oTable = $(location).dataTable(oTableParams);

            $(window).bind('resize', function () {
                oTable.fnAdjustColumnSizing();
            });
        }
        $("#host-presence-table-loading-indicator").hide();
    }


/*
 function updateWindow(){

 var panelWidth = $("#row3-full").width();
 var panelHeight = 300;
 var margin = {top: 30, right: 30, bottom: 30, left: 80},
 width = panelWidth - margin.left - margin.right,
 height = panelHeight - margin.top - margin.bottom;


 x = d3.time.scale().range([0, width]);
 x.domain(d3.extent(data, function(d) { return d.date; }));
 xAxis = d3.svg.axis().scale(x)
 .orient("bottom").ticks(5);

 console.log("adjusted width = " + panelWidth);
 console.log("adjusted height = " + panelHeight);
 svg.attr("width", panelWidth)
 .attr("height", panelHeight);
 svg.select(".x.axis")
 .call(xAxis);
 svg.select(".line")
 .attr("d", valueLine(data));

 }

 window.onresize = updateWindow;

 */