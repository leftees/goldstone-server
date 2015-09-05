#!/bin/bash
# Copyright 2015 Solinea, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

#
# Stops the OpenStack and boot2docker VirtualBox VMs.  It does an ACPI
# shutdown for the OpenStack VM, and will poll to see that the shutdown
# has completed.  If it never com
# succeed to shut down safely after 300 seconds, it will forcefully power 
# it off.  
#
# It assumes that there are no other celery or flower processes running
# on the system, and optimistically kills processes.

STACK_VM="RDO-kilo"
DOCKER_VM="default"
ACPI_SHUTDOWN_WAIT=300

for arg in "$@" ; do
    case $arg in
        --docker-vm=*)
            DOCKER_VM="${arg#*=}"
            shift
        ;;
        --stack-vm=*)
            STACK_VM="${arg#*=}"
            shift
        ;;
        --help)
            echo "Usage: $0 [--docker-vm=name] [--stack-vm=name]"
            exit 0
        ;;
        *)
            # unknown option
            echo "Usage: $0 [--docker-vm=name] [--stack-vm=name]"
            exit 1
        ;;
    esac
done

wait_for_shutdown()
{
    local delay=0.75
    local spinstr='|/-\'
    local i="0"
    until $(VBoxManage showvminfo ${STACK_VM} --machinereadable | grep -q ^VMState=.poweroff.)
    do
        i=$[$i+1]
        if [ $i -gt ${ACPI_SHUTDOWN_WAIT} ] ; then
            echo "Failed to shut down ${STACK_VM}"
            exit 1 
        fi 
        local temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

# echo "shutting down celery"
pkill -f celery
pkill -f flower

echo "cleaning up celery log files"
rm /tmp/goldstone-server-celery.log
rm /tmp/goldstone-server-flower.log

echo "shutting down docker VM"
(cd $PROJECT_HOME/goldstone-server/docker;docker-compose stop)
docker-machine stop ${DOCKER_VM}

VBoxManage controlvm $STACK_VM acpipowerbutton 2&> /dev/null
echo "Waiting for $STACK_VM to poweroff..."
wait_for_shutdown

