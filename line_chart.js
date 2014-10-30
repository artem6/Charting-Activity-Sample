var LineChart = function(){

  this.config = {
    location: "graph",
    margin: {"left": 2, "top": 0, "right": 0, "bottom": 50},
    xAxis: {"offset":0, "ticks":5, "tickSize":10, "type":"date" },
    yAxis: {"offset":0, "ticks":0, "tickSize":0, "type":"numeric"  },
    aspectRatio: 2    
  };
  this.lines = {};
  this.self = null
  this.graph = null;
  this.clipping = null;
  this.axis = {
    "x":{"scale": null, "d3": null, "svg": null},
    "y":{"scale": null, "d3": null, "svg": null}
  }

  this.hidden = {};

  this.getDimensions = function(){
    /* this pulls the width from the parent element */
    var width = parseInt(d3.select("#"+this.config.location).style("width"));
    var height = parseInt(width/this.config.aspectRatio);
    var innerWidth = width - this.config.margin.left - this.config.margin.right;
    var innerHeight = height - this.config.margin.top - this.config.margin.bottom;
    return {"width": width, "height": height, "innerWidth": innerWidth, "innerHeight": innerHeight}
  }

  this.init = function(){
    var elThis = this;

    var dimensions = this.getDimensions();

    if (typeof(arguments[0])=="object") { 
      for (var attrname in arguments[0]) { this.config[attrname] = arguments[0][attrname]; } 
    }

    /* make the SVG drawing the proper size */
    this.self = d3
      .select("#"+this.config.location)
        .append("svg")
          .attr("id", this.config.location + "SVG")
          .attr("width", dimensions.width)
          .attr("height", dimensions.height);

    /* make a new x-axis scale in D3 */
    if (this.config.xAxis.type == "date") this.axis.x.scale = d3.time.scale();
    if (this.config.xAxis.type == "numeric") this.axis.x.scale = d3.scale.linear();
    this.axis.x.scale
      .range([0, dimensions.innerWidth]);
    /* make a new x-axis in D3 */
    this.axis.x.d3 = d3.svg.axis()
      .scale(this.axis.x.scale)
      .ticks(this.config.xAxis.ticks)
      .tickSize(this.config.xAxis.tickSize)
      .orient("bottom");
    /* draw the x-axis on the SVG, not in the graph area */
    this.axis.x.svg = this.self
      .append("g")
        .attr("class", "x axis")
        .attr("transform", "translate("+(this.config.margin.left)+"," + (parseInt(dimensions.innerHeight) + this.config.xAxis.offset + this.config.margin.top) + ")")
        .call(this.axis.x.d3);

    /* make a new y-axis scale in D3 */
    if (this.config.yAxis.type == "date") this.axis.y.scale = d3.time.scale();
    if (this.config.yAxis.type == "numeric") this.axis.y.scale = d3.scale.linear();
    this.axis.y.scale
      .range([dimensions.innerHeight, 0]);
    /* make a new y-axis in D3 */
    this.axis.y.d3 = d3.svg.axis()
      .scale(this.axis.y.scale)
      .ticks(this.config.yAxis.ticks)
      .tickSize(this.config.yAxis.tickSize)
      .orient("left");
    /* draw the y-axis on the SVG, not in the graph area */
    this.axis.y.svg = this.self
      .append("g")
        .attr("class", "y axis")
        .attr("transform", "translate("+(this.config.yAxis.offset + this.config.margin.left)+","+(this.config.margin.top)+")")
        .call(this.axis.y.d3);


    /* make an offset area for the graph lines */
    this.graph = this.self
      .append("g")
        .attr("transform", "translate(" + this.config.margin.left + "," + this.config.margin.top + ")");

    /* add a clipping path so that the lines don't go out of bounds */
    this.clipping = this.graph
      .append("clipPath")
        .attr("id", "chartArea")
      .append("rect")
        .attr("id", "chartRect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", dimensions.innerWidth)
        .attr("height", dimensions.innerHeight);
  }

  this.addLine = function(line){
    var elThis = this;

    /* make a new line in D3 mapped to each axis */
    this.lines[line]={}
    this.lines[line].d3 = d3.svg.line()
      .x(function(d) { return elThis.axis.x.scale(d.x); })
      .y(function(d) { return elThis.axis.y.scale(d.y); });

    /* draw the line */
    this.lines[line].svg = this.graph
      .append("path")
        .datum([])
        .attr("clip-path", "url(#chartArea)")
        .attr("class", "line")
        .attr("id", line)
        .attr("d", this.lines[line].d3)
  }

  /* adds or removes the class "hiddenLine" from the line */
  this.toggleVisibility = function(object){
      var el = document.getElementById(object).className

      if (el.baseVal.indexOf("hiddenObject")==-1){
        el.baseVal += el.baseVal ? " hiddenObject" : "hiddenObject";
        el.animVal += el.animVal ? " hiddenObject" : "hiddenObject";
        return true;
      }else{
        el.baseVal = el.baseVal.replace("hiddenObject","");
        el.animVal = el.animVal.replace("hiddenObject","");
        return false;
      }
  }

  this.resize = function(){
    /* note that instead of using a traditional scale of the entire SVG drawing, 
       we are resizing only the graph area so that the fonts and line widths 
       stay exactly the same */

    var dimensions = this.getDimensions();

    /* resize the dvg, graph area, and clipping mask */
    this.self
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);
    this.graph
      .attr("width", dimensions.innerWidth)
      .attr("height", dimensions.innerHeight);
    this.clipping
      .attr("width", dimensions.innerWidth)
      .attr("height", dimensions.innerHeight);

    /* change the axis scale */
    this.axis.x.scale.range([0, dimensions.innerWidth]).nice(d3.time.second);
    this.axis.y.scale.range([dimensions.innerHeight, 0]).nice();

    /* change the axis position */
    this.axis.x.svg
      .attr("transform", "translate("+(this.config.margin.left)+"," + (parseInt(dimensions.innerHeight) + this.config.xAxis.offset + this.config.margin.top) + ")");
    this.axis.y.svg
      .attr("transform", "translate("+(this.config.yAxis.offset + this.config.margin.left)+","+(this.config.margin.top)+")");


    this.updateView();
  }

  this.changeData = function(data){
    /* updates the data for the lines */
    for (var property in data) {
      this.graph.selectAll('#'+property).datum(data[property]);
    }
  }

  this.changeRange = function(range){
    /* changes the min and max of the axis */
    this.axis.x.scale.domain(range.x);
    this.axis.y.scale.domain(range.y);
  }

  this.updateView = function(){
    var dimensions = this.getDimensions();

    /* redraws each axis */
    this.axis.x.svg.call(this.axis.x.d3);
    this.axis.y.svg.call(this.axis.y.d3);

    /* redraws each line */
    for (var line in this.lines) {
      this.lines[line].svg
        .transition()
        .attr("d", this.lines[line].d3);

    }
  }
}