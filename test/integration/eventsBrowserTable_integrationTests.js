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

/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests - goldstoneBaseCollection.js

describe('eventsBrowserTableCollection.js spec', function() {
    beforeEach(function() {

        $('body').html(
            '<div class="container"></div>'
        );

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.autoRespond = true;
        this.server.respondWith([200, {
            "Content-Type": "application/json"
        }, 'OK']);
        this.testCollection = new EventsBrowserTableCollection({});
        this.testView = new EventsBrowserDataTableView({
            chartTitle: 'Events Browser',
            collection: this.testCollection,
            el: '.container',
            infoIcon: 'fa-table',
            width: $('.container').width()
        });
        this.protoFetchSpy = sinon.spy(EventsBrowserTableCollection.prototype, "fetch");
    });
    afterEach(function() {
        this.server.restore();
        this.protoFetchSpy.restore();
    });
    describe('collection is constructed', function() {
        it('should exist', function() {
            assert.isDefined(this.testCollection, 'this.testCollection has been defined');
            expect(this.testCollection).to.be.an('object');
        });
    });
    describe('test view methods', function() {
        it('should properly preprocess data', function() {
            var testData = [{
                'id': 'hello',
                'doc_type': 'hi',
                'timestamp': 'timestamp',
                'user_name': 'Unknown',
            }];
            var test1 = this.testView.preprocess(testData);
            expect(test1).to.deep.equal([{
                id: 'hello',
                type: 'hi',
                timestamp: 'timestamp',
                traits: undefined,
                user_name: 'Unknown',
                user_type: undefined,
                tenant_name: undefined,
                tenant_type: undefined,
                instance_name: undefined,
                instance_type: undefined
            }]);

            testData = [{}];

            test1 = this.testView.preprocess(testData);
            expect(test1).to.deep.equal([{
                id: undefined,
                type: undefined,
                timestamp: undefined,
                traits: undefined,
                user_name: undefined,
                user_type: undefined,
                tenant_name: undefined,
                tenant_type: undefined,
                instance_name: undefined,
                instance_type: undefined,
            }]);

            testData = [{
                id: 'a',
                doc_type: 'b',
                timestamp: 'c',
                traits: 'd',
                user_name: 'e',
                user_type: 'f',
                tenant_name: 'g',
                tenant_type: 'h',
                instance_name: 'i',
                instance_type: 'j',
            }];

            test1 = this.testView.preprocess(testData);
            expect(test1).to.deep.equal([{
                id: 'a',
                type: 'b',
                timestamp: 'c',
                traits: 'd',
                user_name: 'e',
                user_type: 'f',
                tenant_name: 'g',
                tenant_type: 'h',
                instance_name: 'i',
                instance_type: 'j',
            }]);

            this.testView.update();
        });
    });
    describe('test collection methods', function() {
        it('should generate urls', function() {
            expect(this.protoFetchSpy.callCount).to.equal(0);

            this.clock = sinon.useFakeTimers();
            this.clock.tick(3600000);

            $('body').append('<option id="global-lookback-range" value=60>');
            this.testCollection.urlGenerator();
            expect(this.protoFetchSpy.callCount).to.equal(1);
            expect(this.testCollection.url).to.equal('/core/events/search/?timestamp__range={"gte":0,"lte":3600000}&page_size=1000');

            this.clock.restore();

        });
        it('returns preProcessData', function() {
            var test1 = this.testCollection.preProcessData('la dee da');
            expect(test1).to.equal(undefined);
            test1 = this.testCollection.preProcessData(123);
            expect(test1).to.equal(undefined);
            test1 = this.testCollection.preProcessData(null);
            expect(test1).to.equal(undefined);
            test1 = this.testCollection.preProcessData({});
            expect(test1).to.deep.equal(undefined);
            test1 = this.testCollection.preProcessData([]);
            expect(test1).to.deep.equal(undefined);
            test1 = this.testCollection.preProcessData(new Date());
            expect(test1).to.deep.equal(undefined);
            test1 = this.testCollection.preProcessData(undefined);
            expect(test1).to.equal(undefined);
            test1 = this.testCollection.preProcessData({
                results: [1, 2, 3]
            });
            expect(test1).to.deep.equal([1, 2, 3]);
        });
    });

});
