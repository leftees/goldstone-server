"""Logging URLconf."""
# Copyright 2014 - 2015 Solinea, Inc.
#
# Licensed under the Solinea Software License Agreement (goldstone),
# Version 1.0 (the "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at:
#
#     http://www.solinea.com/goldstone/LICENSE.pdf
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from django.conf.urls import patterns, url
from rest_framework.routers import DefaultRouter
from .views import LogDataView, LogAggView, LogEventView

router = DefaultRouter(trailing_slash=False)

# router.register(r'events', LoggingEventViewSet, base_name='event')

urlpatterns = router.urls

urlpatterns += patterns('', url(r'search[/]?$', LogDataView.as_view(),
                        name='log-data-view'))
urlpatterns += patterns('', url(r'summarize[/]?$', LogAggView.as_view(),
                        name='log-summary-view'))
urlpatterns += patterns('', url(r'events[/]?$', LogEventView.as_view(),
                        name='log-event-view'))
