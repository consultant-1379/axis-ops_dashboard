queue()
    .defer(d3.json, "/jenkins/mtslaves")
    .await(makeGraphs);

function makeGraphs(error, projectsJson, statesJson) {
	
	//Clean projectsJson data
	var dashboardProject = projectsJson;
    var dateFormat = d3.time.format("%Y-%m-%d %H:%M:%S")
	dashboardProject.forEach(function(d) {
		d["time"] = dateFormat.parse(d["time"]);
        //d["date"].setDate(1);
	});

	//Create a Crossfilter instance
	var ndx = crossfilter(dashboardProject);

	//Define Dimensions
    var dateDim = ndx.dimension(function(d) { return d["time"]; });
    var issueTypeDim = ndx.dimension(function(d) { return d["node"]; });
    
    var fmt = d3.format('02d');
    
	//Calculate metrics
	var numProjectsByDate = dateDim.group();
   
	var all = ndx.groupAll();

	//Define values (to be used in charts)
	var minDate = dateDim.bottom(1)[0]["time"];
	var maxDate = dateDim.top(1)[0]["time"];

    //Charts
	var timeChart = dc.barChart("#time-chart");
    var issueTypeChart = dc.selectMenu("#issue-type-chart");
    
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
        
    issueTypeChart
        .dimension(issueTypeDim)
        .group(issueTypeDim.group())
        .controlsUseVisibility(true);
       
    dc.renderAll();

};