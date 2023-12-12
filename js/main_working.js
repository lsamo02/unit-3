
//begin script when window loads
(function(){
    //pseudo-global variables
    var attrArray = ["Country_Name","Country_Code","1990","1995","2000","2005", "2010","2015", "2020"]; //list of attributes
    var expressed = attrArray[0]; //initial attribute

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
     .attr("d", path);
    }

top15MostPopulousCountries = joinData(top15MostPopulousCountries, csvData);

var colorScale= makeColorScale (csvData)
    
};


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

function joinData(top15MostPopulousCountries, csvData){
    // Variables for data join
    var attrArray = ["Country_Name","Country_Code","1990","1995","2000","2005", "2010","2015", "2020"]; // replace with your actual attributes
    // Loop through CSV data to assign each set of CSV attribute values to GeoJSON state
    for (var i = 0; i < csvData.length; i++) {
        var csvState = csvData[i]; // The current state
        var csvKey = csvData.name; // The CSV primary key
        // Loop through GeoJSON states to find correct state
        for (var a = 0; a < top15MostPopulousCountries.length; a++) {
            var geojsonProps = top15MostPopulousCountries[a].properties; // The current state GeoJSON properties
            var geojsonKey = geojsonProps.name; // The GeoJSON primary key
            // Where primary keys match, transfer CSV data to GeoJSON properties object
            if (geojsonKey == csvKey) {
                // Assign all attributes and values
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvData[attr]); // Get CSV attribute value
                    geojsonProps[attr] = val; // Assign attribute and value to GeoJSON properties
                });
            }
        }
    }

    return top15MostPopulousCountries;
};




})(); //last line