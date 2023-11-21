

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

    //create Albers equal area conic projection centered on France
    var projection = geoRobinson()
        .center([0, 46.2])
        .rotate([-2, 0, 0])
        .parallels([43, 62])
        .scale(2500)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);

    //use Promise.all to parallelize asynchronous data loading
    var promises = [];    
    promises.push(d3.csv("data/WorldBank_ForestAreaSqKm_1990_2021_edited.csv")); //load attributes from csv    
    promises.push(d3.json("data/BackgoundCountries.topojson")); //load background spatial data    
    promises.push(d3.json("data/Top15MostPopulousCountries.topojson")); //load choropleth spatial data    
    Promise.all(promises).then(callback);


    //use Promise.all to parallelize asynchronous data loading
    var promises = [d3.csv("data/WorldBank_ForestAreaSqKm_1990_2021_edited.csv"),                    
                    d3.json("data/BackgoundCountries.topojson"),                    
                    d3.json("data/Top15MostPopulousCountries.topojson")                   
                    ];    
    Promise.all(promises).then(callback);

    function callback(data) {
        var csvData = data[0],
            world = data[1],
            selectCountries = data[2];
        console.log(csvData);
        console.log(world);
        console.log(selectCountries);

        var backgroundCountries = topojson.feature(world, world.objects.BackgroundCountries),
            top15MostPopulousCountries = topojson.feature(selectCountries, selectCountries.objects.top15MostPopulousCountries);

        console.log(backgroundCountries);
        console.log(top15MostPopulousCountries);

        //add Europe countries to map
        var countries = map.append("path")
            .datum(backgroundCountriesCountries)
            .attr("class", "countries")
            .attr("d", path);

        //add top 15 regions to map
        var topCountries = map.selectAll(".regions")
            .data(top15MostPopulousCountries)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "regions " + d.properties.adm1_code;
            })
            .attr("d", path);

         //variables for data join
    var attrArray = ["varA", "varB", "varC", "varD", "varE"];

    //loop through csv to assign each set of csv attribute values to geojson region
    for (var i=0; i<csvData.length; i++){
        var csvRegion = csvData[i]; //the current region
        var csvKey = csvRegion.adm1_code; //the CSV primary key

        //loop through geojson regions to find correct region
        for (var a=0; a<franceRegions.length; a++){

            var geojsonProps = franceRegions[a].properties; //the current region geojson properties
            var geojsonKey = geojsonProps.adm1_code; //the geojson primary key

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
    }; 
};