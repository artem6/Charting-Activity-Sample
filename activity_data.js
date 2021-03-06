var ActivityData = function(){
  this.data = [];

  this.summaryPreFilter = {};
  this.summaryPostFilter = {};

  this.interval = 3*60*60*1000;
  this.filter = {};
  this.maxRange = {"x":[null, null], "y": [null, null]};
  this.range = {"x":[null, null], "y": [null, null]};

  /* function to call upon any change happening */
  this.callback = null;

  this.setCallback = function(callback){
    this.callback = callback;
  }

  this.getSummary = function(item){
    /* returns aggregate data for a pie chart from the post-filter data */
    var ret = [], label;
    for (var property in this.summaryPostFilter[item]) {
      label = property.charAt(0).toUpperCase() + property.substring(1);
      ret.push({'label':label, 'value':this.summaryPostFilter[item][property]});
    } 
    return ret;
  }

  this.init = function(){
    elThis = this;

    /* get the extremeties of the data */
    this.maxRange.x[0] = new Date(d3.min(elThis.data, function(d){return d.Date.getTime();}));        
    this.maxRange.x[1] = new Date(d3.max(elThis.data, function(d){return d.Date.getTime();}));
    this.maxRange.y[0] = 0;
    this.maxRange.y[1] = 1;

    /* set the current range to the max range */
    this.range.x = this.maxRange.x;
    this.range.y = this.maxRange.y;



  }

  this.processData = function(){
    /* find the min and max of the dataset */
    var minAbsolute = this.maxRange.x[0].getTime();
    var maxAbsolute = this.maxRange.x[1].getTime();

    /* this is the min and max we are interested in */
    var minRange = this.range.x[0].getTime();
    var maxRange = this.range.x[1].getTime();

    /* define some helper variables */
    var i, ii, time;

    /* make a new empty array to hold the data */
    var tempActivity = new Array(Math.ceil((maxAbsolute-minAbsolute)/this.interval)+1).join('0').split('').map(parseFloat);
    var tempTotal = new Array(Math.ceil((maxAbsolute-minAbsolute)/this.interval)+1).join('0').split('').map(parseFloat);

    /* reset the summary data */
    this.summaryPreFilter = {};
    this.summaryPostFilter = {};

    /* determine how many filters we need to satisfy */
    var filtersToMatch = Object.keys(this.filter).length;
    var matchedFilters = 0;

    /* loop through the data  */
    for (i=0,ii=this.data.length;i<ii;i++){

      time = this.data[i].Date.getTime();

      /* count the attributes: (1) within the range and (2) before the filter */
      if (time >= minRange && time <= maxRange){  
        for (var attrname in this.data[i]) {
          if (attrname == "Date" || attrname == "Activity") continue;
          if (!this.summaryPreFilter[attrname]) this.summaryPreFilter[attrname] = {};
          if (!this.summaryPreFilter[attrname][this.data[i][attrname]]) this.summaryPreFilter[attrname][this.data[i][attrname]] = 0;
          this.summaryPreFilter[attrname][this.data[i][attrname]] += 1;
        }
      }

      /* skip if the filter doesn't match */
      matchedFilters = 0;
      for (var property in this.filter) { if (this.data[i][property] == this.filter[property]) matchedFilters++;  }
      if (matchedFilters != filtersToMatch) continue;

      /* count the attributes: (1) within the range and (2) after the filter */
      if (time >= minRange && time <= maxRange){  
        for (var attrname in this.data[i]) {
          if (attrname == "Date" || attrname == "Activity") continue;
          if (!this.summaryPostFilter[attrname]) this.summaryPostFilter[attrname] = {};
          if (!this.summaryPostFilter[attrname][this.data[i][attrname]]) this.summaryPostFilter[attrname][this.data[i][attrname]] = 0;
          this.summaryPostFilter[attrname][this.data[i][attrname]] += 1;
        }
      }
      
      /* count the activity data: (1) across all data and (2) after the filter */
      tempActivity[Math.floor((time-minAbsolute)/this.interval)] += this.data[i].Activity;
      tempTotal[Math.floor((time-minAbsolute)/this.interval)] ++;
    }

    /* convert the activity data to a percentage */
    for (i=0,ii=tempActivity.length;i<ii;i++){
      tempActivity[i] = tempTotal[i]? tempActivity[i] / tempTotal[i] : 0;
    }

    /* these store the time constrained data to calculate the trend and average lines */
    var xData = [];
    var yData = [];

    /* this stores the final data for giving to D3 to draw the line */
    var activityData = [];

    for (i=0,ii=tempActivity.length;i<ii;i++){
      /* we are giving D3 the entire line, even points outside the range.
         doing so will help D3 draw and animate faster */
      time = minAbsolute+i*this.interval;
      activityData.push({"x": new Date(time), "y": tempActivity[i]});

      /* now separately save the data for trend and average processing if it is in the range */
      if (time >= minRange && time <= maxRange) {
        xData.push(time);
        yData.push(tempActivity[i]);
      }
    }

    var averageData = this.averageLine(xData,yData);
    var trendData = this.trendLine(xData,yData);

    var ret = {"activityLine":activityData, "averageLine":averageData, "trendLine":trendData};

    if (this.callback) this.callback(ret);
    return ret;
  }
  this.trendLine = function(xData,yData){
    var minRange = this.range.x[0].getTime();
    var maxRange = this.range.x[1].getTime();
    var i,ii;

    /* the x values are in the form of milliseconds, which 
       gives us very large numbers that will not work with complex
       math operations. We are shrinking these numbers to a smaller 0-1 range */
    for (i=0,ii=xData.length;i<ii;i++){
      xData[i] = (xData[i] - minRange)/( maxRange - minRange );
    }

    var avgX = Math.average(xData);
    var avgY = Math.average(yData);
    
    var varX = Math.variance(xData, avgX);
    var covXY = Math.covariance(xData,yData,avgX,avgY);

    var maxX = Math.max.apply(Math, xData);  
    var minX = Math.min.apply(Math, xData);

    var slope = covXY / varX;

    var ret = [];
    ret.push({"x": new Date(minX*(maxRange-minRange) + minRange), "y": avgY + (minX - avgX) * slope });
    ret.push({"x": new Date(maxX*(maxRange-minRange) + minRange), "y": avgY + (maxX - avgX) * slope });

    return ret;
  }
  this.averageLine = function(xData,yData){
    var avgY = Math.average(yData);
    var minX = Math.min.apply(Math, xData);
    var maxX = Math.max.apply(Math, xData);
    
    var ret = [];
    ret.push({"x": new Date(minX), "y": avgY});
    ret.push({"x": new Date(maxX), "y": avgY});
    return ret;
  }
  this.lastNDays = function(days){
    if (days){
      this.range.x = [d3.time.day.offset(this.maxRange.x[1],-days), this.maxRange.x[1]];
    }else{
      this.range.x = this.maxRange.x;
    }
    this.processData();
  }
  this.filterData = function(filter){
    /* applies a filter before processing the data */
    if (typeof(filter)=="object") { 
      for (var attrname in filter) { 
        this.filter[attrname] = filter[attrname]; 
        if (this.filter[attrname] == undefined) delete this.filter[attrname];
      } 
    }
    this.processData();
  }

  this.importCSV = function(data,callback){
    /* imports the data from a CSV file */
    var elThis=this;
    d3.csv(data, function(error, data) { 
      elThis.data = data; 

      elThis.data.forEach(function(d){
        d.Date = new Date(d.Date+" "+d.Time+" PST");
        d.Activity = parseInt(d.Activity);
        delete d.Time;
      });

      callback(error);
      elThis.init();
      elThis.filterData();
    });
  }
}


