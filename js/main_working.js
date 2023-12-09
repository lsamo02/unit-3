//First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function(){

    //pseudo-global variables
    var attrArray = ["1990", "1995", "2000", "2005", "2010", "2015", "2020"]; //list of attributes
    var expressed = attrArray[0]; //initial attribute


//begin script when window loads
window.onload = setMap;

//set up choropleth map
function setMap(){

    //map frame dimensions
    var width = window.innerWidth * 0.5,
        height = 460;

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
    promises.push(d3.csv("data/WorldBank_ForestAreaSqKm_1990_2021_edited.csv"));                    
    promises.push(d3.json("data/BackgroundCountries.topojson"));                   
    promises.push(d3.json("data/Top15MostPopulousCountries.topojson"));                                     
    Promise.all(promises).then(callback);

    //function to create color scale generator
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
    };

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);

    return colorScale;
}; 

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
            .style("fill", function(d){
                return makeColorScale(d.properties[expressed]);});

        //variables for data join
        var attrArray = ["1990", "1995", "2000", "2005", "2010", "2015", "2020"];

            //create the color scale
        var colorScale = makeColorScale(csvData);

                //function to create coordinated bar chart
        function setChart(csvData, colorScale){
            //chart frame dimensions
            var chartWidth = window.innerWidth * 0.425,
                chartHeight = 460;

            //create a second svg element to hold the bar chart
            var chart = d3.select("body")
                .append("svg")
                .attr("width", chartWidth)
                .attr("height", chartHeight)
                .attr("class", "chart");
        };

    //Example 1.3 line 24...add enumeration units to the map
    setEnumerationUnits(top15MostPopulousCountries, map, path, colorScale);

    //add coordinated visualization to the map
    setChart(csvData, colorScale);

    };


};})(); //last line of main.js

function joinData(top15MostPopulousCountries, csvData){
    
         //loop through csv to assign each set of csv attribute values to geojson region
         for (var i=0; i<csvData.length; i++){
            var csvRegion = csvData[i]; //the current region
            var csvKey = csvRegion.Country_Code; //the CSV primary key
    
            //loop through geojson regions to find correct region
            for (var a=0; a<top15MostPopulousCountries.length; a++){
    
                var geojsonProps = top15MostPopulousCountries[a].properties; //the current region geojson properties
                var geojsonKey = geojsonProps.Country_Code; //the geojson primary key
    
                //where primary keys match, transfer csv data to geojson properties object
                if (geojsonKey == csvKey){
    
                    //assign all attributes and values
                    attrArray.forEach(function(attr){
                        var val = parseFloat(csvRegion[attr]); //get csv attribute value
                        geojsonProps[attr] = val; //assign attribute and value to geojson properties
                    });
                };
            };
        };

        return top15MostPopulousCountries
    
};





