queue()
    .defer(d3.json, "/jenkins/plugins")
    .await(makeGraphs);

function makeGraphs(error, projectsJson, statesJson) {
	
	//Clean projectsJson data
	var donorschooseProjects = projectsJson;

	//Create a Crossfilter instance
	var ndx = crossfilter(donorschooseProjects);
    
	//Define Dimensions
	var femDim = ndx.dimension(function(d) { return d["fem"]; });
	var pluginDim = ndx.dimension(function(d) { return d["plugin"]; });
	var statusDim = ndx.dimension(function(d) { return d["status"]; });

    //Charts
    var select1 = dc.selectMenu("#select1");
    var select2 = dc.selectMenu("#select2");
    var select3 = dc.selectMenu("#select3");
    var datatable = dc.dataTable("#datatable");
    
    select1
        .dimension(femDim)
        .group(femDim.group())
        .controlsUseVisibility(true);
    select2
        .width(600)
        .height(300)
        .dimension(pluginDim)
        .group(pluginDim.group())
        .multiple(true)
        .numberVisible(10)
        .controlsUseVisibility(true);
    select3.dimension(statusDim)
        .width(150)
        .height(150)
        .group(statusDim.group())
        .multiple(true)
        .numberVisible(10)
        .controlsUseVisibility(true);
    datatable
        .dimension(femDim)
        .group(function(d) { return d["fem"] })
        //.columns(['plugin', 'version'])
        .columns([
            function (d) { return d["plugin"] },
            function (d) { return d["version"] }])
        .sortBy(function(d) { return d["plugin"]; })
        .size(donorschooseProjects.length);
        
    dc.renderAll();

};