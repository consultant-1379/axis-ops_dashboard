queue()
    .defer(d3.json, "/jenkins/total_stats") // read project data
    .await(makeGraphs); // wait for all the data to be read before to execute the function

/*
error: to handle any error from the .defer function
projectsJson/statesJson: they contain the data to read from the .defer function
*/
function makeGraphs(error, projectsJson, statesJson) {
	
	//Clean projectsJson data
	var donorschooseProjects = projectsJson;
    var dateFormat = d3.time.format("%Y-%m-%d %H:%M:%S")
	donorschooseProjects.forEach(function(d) {
		d["date"] = dateFormat.parse(d["date"]);
        //d["date"].setDate(1);
	});

	//Create a Crossfilter instance
	var ndx = crossfilter(donorschooseProjects);

	//Define Dimensions
	var stateDim = ndx.dimension(function(d) { return d["fem"]; });
	var resourceTypeDim = ndx.dimension(function(d) { return d["job"]; });
	var povertyLevelDim = ndx.dimension(function(d) { return d["node"]; });
    var dateDim = ndx.dimension(function(d) { return d["date"]; });
    var statusDim  = ndx.dimension(function(d) { return d["status"]; });
    
    var fmt = d3.format('02d'); /////////////
    var ttt = ndx.dimension(function(d) { return [fmt(d.jobname)]; }); ////////////
    var femDim = ndx.dimension(function(d) { return d["area"]; });
    
	//Calculate metrics
    var numProjectsByFEMLevel = stateDim.group();
	var numProjectsByResourceType = resourceTypeDim.group();
	var numProjectsByPovertyLevel = povertyLevelDim.group();
	var numProjectsByDate = dateDim.group();
    var numProjectsByStatusLevel = statusDim.group();
    

    //var tttt = ttt.group(); //////////////
    grouping = function (d) { return d.jobname;};////////
    
	var all = ndx.groupAll();

	//Define values (to be used in charts)
	var minDate = dateDim.bottom(1)[0]["date"];
	var maxDate = dateDim.top(1)[0]["date"];

    //Charts
	var timeChart = dc.barChart("#time-chart");
    var usChart = dc.barChart("#us-chart");
	var resourceTypeChart = dc.rowChart("#resource-type-row-chart");
	var povertyLevelChart = dc.rowChart("#poverty-level-row-chart");
	var numberProjectsND = dc.numberDisplay("#number-projects-nd");
    var statusJenkinsJobChart = dc.rowChart("#status-type-row-chart");
    
    var chart = dc.dataTable("#test"); //////////////
    var select1 = dc.selectMenu("#select1");
    
    select1
        .dimension(femDim)
        .group(femDim.group())
        .controlsUseVisibility(true);

	numberProjectsND
		.formatNumber(d3.format("d"))
		.valueAccessor(function(d){return d; })
		.group(all);

	timeChart
		.width(1400)
		.height(300)
		.margins({top: 10, right: 50, bottom: 30, left: 50})
		.dimension(dateDim)
		.group(numProjectsByDate)
		.transitionDuration(500)
		.x(d3.time.scale().domain([minDate, maxDate]))
		.elasticY(true)
        .yAxisLabel("Number of builds")
		.xAxisLabel("Time")
		.yAxis().ticks(4);

	resourceTypeChart
        .width(600)
        .height(330)
        .dimension(resourceTypeDim)
        .group(numProjectsByResourceType)
        .elasticX(true)
        .xAxis().ticks(4);

	povertyLevelChart
        .width(600)
		.height(330)
		.dimension(povertyLevelDim)
        .group(numProjectsByPovertyLevel)
        /*.slicesCap(5)
        .innerRadius(100);*/
        .elasticX(true)
        .xAxis().ticks(4);
        
	usChart
        .width(1400)
        .height(300)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .brushOn(true)
        .yAxisLabel("Number of Jenkins Jobs")
        .xAxisLabel("Jenkins instance")
        .dimension(stateDim)
        .group(numProjectsByFEMLevel)
        .elasticY(true)
        
        .colorAccessor(function (d) {
        if (d.value < 800) {
            return "normal";
        }
        if (d.value > 800 && d.value < 900) {
            return "warning";
        }
        if (d.value > 900) {
            return "error";
        }
        })
        
        .colors(d3.scale.ordinal().domain(["normal", "warning", "error"])
        .range(["#3071a9", "#eea236", "#d9534f"]));
        
	statusJenkinsJobChart
        .width(600)
        .height(330)
        .dimension(statusDim)
        .group(numProjectsByStatusLevel)
        .elasticX(true)
        .xAxis().ticks(4);
        
    chart
        .width(150)
        .height(150)
        .dimension(ttt)
        .group(grouping)
        .size(6)
        //.columns(['jobname'])
        .sortBy(function (d) { return [fmt(+d.jobname)]; })
        .order(d3.ascending);
        
    d3.select('#download')
        .on('click', function() {
            var data = ttt.top(Infinity);
            var blob = new Blob([d3.csv.format(data)], {type: "text/plain;charset=utf-8"});
            saveAs(blob, 'data.csv');
        });

    dc.renderAll();

};