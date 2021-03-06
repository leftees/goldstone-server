/**
 * Copyright 2015 Solinea, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// create a project namespace and utility for creating descendants
var goldstone = goldstone || {};

// tools for raising alerts
goldstone.raiseError = function(message) {
    "use strict";
    goldstone.raiseDanger(message);
};

goldstone.raiseDanger = function(message) {
    "use strict";
    goldstone.raiseAlert(".alert-danger", message);
};

goldstone.raiseWarning = function(message) {
    "use strict";
    goldstone.raiseAlert(".alert-warning", message);
};

goldstone.raiseSuccess = function(message) {
    "use strict";
    goldstone.raiseAlert(".alert-success", message);
};

goldstone.raiseInfo = function(message, persist) {
    "use strict";

    if (persist === true) {
        goldstone.raiseAlert(".alert-info", message, true);
    } else {
        goldstone.raiseAlert(".alert-info", message);
    }

};

goldstone.raiseAlert = function(selector, message, persist) {
    "use strict";

    if (message && message.length > 200) {
        message = message.slice(0, 200) + '...';
    }

    if (persist) {
        $(selector).html(message);
    } else {
        // commenting out the ability to dismiss the alert, which destroys the
        // element and prevents additional renderings.

        // $(selector).html(message + '<a href="#" class="close"
        // data-dismiss="alert">&times;</a>');
        $(selector).html(message + '<a href="#" class="close" data-dismiss="alert"></a>');
    }

    var alertWidth = $(selector).parent().width();

    $(selector).fadeIn("slow").css({
        'position': 'absolute',
        'width': alertWidth,
        'z-index': 10
    });

    if (!persist) {
        window.setTimeout(function() {
            $(selector).fadeOut("slow");
        }, 4000);
    }

};

goldstone.returnAddonPresent = function(checkName) {
    var addonList = JSON.parse(localStorage.getItem('addons'));
    var result = false;
    _.each(addonList, function(item) {
        if(item.name && item.name === checkName) {
            result = true;
        }
    });
    return result;
};

goldstone.uuid = function() {
    "use strict";

    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
};

goldstone.time = goldstone.time || {};

goldstone.time.fromPyTs = function(t) {
    "use strict";

    if (typeof t === 'number') {
        return new Date(Math.round(t) * 1000);
    } else {
        return new Date(Math.round(Number(t) * 1000));
    }
};

goldstone.time.toPyTs = function(t) {
    "use strict";

    // TODO decide whether toPyTs should only handle date objects.  Handling numbers may cause unexpected results.
    if (typeof t === 'number') {
        return String(Math.round(t / 1000));
    } else if (Object.prototype.toString.call(t) === '[object Date]') {
        return String(Math.round(t.getTime() / 1000));
    }
};

window.onerror = function(message, fileURL, lineNumber) {
    console.log(message + ': ' + fileURL + ': ' + lineNumber);
};

// convenience for date manipulation
Date.prototype.addSeconds = function(m) {
    "use strict";
    this.setTime(this.getTime() + (m * 1000));
    return this;
};

Date.prototype.addMinutes = function(m) {
    "use strict";
    this.setTime(this.getTime() + (m * 60 * 1000));
    return this;
};

Date.prototype.addHours = function(h) {
    "use strict";
    this.setTime(this.getTime() + (h * 60 * 60 * 1000));
    return this;
};

Date.prototype.addDays = function(d) {
    "use strict";
    this.setTime(this.getTime() + (d * 24 * 60 * 60 * 1000));
    return this;
};

Date.prototype.addWeeks = function(d) {
    "use strict";
    this.setTime(this.getTime() + (d * 7 * 24 * 60 * 60 * 1000));
    return this;
};