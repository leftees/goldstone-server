"""Neutron views."""
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

from goldstone.views import TopLevelView, ApiPerfView as GoldstoneApiPerfView
from .models import ApiPerfData
import logging

logger = logging.getLogger(__name__)


class ReportView(TopLevelView):
    template_name = 'neutron_report.html'


class ApiPerfView(GoldstoneApiPerfView):

    def _get_data(self, context):
        return ApiPerfData().get(context['start_dt'],
                                 context['end_dt'],
                                 context['interval'])
