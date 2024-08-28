#!/usr/bin/python

from routeData import data_projects

from flask import Flask
from flask import render_template

app = Flask(__name__)

# mongoDB coordinates
MONGODB_HOST = 'localhost'
MONGODB_PORT = 27017

# mongoDB DataBase name
DBS_NAME = 'jenkins'

# mongoDB collections belonging to DBS_NAME
COLLECTION_TOTAL_STATS = 'total_stats'
COLLECTION_BUILDS = 'builds'
COLLECTION_PLUGINS = 'plugins'
COLLECTION_PENDINGS = 'pendings'
COLLECTION_MTSLAVES = 'mtslaves'

# data's architecture (attributes to use in our query)
TOTAL_STATS = {'fem': True, 'jobname': True, 'job': True, 'node': True, 'status': True, 'date': True, 'area': True, '_id': False}
BUILDS = {'fem': True, 'jobname': True, 'job': True, 'node': True, 'date': True, 'area': True, '_id': False}
PLUGINS = {'fem': True, 'plugin': True, 'status': True, 'version': True, '_id': False}
PENDINGS = {'fem': True, 'jobname': True, 'status': True, 'time': True, 'rootcause': True, 'counter': True, 'node': True, '_id': False}
MTSLAVES = {'fem': True, 'jobname': True, 'time': True, 'node': True, '_id': False}

# ############### ##################################### #
# Routes creation to map URLs to the data from database #
# ##################################################### #
@app.route("/total_stats")
def index_total_stats():
    return render_template("index_total_stats.html")
    
@app.route("/builds")
def index_builds():
    return render_template("index_builds.html")
    
@app.route("/plugins")
def index_plugins():
    return render_template("index_plugins.html")
    
@app.route("/pendings")
def index_pendings():
    return render_template("index_pendings.html")
    
@app.route("/mtslaves")
def index_mtslaves():
    return render_template("index_mtslaves.html")
    
@app.route("/swapSpace")
def index_swapSpace():
    return render_template("swapSpace.html")

@app.route("/jenkins/total_stats")
def total_stats_projects():
    return data_projects(MONGODB_HOST, MONGODB_PORT, DBS_NAME, COLLECTION_TOTAL_STATS, TOTAL_STATS)
    
@app.route("/jenkins/builds")
def builds_projects():
    return data_projects(MONGODB_HOST, MONGODB_PORT, DBS_NAME, COLLECTION_BUILDS, BUILDS)
    
@app.route("/jenkins/plugins")
def plugins_projects():
    return data_projects(MONGODB_HOST, MONGODB_PORT, DBS_NAME, COLLECTION_PLUGINS, PLUGINS)
    
@app.route("/jenkins/pendings")
def pendings_projects():
    return data_projects(MONGODB_HOST, MONGODB_PORT, DBS_NAME, COLLECTION_PENDINGS, PENDINGS)
    
@app.route("/jenkins/mtslaves")
def mtslaves_projects():
    return data_projects(MONGODB_HOST, MONGODB_PORT, DBS_NAME, COLLECTION_MTSLAVES, MTSLAVES)

# web host definition    
if __name__ == "__main__":
    app.run(host='0.0.0.0',port=5000,debug=True)
