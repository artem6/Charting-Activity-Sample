var ActivityData = function(){
  this.data = [];
  this.summaryPreFilter = {};
  this.summaryPostFilter = {};

  this.interval = 3*60*60*1000;
  this.filter = {};
  this.maxRange = [null, null];
  this.range = [null, null];

  /* function to call upon any change happening */
  this.callback = null;

  this.setCallback = function(callback){
    this.callback = callback;
  }

  this.getSummary = function(item){
      var ret = [] , label;
      for (var property in this.summaryPostFilter[item]) {
        label = property.charAt(0).toUpperCase() + property.substring(1);
        ret.push({'label':label, 'value':this.summaryPostFilter[item][property]});
      } 
      return ret;
  }

  this.processData = function(){
    /* find the min and max of the dataset */
    var minAbsolute = this.maxRange[0].getTime();
    var maxAbsolute = this.maxRange[1].getTime();

    /* this is the min and max we are interested in */
    var minRange = this.range[0].getTime();
    var maxRange = this.range[1].getTime();

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

    /* loop through the data and process the activity */
    for (i=0,ii=this.data.length;i<ii;i++){

      time = this.data[i].Date.getTime();

      /* count the attributes within the range before the filter */
      if (time >= minRange && time <= maxRange){
        for (var attrname in this.data[i]) {
          if (!this.summaryPreFilter[attrname]) this.summaryPreFilter[attrname] = {};
          if (!this.summaryPreFilter[attrname][this.data[i][attrname]]) this.summaryPreFilter[attrname][this.data[i][attrname]] = 0;
          this.summaryPreFilter[attrname][this.data[i][attrname]] += 1;
        }
      }

      /* skip if the filter doesn't match */
      matchedFilters = 0;
      for (var property in this.filter) { if (this.data[i][property] == this.filter[property]) matchedFilters++;  }
      if (matchedFilters != filtersToMatch) continue;


      /* count the attributes within the range after the filter */
      if (time >= minRange && time <= maxRange){
        for (var attrname in this.data[i]) {
          if (!this.summaryPostFilter[attrname]) this.summaryPostFilter[attrname] = {};
          if (!this.summaryPostFilter[attrname][this.data[i][attrname]]) this.summaryPostFilter[attrname][this.data[i][attrname]] = 0;
          this.summaryPostFilter[attrname][this.data[i][attrname]] += 1;
        }
      }

      tempActivity[Math.floor((time-minAbsolute)/this.interval)] += this.data[i].Activity;
      tempTotal[Math.floor((time-minAbsolute)/this.interval)] ++;
    }

    /* convert to a percentage */
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
      activityData.push({"Date": new Date(time), "Activity": tempActivity[i]});

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
    var minRange = this.range[0].getTime();
    var maxRange = this.range[1].getTime();
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
    ret.push({"Date": new Date(minX*(maxRange-minRange) + minRange), "Activity": avgY + (minX - avgX) * slope });
    ret.push({"Date": new Date(maxX*(maxRange-minRange) + minRange), "Activity": avgY + (maxX - avgX) * slope });

    return ret;
  }
  this.averageLine = function(xData,yData){
    var avgY = Math.average(yData);
    var minX = Math.min.apply(Math, xData);
    var maxX = Math.max.apply(Math, xData);
    
    var ret = [];
    ret.push({"Date": new Date(minX), "Activity": avgY});
    ret.push({"Date": new Date(maxX), "Activity": avgY});
    return ret;
  }
  this.lastNDays = function(days){
    if (days){
      this.range = [d3.time.day.offset(this.maxRange[1],-days), this.maxRange[1]];
    }else{
      this.range = this.maxRange;
    }
    this.processData();
  }
  this.filterData = function(filter){
    if (typeof(filter)=="object") { 
      for (var attrname in filter) { 
        this.filter[attrname] = filter[attrname]; 
        if (this.filter[attrname] == undefined) delete this.filter[attrname];
      } 
    }
    this.processData();
  }

  this.importCSV = function(data,callback){
    var elThis=this;
    d3.csv(data, function(error, data) { 
      elThis.data = data; 
        elThis.data.forEach(function(d){
          d.Date = new Date(d.Date+" "+d.Time+" GMT");
          d.Activity = parseInt(d.Activity);
          delete d.Time;
        });

        elThis.maxRange[0] = new Date(d3.min(elThis.data, function(d){return d.Date.getTime();}));        
        elThis.maxRange[1] = new Date(d3.max(elThis.data, function(d){return d.Date.getTime();}));

        elThis.range = elThis.maxRange;
      callback(error);
      elThis.filterData();
    });
  }
}


