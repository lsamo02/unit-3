
//begin script when window loads
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
    promises.push(d3.csv("data/WorldBank_ForestAreaSqKm_1990_2021_edited.csv"));                    
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
};