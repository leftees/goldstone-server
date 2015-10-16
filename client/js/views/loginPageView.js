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

var LoginPageView = GoldstoneBaseView2.extend({

    instanceSpecificInit: function() {
        this.hideBaseTemplate();
        this.render();
        this.addHandlers();
    },

    hideBaseTemplate: function() {
        $('.navbar-default').hide();
        $('.sidebar').hide();

        $('form').css({'outline': 'none'});

    },

    onClose: function() {
        $('.navbar-default').show();
        $('.sidebar').show();
    },

    checkForInstalledApps: function() {
        $.ajax({
            type: 'get',
            url: '/addons/'
        }).done(function(success) {
            localStorage.setItem('addons', JSON.stringify(success));

            // triggers view in addonMenuView.js
            goldstone.addonMenuView.trigger('installedAppsUpdated');
        }).fail(function(fail) {
            console.log(goldstone.translate("Failed to initialize installed addons"));

            // triggers view in addonMenuView.js
            goldstone.addonMenuView.trigger('installedAppsUpdated');
        });
    },

    addHandlers: function() {
        var self = this;

        $('.login-form').on('submit', function(e) {
            e.preventDefault();
            self.trimInputField('[name="username"]');
            self.submitRequest($(this).serialize());
        });
    },

    trimInputField: function(selector) {
        var trimmedContent = $(selector).val().trim();
        $(selector).val(trimmedContent);
    },

    submitRequest: function(input) {
        var self = this;

        // Upon clicking the submit button, the serialized user input is sent
        // via $.post to check the credentials. If successful, invoke "done"
        // if not, invoke "fail"

        $.post('/accounts/login/', input, function() {})
            .done(function(success) {

                // store the auth token
                self.storeAuthToken(success.auth_token);

                // must follow storing token otherwise call will fail with 401
                self.checkForInstalledApps();
                self.redirectPostSuccessfulAuth();
            })
            .fail(function(fail) {
                // and add a message to the top of the screen that logs what
                // is returned from the call

                try {
                    goldstone.raiseInfo(fail.responseJSON.non_field_errors[0]);
                } catch (e) {
                    goldstone.raiseInfo(fail.responseText);
                    console.log(e);
                }

            });
    },

    storeAuthToken: function(token) {
        localStorage.setItem('userToken', token);
    },

    redirectPostSuccessfulAuth: function() {
        location.href = '#';
    },

    template: _.template('' +
        '<div class="container">' +
        '<div class="row">' +
        '<div class="col-md-4 col-md-offset-4">' +
        '<form class="login-form">' +
        '<h1 class="text-center" id="goldstone-text">goldstone</h1>' +
        '<input name="username" type="text" class="form-control" placeholder="<%=goldstone.contextTranslate(\'Username\', \'loginpage\')%>" required autofocus><br><br>' +
        '<input name="password" type="password" class="form-control" placeholder="<%=goldstone.contextTranslate(\'Password\', \'loginpage\')%>" required><br>' +
        '<button name="submit" class="btn btn-lg btn-primary btn-block" type="submit"><%=goldstone.contextTranslate(\'SIGN IN\', \'loginpage\')%></button>' +
        '</form>' +
        '<div class="text-center" id="forgotUsername"><a href="#password"><%=goldstone.translate(\'reset password\')%></a></div>' +
        '</div>' +
        '</div>' +
        '</div>'
    )

});
