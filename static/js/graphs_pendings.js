queue()
    .defer(d3.json, "/jenkins/pendings")
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
	var jenkinsInstanceDim = ndx.dimension(function(d) { return d["fem"]; });
	var jenkinsJobDim = ndx.dimension(function(d) { return d["job"]; });
	var rootCauseDim = ndx.dimension(function(d) { return d["rootcause"]; });
    var jenkinsNodeDim = ndx.dimension(function(d) { return d["node"]; });
    var issueTypeDim = ndx.dimension(function(d) { return d["status"]; });

    var fmt = d3.format('02d');
    
	//Calculate metrics
	var numProjectsByDate = dateDim.group();
    var numJenkinsInstance = jenkinsInstanceDim.group();

    var jenkinsJobDim = ndx.dimension(function(d) { return [fmt(d.jobname)]; });

	var numRootCause = rootCauseDim.group();
	var numJenkinsNode = jenkinsNodeDim.group();


    grouping = function (d) { return d.jobname;};
    
	var all = ndx.groupAll();

	//Define values (to be used in charts)
	var minDate = dateDim.bottom(1)[0]["time"];
	var maxDate = dateDim.top(1)[0]["time"];

    //Charts
	var numberProjectsND = dc.numberDisplay("#number-projects-nd");
	var timeChart = dc.barChart("#time-chart");
    var issueTypeChart = dc.selectMenu("#issue-type-chart");
    var mapChart = dc.barChart("#map-chart");
    var rootCauseChart = dc.rowChart("#root-cause-chart");
    var jenkinsJobReferenceChart = dc.dataTable("#jenkins-job-reference-chart");
	var jenkinsNodeReferenceChart = dc.rowChart("#jenkins-node-reference-chart");
    
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
        
    issueTypeChart
        .dimension(issueTypeDim)
        .group(issueTypeDim.group())
        .controlsUseVisibility(true);
        
	mapChart
        .width(1400)
        .height(300)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .brushOn(true)
        .yAxisLabel("Number of Jenkins Jobs")
        .xAxisLabel("Jenkins instance")
        .dimension(jenkinsInstanceDim)
        .group(numJenkinsInstance)
        .elasticY(true);
        
	rootCauseChart
        .width(600)
		.height(330)
		.dimension(rootCauseDim)
        .group(numRootCause)
        /*.slicesCap(5)
        .innerRadius(100);*/
        .elasticX(true)
        .xAxis().ticks(4);
        
    jenkinsJobReferenceChart
        .width(150)
        .height(150)
        .dimension(jenkinsJobDim)
        .group(grouping)
        .size(6)
        //.columns(['jobname'])
        .sortBy(function (d) { return [fmt(+d.jobname)]; })
        .order(d3.ascending);
        
	jenkinsNodeReferenceChart
        .width(600)
		.height(330)
		.dimension(jenkinsNodeDim)
        .group(numJenkinsNode)
        /*.slicesCap(5)
        .innerRadius(100);*/
        .elasticX(true)
        .xAxis().ticks(4);
        
    d3.select('#download')
        .on('click', function() {
            var data = jenkinsJobDim.top(Infinity);
            var blob = new Blob([d3.csv.format(data)], {type: "text/plain;charset=utf-8"});
            saveAs(blob, 'data.csv');
        });

    dc.renderAll();

};