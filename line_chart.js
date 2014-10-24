var LineChart = function(){

  this.config = {
    location: "graph",
    margin: {"x": 2, "y": 50},
    xAxis: {min: null, max:null, xOffset:0, yOffset:0 },
    yAxis: {min: null, max:null, xOffset:0, yOffset:0 },
    aspectRatio: 3    
  };
  this.lines = {};
  this.graph = null;

  this.hidden = {};

  this.init = function(){
    var elThis = this;

    if (typeof(arguments[0])=="object") { 
      for (var attrname in arguments[0]) { this.config[attrname] = arguments[0][attrname]; } 
    }

    if (this.config.xAxis.max == null) this.config.xAxis.max = new Date("07/31/2014 11:59:00 PM GMT");
    if (this.config.xAxis.min == null) this.config.xAxis.min = d3.time.day.offset(this.config.xAxis.max,-14);
    if (this.config.yAxis.max == null) this.config.yAxis.max = 1;
    if (this.config.yAxis.min == null) this.config.yAxis.min = 0;


    var width = parseInt(d3.select("#"+this.config.location).style("width")) - this.config.margin.x*2;
    var height = parseInt(width/this.config.aspectRatio);

    this.hidden.xScale = d3.time.scale()
      .range([0, width])
      .nice(d3.time.year)
      .domain([this.config.xAxis.min,this.config.xAxis.max]);

    this.hidden.yScale = d3.scale.linear()
      .range([height, 0])
      .nice()
      .domain([this.config.yAxis.min,this.config.yAxis.max]);

    this.hidden.xAxis = d3.svg.axis()
      .scale(this.hidden.xScale)
      .ticks(4)
      .tickSize(8)
      .orient("bottom");

    this.hidden.yAxis = d3.svg.axis()
      .scale(this.hidden.yScale)
      .ticks(0)
      .tickSize(0)
      .orient("left");

    this.graph = d3
      .select("#"+this.config.location)
        .attr("width", width + this.config.margin.x*2)
        .attr("height", height + this.config.margin.y*2)
      .append("g")
        .attr("transform", "translate(" + this.config.margin.x + "," + this.config.margin.y + ")");
      
    this.graph.append("clipPath")
        .attr("id", "chartArea")
        .append("rect")
        .attr("id", "chartRect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height);

    this.graph.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate("+this.config.xAxis.xOffset+"," + (parseInt(height) + this.config.xAxis.yOffset) + ")")
        .call(this.hidden.xAxis);

    this.graph.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate("+this.config.yAxis.xOffset+","+this.config.yAxis.yOffset + ")")
        .call(this.hidden.yAxis);
  }

  this.addLine = function(line){
    var elThis = this;
    this.lines[line] = d3.svg.line()
      .x(function(d) { return elThis.hidden.xScale(d.Date); })
      .y(function(d) { return elThis.hidden.yScale(d.Activity); });

    this.graph.append("path")
      .datum([])
      .attr("clip-path", "url(#chartArea)")
      .attr("class", "line")
      .attr("id", line)
      .attr("d", this.lines[line])
  }

  this.toggleLineVisibility = function(line){
      var el = document.getElementById(line).className

      if (el.baseVal.indexOf("hiddenLine")==-1){
        el.baseVal += el.baseVal ? " hiddenLine" : "hiddenLine";
        el.animVal += el.animVal ? " hiddenLine" : "hiddenLine";
        return true;
      }else{
        el.baseVal = el.baseVal.replace("hiddenLine","");
        el.animVal = el.animVal.replace("hiddenLine","");
        return false;
      }
  }

  this.resize = function(){
    var width = parseInt(d3.select("#"+this.config.location).style("width")) - this.config.margin.x*2;
    var height = parseInt(width/this.config.aspectRatio);

    document.getElementById(this.config.location).style.height = (height+this.config.margin.y*2) + "px";

    d3.select("#chartRect")
      .attr("width", width)
      .attr("height", height);

    this.hidden.xScale.range([0, width]).nice(d3.time.second);
    this.hidden.yScale.range([height, 0]).nice();

    this.updateView();
  }

  this.changeData = function(data){
    for (var property in data) {
      this.graph.selectAll('#'+property).datum(data[property]);
    }
  }

  this.changeRange = function(range){
    this.hidden.xScale.domain(range);
  }

  this.updateView = function(){
    var width = parseInt(d3.select("#"+this.config.location).style("width")) - this.config.margin.x*2;
    var height = parseInt(width/this.config.aspectRatio);


    this.graph.select('.x.axis')
      .attr("transform", "translate("+this.config.xAxis.xOffset+"," + (parseInt(height) + this.config.xAxis.yOffset) + ")")
      .call(this.hidden.xAxis);

    this.graph.select('.y.axis')
      .attr("transform", "translate("+this.config.yAxis.xOffset+","+this.config.yAxis.yOffset + ")")
      .call(this.hidden.yAxis);

    this.graph.selectAll('#activityLine').transition()
      .attr("d", this.lines.activityLine);
     this.graph.selectAll('#trendLine').transition()
      .attr("d", this.lines.trendLine);
    this.graph.selectAll('#averageLine').transition()
      .attr("d", this.lines.averageLine);
  }
}