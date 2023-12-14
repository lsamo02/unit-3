(function(){
    // Variables that will be used throughout the script
    var attrArray = ["varA", "varB", "varC", "varD", "varE"]; // List of attributes
    var expressed = attrArray[0]; // Initial attribute for visualization

    // Add event listener to load the map once the window is fully loaded
    window.addEventListener('load', setMap);

    // Function to set up the choropleth map
    function setMap() {
        // Map frame dimensions
        var width = window.innerWidth * 0.5,
            height = 460;

        // Create new SVG container for the map within the map container
        let map = d3.select("#map-container")
            .append("svg")
            .attr("class", "map")
            .attr("width", width)
            .attr("height", height);

        // Create Albers equal area conic projection centered on Minnesota
        let projection = d3.geoAlbers()
            .center([-94.5, 46.2])
            .rotate([0, 0, 0])
            .parallels([-46.5, 46.5])
            .scale(3000)
            .translate([width / 2, height / 2]);

        // Create a path generator using the projection
        let path = d3.geoPath()
            .projection(projection);

        // Load external data files asynchronously using Promise.all
        let promises = [];
        promises.push(d3.csv("data/unitsData.csv")); // CSV attributes
        promises.push(d3.json("data/mn-county-2010.topojson")); // Spatial data

        // Once all files are loaded, execute the callback function
        Promise.all(promises).then(callback);

        function callback(data) {
            // Unpack the data from the promises
            let csvData = data[0], // CSV attributes
                mn = data[1]; // TopoJSON data

            // Transform TopoJSON to GeoJSON
            let MNCounties = topojson.feature(mn, mn.objects.mncounty2010).features;

            // Loop through the CSV to assign attribute values to GeoJSON regions
            for (var i = 0; i < csvData.length; i++) {
                var csvRegion = csvData[i]; // Current CSV region
                var csvKey = csvRegion.adm1_code; // CSV primary key

                // Loop through GeoJSON regions to find the correct region
                for (var a = 0; a < MNCounties.length; a++) {
                    var geojsonProps = MNCounties[a].properties; // Current GeoJSON properties
                    var geojsonKey = geojsonProps.COUNTY; // GeoJSON primary key

                    // Transfer CSV data to GeoJSON properties where primary keys match
                    if (geojsonKey == csvKey) {
                        attrArray.forEach(function(attr){
                            var val = parseFloat(csvRegion[attr]); // Get CSV attribute value
                            geojsonProps[attr] = val; // Assign attribute and value to GeoJSON properties
                        });
                    }
                }
            }

            // Append all counties to the map SVG as paths
            let counties = map.selectAll(".county")
                .data(MNCounties)
                .enter()
                .append("path")
                .attr("class", "county")
                .attr("d", path)
                .attr("fill", "#ccc") // Fill color
                .attr("stroke", "#333"); // Stroke color

            // Create the color scale for the enumeration units
            var colorScale = makeColorScale(MNCounties, expressed);

            // Add enumeration units to the map
            counties.attr("fill", function(d){
                return colorScale(d.properties[expressed]);
            });

            // Add coordinated visualization (bar chart) to the map
            setChart(csvData, colorScale);

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
        }
    }

    // Function to create the color scale generator
    function makeColorScale(data, expressed) {
        // Color classes for the scale
        var colorClasses = [
            "#D4B9DA",
            "#C994C7",
            "#DF65B0",
            "#DD1C77",
            "#980043"
        ];

        // Create color scale generator
        var colorScale = d3.scaleQuantile()
            .range(colorClasses);

        // Build array of all values of the expressed attribute
        var domainArray = [];
        for (var i = 0; i < data.length; i++) {
            var val = parseFloat(data[i].properties[expressed]);
            domainArray.push(val);
        }

        // Assign array of expressed values as scale domain
        colorScale.domain(domainArray);

        return colorScale;
    }

    // Function to create the coordinated bar chart
    function setChart(csvData, colorScale) {
        // Chart frame dimensions
        var chartWidth = window.innerWidth * 0.425,
            chartHeight = 460;

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
                return "numbers " + d.adm1_code;
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
            .attr("x", 20)
            .attr("y", 40)
            .attr("class", "chartTitle")
            .text("This county's total population is " + expressed[3]);
    }

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
})();