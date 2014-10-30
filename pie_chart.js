var PieChart = function(){

  this.data = [];

  this.config = {
    "location": "pie",
    "margin": 1,
    "duration": 500,
    "minWidth": 300,
    "maxWidth": 370,
    "percentWidth": 0.4,

    "baseDimensions": {"width": 200, "height": 200, "pieRadius": 60, "labelRadius": 100},
    "labelDimensions": {"width": 36, "height": 12, "xOffset": 0, "yOffset": -3},
    "color": ["#C9DAF8", "#FCE5CD", "#EAD1DC"]
  };

  this.self = null;
  this.pie = null;
  this.chart = {"arc":null, "group":null, "objects":null };
  this.labels = {"arc":null, "group":null, "objects":null };
  this.labelBackground = {"arc":null, "group":null, "objects":null };
  
  this.init = function(){
    var elThis = this;

    /* inputs any config settings passed */
    if (typeof(arguments[0])=="object") { 
      for (var attrname in arguments[0]) { this.config[attrname] = arguments[0][attrname]; } 
    }

    /* sets up the SVG drawing area */
    this.self = d3
      .select("#"+this.config.location)
        .append("svg")
          .attr("id", this.config.location + "SVG")
          .attr("width", '100%')
          .attr("height", '100%')
          .attr('viewBox','0 0 '+ this.config.baseDimensions.width +' '+this.config.baseDimensions.height )
          .attr('preserveAspectRatio','xMinYMin');

    /* creates a D3 pie object */
    this.pie = d3.layout.pie()
      .sort(null)
      .value(function(d) { return d.value; });

    /* creates a D3 arc object for the chart */
    this.chart.arc = d3.svg.arc()
      .innerRadius(0)
      .outerRadius(this.config.baseDimensions.pieRadius);
    /* makes an area for drawing the chart */
    this.chart.group = this.self.append("g")
      .attr("class", "arcGroup")
      .attr("transform", "translate(" + (this.config.baseDimensions.width / 2) + "," + (this.config.baseDimensions.height / 2) + ")");
    /* sets up the arcs for the chart */
    this.chart.objects = this.chart.group.selectAll("path")
      .data(this.pie(this.data));
    this.chart.objects.enter()
      .append("path")
        .attr("fill", function(d, i) { return elThis.config.color[i]; })
        .attr("d", this.chart.arc)
        .each(function(d) { return this.current = d; });

    /* creates a D3 arc object for the label background */
    this.labelBackground.arc = d3.svg.arc()
      .innerRadius(this.config.baseDimensions.pieRadius)
      .outerRadius(this.config.baseDimensions.labelRadius);
    /* makes an area for drawing the label backround */
    this.labelBackground.group = this.self.append("g")
      .attr("class", "labelGroup")
      .attr("transform", "translate(" + (this.config.baseDimensions.width / 2) + "," + (this.config.baseDimensions.height / 2) + ")");
    /* sets up the background for the labels */
    this.labelBackground.objects = this.labelBackground.group.selectAll("rect")
      .data(this.pie(this.data));
    this.labelBackground.objects.enter()
      .append("rect")
          .attr("transform", function(d) { return "translate(" + (elThis.labelBackground.arc.centroid(d)) + ")"; })
          .attr("width", this.config.labelDimensions.width)
          .attr("height", this.config.labelDimensions.height)
          .attr("x", this.config.labelDimensions.width / -2 + this.config.labelDimensions.xOffset)
          .attr("y", this.config.labelDimensions.height / -2 + this.config.labelDimensions.yOffset)
          .style("fill", function(d, i) { return elThis.config.color[i]; });

    /* creates a D3 arc object for the labels */
    this.labels.arc = d3.svg.arc()
      .innerRadius(this.config.baseDimensions.pieRadius)
      .outerRadius(this.config.baseDimensions.labelRadius);
    /* makes an area for drawing the labels */
    this.labels.group = this.self.append("g")
      .attr("class", "labelGroup")
      .attr("transform", "translate(" + (this.config.baseDimensions.width / 2) + "," + (this.config.baseDimensions.height / 2) + ")");
    /* sets up the labels */
    this.labels.objects = this.labels.group.selectAll("text")
      .data(this.pie(this.data));
    this.labels.objects.enter()      
      .append("text")
        .attr("class", "arcLabel")
        .attr("transform", function(d) { return "translate(" + (elThis.labels.arc.centroid(d)) + ")"; })
        .attr("text-anchor", "middle")
        .text(function(d) { return d.data.label; });

    /* runs the resize function */
    this.resize();

  };
  this.updateData = function(data) {
    this.data = data;

    /* update the chart with the new data */
    this.chart.objects
      .data(this.pie(this.data))
      .enter();

    /* update the labels with the new data */
    this.labels.objects
      .data(this.pie(this.data));

    /* update the label backgrounds with the new data */
    this.labelBackground.objects
      .data(this.pie(this.data));

  }
  this.updateView = function() {
    elThis = this;

    /* redraw the chart */
    this.chart.objects
      .transition()
      .duration(this.config.duration)
      .attrTween("d", function(a) {
          var i = d3.interpolate(this.current, a);
          this.current = i(0);
          return function(t) { return elThis.chart.arc(i(t)); };
        });

    /* redraw the labels */
    this.labels.objects
      .transition()
      .duration(this.config.duration)
      .attr("transform", function(d) { return "translate(" + (elThis.labels.arc.centroid(d)) + ")"; });

    /* redraw the label background */
    this.labelBackground.objects
      .transition()
      .duration(this.config.duration)
      .attr("transform", function(d) { return "translate(" + (elThis.labels.arc.centroid(d)) + ")"; });
  };

  this.resize = function(){
    // ================== TODO fix later
    el = document.getElementById(this.config.location+"SVG");
    var width = Math.min(Math.max(parseInt(window.innerWidth) * this.config.percentWidth,this.config.minWidth),this.config.maxWidth) + "px";
    el.style.width = width;
    el.style.height = width;
  };

}

