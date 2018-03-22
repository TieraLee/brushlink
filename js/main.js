// Color mapping based on year
var yearColors = {2000: '#8c8c8c', 2010: '#d86763'};
var valueColors = ['#fcc9b5','#fa8873','#d44951','#843540'];
var densityColorScale = d3.scaleThreshold().range(valueColors).domain([5000,10000,15000]);
var popColorScale = d3.scaleThreshold().range(valueColors).domain([500000, 1000000, 5000000]);
var landColorScale = d3.scaleThreshold().range(valueColors).domain([200, 500, 1000]);

// Create a list of objects for generating the color legend
var legendObjects = valueColors.map(function(color) { return {legend:popColorScale.invertExtent(color), color: color};}).reverse();

var svg = d3.select('svg');
// Get layout parameters
var svgWidth = +svg.attr('width');
var svgHeight = +svg.attr('height');

var padding = {t: 40, r: 5, b: 40, l: 300};
var cellPadding = 50;

// Compute chart dimensions
var chartWidth = svgWidth - padding.l - padding.r;
var chartHeight = svgHeight - padding.t - padding.b;


// Create a group element for appending chart elements
var chartG = svg.append('g')
    .attr('transform', 'translate('+[padding.l, padding.t]+')');

var metrics2000 = ['land_2000','pop_2000','density_2000'];
var metrics2010 = ['land_2010','pop_2010','density_2010'];
var growth = ['land_growth','pop_growth','density_growth'];

var N = growth.length;

// Compute chart dimensions
var cellWidth = (svgWidth - padding.l - padding.r - 100) / N;
var cellHeight = (svgHeight - padding.t - padding.b);

var barGraphWidth = 2*(cellWidth / 3);
var barGraphHeight =  (cellHeight /2);



// scales
var xBarScale = d3.scaleLinear().range([0, barGraphWidth]);
var yBarScale = d3.scaleBand().range([0, barGraphHeight]);

var xHistogramScale = d3.scaleLinear()
    .rangeRound([0,cellWidth-cellPadding]);

var yHistogramScale = d3.scaleLinear()
    .domain([0, 160])
    .range([cellHeight-cellPadding, 0]);

var yGrid = d3.axisLeft(yHistogramScale)
        .tickSize(-cellWidth, 0, 0) // Use tick size to create grid line
        .tickFormat('')
        .ticks(9);



var barHeight = 5;

// resuable

var max2010byAttribute = {};
var max2000byAttribute = {};
var growthExtent = {};


// Brushing
var brush = d3.brushX()
    .extent([[0, 0], [cellWidth-cellPadding, cellHeight - cellPadding]])
    .on("start", brushstart)
    .on("brush", brushmove)
    .on("end", brushend);

var brushCell;


function highlight(type){
    if (type == null){
        d3.selectAll('.rect').classed('active', false);
        svg.selectAll('.hidden').classed('hidden', false);
    } else {
        d3.selectAll('.rect.' + type).classed('active', true);
        svg.selectAll(".dot")
            .classed("hidden", function(d){
                return (d.country == type);
            });
    }
}

function pairCell(metric2000,metric2010,growth, col){
    this.metric2000 = metric2000;
    this.metric2010 = metric2010;
    this.growth = growth;
    this.col = col;
}

var cells = [];

for(var i = 0; i<3; i++){
    cells.push(new pairCell(metrics2000[i], metrics2010[i],growth[i], i));
}



pairCell.prototype.init = function(g) {
    var cell = d3.select(g);

    // cell.append('rect')
    //   .attr('class', 'frame')
    //   .attr('width', cellWidth - cellPadding)
    //   .attr('height', cellHeight - cellPadding);
}


pairCell.prototype.update = function(g, data, growthData) {
    var cell = d3.select(g);
    var _this = this;



    var legend = svg.selectAll('.legend')
    .data(legendObjects)
    .enter()
    .append('g')
    .attr('class', 'legend');
  //   .attr('transform', function(d, i) {
  //   var height = legendRectSize + legendSpacing;
  //   var offset =  height * color.domain().length / 2;
  //   var horz = -2 * legendRectSize;
  //   var vert = i * height - offset;
  //   return 'translate(' + horz + ',' + vert + ')';
  // });

    // text for title
    if(_this.growth == 'land_growth'){
        var title = 'Urban Growth';
    } else if (_this.growth == 'pop_growth') {
        var title = 'Urban Population';
    }
    else if (_this.growth == 'density_growth') {
        var title = ' Avg. Population Density';
    }



///////////////////////////////////////////////////Histogram


    var histogram = cell.append('g')
    .attr('class','histogramGroup');

    histogram.append('g')
        .attr('class', 'grid')
        .call(yGrid);


    xHistogramScale.domain(growthExtent[_this.growth]);

    var bins = d3.histogram()
        .value(function(d) {
            return d[_this.growth];
        })
        .domain(xHistogramScale.domain())
        .thresholds(xHistogramScale.ticks(80))
        (growthData);



    histogram.append('g')
        .attr('class', 'x axis')
        .attr('transform','translate(0,' +(cellHeight - cellPadding) +')')
        .call(d3.axisBottom(xHistogramScale).ticks(5));

    histogram.append('g')
        .attr('class', 'y axis')
        .call(d3.axisLeft(yHistogramScale).ticks(9));

    histogram.append('text')
        .attr('class', 'y-axis-label')
        .attr('transform', 'translate('+[-20, cellHeight - cellPadding]+') rotate(270)')
        .text('Number of Cities');

    // histogram.append('text')
    //     .attr('class', 'title')
    //     .attr('transform', 'translate('+[50, 2* (cellHeight/3)]+')')
    //     .text(title + 'between 2000 and 2010')
    //     .style("font-size","12px")
    //     .style("word-wrap","break-word");



//used for coloring
if(_this.growth == 'land_growth'){
        var scale = landColorScale;
        var colorAttribute = 'land_2010';
    } else if (_this.growth == 'pop_growth') {
        var scale = popColorScale;
        var colorAttribute = 'pop_2010';
    }
    else if (_this.growth == 'density_growth') {
        var scale = densityColorScale;
        var colorAttribute = 'density_2010';
    }


var dot = histogram.selectAll('.dotbin')
    .data(bins);

var dotEnter = dot.enter()
    .append('g')
    .attr('class', 'dotbin')
    .attr('transform',function(d){
        tx = xHistogramScale(d.x0);
        return 'translate('+[tx,0]+')';
    })
    .selectAll('.dot')
    .data(function(d) {return d;})
    .enter()
    .append('circle')
    .attr('class', 'dot')
    .attr('cx',0)
    .attr('cy', function(d,i){
        return yHistogramScale(i);
    })
    .attr('r', 2)
    .style('fill', function(d){
        return scale(d[colorAttribute]);
    });


//////////////////////////////////////////////Bar Chart 

    // var test = data.sort(function(x,y){
    //     return d3.descending(x.value[_this.metric2010], y.value[_this.metric2010]);
    // });

    // console.log(test);


    var barChart = cell.append('g')
        .attr('transform',function(d){
            return 'translate('+[(cellWidth-barGraphWidth - 15), 15] + ')';
        });

    // barChart.append('rect')
    //     .attr('class', 'frame')
    //     .attr('width',barGraphWidth)
    //     .attr('height', barGraphHeight);



    barChart.append('text')
        .attr('class', 'title')
        .attr('transform', 'translate('+[0, 0]+')')
        .text(title);


    // set x axis for bar chats
    var barMax = Math.max(max2000byAttribute[this.metric2000], max2010byAttribute[this.metric2010]);
    xBarScale.domain([0,barMax]);

    yBarScale.domain(countryKeys);

    barChart.append('g')
        .attr('class', 'x axis')
        .attr('transform','translate(0,' +barGraphHeight +')')
        .call(d3.axisBottom(xBarScale).ticks(5));

    barChart.append('g')
        .attr('class', 'y axis')
        .call(d3.axisLeft(yBarScale));


    // bar chart group for 2 rects
    var barGroup = barChart.selectAll('.barPair')
        .data(data, function(d){
            return d.key;
        });

    var barGroupEnter = barGroup.enter()
        .append('g')
        .attr('class', 'barPair')
        .attr('transform',function(d){
            ty = yBarScale(d.key);
            return 'translate('+[0,ty]+')';
        });

        // the actual two rectanlges
    barGroupEnter.append('rect')
            .attr('class',function(d){
                return 'rect ' + d.key;
            })
            .attr('x','0')
            .attr('y','5')
            .attr('width',function(d){
                return xBarScale(d.value[_this.metric2000]);
            })
            .attr('height',barHeight)
            .style('fill',yearColors[2000]);

    barGroupEnter.append('rect')
            .attr('class',function(d){
                return 'rect ' + d.key;
            })
            .attr('x','0')
            .attr('y','10')
            .attr('width',function(d){
                return xBarScale(d.value[_this.metric2010]);
            })
            .attr('height',barHeight)
            .style('fill', yearColors[2010]);

    barGroupEnter.on('mouseover', function(d){
        highlight(d.key);
    })
    .on('mouseout', function(d){
        highlight(null);
    });

    barGroup.merge(barGroupEnter);

    
    histogram.append('text')
        .attr('class', 'title')
        .attr('transform', 'translate('+[50, 2* (cellHeight/3)]+')')
        .text(title + 'between 2000 and 2010')
        .style("font-size","12px")
        .style("word-wrap","break-word");

}


//create cell frames
var cellEnter = chartG.selectAll('.cell')
    .data(cells)
    .enter()
    .append('g')
    .attr('class', 'cell')
    .attr("transform", function(d) {
        // Start from the far right for columns to get a better looking chart
        var tx = (N - d.col - 1) * cellWidth + cellPadding / 2;
        var ty = cellPadding;
        return "translate("+[tx, ty]+")";
     });


// Dataset from http://nbremer.github.io/urbanization/
d3.csv('./data/asia_urbanization.csv',
function(row){
    // This callback formats each row of the data
    return {
        city: row.city,
        country: row.country,
        type_country: row.type_country,
        land_2000: +row.land_2000,
        land_2010: +row.land_2010,
        land_growth: +row.land_growth,
        pop_2000: +row.pop_2000,
        pop_2010: +row.pop_2010,
        pop_growth: +row.pop_growth,
        density_2000: +row.density_2000,
        density_2010: +row.density_2010,
        density_growth: +row.density_growth
    }
},
function(error, dataset){
    if(error) {
        console.error('Error while loading ./data/asia_urbanization.csv dataset.');
        console.error(error);
        return;
    }

    cityData = dataset;

//////nesting data for bar char
    var nestedData = d3.nest()
        .key(function(d){
            return d.country;
        })
        .rollup(function(v) { return {
            density_2000: d3.mean(v, function(d) {
                return d.density_2000;
            }),
            density_2010: d3.mean(v, function(d) {
                return d.density_2010;
            }),
            pop_2000: d3.sum(v, function(d){
                return d.pop_2000;
            }),
            pop_2010: d3.sum(v, function(d) {
                return d.pop_2010;
            }),
            land_2000: d3.sum(v, function(d){
                return d.land_2000;
            }),
            land_2010: d3.sum(v, function(d){
                return d.land_2010;
            })
        }; })
        .entries(dataset);

        console.log(nestedData.key);
        // retrieving entry values for nested data
        countryKeys = nestedData.map(function(d) {
        return d.key;
        });


        var countryValues = nestedData.map(function(d){
            return d.value;
        });

        //mapping maximum and extent values of attributes
        metrics2010.forEach(function(attribute){
        max2010byAttribute[attribute] = d3.max(countryValues, function(d){
                return d[attribute];
            });
        });

        metrics2000.forEach(function(attribute){
        max2000byAttribute[attribute] = d3.max(countryValues, function(d){
                return d[attribute];
            });
        });

        growth.forEach(function(attribute){
            growthExtent[attribute] = d3.extent(dataset, function(d){
                return d[attribute];
            });
        });

        //mapping extent of attributes

    cellEnter.append('g')
        .attr('class', 'brush')
        .call(brush);

     
    cellEnter.each(function(cell){
        cell.init(this);
        cell.update(this, nestedData, dataset);
        });



    // **** Your JavaScript code goes here ****



});

function brushstart(cell) {
    // cell is the SplomCell object

    // // Check if this g element is different than the previous brush
    if(brushCell !== this) {

        // Clear the old brush
        brush.move(d3.select(brushCell), null);

        // Update the global scales for the subsequent brushmove events
        xHistogramScale.domain(growthExtent[cell.growth]);
        // yHistogramScale.domain(growthExtent[cell.growth]);

        // Save the state of this g element as having an active brush
        brushCell = this;
    }
}

function brushmove(cell) {
    // cell is the SplomCell object

     // Get the extent or bounding box of the brush event, this is a 2x2 array
    var e = d3.event.selection;
    if(e) {

        // Select all .dot circles, and add the "hidden" class if the data for that circle
        // lies outside of the brush-filter applied for this SplomCells x and y attributes
        svg.selectAll(".dot")
            .classed("hidden", function(d){

                return e[0] > xHistogramScale(d[cell.growth]) || xHistogramScale(d[cell.growth]) > e[1];
            })
    }
}

function brushend() {
    //If there is no longer an extent or bounding box then the brush has been removed
    if(!d3.event.selection) {
        // Bring back all hidden .dot elements
        svg.selectAll('.hidden').classed('hidden', false);
        // Return the state of the active brushCell to be undefined
        brushCell = undefined;
    }
}
