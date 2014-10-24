var PieChart = function(){

  this.data = [];

  this.config = {
    location: "pie",
    margin: 1,
    duration: 500,
    minWidth: 300,
    maxWidth: 370,
    percentWidth: 0.4,
    color: ["#C9DAF8", "#FCE5CD", "#EAD1DC"]
  };

  this.hidden = [];
  
  this.init = function(){
    var elThis = this;

    if (typeof(arguments[0])=="object") { 
      for (var attrname in arguments[0]) { this.config[attrname] = arguments[0][attrname]; } 
    }

    this.hidden.width = 200;
    this.hidden.height = 200;
    this.hidden.radius = Math.floor(Math.min(this.hidden.width, this.hidden.height)/2 * 0.6);

    this.hidden.circle = d3.layout.pie()
      .sort(null)
      .value(function(d) { return d.value; });

    this.hidden.chartArc = d3.svg.arc()
      .innerRadius(0)
      .outerRadius(this.hidden.radius);

    this.hidden.labelArc = d3.svg.arc()
      .innerRadius(this.hidden.radius)
      .outerRadius(this.hidden.radius*1.8);

    this.hidden.svg = d3.select("#"+this.config.location)
      .attr("width", '100%')
      .attr("height", '100%')
      .attr('viewBox','0 0 '+Math.min(this.hidden.width,this.hidden.height) +' '+Math.min(this.hidden.width,this.hidden.height) )
      .attr('preserveAspectRatio','xMinYMin');

    this.hidden.arc_group = this.hidden.svg.append("g")
      .attr("class", "arcGroup")
      .attr("transform", "translate(" + (this.hidden.width / 2) + "," + (this.hidden.height / 2) + ")");

    this.hidden.label_group = this.hidden.svg.append("g")
      .attr("class", "labelGroup")
      .attr("transform", "translate(" + (this.hidden.width / 2) + "," + (this.hidden.height / 2) + ")");


    this.hidden.arcs = this.hidden.arc_group.selectAll("path")
      .data(this.hidden.circle(this.data));
    this.hidden.arcs.enter()
      .append("path")
        .attr("fill", function(d, i) { return elThis.config.color[i]; })
        .attr("d", this.hidden.chartArc)
        .each(function(d) { return this.current = d; });

    this.hidden.sliceLabel = this.hidden.label_group.selectAll("text")
      .data(this.hidden.circle(this.data));
    this.hidden.sliceLabel.enter()
      .append("text")
        .attr("class", "arcLabel")
        .attr("transform", function(d) { return "translate(" + (elThis.hidden.labelArc.centroid(d)) + ")"; })
        .attr("text-anchor", "middle")
        .style("background-color", function(d, i) { return elThis.config.color[i]; })
        .text(function(d) { return d.data.label; });

      this.resize();

  };
  this.updateView = function(data) {
    elThis = this;

    this.data = data;

    this.hidden.arcs
      .data(this.hidden.circle(this.data))
      .enter();

    this.hidden.arcs
      .transition()
      .duration(this.config.duration)
      .attrTween("d", function(a) {
          var i = d3.interpolate(this.current, a);
          this.current = i(0);
          return function(t) { return elThis.hidden.chartArc(i(t)); };
        });


    this.hidden.sliceLabel
      .data(this.hidden.circle(this.data));

    this.hidden.sliceLabel
      .transition()
      .duration(this.config.duration)
      .attr("transform", function(d) { return "translate(" + (elThis.hidden.labelArc.centroid(d)) + ")"; })
      .style("background-color", function(d, i) { return elThis.config.color[i]; });

  };

  this.resize = function(){
    el = document.getElementById(this.config.location);
    var width = Math.min(Math.max(parseInt(window.innerWidth) * this.config.percentWidth,this.config.minWidth),this.config.maxWidth) + "px";
    el.style.width = width;
    el.style.height = width;

  };

}

