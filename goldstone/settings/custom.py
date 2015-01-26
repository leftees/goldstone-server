"""Support for customized Django settings files."""

# Copyright 2015 Solinea, Inc.
#
# Licensed under the Solinea Software License Agreement (goldstone),
# Version 1.0 (the "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at:
#
#     http://www.solinea.com/goldstone/LICENSE.pdf
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from .base import SettingsEnvironments, CUSTOM_ENV_SETTINGS


def get_customized(execution_type):
    """Return the name of a customized local settings file, or None.

    If the desired settings filename is defined in the environment,
    use it. Otherwise, look for a customized settings file based on
    this computer's name. Otherwise, return None.

    :param execution_type: The type of customized settings file to look for.
    :type execution_type: str. It should be a member of SettingsEnvironment
    :return: A value that can be passed to importlib.import_module(), or None
    :rtype: str, or None

    """
    import os
    import os.path

    # First, look within the environment variables.
    target = os.getenv(CUSTOM_ENV_SETTINGS % execution_type)
    if target:
        # Found it!
        return target

    # Try looking in the settings directory for a file for this machine.
    target = "settings_%s" % os.uname()[1]
    if os.path.exists(target):
        # A settings file exists for this machine.
        return target

    # A personalied settings file doesn't exist for the desired
    # execution type, or for this machine.
    return None
