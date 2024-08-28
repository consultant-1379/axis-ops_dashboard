#!/usr/bin/python

import json
from pymongo import MongoClient

from bson import json_util
from bson.json_util import dumps

# ######################### #
# import data's structure   #
# ######################### #
def data_projects(mongoHost, mongoPort, database, collection, dataEntry):
    connection = MongoClient(mongoHost, mongoPort)
    collection = connection[database][collection]
    projects = collection.find( {}, dataEntry, limit=20000)
    json_projects = []
    for project in projects:
        json_projects.append(project)
    json_projects = json.dumps(json_projects, default=json_util.default)
    connection.close()
    return json_projects