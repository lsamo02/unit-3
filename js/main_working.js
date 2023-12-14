//begin script when window loads
(function(){
    //pseudo-global variables
    var attrArray = ["Country_Name","Country_Code","1990","1995","2000","2005", "2010","2015", "2020"]; //list of attributes
    var expressed = attrArray[2]; //initial attribute

        //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 473,
        leftPadding = 25,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a scale to size bars proportionally to frame and for axis
// Create a scale to size bars proportionally to frame
    var yScale = d3.scaleLinear()
        .range([chartInnerHeight, 0])
        .domain([0, 35]);

    window.onload = setMap;

    //set up choropleth map
    function setMap(){

        //map frame dimensions
        var width = 960,
            height = 500;

        //create new svg container for the map
        var map = d3.select("body")
            .append("svg")
            .attr("class", "map")
            .attr("width", width)
            .attr("height", height);

        var projection = d3.geoRobinson()
            .scale(150)
            .translate([width / 2, height / 2])
            .rotate([180,0])
            .precision(.1);

        var path = d3.geoPath()
            .projection(projection);

        //use Promise.all to parallelize asynchronous data loading
        var promises = [];
        promises.push(d3.csv("data/WorldBank.csv"));                    
        promises.push(d3.json("data/BackgroundCountries.topojson"));                   
        promises.push(d3.json("data/Top15MostPopulousCountries.topojson"));                                     
        Promise.all(promises).then(callback);

        function callback(data) {
            var csvData = data[0],
                world = data[1],
                topFifteen = data[2];
            console.log(csvData);
            console.log(world);
            console.log('selecct', topFifteen);

            var backgroundCountries = world;
            var top15MostPopulousCountries = topojson.feature(data[2], data[2].objects.Top15MostPopulousCountries).features;

            console.log(backgroundCountries);
            console.log('look at me', top15MostPopulousCountries);

            
            //add Europe countries to map
            var countries = map.append("path")
                .datum(backgroundCountries)
                .attr("class", "countries")
                .attr("d", path);

            //add France regions to map
            var regions = map.selectAll(".regions")
                .data(top15MostPopulousCountries)
                .enter()
                .append("path")
                .attr("class", function(d){
                    return "regions " + d.properties.Country_Code;
                })
                .attr("d", path)
                .on('mouseover', function (d) {
                    highlight(d.properties);
                })
                .on('mouseout', function (d) {
                    dehighlight(d.properties);
                })
                .on('mousemove', function () {
                    moveLabel();
                });


            top15MostPopulousCountries = joinData(top15MostPopulousCountries, csvData);

            var colorScale = makeColorScale(csvData);
            
            // Now that top15MostPopulousCountries has been joined with csvData,
            // you can use it to apply the color scale
            regions.style("fill", function(d) {
                return colorScale(d.properties[expressed]);
            });

            // Add coordinated visualization (bar chart) to the map
            setChart(csvData, colorScale);


                        //Example 1.1 line 1...function to create a dropdown menu for attribute selection
            function createDropdown(csvData){
                //add select element
                var dropdown = d3.select("body")
                    .append("select")
                    .attr("class", "dropdown")
                    .on("change", function(){
                        changeAttribute(this.value, csvData)
                    });


                //function to create a dropdown menu for attribute selection
            function createDropdown(){
                //add select element
                var dropdown = d3.select("body")
                    .append("select")
                    .attr("class", "dropdown");

                //add initial option
                var titleOption = dropdown.append("option")
                    .attr("class", "titleOption")
                    .attr("disabled", "true")
                    .text("Select Attribute");

                //add attribute name options
                var attrOptions = dropdown.selectAll("attrOptions")
                    .data(attrArray)
                    .enter()
                    .append("option")
                    .attr("value", function(d){ return d })
                    .text(function(d){ return d });
            };

            
            //dropdown change event handler
            function changeAttribute(attribute, csvData) {
                //change the expressed attribute
                expressed = attribute;

                //recreate the color scale
                var colorScale = makeColorScale(csvData);

                //recolor enumeration units
                var regions = d3.selectAll(".regions").style("fill", function (d) {
                    var value = d.properties[expressed];
                    if (value) {
                        return colorScale(d.properties[expressed]);
                    } else {
                        return "#ccc";
                    }
                });
            }
        }

        function makeColorScale(data){
            var colorClasses = [
                "#D4B9DA",
                "#C994C7",
                "#DF65B0",
                "#DD1C77",
                "#980043"
            ];

            //create color scale generator
            var colorScale = d3.scaleQuantile()
                .range(colorClasses);

            //build array of all values of the expressed attribute
            var domainArray = [];
            for (var i=0; i<data.length; i++){
                var val = parseFloat(data[i][expressed]);
                domainArray.push(val);
            }

            //assign array of expressed values as scale domain
            colorScale.domain(domainArray);

            return colorScale;
        }
    };

        function joinData(top15MostPopulousCountries, csvData){
            // Loop through CSV data to assign each set of CSV attribute values to GeoJSON countries
            for (var i = 0; i < csvData.length; i++) {
                var csvCountry = csvData[i]; // The current country in the CSV
                var csvKey = csvCountry.Country_Code; // The CSV primary key should be 'Country_Code' based on your attributes
        
                // Loop through GeoJSON countries to find the correct country
                for (var a = 0; a < top15MostPopulousCountries.length; a++) {
                    var geojsonProps = top15MostPopulousCountries[a].properties; // The current country GeoJSON properties
                    var geojsonKey = geojsonProps.Country_Code; // The GeoJSON primary key should also be 'Country_Code'
        
                    // Where primary keys match, transfer CSV data to GeoJSON properties object
                    if (geojsonKey == csvKey) {
                        // Assign all attributes and values from the attrArray list
                        attrArray.forEach(function(attr){
                            var val = parseFloat(csvCountry[attr]); // Get CSV attribute value
                            geojsonProps[attr] = val; // Assign attribute and value to GeoJSON properties
                        });
                    }
                }
            }
        
            return top15MostPopulousCountries;
        }
        
    }

    // Function to create the coordinated bar chart
    function setChart(csvData, colorScale) {
        // Chart frame dimensions
        var chartWidth = window.innerWidth * 0.325,
            chartHeight = 500;

        // Create a second SVG element to hold the bar chart
        var chart = d3.select("#chart-container")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("class", "chart");

        // Find the maximum data value for the expressed attribute to set up the yScale domain
        var maxVal = d3.max(csvData, function(d) { return parseFloat(d[expressed]); });


        // Create a scale to size bars proportionally to frame
        var yScale = d3.scaleLinear()
            .range([0, chartHeight])
            .domain([0, maxVal]); //changed this from 105 to maxVal

        // Set bars for each province
        var bars = chart.selectAll(".bar")
            .data(csvData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("width", chartWidth / csvData.length - 1)
            .attr("x", function(d, i){
                return i * (chartWidth / csvData.length);
            })
            .attr("height", function(d){
                return yScale(parseFloat(d[expressed]));
            })
            .attr("y", function(d){
                return chartHeight - yScale(parseFloat(d[expressed]));
            })
            .style("fill", function(d){
                return colorScale(d[expressed])
            })
            .attr('transform', translate)
            .on("mouseover",highlight)
            .on("mouseover", dehighlight)

        
        var numbers = chart.selectAll(".numbers")
            .data(csvData)
            .enter()
            .append("text")
            .sort(function(a, b){
                return b[expressed]-a[expressed]
            })
            .attr("class", function(d){
                return "numbers " + d.Country_Code;
            })
            .attr("text-anchor", "middle")
        
            .attr("x", function(d, i){
                var fraction = chartWidth / csvData.length;
                return i * fraction + (fraction - 1) / 2;
            })
            .attr("y", function(d){
                return chartHeight - yScale(parseFloat(d[expressed])) + 15;
            })
            .text(function(d){
                return d[expressed];


            });

        var chartTitle = chart.append("text")
            .attr("x", 80)
            .attr("y", 20)
            .attr("class", "chartTitle")
            .text("This Country's Total Forested Area (sq km) is " + expressed[3]);
    }

    function createDropdown(csvData) {
        let dropdown = d3.select('body')
            .append('select')
            .attr('class', 'dropdown')
            .on('change', function () {
                changeAttribute(this.value, csvData)
            });
    
        //add initial option
        let titleOption = dropdown.append('option')
            .attr('class', 'titleOption')
            .attr('disabled', 'true')
            .text('Select Attribute');
    
        // Add attribute name options
        let attrOptions = dropdown.selectAll('attrOptions')
            .data(attrArray)
            .enter()
            .append('option')
            .attr('value', function (d) {
                return d
            })
            .text(function (d) {
                return d
            });
    }

    
    // Function to highlight states and bars
    function highlight(csvData) {
        // Change stroke
        var selected = d3.selectAll('.' + Country_Code)
            .style('stroke', '#c8c8c8')
            .style('stroke-width', '2');

        setLabel(props);
    }

    //function to reset the element style on mouseout
    function dehighlight(csvData) {
        var selected = d3.selectAll("." + Country_Code)
            .style("stroke", "black")
            .style("stroke-width", "0.5px");

        d3.select(".infolabel")
            .remove();
    };

    function highlight(d) {
        d3.select()
            .style("stroke","black")
            .style("stroke-width","2px");
    }

    function dehighlight(d) {
        d3.select()
            .style("stroke","none")
            .style("stroke-width","0px");
    }

    //function to create dynamic label
function setLabel(props) {
    //label content
    
    var classState = "<p><b>" + props[expressed + "_Count"] + "</b><small> gyms offer " + expressed + " in <b>" + props.postal + "</b></small></p>";
    var count = "<p>(<b>" + props[expressed] + "</b><small> gyms per million people)</small></p>";
    var labelAttribute = classState + count;

    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.postal + "_label")
        .html(labelAttribute);

    var regionName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.name);
};

//function to move info label with mouse
function moveLabel() {
    //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;
    
    var labelHeight = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .height;
    
    //use coordinates of mousemove event to set label coordinates    
    var x1 = d3.event.pageX + 10,
        y1 = d3.event.pageY - labelHeight - 10,
        x2 = d3.event.pageX - labelWidth - 5,
        y2 = d3.event.pageY + 25;

    //horizontal label coordinate, testing for overflow
    var x = d3.event.pageX > window.innerWidth - labelWidth - 20 ? x2 : x1;
    //vertical label coordinate, testing for overflow
    var y = d3.event.pageY < 75 ? y2 : y1;

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};




})(); //last line