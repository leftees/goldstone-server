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
# Does the following:
#     * creates a new host only network
#     * configures the network address space to work with the provided
#       developer OpenStack image
#     * ensures that the OpenStack VM has a NAT interface for external
#       access
#     * ensures that the OpenStack VM has a host only network interface
#     * adds NAT rules for Goldstone traffic
#

STACK=true
DOCKER=true
DOCKER_VM="default"
OPENSTACK_VM="RDO-kilo"

for arg in "$@" ; do
    case $arg in
        --no-stack)
            STACK=false
        ;;
        --no-docker)
            DOCKER=false
        ;;
        --docker-vm=*)
            DOCKER_VM="${arg#*=}"
            shift
        ;;
        --stack-vm=*)
            OPENSTACK_VM="${arg#*=}"
            shift
        ;;
        --help)
            echo "Usage: $0 [--docker-vm=name] [--stack-vm=name] [--no-stack] [--no-docker]"
            exit 0
        ;;
        *)
            # unknown option
            echo "Usage: $0 [--docker-vm=name] [--stack-vm=name] [--no-stack] [--no-docker]"
            exit 1
        ;;
    esac
done

HOST_ONLY_ADDR=172.24.4.1
HOST_ONLY_NETMASK=255.255.255.0
DHCP_LO=172.24.4.50
DHCP_HI=172.24.4.59
OPENSTACK_HOST_INT=2
OPENSTACK_NAT_INT=1
COMMON_RULE_LIST='es_9200_local,tcp,,9200,,9200 
                  es_9300_local,tcp,,9300,,9300 
                  logstash_syslog_local,tcp,,5514,,5514 
                  logstash_metrics_local,udp,,5516,,5516 
                  postgres_local,tcp,,5432,,5432 
                  redis_local,tcp,,6379,,6379
                  kibana_local,tcp,,5601,,5601
                  gs_8000_local,tcp,,8000,,8000
                  gs_8888_local,tcp,,8888,,8888 
                  flower_local,tcp,,5555,,5555' 

# create vboxnet
if [[ $STACK == "true" ]] ; then
    host_net=$(VBoxManage hostonlyif create 2> /dev/null | \
           grep Interface | \
           sed -e "s/^.*'\(.*\)'.*$/\1/")

    if [[ $host_net == '' ]] ; then
        echo 'Could not create host only network'
        exit 1
    else
        echo "Host network name = $host_net"
    fi

    # configure vboxnet
    VBoxManage hostonlyif ipconfig $host_net --ip $HOST_ONLY_ADDR \
                                         --netmask $HOST_ONLY_NETMASK 

    if [[ $? != 0 ]] ; then
        echo "Could not configure address of $host_net"
        exit 1
    else 
        echo "set $host_net to ${HOST_ONLY_ADDR}/${HOST_ONLY_NETMASK}"
    fi

    # configure dhcp server on vboxnet
    VBoxManage dhcpserver remove --ifname $host_net 2> /dev/null 
    VBoxManage dhcpserver add --ifname $host_net \
                          --ip $HOST_ONLY_ADDR \
                          --netmask $HOST_ONLY_NETMASK \
                          --lowerip $DHCP_LO \
                          --upperip $DHCP_HI \
                          --enable

    if [[ $? != 0 ]] ; then
        echo "Could not configure DHCP server for $host_net"
        exit 1
    else 
        echo "set $host_net DHCP range from $DHCP_LO to $DHCP_HI"
    fi

    # Track errors with VM network settings
    err_count="0"

    # configure NICs for VMs
    VBoxManage modifyvm $OPENSTACK_VM --nic${OPENSTACK_HOST_INT} hostonly || \
        err_count=$[$err_count+$?]
    VBoxManage modifyvm $OPENSTACK_VM --nic${OPENSTACK_NAT_INT} nat || \
        err_count=$[$err_counti+$?]
    VBoxManage modifyvm $OPENSTACK_VM --hostonlyadapter${OPENSTACK_HOST_INT} \
                                  $host_net || \
        err_count=$[$err_counti+$?]

    if [ $err_count -gt 0 ] ; then
        echo "Encountered errors setting up VM network interfaces"
        exit 1
    else
        echo "Finished configuring VM network interfaces"
    fi
else
    echo "Skipping OpenStack network configuration"
fi


if [[ $DOCKER == "true" ]] ; then
    # Ensure the docker image is stopped
    docker-machine stop ${DOCKER_VM}
    # Restore the original ssh NAT rule if it has been deleted.  Ignore errors.
    VBoxManage modifyvm ${DOCKER_VM} --natpf1 "ssh,tcp,,2022,,22" 2> /dev/null

    # Track errors with Docker image NAT settings
    err_count="0"
    for rule in $COMMON_RULE_LIST ; do
        echo "processing rule: $rule"
        VBoxManage modifyvm ${DOCKER_VM} --natpf1 "$rule" || \
            err_count=$[$err_count+$?]
    done

    if [ $err_count -gt 0 ] ; then
        echo "Encountered errors setting up NAT rules for $DOCKER_VM"
        exit 1
    else
        echo "Finished configuring VM network interfaces"
    fi
else
    echo "Skipping docker VM network configuration"
fi
