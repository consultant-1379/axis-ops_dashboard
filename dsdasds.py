#!/usr/bin/python

'''
By mean of this script is possible to find specific builds by configuring different kind of filters. 
e.g. it is possible to restrict the check in the desired Jenkins instance and under the desired jenkins slave. 
The user can also configure a minimun build duration and a string to search inside the console log.
'''

import sys
import os
from os import listdir
from os.path import isfile, isdir, join

from xml.etree import ElementTree as ET
from xml.dom import minidom
import subprocess
import urllib2
import xml

import datetime
from datetime import date, timedelta
import calendar

import ConfigParser, re, glob, time

from difflib import SequenceMatcher

# List of Jenkins isntances to check
#fems = [104, 105, 106, 107, 108, 109, 114, 115, 120, 121, 123, 134, 135, 138, 139, 140, 155]
fems = [101, 102, 103, 104, 105, 106, 107, 108, 109, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 133, 134, 135, 136, 137, 138, 139, 140, 142, 143, 144, 155]

# Text file to fill mongoDB
mongoDB = open('mongoDB.txt', 'w')
mongoDB.write("fem,jobname,job,node,status,date\n")

# Variables definition
standard_label_slave = {'GridEngine' : ['RHEL6.4_GE', 'RHEL6.6_GE'], 'acceptancetest' : ['RHEL6.4_AT', 'RHEL6.6_AT']}
standard_label_job = ['_PreCodeReview', '_Unit', '_Acceptance', '_Release', '_Verify', '3in1Release', '_Parent_Update', '_Sprint_Version_Update', 'Admin']

def main():
    for fem in fems:
        getBuilds(fem)
        
# ############################################ #
# Get builds from a list of parameters (filter)#
# ############################################ #            
def getBuilds(jenkins_instance):
    node_type = "Other"

    # get cloud configuration section for the specified Jenkins instance
    cloudConfigSection = open("cloudConfigSection.xml", "w+")
    tree = ET.parse("/proj/eiffel004_config/fem" + str(jenkins_instance) + "/eiffel_home/config.xml")
    node = tree.find('.//clouds')
    cloudConfigSection.write(ET.tostring(node))
    cloudConfigSection.close()
    # #################################################################

    # define array with list of vApps for the defined Jenkins instance
    vAPP_list = extractVappValue("cloudConfigSection.xml", "label")

    # define jenkins instance variables
    jenkins_nodes_home = "/proj/eiffel004_config/fem" + str(jenkins_instance) + "/eiffel_home/nodes/"
    jenkins_nodes_url = "https://fem" + str(jenkins_instance) + "-eiffel004.lmera.ericsson.se:8443/jenkins/job/"

    # list of directories under ../jobs folder
    jenkins_nodes = [d for d in listdir(jenkins_nodes_home) if isdir(join(jenkins_nodes_home, d))]

    for jenkins_node in jenkins_nodes:
        try:
            builtOn = createxmldoc(jenkins_nodes_home + jenkins_node + "/config.xml", "assignedNode")
            status = createxmldoc(jenkins_nodes_home + jenkins_node + "/config.xml", "disabled")
        except:
            break
        
        # manage Nonetype value for builtOn's tag
        try:
            node = builtOn[0].firstChild.nodeValue
        except:
            node = "Not_assigned"
            node_type = node
            
        if node == "master":
            node_type = node
        
        # from Jenkins job name, classify it by job's type (e.g. pm_gui_Acceptance -> Acceptance)
        job_type = "Other"
        for label_job in standard_label_job:
            if label_job.lower() in jenkins_node.lower():
                job_type = label_job.replace("_", "")
                break
                
        # from slave name, classify it by node's type (e.g. RHEL6.4_AT -> acceptancetest)
        for vApp in vAPP_list:
            if vApp in node:
                node_type = "vApp"
                break
        for key, values in standard_label_slave.items():
            for value in values:
                if value.lower() in node.lower() or node.lower() in value.lower():
                    node_type = key
                    break
            if node.lower() in key.lower():
                node_type = key
        
        # assign Jenkins job status (enabled or disabled)
        try:
            if status[0].firstChild.nodeValue == "false":
                state = "enabled"
            else:
                state = "disabled"
        except:
            state = "None"

        # find the date of the last jenkins job's build
        lastBuildURL = jenkins_nodes_url + jenkins_node + "/lastBuild"
        subprocess.call(["wget %s/api/xml --output-document=lastBuildAPI.xml" % lastBuildURL], stderr=subprocess.PIPE, shell=True)
        
        try:
            lastBuild_id = createxmldoc("lastBuildAPI.xml", "id")
            lastBuild_id = lastBuild_id[0].firstChild.nodeValue
            
            buildDate = lastBuild_id.split('_')[0]
            buildHour = lastBuild_id.split('_')[1]

            if "_" in lastBuild_id:
                lastBuild_date = buildDate + " " + buildHour.replace('-',':')
            else:
                lastBuild_date = str(time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime(os.path.getmtime(jenkins_nodes_home + jenkins_node + "/builds/" + lastBuild_id))))
        except:
            lastBuild_date = str(time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime(os.path.getmtime(jenkins_nodes_home + jenkins_node))))
            state = state + "_noBuilds"

        mongoDB.write(str(jenkins_instance) + "," + jenkins_node + "," + job_type + "," + node_type + "," +  state + "," + lastBuild_date + "\n")

# ############################################ #
# Parsing .xml file by tag value               #
# ############################################ #        
def createxmldoc(ConfigFile, tag):
    try:
        xmldoc = minidom.parse(ConfigFile)
        return xmldoc.getElementsByTagName(tag)
    except urllib2.HTTPError as err:
        if err.code == 404:
            pass
    except xml.parsers.expat.ExpatError, e:
        pass

# ############################################ #
# Extract tag's values from .xml file          #
# ############################################ #
def extractVappValue(configFile, tag):
    value_list = []
    with open(configFile) as f:
        for line in f:
            if "<" + tag + ">" in line:
                value = line.replace("<"+ tag + ">","")
                value = value.replace("</"+ tag + ">","")
                value_list.append(value.strip())
    return value_list

main()
