//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){

    //map frame dimensions
    var width = 960,
    height = 460;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //Example 2.1 line 15...create Albers equal area conic projection centered on France
    var projection = d3.geoAlbers()
        .center([0, 46.2])
        .rotate([-2, 0])
        .parallels([43, 62])
        .scale(2500)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);

     //use Promise.all to parallelize asynchronous data loading
     var promises = [];    
     promises.push(d3.csv("data/WorldBank_ForestAreaSqKm_1990_2021_edited.csv")); //load attributes from csv    
     promises.push(d3.json("data/Top15MostPopulousCountries_ForestedSqKm.topojson")); //load background spatial data    
     Promise.all(promises).then(callback);

    //use Promise.all to parallelize asynchronous data loading
    var promises = [d3.csv("data/WorldBank_ForestAreaSqKm_1990_2021_edited.csv"),                    
                    d3.json("data/Top15MostPopulousCountries_ForestedSqKm.topojson"),                                  
                    ];    
    Promise.all(promises).then(callback);

    
    function callback(data) {
        var csvData = data[0],
        countries = data[1];
        console.log(csvData);
        console.log(countries);
    }

    //translate countries TopoJSON
    var countriesName = topojson.feature(countries, countries.objects.countriesName);

    //examine the results
    console.log(countriesName);

    //add Europe countries to map
    var countries = map.append("path")
    .datum(countriesName)
    .attr("class", "countries")
    .attr("d", path);
    
    
};